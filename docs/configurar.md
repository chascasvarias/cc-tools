# Reemplazos por equipo (cc-tools.json)

Un fichero opcional, distinto en cada equipo, con reemplazos de texto que usan el plugin y la línea de estado:

- Linux/macOS: `~/.claude/cc-tools.json`
- Windows: `%USERPROFILE%\.claude\cc-tools.json`
- Si está definida `CLAUDE_CONFIG_DIR`, en esa carpeta.

```json
{
  "replace": [
    { "from": "cd <carpeta> && ", "to": "" },
    { "from": "/home/<usuario>", "to": "~" }
  ]
}
```

- Texto literal, sin expresiones regulares (las barras de Windows se escriben tal cual, dobladas por ser JSON: `"C:\\Users\\<usuario>"`). Distingue mayúsculas.
- Se aplican en orden, uno tras otro.
- **Plugin**: al comando que se muestra (antes de cortarlo). **Línea de estado**: a la carpeta.
- Sin fichero, o con un error en él, todo funciona igual que sin reemplazos.
- El plugin lo lee al cargar: tras cambiarlo, reiniciar Claude Code (o `/reload-plugins`). La línea de estado lo lee en cada actualización.

Comprobar la línea de estado (Linux):
```
echo '{"workspace":{"current_dir":"'"$HOME"'/src"}}' | ~/.claude/statusline.sh
```
