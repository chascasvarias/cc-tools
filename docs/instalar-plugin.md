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
4. Comprobar: pide cualquier edición o comando. Debe verse una línea tenue (`● Ran command (N lines)`) en vez del diff o la salida. `ctrl+o` muestra el detalle.

## Opciones

En `/config`, entrada `quiet-tools`:

- `icon`: marcador al inicio de cada línea (vacío = ninguno).
- `showLineCount`: añade `(N lines)` a los comandos.

## Quitar

`claude plugin uninstall quiet-tools@cc-tools` y reiniciar.

## Si no funciona

- Ver el log: `claude --debug` y buscar `quiet-tools`.
- Si tras una actualización de Claude Code desaparece el efecto, puede haber cambiado algún componente interno; revisa si hay versión nueva del plugin.
