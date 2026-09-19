# Propuesta 03: el alta de un repo que ignora `CLAUDE.md`

Toca: `skills/alta-de-proyecto-en-la-fabrica/SKILL.md`, Fase 0 y "Trampas ya pagadas". Lleva bump.

## Qué se observó

El `.gitignore` del proyecto origen tiene, en líneas consecutivas, `CLAUDE.md`, `CLAUDE-*.md` y
`.claude/`. La tercera ya está cubierta por la Fase 0, punto 2. Las dos primeras no, y rompen la
Fase 4 sin ningún error: el `CLAUDE.md` se escribe, la sesión local lo lee, todo parece andar, y
el archivo nunca llega al remoto.

Consecuencias que ya se vieron en ese repo:

- Una migración SQL versionada remite a "ver CLAUDE.md" para justificar una decisión. Quien clona el
  repo, o lo recibe como zip, no tiene ese archivo. Una auditoría externa se trabó exactamente ahí y
  la decisión quedó registrada como "sin origen conocido".
- Los invariantes del repo viven en una sola máquina. Otra sesión, en otra PC, arranca sin ellos.

Puede haber un motivo legítimo para ignorarlo (el archivo mezclaba contexto de trabajo con datos
del cliente). Por eso no es "sacalo del `.gitignore`": es una decisión que el alta tiene que hacer
visible.

## Texto propuesto

Punto nuevo en la Fase 0, después del 2:

> **El repo no ignora `CLAUDE.md`.** `git add -n CLAUDE.md`: si responde que está ignorado, frenar
> y preguntar por qué antes de la Fase 4. Si el motivo es que el archivo guarda datos que no pueden
> versionarse, la salida es separar: los hechos e invariantes van a un `CLAUDE.md` versionado, y lo
> privado a un archivo local ignorado. Un `CLAUDE.md` que no viaja con el código deja a cada
> máquina con invariantes distintos, y a cualquier referencia "ver CLAUDE.md" apuntando a nada.

Fila nueva en "Trampas ya pagadas":

| Síntoma | Causa real |
|---|---|
| El `CLAUDE.md` existe, la sesión lo lee, y en otra máquina o en un clon limpio los invariantes no están | El `.gitignore` excluye `CLAUDE.md`. No da error: simplemente nunca se commitea. |
