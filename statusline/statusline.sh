#!/bin/bash
# Línea de estado de Claude Code: usuario@host:carpeta | modelo esfuerzo | contexto | 5h | semana
# Zona horaria de las horas de restablecimiento: la del sistema, o STATUSLINE_TZ (p. ej. Europe/Madrid)
[ -n "$STATUSLINE_TZ" ] && export TZ="$STATUSLINE_TZ"
input=$(cat)
j() { echo "$input" | jq -r "$1 // empty" 2>/dev/null; }
sep=" | "
cwd=$(j '.workspace.current_dir // .cwd')
out=$(printf '\033[01;32m%s@%s\033[00m:\033[01;34m%s\033[00m' "$(whoami)" "$(hostname -s)" "$cwd")

model=$(j '.model.display_name')
effort=$(j '.effort.level')
if [ -n "$model" ]; then out="$out$sep$model${effort:+ $effort}"; elif [ -n "$effort" ]; then out="$out$sep$effort"; fi

YEL=$'\033[33m'; ORA=$'\033[38;5;208m'; RST=$'\033[00m'
paint() { [ -n "$1" ] && printf '%s%s%s' "$1" "$2" "$RST" || printf '%s' "$2"; }  # $1 color, $2 texto

# contexto: amarillo > 150k, naranja > 250k
tok=$(j '.context_window.total_input_tokens')
if [ -n "$tok" ]; then
  c=""; [ "$tok" -gt 150000 ] 2>/dev/null && c=$YEL; [ "$tok" -gt 250000 ] 2>/dev/null && c=$ORA
  out="$out$sep$(paint "$c" "$(awk -v t="$tok" 'BEGIN{printf "%.1fk", t/1000}')")"
fi

# uso de la suscripción; hora de restablecimiento
dias=(dom lun mar mié jue vie sáb)
limit() {  # $1 = five_hour|seven_day, $2 = etiqueta, $3 = con día (1) o solo hora
  local pct reset txt d h
  pct=$(j ".rate_limits.$1.used_percentage"); [ -z "$pct" ] && return
  txt="$2: $(printf '%.0f' "$pct")%"
  reset=$(j ".rate_limits.$1.resets_at")
  if [ -n "$reset" ]; then
    h=$(date -d "@$reset" +%H:%M 2>/dev/null)
    if [ "$3" = 1 ]; then
      d=$(date -d "@$reset" +%w 2>/dev/null)
      [ -n "$d" ] && txt="$txt (${dias[$d]} $h)"
    else
      [ -n "$h" ] && txt="$txt ($h)"
    fi
  fi
  # color: naranja > 80 %; en la semana, amarillo si el uso va por delante del tiempo transcurrido
  local c="" p=${pct%.*}
  if [ "$p" -gt 80 ] 2>/dev/null; then c=$ORA
  elif [ "$1" = seven_day ] && [ -n "$reset" ]; then
    local now elapsed; now=$(date +%s)
    elapsed=$(( (604800 - (reset - now)) * 100 / 604800 ))  # % de la semana transcurrido
    [ "$p" -gt "$elapsed" ] 2>/dev/null && c=$YEL
  fi
  out="$out$sep$(paint "$c" "$txt")"
}
limit five_hour 5h 0
limit seven_day sem 1

printf '%s' "$out"
