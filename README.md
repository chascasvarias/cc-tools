# cc-tools

Utilidades pequeñas para dejar Claude Code más limpio y cómodo.

| Qué | Dónde | Para qué |
| --- | --- | --- |
| **quiet-tools** (plugin) | `plugins/quiet-tools/` | Sustituye diffs, comandos Bash y salida de herramientas por una línea corta. `ctrl+o` muestra todo. |
| **statusline** (scripts) | `statusline/` | Línea de estado: `usuario@host:carpeta \| modelo esfuerzo \| contexto \| 5h \| semana`, con colores de aviso. Versión Linux/macOS (`.sh`) y Windows (`.ps1`). |

## Instalar

- Plugin: [docs/instalar-plugin.md](docs/instalar-plugin.md)
- Línea de estado en Linux/macOS: [docs/instalar-statusline-linux.md](docs/instalar-statusline-linux.md)
- Línea de estado en Windows: [docs/instalar-statusline-windows.md](docs/instalar-statusline-windows.md)
- Reemplazos por equipo (plugin y línea de estado): [docs/configurar.md](docs/configurar.md)
- Actualizar en muchos equipos: [docs/actualizar.md](docs/actualizar.md)

Las guías están escritas para que las siga una persona o un agente de IA: cada paso lleva su comprobación.

## Qué hay que saber

- El plugin usa la API de mods de Claude Code (`ui.render`). Depende de componentes internos (`ToolUse`, `ToolResult`) que pueden cambiar entre versiones.
- Solo cambia lo que se dibuja; no cambia lo que lee el modelo ni lo que ejecuta.
- No lleva claves ni datos personales. Licencia MIT.
