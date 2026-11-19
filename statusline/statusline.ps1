# Uso: powershell -NoProfile -File statusline.ps1  (Claude Code le pasa el JSON por stdin; equivalente Windows de statusline.sh)
# Linea de estado: usuario@host:carpeta | modelo esfuerzo | contexto | 5h | semana
[Console]::InputEncoding = [Text.Encoding]::UTF8
[Console]::OutputEncoding = [Text.Encoding]::UTF8
$raw = [Console]::In.ReadToEnd()
try { $j = $raw | ConvertFrom-Json } catch { $j = $null }

$E = [char]27
$RST = "$E[00m"; $YEL = "$E[33m"; $ORA = "$E[38;5;208m"
$sep = ' | '
function Paint($c, $t) { if ($c) { "$c$t$RST" } else { $t } }

$cwd = if ($j.workspace.current_dir) { $j.workspace.current_dir } else { $j.cwd }
$out = "$E[01;32m$($env:USERNAME)@$($env:COMPUTERNAME.ToLower())$RST`:$E[01;34m$cwd$RST"

$model = $j.model.display_name; $effort = $j.effort.level
if ($model) { $out += $sep + $model + $(if ($effort) { " $effort" }) }
elseif ($effort) { $out += $sep + $effort }

# contexto: amarillo > 150k, naranja > 250k
$tok = $j.context_window.total_input_tokens
if ($null -ne $tok) {
  $c = $null; if ($tok -gt 150000) { $c = $YEL }; if ($tok -gt 250000) { $c = $ORA }
  $out += $sep + (Paint $c (($tok / 1000).ToString('0.0', [Globalization.CultureInfo]::InvariantCulture) + 'k'))
}

# uso de la suscripcion; hora de restablecimiento en la zona del sistema, o en STATUSLINE_TZ (id de Windows, p. ej. 'Romance Standard Time')
$tz = if ($env:STATUSLINE_TZ) { [TimeZoneInfo]::FindSystemTimeZoneById($env:STATUSLINE_TZ) } else { [TimeZoneInfo]::Local }
$dias = 'dom', 'lun', 'mar', "mi$([char]0xE9)", 'jue', 'vie', "s$([char]0xE1)b"  # sin tildes literales: PS 5.1 lee mal UTF-8 sin BOM
function Limit($key, $label, $withDay) {
  $r = $j.rate_limits.$key
  if ($null -eq $r -or $null -eq $r.used_percentage) { return '' }
  $pct = [double]$r.used_percentage
  $txt = "${label}: $([math]::Round($pct))%"
  $reset = $r.resets_at
  if ($reset) {
    $t = [TimeZoneInfo]::ConvertTime([DateTimeOffset]::FromUnixTimeSeconds([long]$reset), $tz)
    $txt += $(if ($withDay) { " ($($dias[[int]$t.DayOfWeek]) $($t.ToString('HH:mm')))" } else { " ($($t.ToString('HH:mm')))" })
  }
  $c = $null
  if ($pct -gt 80) { $c = $ORA }
  elseif ($key -eq 'seven_day' -and $reset) {
    $now = [DateTimeOffset]::UtcNow.ToUnixTimeSeconds()
    $elapsed = [math]::Floor((604800 - ([long]$reset - $now)) * 100 / 604800)
    if ([math]::Floor($pct) -gt $elapsed) { $c = $YEL }
  }
  $sep + (Paint $c $txt)
}
$out += (Limit 'five_hour' '5h' $false)
$out += (Limit 'seven_day' 'sem' $true)

[Console]::Write($out)
