import { expect, test } from 'claude-code/testing'
import { applyReplacements, describe, parts, diffSize, lines, parseConfig, shorten, type Options } from './register'

const O: Options = {
  icon: '●',
  verbColor: 'suggestion',
  label: 'command',
  showCommand: true,
  maxChars: 60,
  showLineCount: true,
  showDiffSize: true,
  replace: [],
}

test('line count ignores trailing newlines and counts stdout and stderr apart', async () => {
  expect(lines({ stdout: 'a\n' })).toBe(1)
  expect(lines({ stdout: 'a\nb\n', stderr: 'e\n' })).toBe(3)
  expect(lines({ stdout: 'a\r\nb\r\n' })).toBe(2)
  expect(lines({ stdout: '\n', stderr: '' })).toBe(0)
  expect(lines(undefined)).toBe(0)
})

test('long commands are cut in the middle', async () => {
  expect(shorten('ls -la', 60)).toBe('ls -la')
  const s = shorten("sed -i 's/aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa/b/' docs/notes.md", 40)
  expect(s.length <= 40 && s.includes('…')).toBe(true)
  expect(s.endsWith('docs/notes.md')).toBe(true)
  expect(shorten('  first\nsecond', 60)).toBe('first')
})

test('config: literal replacements in order; malformed input is ignored', async () => {
  const list = parseConfig(
    '\uFEFF{"replace":[{"from":"cd ~/proj && ","to":""},{"from":"C:\\\\Users\\\\user","to":"~"},{"from":""},{"to":"x"},{"from":"a.b"}]}',
  )
  expect(list).toEqual([
    { from: 'cd ~/proj && ', to: '' },
    { from: 'C:\\Users\\user', to: '~' },
    { from: 'a.b', to: '' },
  ])
  expect(applyReplacements('cd ~/proj && git status', list)).toBe('git status')
  expect(applyReplacements('cd C:\\Users\\user\\src; dir', list)).toBe('cd ~\\src; dir')
  expect(applyReplacements('aXb a.b', list)).toBe('aXb ')
  expect(parseConfig('not json')).toEqual([])
  expect(parseConfig('{"replace":"x"}')).toEqual([])
  expect(parseConfig('null')).toEqual([])
})

test('diff size from structuredPatch, and new files', async () => {
  const patch = [{ lines: [' ctx', '-old', '+new', '+more'] }, { lines: ['-gone'] }]
  expect(diffSize({ structuredPatch: patch })).toBe(' (+2 −2)')
  expect(diffSize({ structuredPatch: [{ lines: ['+a'] }] })).toBe(' (+1)')
  expect(diffSize({ structuredPatch: [{ lines: ['-a'] }] })).toBe(' (−1)')
  expect(diffSize({ type: 'create', structuredPatch: [], content: 'a\nb\nc\n' })).toBe(' (+3)')
  expect(diffSize({ structuredPatch: [] })).toBe('')
  expect(diffSize(undefined)).toBe('')
})

test('describe: commands, descriptions, replacements and edits', async () => {
  const cmd = { command: 'cd ~/proj && ls -la', description: 'List the project folder' }
  expect(describe(O, 'Bash', cmd, { stdout: '1\n2\n3\n' }, false)).toBe('● Cmd: cd ~/proj && ls -la (3 lines)')
  const r = { ...O, replace: [{ from: 'cd ~/proj && ', to: '' }] }
  expect(describe(r, 'Bash', cmd, { stdout: 'x\n' }, false)).toBe('● Cmd: ls -la')
  const d = { ...O, label: 'description' as const }
  expect(describe(d, 'Bash', cmd, undefined, true)).toBe('● Cmd: List the project folder …')
  expect(describe(d, 'Bash', { command: 'true' }, { stdout: '' }, false)).toBe('● Cmd: true')
  expect(describe({ ...O, showCommand: false }, 'Bash', cmd, undefined, false)).toBe('● Cmd')
  const edit = { structuredPatch: [{ lines: ['-a', '+b', '+c'] }] }
  expect(describe(O, 'Edit', { file_path: '/srv/app/docs/notes.md' }, edit, false)).toBe('● Edited docs/notes.md (+2 −1)')
  expect(describe({ ...O, showDiffSize: false }, 'Edit', { file_path: 'a/b.md' }, edit, false)).toBe('● Edited a/b.md')
  const created = { type: 'create', structuredPatch: [], content: 'x\ny\n' }
  expect(describe({ ...O, icon: '' }, 'Write', { file_path: 'C:\\src\\new.ts' }, created, false)).toBe('Created src/new.ts (+2)')
  expect(describe(O, 'Read', { file_path: '/a/b/c.md' }, { file: {} }, false)).toBe('● Read b/c.md')
})

