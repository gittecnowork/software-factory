---
name: commitear-con-verificacion
description: "Comprobar qué entra de verdad a un repositorio antes de commitear y confirmar contra el remoto después de pushear: revisar el árbol completo, decidir si un archivo entra, respetar las condiciones duras del repo y frenar cuando un criterio no se cumple. Usar antes de cualquier commit, y cada vez que haya que decidir si un archivo está ignorado, trackeado o fuera de alcance."
---

# Commitear con verificación

Verificado: 2026-09-15. La tabla de comportamiento de `git add -n` se comprobó corriendo cada caso
en un repositorio desechable con **git 2.54.0** en Windows, no de memoria. Si esa tabla se contradice
con lo que devuelve el repo que tenés delante, gana el repo: anotalo y corregí esta skill.

Un commit no se juzga por lo que se quiso cambiar, sino por **lo que efectivamente entra**. Los tres
errores que esta skill evita son siempre el mismo error con distinta cara: tomar el silencio de un
comando como respuesta, tomar una respuesta parcial como completa, y ajustar el criterio para que dé
bien.

---

## Antes del commit

### 1. Mirar el árbol completo

`git status --short`, entero, sin filtrar. **Todo** archivo que aparezca y esté fuera del alcance
declarado se nombra en el reporte y se explica. Ignorar uno en silencio es la forma más barata de
meter un cambio que nadie pidió y que nadie va a buscar después.

Un archivo que aparece **por efecto** del cambio bajo revisión es parte del alcance, no una
excepción: el bump de versión que el cambio obliga, el lockfile que se movió al instalar, el archivo
generado por el paso que se agregó. Excluirlo "porque no estaba en el pedido" parte el cambio en dos
commits de los cuales el primero no funciona.

### 2. "¿Este archivo entra al repo?" se responde con `git add -n`

Nunca con `git check-ignore` **para responder esa pregunta**. `check-ignore` responde otra: cuál es
la regla que matchea la ruta. Sale **0 si alguna regla matchea, incluida una negación** — así que un
exit 0 no significa "está ignorado":

```
$ git check-ignore -v cfg/keep.json     # .gitignore: cfg/*  +  !cfg/keep.json
.gitignore:3:!cfg/keep.json	cfg/keep.json     ← exit 0, y NO está ignorado
$ git check-ignore -v cfg/otro.json
.gitignore:2:cfg/*	cfg/otro.json             ← exit 0, y sí está ignorado
```

`git add -n <ruta>` responde por el comportamiento real. Su tabla de verdad:

| Situación de la ruta | Qué imprime `git add -n` | Exit |
|---|---|---|
| No trackeada, ignorada por un patrón | `The following paths are ignored by one of your .gitignore files:` | 1 |
| No trackeada, no ignorada | `add '<ruta>'` | 0 |
| Trackeada, con cambios | `add '<ruta>'` | 0 |
| **Trackeada, sin cambios** | **nada** | 0 |
| Inexistente o ruta mal escrita | `fatal: pathspec '<ruta>' did not match any files` | 128 |

### 3. El silencio de `git add -n` no significa "ignorado"

Significa **"no hay diferencia que stagear"**, y eso pasa cuando el archivo ya está trackeado y sin
cambios. Confundir esos dos casos produce una falsa alarma en cualquiera de las dos direcciones: dar
por ignorado algo que está versionado, o salir a arreglar un `.gitignore` que nunca estuvo roto.

Para desambiguar, una sola pregunta más, que responde por sí o por no con el código de salida:

```bash
git ls-files --error-unmatch <ruta>   # exit 0 = trackeado, exit 1 = no trackeado
```

Silencio + `ls-files` exit 0 → está en el repo y está al día. Silencio + exit 1 no debería ocurrir:
si ocurre, mirá el exit 128 de la tabla, casi siempre es la ruta mal escrita (espacios, acentos,
mayúsculas en Windows).

### 4. Un patrón de `.gitignore` no destrackea nada

Lo ya versionado sigue versionado, y `.gitignore` deja de aplicarle. Comprobado: agregar
`trackeado.txt` al `.gitignore` de un repo donde ese archivo ya está commiteado deja `git add -n`
listándolo normalmente y hace que `check-ignore -v` salga **1 sin imprimir nada** — es decir,
"ninguna regla lo ignora", aunque la regla esté escrita ahí arriba.

