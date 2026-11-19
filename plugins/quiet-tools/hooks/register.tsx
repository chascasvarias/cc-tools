import type { Register } from 'claude-code'

// Short label per tool call: "Edited src/a.ts", "Ran command", ...
const VERBS: Record<string, string> = {
  Edit: 'Edited',
  MultiEdit: 'Edited',
  Write: 'Wrote',
  NotebookEdit: 'Edited',
  Bash: 'Ran command',
  PowerShell: 'Ran command',
  Read: 'Read',
  Grep: 'Searched',
  Glob: 'Listed files',
}

const target = (input: unknown): string => {
  const i = (input ?? {}) as Record<string, unknown>
  const p = i.file_path ?? i.notebook_path ?? i.path ?? i.pattern
  return typeof p === 'string' ? ' ' + p.split(/[\\/]/).slice(-2).join('/') : ''
}

// First line of a shell command, whitespace collapsed, cut in the middle to `max`
// characters so both the start and the end (usually the file) stay visible.
const shortCommand = (input: unknown, max: number): string => {
  const c = ((input ?? {}) as Record<string, unknown>).command
  if (typeof c !== 'string') return ''
  const one = (c.trim().split('\n')[0] ?? '').replace(/\s+/g, ' ')
  if (one.length <= max) return one
  const head = Math.ceil((max - 1) * 0.6)
  const tail = max - 1 - head
  return one.slice(0, head).trimEnd() + '…' + one.slice(one.length - tail).trimStart()
}

const lines = (output: unknown): number => {
  const o = (output ?? {}) as Record<string, unknown>
  const text = [o.stdout, o.stderr].filter(x => typeof x === 'string').join('\n')
  return text ? text.split('\n').length : 0
}

export const register: Register = (on, options) => {
  const icon = String(options.icon ?? '●').trim()
  const showLineCount = options.showLineCount !== false
  const showCommand = options.showCommand !== false
  const maxChars = Math.max(10, Number(options.commandMaxChars ?? 60) || 60)

  // One folded line for a call: "● Ran command: sed -i ... (4 lines)", "● Edited src/a.ts".
  const describe = (tool: string, input: unknown, output: unknown, isRunning: boolean): string => {
    const verb = VERBS[tool] ?? tool
    const what = showCommand && verb === 'Ran command' ? ': ' + shortCommand(input, maxChars) : target(input)
    const n = showLineCount && output !== undefined ? lines(output) : 0
    return (icon ? icon + ' ' : '') + verb + what + (isRunning ? ' …' : n > 1 ? ` (${n} lines)` : '')
  }

  on('ui.render', { component: 'ToolUse' }, async ($, e, next) => {
    if (e.props.isExpanded || e.props.isErrored || e.props.isInterrupted) return next(e)
    const { Text } = $.ui.resolve(e)
    return <Text dimColor>{describe(e.props.tool, e.props.input, e.props.output, e.props.isRunning)}</Text>
  })

  // The engine folds runs of reads/searches/read-only commands into one count line
  // ("Ran 1 shell command"); draw one short line per call instead. ctrl+o still shows all.
  on('ui.render', { component: 'ToolGroup' }, async ($, e, next) => {
    if (e.props.isExpanded || e.props.isCallsOnly !== true) return next(e)
    const { Box, Text } = $.ui.resolve(e)
    return (
      <Box flexDirection="column">
        {e.props.calls.map((c, i) => (
          <Text key={c.tool_use_id ?? String(i)} dimColor>
            {describe(c.tool, c.input, c.output, c.isRunning)}
          </Text>
        ))}
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
