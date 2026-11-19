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

## Prompt para que lo instale un agente

Pégalo en Claude Code (o en otro agente) en el equipo donde quieras instalarlo. Sirve para Linux, macOS y Windows.

```
Quiero instalar y configurar las utilidades de Claude Code del repo público
https://github.com/chascasvarias/cc-tools

1. Clona el repo en una carpeta temporal (fuera de cualquier proyecto) y lee
   README.md y docs/. Sigue esas guías, no tu criterio; si algo no cuadra con
   este equipo, para y pregúntame.

2. Antes de tocar nada: comprueba que Claude Code está instalado, qué sistema
   es este equipo y qué hay en la carpeta de configuración de Claude
   (~/.claude, o CLAUDE_CONFIG_DIR si está definida). Si settings.json ya
   tiene statusLine, o ya existe cc-tools.json, enséñamelo y no lo
   sobrescribas. Copia settings.json a settings.json.bak antes de cambiarlo y
   no toques ninguna otra clave.

3. Plugin quiet-tools: instálalo según docs/instalar-plugin.md. Enséñame sus
   opciones con sus valores por defecto y pregúntame si quiero cambiar alguna.

4. Línea de estado: instálala según docs/instalar-statusline-linux.md o
   docs/instalar-statusline-windows.md, según el sistema. Pregúntame la zona
   horaria (STATUSLINE_TZ) si la del sistema no es la mía. Si falta jq (Linux),
   dime cómo lo instalarías y espera mi "sí".

5. Reemplazos por equipo (docs/configurar.md): pregúntame si quiero alguno
   (por ejemplo, quitar un prefijo de ruta largo) y crea cc-tools.json solo si
   te digo cuáles.

6. Verifica y dame la evidencia: la prueba con JSON de ejemplo de la guía de
   la línea de estado y `claude plugin list` con quiet-tools@cc-tools
   habilitado.

7. Borra la carpeta temporal. No reinicies Claude Code ni toques otros
   proyectos. Al final dime qué hiciste, qué no pudiste probar y qué me toca a
   mí (reiniciar Claude Code).
```

Para actualizar más adelante basta con: «Sigue docs/actualizar.md del repo chascasvarias/cc-tools».

## Qué hay que saber

- El plugin usa la API de mods de Claude Code (`ui.render`). Depende de componentes internos (`ToolUse`, `ToolResult`) que pueden cambiar entre versiones.
- Solo cambia lo que se dibuja; no cambia lo que lee el modelo ni lo que ejecuta.
- No lleva claves ni datos personales. Licencia MIT.
