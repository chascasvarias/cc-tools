# AGENTS.md

Repo público de utilidades para Claude Code (`cc-tools`). Estructura: `plugins/` (plugins del marketplace), `statusline/` (scripts), `docs/` (guías de instalación).

## Reglas

- **Público: nada sensible.** Ni claves, tokens, correos, nombres reales, rutas personales (`C:\Users\<nombre>`, `/home/<nombre>`), hosts, IPs ni zonas horarias fijas de nadie. En guías usa placeholders (`<usuario>`, `<nombre>`). La única excepción es el usuario de GitHub dueño del repo (`chascasvarias`), que ya es público en la URL. Antes de cada commit: buscar esos patrones y, si hay escáner de secretos, pasarlo.
- Autor de commits sin datos personales si la persona lo pide; no añadas campos `author` a los manifiestos.
- Sube la `version` de `plugins/quiet-tools/.claude-plugin/plugin.json` en cada cambio del plugin (si no, `claude plugin update` no ve la novedad) y etiqueta con git (`vX.Y.Z`).
- Cambios en `statusline/`: mantén `.sh` y `.ps1` con la misma lógica y probalos con un JSON de ejemplo (ver las guías).
- `statusline.ps1`: sin caracteres no ASCII literales en el código (PowerShell 5.1 lee mal UTF-8 sin BOM); usa `[char]0xE9`, etc.
- Antes de un push grande o un primer push: lista de archivos y peso; si hay algo raro, para y pregunta.
- No inventes: si no lo has probado, dilo en la guía.
