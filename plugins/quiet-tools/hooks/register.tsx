import type { EngineInterface, Register } from 'claude-code'

// Short label per tool call: "Edited src/a.ts", "Cmd: ls -la", ...
const VERBS: Record<string, string> = {
  Edit: 'Edited',
  MultiEdit: 'Edited',
  Write: 'Wrote',
  NotebookEdit: 'Edited',
  Bash: 'Cmd',
  PowerShell: 'Cmd',
  Read: 'Read',
  Grep: 'Searched',
  Glob: 'Listed files',
}

export type Replacement = { from: string; to: string }

// Literal replacements, applied in order. No regular expressions: Windows paths stay as typed.
export const applyReplacements = (text: string, list: readonly Replacement[]): string =>
  list.reduce((s, r) => s.split(r.from).join(r.to), text)

// Accepts {"replace": [{"from": "...", "to": "..."}]}; anything malformed is skipped.
export const parseConfig = (text: string): Replacement[] => {
  let data: unknown
  try {
    data = JSON.parse(text.replace(/^﻿/, ''))
  } catch {
    return []
  }
  const list = (data as { replace?: unknown } | null)?.replace
  if (!Array.isArray(list)) return []
  return list
    .filter((r): r is { from: string; to?: unknown } => typeof r?.from === 'string' && r.from !== '')
    .map(r => ({ from: r.from, to: typeof r.to === 'string' ? r.to : '' }))
}

export const target = (input: unknown): string => {
  const i = (input ?? {}) as Record<string, unknown>
  const p = i.file_path ?? i.notebook_path ?? i.path ?? i.pattern
  return typeof p === 'string' ? ' ' + p.split(/[\\/]/).slice(-2).join('/') : ''
}

// First line, whitespace collapsed, cut in the middle to `max` characters so both
// the start and the end (usually the file) stay visible.
export const shorten = (text: string, max: number): string => {
  const one = (text.trim().split('\n')[0] ?? '').replace(/\s+/g, ' ').trim()
  if (one.length <= max) return one
  const head = Math.ceil((max - 1) * 0.6)
  const tail = max - 1 - head
  return one.slice(0, head).trimEnd() + '…' + one.slice(one.length - tail).trimStart()
}

// Lines of stdout plus stderr; a trailing newline does not count as an extra line.
export const lines = (output: unknown): number => {
  const o = (output ?? {}) as Record<string, unknown>
  return [o.stdout, o.stderr]
    .filter((x): x is string => typeof x === 'string')
    .map(x => x.replace(/\r?\n+$/, ''))
    .filter(x => x !== '')
    .reduce((n, x) => n + x.split('\n').length, 0)
}

// Added and removed lines of an Edit/Write result: "(+3 −1)", "(+12)", or '' when unknown.
export const diffSize = (output: unknown): string => {
  const o = (output ?? {}) as { structuredPatch?: unknown; type?: unknown; content?: unknown }
  let add = 0
  let del = 0
  if (Array.isArray(o.structuredPatch)) {
    for (const hunk of o.structuredPatch as { lines?: unknown }[]) {
      for (const l of Array.isArray(hunk?.lines) ? hunk.lines : []) {
        if (typeof l !== 'string') continue
        if (l.startsWith('+')) add++
        else if (l.startsWith('-')) del++
      }
    }
  }
  if (add === 0 && del === 0 && o.type === 'create' && typeof o.content === 'string' && o.content !== '')
    add = o.content.replace(/\r?\n+$/, '').split('\n').length
  if (add === 0 && del === 0) return ''
  return del === 0 ? ` (+${add})` : add === 0 ? ` (−${del})` : ` (+${add} −${del})`
}

export type Options = {
  icon: string
  verbColor: string
  label: 'command' | 'description'
  showCommand: boolean
  maxChars: number
  showLineCount: boolean
  showDiffSize: boolean
  replace: readonly Replacement[]
}

export type Parts = { lead: string; verb: string; rest: string }

