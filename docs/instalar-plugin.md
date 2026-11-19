# Instalar el plugin quiet-tools

Requisito: Claude Code instalado (`claude --version`).

1. Añadir el marketplace (dentro de Claude Code):
   ```
   /plugin marketplace add chascasvarias/cc-tools
   ```
   O desde la terminal: `claude plugin marketplace add chascasvarias/cc-tools`.
2. Instalar:
   ```
   /plugin install quiet-tools@cc-tools
   ```
   O: `claude plugin install quiet-tools@cc-tools`.
3. Reiniciar Claude Code.
4. Comprobar: pide cualquier edición o comando. Debe verse una línea tenue (`● Cmd: List files in current directory (N lines)`) en vez del diff o la salida. `ctrl+o` muestra el detalle.

## Opciones

En `/config`, entrada `quiet-tools`:

- `icon`: marcador al inicio de cada línea (vacío = ninguno).
- `verbColor`: color del verbo (`Cmd`, `Edited`, `Read`…). Un color del tema (`suggestion`, el de por defecto; `success`, `warning`, `claude`…), que sigue al tema claro u oscuro, o un nombre o hex (`cyan`, `#5fafff`). Vacío = tenue como el resto.
- `showLineCount`: añade `(N lines)` a los comandos.
- `showCommand`: muestra una versión corta del comando Bash/PowerShell (`Cmd: sed -i … README.md`) cuando `label` es `command` o el comando no trae descripción. Sin esto, un comando que edita un archivo no dice cuál.
- `commandMaxChars`: longitud máxima de la descripción o del comando mostrado (por defecto 120).
- `label`: `description` (por defecto) muestra la frase corta que el modelo escribe para cada comando (`Cmd: List files in current directory`; si no hay, el comando); `command` muestra el comando abreviado.
- `showDiffSize`: añade a las ediciones las líneas añadidas y quitadas (`Edited src/a.ts (+3 −1)`); un archivo nuevo sale como `Created … (+N)`.

Reemplazos por equipo (rutas, prefijos repetidos): ver [configurar.md](configurar.md).

## Quitar

`claude plugin uninstall quiet-tools@cc-tools` y reiniciar.

## Si no funciona

- Ver el log: `claude --debug` y buscar `quiet-tools`.
- Si tras una actualización de Claude Code desaparece el efecto, puede haber cambiado algún componente interno; revisa si hay versión nueva del plugin.