test('a folded Bash row is drawn as one short line', { options: { label: 'command' } }, async $ => {
  for (const surface of ['terminal', 'desktop'] as const) {
    const ui = await $.ui.mount({
      plugin: 'quiet-tools',
      surface,
      component: 'ToolUse',
      props: {
        tool_use_id: 't1',
        tool: 'Bash',
        input: { command: 'ls -la', description: 'List files' },
        isRunning: false,
        isErrored: false,
        isInterrupted: false,
        isExpanded: false,
        output: { stdout: 'a\nb\n', stderr: '', interrupted: false },
      },
    })
    const t = await ui.find({ type: 'Text' })
    expect(JSON.stringify(t)).toContain('Cmd: ls -la (2 lines)')
    await ui.unmount()
  }
})

test('by default a command shows its description', async $ => {
  const ui = await $.ui.mount({
    plugin: 'quiet-tools',
    surface: 'terminal',
    component: 'ToolUse',
    props: {
      tool_use_id: 't2',
      tool: 'Bash',
      input: { command: 'ls -la', description: 'List files' },
      isRunning: false,
      isErrored: false,
      isInterrupted: false,
      isExpanded: false,
      output: { stdout: 'a\n', stderr: '', interrupted: false },
    },
  })
  expect(JSON.stringify(await ui.find({ type: 'Text' }))).toContain('Cmd: List files')
  await ui.unmount()
})

test('the verb is a part of its own, for its color', async () => {
  expect(parts({ ...O, label: 'description' }, 'Bash', { command: 'ls', description: 'List files' }, { stdout: 'a\nb\n' }, false)).toEqual({
    lead: '● ',
    verb: 'Cmd',
    rest: ': List files (2 lines)',
  })
  expect(parts({ ...O, icon: '' }, 'Edit', { file_path: 'a/b.md' }, undefined, true)).toEqual({
    lead: '',
    verb: 'Edited',
    rest: ' a/b.md …',
  })
})

test('the drawn row paints the verb with verbColor', { options: { verbColor: 'warning' } }, async $ => {
  const ui = await $.ui.mount({
    plugin: 'quiet-tools',
    surface: 'terminal',
    component: 'ToolUse',
    props: {
      tool_use_id: 't3',
      tool: 'Bash',
      input: { command: 'ls', description: 'List files' },
      isRunning: false,
      isErrored: false,
      isInterrupted: false,
      isExpanded: false,
      output: { stdout: 'a\n', stderr: '', interrupted: false },
    },
  })
  const all = JSON.stringify(await ui.find({ type: 'Text' }))
  expect(all).toContain('"color":"warning"')
  await ui.unmount()
})

test('an edit row paints +N green and −N red', async $ => {
  const ui = await $.ui.mount({
    plugin: 'quiet-tools',
    surface: 'terminal',
    component: 'ToolUse',
    props: {
      tool_use_id: 't4',
      tool: 'Edit',
      input: { file_path: 'docs/a.md' },
      isRunning: false,
      isErrored: false,
      isInterrupted: false,
      isExpanded: false,
      output: { structuredPatch: [{ lines: ['-a', '+b', '+c'] }] },
    },
  })
  const all = JSON.stringify(await ui.find({ type: 'Text' }))
  expect(all).toContain('"color":"success"')
  expect(all).toContain('"color":"error"')
  await ui.unmount()
})