// One folded line for a call, in three parts so the verb can take its own color:
// "● " + "Cmd" + ": List files (4 lines)", "● " + "Edited" + " src/a.ts (+3 −1)".
export const parts = (
  o: Options,
  tool: string,
  input: unknown,
  output: unknown,
  isRunning: boolean,
): Parts => {
  const i = (input ?? {}) as Record<string, unknown>
  let verb = VERBS[tool] ?? tool
  let what = target(input)
  let tailText = ''
  if (verb === 'Cmd') {
    const desc = typeof i.description === 'string' ? i.description.trim() : ''
    const cmd = typeof i.command === 'string' ? applyReplacements(i.command, o.replace) : ''
    if (o.label === 'description' && desc) what = ': ' + shorten(desc, o.maxChars)
    else if (o.showCommand && cmd.trim()) what = ': ' + shorten(cmd, o.maxChars)
    else what = ''
    const n = o.showLineCount && output !== undefined ? lines(output) : 0
    if (n > 1) tailText = ` (${n} lines)`
  } else if (tool === 'Edit' || tool === 'Write' || tool === 'MultiEdit') {
    if (tool === 'Write' && (output as { type?: unknown } | undefined)?.type === 'create') verb = 'Created'
    if (o.showDiffSize && output !== undefined) tailText = diffSize(output)
  }
  return { lead: o.icon ? o.icon + ' ' : '', verb, rest: what + (isRunning ? ' …' : tailText) }
}

export const describe = (...a: Parameters<typeof parts>): string => {
  const p = parts(...a)
  return p.lead + p.verb + p.rest
}

// Per-machine replacements in <claude config dir>/cc-tools.json, shared with the status line.
// Read once per load; a missing or broken file means no replacements.
async function loadOptions($: EngineInterface, base: Options): Promise<Options> {
  try {
    const dir =
      (await $.env.get('CLAUDE_CONFIG_DIR')) ||
      ((await $.env.get('HOME')) || (await $.env.get('USERPROFILE')) || '') + '/.claude'
    return { ...base, replace: parseConfig(await $.fs.read(dir + '/cc-tools.json')) }
  } catch {
    return base
  }
}

export const register: Register = (on, options) => {
  const base: Options = {
    icon: String(options.icon ?? '●').trim(),
    verbColor: String(options.verbColor ?? 'suggestion').trim(),
    label: options.label === 'command' ? 'command' : 'description',
    showCommand: options.showCommand !== false,
    maxChars: Math.max(10, Number(options.commandMaxChars ?? 120) || 120),
    showLineCount: options.showLineCount !== false,
    showDiffSize: options.showDiffSize !== false,
    replace: [],
  }

  let config: Promise<Options> | undefined

  on('ui.render', { component: 'ToolUse' }, async ($, e, next) => {
    if (e.props.isExpanded || e.props.isErrored || e.props.isInterrupted) return next(e)
    const o = await (config ??= loadOptions($, base))
    const { Text } = $.ui.resolve(e)
    const p = parts(o, e.props.tool, e.props.input, e.props.output, e.props.isRunning)
    return (
      <Text>
        <Text dimColor>{p.lead}</Text>
        {o.verbColor ? <Text color={o.verbColor}>{p.verb}</Text> : <Text dimColor>{p.verb}</Text>}
        <Text dimColor>{p.rest}</Text>
      </Text>
    )
  })

  // The engine folds runs of reads/searches/read-only commands into one count line
  // ("Ran 1 shell command"); draw one short line per call instead. ctrl+o still shows all.
  on('ui.render', { component: 'ToolGroup' }, async ($, e, next) => {
    if (e.props.isExpanded || e.props.isCallsOnly !== true) return next(e)
    const o = await (config ??= loadOptions($, base))
    const { Box, Text } = $.ui.resolve(e)
    return (
      <Box flexDirection="column">
        {e.props.calls.map((c, i) => {
          const p = parts(o, c.tool, c.input, c.output, c.isRunning)
          return (
            <Text key={c.tool_use_id ?? String(i)}>
              <Text dimColor>{p.lead}</Text>
              {o.verbColor ? <Text color={o.verbColor}>{p.verb}</Text> : <Text dimColor>{p.verb}</Text>}
              <Text dimColor>{p.rest}</Text>
            </Text>
          )
        })}
      </Box>
    )
  })

  // The result block (diff, command output) is hidden; errors and ctrl+o still show it.
  on('ui.render', { component: 'ToolResult' }, async ($, e, next) => {
    if (e.props.isExpanded || e.props.isErrored) return next(e)
    const { Text } = $.ui.resolve(e)
    return <Text dimColor>{''}</Text>
  })
}
