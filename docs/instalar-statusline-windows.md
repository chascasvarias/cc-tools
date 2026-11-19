# Línea de estado en Windows

Requisitos: Windows PowerShell 5.1 o superior. No necesita `jq`. (PowerShell 7 / `pwsh` no probado.)

1. Copiar el script (desde un clon del repo):
   ```powershell
   New-Item -ItemType Directory -Force "$env:USERPROFILE\.claude" | Out-Null
   Copy-Item statusline\statusline.ps1 "$env:USERPROFILE\.claude\statusline.ps1"
   ```
2. Probar sin Claude Code:
   ```powershell
   '{"model":{"display_name":"Opus"},"effort":{"level":"high"},"context_window":{"total_input_tokens":180000}}' | powershell -NoProfile -File "$env:USERPROFILE\.claude\statusline.ps1"
   ```
   Debe imprimir `usuario@host:… | Opus high | 180.0k` (con códigos de color).
3. Activar en `%USERPROFILE%\.claude\settings.json` **sin borrar lo que ya tenga**:
   ```powershell
   $f = "$env:USERPROFILE\.claude\settings.json"
   if (-not (Test-Path $f)) { '{}' | Set-Content $f -Encoding UTF8 }
   Copy-Item $f "$f.bak"
   $s = Get-Content $f -Raw -Encoding UTF8 | ConvertFrom-Json
   $cmd = 'powershell -NoProfile -File "' + $env:USERPROFILE + '\.claude\statusline.ps1"'
   $s | Add-Member -NotePropertyName statusLine -NotePropertyValue ([pscustomobject]@{ type = 'command'; command = $cmd }) -Force
   $s | ConvertTo-Json -Depth 20 | Set-Content $f -Encoding UTF8
   ```
4. Reiniciar Claude Code y comprobar que la línea aparece.

## Zona horaria

Usa la zona del sistema. Para otra, define la variable de entorno `STATUSLINE_TZ` con un id de Windows (p. ej. `Romance Standard Time`; lista: `tzutil /l`).

## Quitar

Restaurar `settings.json.bak` (o borrar la clave `statusLine`) y reiniciar.
