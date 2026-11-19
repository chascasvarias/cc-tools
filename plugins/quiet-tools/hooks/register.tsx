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

const lines = (output: unknown): number => {
  const o = (output ?? {}) as Record<string, unknown>
  const text = [o.stdout, o.stderr].filter(x => typeof x === 'string').join('\n')
  return text ? text.split('\n').length : 0
}

export const register: Register = (on, options) => {
  const icon = String(options.icon ?? '●').trim()
  const showLineCount = options.showLineCount !== false

  on('ui.render', { component: 'ToolUse' }, async ($, e, next) => {
    if (e.props.isExpanded || e.props.isErrored || e.props.isInterrupted) return next(e)
    const { Text } = $.ui.resolve(e)
    const verb = VERBS[e.props.tool] ?? e.props.tool
    const n = showLineCount && e.props.output !== undefined ? lines(e.props.output) : 0
    return (
      <Text dimColor>
        {icon ? icon + ' ' : ''}
        {verb}
        {target(e.props.input)}
        {e.props.isRunning ? ' …' : n > 1 ? ` (${n} lines)` : ''}
      </Text>
    )
  })

  // The result block (diff, command output) is hidden; errors and ctrl+o still show it.
  on('ui.render', { component: 'ToolResult' }, async ($, e, next) => {
    if (e.props.isExpanded || e.props.isErrored) return next(e)
    const { Text } = $.ui.resolve(e)
    return <Text dimColor>{''}</Text>
  })
}
