# Línea de estado en Linux / macOS

Requisitos: `bash`, `jq`, `awk` y `date` de GNU (en macOS: `brew install jq coreutils`, y `gdate` en lugar de `date`; no probado en macOS).

1. Comprobar `jq`: `jq --version`. Si falta: `sudo apt install jq` (Debian/Ubuntu).
2. Copiar el script (desde un clon del repo):
   ```
   mkdir -p ~/.claude
   cp statusline/statusline.sh ~/.claude/statusline.sh
   chmod +x ~/.claude/statusline.sh
   ```
3. Probar sin Claude Code:
   ```
   echo '{"model":{"display_name":"Opus"},"effort":{"level":"high"},"context_window":{"total_input_tokens":180000}}' | ~/.claude/statusline.sh
   ```
   Debe imprimir `usuario@host:… | Opus high | 180.0k`.
4. Activar en `~/.claude/settings.json` **sin borrar lo que ya tenga**. Con `jq`:
   ```
   f=~/.claude/settings.json; [ -f "$f" ] || echo '{}' > "$f"
   cp "$f" "$f.bak"
   jq '.statusLine = {"type":"command","command":"bash ~/.claude/statusline.sh"}' "$f.bak" > "$f"
   ```
5. Reiniciar Claude Code y comprobar que la línea aparece.

## Zona horaria

Las horas de restablecimiento (`5h`, `sem`) usan la zona del sistema. Para otra, define `STATUSLINE_TZ` (por ejemplo `Europe/Madrid`) en el entorno donde corre Claude Code, o cambia el comando a:
`"command":"STATUSLINE_TZ=Europe/Madrid bash ~/.claude/statusline.sh"`.

## Colores

Contexto: amarillo >150k, naranja >250k. Límites: naranja >80 %; la semana en amarillo si el uso va por delante del tiempo transcurrido. Se cambian en el script.

## Quitar

Restaurar `~/.claude/settings.json.bak` (o borrar la clave `statusLine`) y reiniciar.
