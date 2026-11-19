# Actualizar en varios equipos

## Plugin

En cada equipo:
```
claude plugin marketplace update cc-tools
claude plugin update quiet-tools@cc-tools
```
Reiniciar Claude Code después. El plugin solo se actualiza si subió `version` en `plugin.json`.

## Línea de estado

Volver a copiar el script (`git pull` en el clon y repetir el paso de copia de la guía de su sistema). `settings.json` no hay que tocarlo otra vez.

## Muchos servidores

Un bucle por SSH, por ejemplo (ajusta la lista de hosts; prueba antes con uno):
```
for h in $(cat servidores.txt); do
  ssh "$h" 'claude plugin marketplace update cc-tools && claude plugin update quiet-tools@cc-tools'
done
```
`servidores.txt` es tu lista local; no la subas al repo.