Destrackear requiere `git rm --cached`, que es un cambio de contenido del repo, no de configuración.
Y destrackear algo que se versiona **a propósito** —el caso típico es `.claude/settings.json`— rompe
funcionalidad para todos los demás sin producir ningún error visible. No se hace de paso: se decide,
y se dice en el reporte.

### 5. Verificar las condiciones duras del repo, cada vez

Las rutas que en un repo determinado **nunca** entran (o que siempre tienen que entrar) son hechos de
ese repo: viven en su `CLAUDE.md`, no acá, porque no son ciertas en ningún otro. Ejemplos reales:
en `twfinance`, `documentacion/` no entra; en esta fábrica, todo cambio de contenido de un plugin
sube su `version` en `plugin.json` **en el mismo commit**.

Lo que sí es universal es **cuándo** se comprueban: antes de cada commit, con los comandos de los
puntos 2 y 3, contra el `git status` de ese momento. No una vez al principio del trabajo. Una
condición dura comprobada hace diez pasos no dice nada sobre el árbol de ahora.

### 6. El mensaje dice qué habilita el cambio

No qué archivos toca — eso ya está en el diff, y repetirlo desperdicia la única línea que alguien va
a leer dentro de seis meses. `docs: sincronizar el README con el contenido real de los plugins`, no
`docs: editar README.md`. Seguí el prefijo convencional que ya usa la historia del repo.

### 7. Si un criterio no se cumple, no se commitea

Se frena y se reporta: qué criterio, qué comando lo mostró, qué haría falta. **No se ajusta el
criterio para que dé bien**, no se commitea "la parte que sí anda" sin decirlo, y no se deja el
problema para el commit siguiente. Un criterio que se relaja cuando molesta no era un criterio.

---

## Después del push

`git push` actualiza la ref de seguimiento local, así que **inmediatamente después de pushear vos**,
`git log origin/<rama> -1` es confirmación válida. Fuera de ese caso —pasó tiempo, pushearon otros,
o no sabés quién pusheó— esa ref es una copia local que puede estar vieja, y confirmar contra ella es
confirmar contra nada.

```bash
git fetch origin && git log origin/<rama> -1 --oneline   # o, sin tocar refs locales:
git ls-remote origin refs/heads/<rama>                   # va al remoto de verdad
```

El criterio es el mismo de siempre: el commit está publicado cuando lo dice el remoto, no cuando el
push no dio error.

---

## Higiene de los scripts auxiliares

Un script de apoyo (una prueba, una exploración, un archivo temporal) va con **ruta absoluta fuera de
todo repositorio** y lleva una guarda de cwd que **aborta** si el directorio de trabajo cayó dentro
de uno. Sin la guarda, un `rm -rf` relativo o un `git init` se ejecutan en el repo real y el daño
aparece mucho después.

Si algo de un repo quedó pisado, modificado o borrado por un script auxiliar, **va en el reporte
aunque se haya restaurado**. Restaurar no cancela el hecho: la próxima vez puede no restaurarse.

---

## Qué se reporta

El formato completo lo fija la skill `contrato-de-traspaso` — acá solo lo que este trabajo obliga a
poner adentro:

- Cada archivo del `git status` que quedó **fuera** del alcance declarado, con la razón.
- Cada condición dura comprobada, con el comando y su código de salida.
- El commit confirmado contra el **remoto**, con el comando que lo confirmó.
- Cualquier archivo de un repo tocado por un script auxiliar, restaurado o no.

---

## Trampas ya pagadas

| Síntoma | Causa real |
|---|---|
| "El archivo está ignorado": `git add -n` no imprimió nada | Estaba trackeado y sin cambios. Silencio = "nada que stagear", no "ignorado". Desambiguar con `git ls-files --error-unmatch`. |
| `git check-ignore -v` sale 0, se concluye que el archivo está ignorado | Sale 0 con cualquier regla que matchee, **incluida una negación**. Hay que leer la línea, o directamente usar `git add -n`. |
| Se agregó el patrón al `.gitignore` y el archivo sigue entrando en los diffs | Un patrón no destrackea lo ya versionado. Requiere `git rm --cached` — y si el archivo se versiona a propósito, no hay que destrackearlo. |
| Se pushea, el push no da error, y el commit no está en el remoto | Se confirmó contra `git log origin/<rama>` sin `fetch`: esa ref es local. |
| Aparece un archivo inesperado en `git status` y se commitea igual "porque era chico" | Alcance no declarado. Se nombra y se explica, o no entra. |
| La condición dura se verificó al empezar y el commit igual metió lo que no debía | Se verificó una vez, no antes del commit. El árbol de ahora es el único que cuenta. |
