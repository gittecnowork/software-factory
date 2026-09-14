---
name: alta-de-proyecto-en-la-fabrica
description: "Conectar un repo a la fábrica: agregar el marketplace, elegir qué overlays instalar, versionar el .claude/settings.json y escribir o corregir el CLAUDE.md del proyecto. Usar al conectar un repo nuevo o existente a la fábrica, o cuando un proyecto ya conectado 'no ve' los agentes o las skills que debería."
---

# Alta de un proyecto en la fábrica

Verificado: 2026-09-14, contra el README de la fábrica y la instalación real en esta máquina
(`software-factory@tecnowork` a nivel usuario, marketplace `tecnowork` agregado). Lo que el README
marca como no verificado —si `extraKnownMarketplaces` + `enabledPlugins` alcanza sin más, o si
además hace falta instalar cada plugin a mano— sigue sin cerrar acá: la Fase 5 de esta skill es
donde se comprueba cada vez, y lo que se descubra pasa a "Trampas ya pagadas".

## Lo que ordena todo

- El marketplace es de la **máquina**; los plugins habilitados son del **repo**. Confundirlos hace
  perder tiempo: un repo con `enabledPlugins` perfecto sigue sin ver nada si esta máquina nunca
  agregó `tecnowork`.
- La pregunta de las tres capas decide dónde va cada cosa, no la comodidad: ¿seguiría siendo cierto
  en otro proyecto? Siempre → `software-factory`. Solo con este stack → overlay de stack. Solo acá →
  overlay de proyecto o `CLAUDE.md`, según si es proceso o es un hecho.
- Nada de esto reemplaza instalar de verdad: `claude plugin list`, corrido con la sesión abierta
  **en el repo**, es la única prueba de que un plugin de alcance `project` está activo.

---

## Fase 0 — Preflight (gratis)

1. **Marketplace agregado en esta máquina.** `claude plugin marketplace list` tiene que listar
   `tecnowork`. Si no está: `claude plugin marketplace add gittecnowork/software-factory` (pide
   acceso de lectura al repo privado).
2. **El repo no ignora `.claude/settings.json`.** Abrir el `.gitignore` y buscar `.claude`. Si
   excluye la carpeta entera, no alcanza con agregar una línea `!.claude/settings.json` debajo:
   Git no vuelve a mirar dentro de un directorio ya excluido, así que la excepción no tiene efecto.
   Hay que cambiar la exclusión de carpeta por una de archivos:

   ```gitignore
   .claude/*
   !.claude/settings.json
   ```

   Eso versiona `settings.json` y sigue ignorando todo lo demás de `.claude/`, `settings.local.json`
   incluido (que es personal y no debe versionarse).

   Para comprobarlo, `git check-ignore -v <archivo>` no alcanza solo: devuelve **código de salida
   0** con cualquier patrón que matchee, incluida una negación (`!...`), así que un match no prueba
   que el archivo siga ignorado. Mirar qué línea imprime (si empieza con `!`, no está ignorado) o,
   más directo, `git add -n .claude/settings.json`: si lo lista para agregar, quedó bien.
3. **Si ya existe `CLAUDE.md`, leerlo entero antes de tocar nada.** Un alta no es la oportunidad
   para reescribirlo: es para no contradecirlo. Si algo de lo que dice ya no es cierto, es un
   hallazgo para el reporte, no una licencia para reescribir de paso.

---

## Fase 1 — Relevar el stack real

Leer el repo, no lo que un README o un `CLAUDE.md` declaren: el `package.json` de la raíz y el de
cada paquete/aplicación del workspace, el gestor de paquetes y su lockfile, el ORM si hay uno, el
framework de cada app. La documentación de un repo con historia suele quedar vieja apenas el código
avanza. Con el stack real en mano, revisar la tabla de overlays existentes en
`.claude-plugin/marketplace.json` de la fábrica: puede que ya exista uno para ese stack.

---

## Fase 2 — Elegir capas

Por cada capacidad candidata (una convención, un checklist, una skill), una sola pregunta:
**¿esto seguiría siendo cierto en otro proyecto?**

- **Sí, siempre** → `plugins/software-factory` (CAPA 1).
- **Sí, pero solo en proyectos con este mismo stack** → el overlay de stack (CAPA 2), o uno nuevo
  si todavía no existe.
- **No, solo en este repo** → acá se bifurca de nuevo: si es un **hecho o invariante** (algo cierto
  del dominio o del sistema, no un procedimiento) va al `CLAUDE.md` del repo. Si es un
  **procedimiento** que se va a repetir, va a un overlay de proyecto (CAPA 2, propio de ese repo).

Un overlay de proyecto que crece mucho es una señal de que hay una capacidad reutilizable sin
extraer todavía — moverla a un overlay de stack o a la base, no dejarla ahí por inercia.

---

## Fase 3 — Escribir el `.claude/settings.json` del repo

Versionado, con el marketplace y **todos** los plugins que el repo necesita — el plugin base
incluido, aunque ya esté instalado a nivel usuario en esta máquina: sin listarlo acá, el repo no es
autosuficiente en una máquina nueva.

```json
{
  "extraKnownMarketplaces": {
    "tecnowork": { "source": { "source": "github", "repo": "gittecnowork/software-factory" } }
  },
  "enabledPlugins": {
    "software-factory@tecnowork": true,
    "<overlay-de-stack>@tecnowork": true,
    "<overlay-de-proyecto>@tecnowork": true
  }
}
```

Si `.claude/settings.local.json` existe, confirmar que sigue ignorado y que no repite ninguna de
estas claves: es personal, y una entrada duplicada ahí puede pisar en silencio a la versionada.

---

## Fase 4 — `CLAUDE.md`

Qué va: hechos e invariantes de **este** repo — y de cada invariante, el porqué, porque sin el
porqué alguien lo va a "mejorar". Qué NO va: proceso. Un paso a paso, un checklist, una secuencia de
comandos son skill, no `CLAUDE.md`: si se escriben ahí, se duplican y divergen la primera vez que
la skill cambie.

Si el repo es **existente** y ya tiene `CLAUDE.md`: no se reescribe de cero. Cada afirmación que se
toque se **verifica contra el código antes de escribirse** —ruta y línea, no memoria ni el README
del propio repo— y el documento tiene que contar el **presente**: una migración en curso, un
componente reemplazado o un runbook dado de baja se actualizan, no se dejan describiendo un estado
que ya pasó.

---

## Fase 5 — Verificación

Ninguna es opcional; todas se corren con una **sesión nueva, abierta en el repo del proyecto**, no
en la fábrica.

1. Los agentes de cada plugin habilitado aparecen con su prefijo (`software-factory:revisor`,
   etc.) y al menos uno responde con su rol al invocarlo.
2. Si el repo tiene un archivo que el hook de la fábrica vigila (`package.json`, `turbo.json`,
   `Dockerfile`, un lockfile...), editarlo una vez: el hook tiene que cortar y pedir los
   consumidores.
3. `claude plugin list` muestra cada plugin de `enabledPlugins` con la versión esperada y
   `enabled`. Si falta alguno pese a estar en `settings.json`, no asumir que el archivo está mal:
   puede hacer falta instalarlo también, con `claude plugin install <plugin>@tecnowork --scope
   project` — el README de la fábrica marca esto como no verificado; esta fase es donde se
   verifica.
4. **Si un agente o una skill que se acaba de agregar a un plugin no aparece**, y `claude plugin
   list` sí muestra el plugin como `enabled`: el caché local de plugins se indexa por **número de
   versión**, no por contenido. `claude plugin marketplace update` refresca el catálogo, pero si el
   `plugin.json` del plugin no subió de versión, el contenido cacheado de esa versión **no se
   vuelve a bajar** — ni con `marketplace update` ni con `claude plugin update`. La causa no es un
   settings.json mal escrito ni una sesión vieja: es que quien publicó el cambio no subió la
   versión del plugin. La solución es esa —subir la versión y volver a instalar—, no reinstalar en
   bucle.

---

## Repo nuevo vs. repo existente

En un repo **nuevo**, el alta se parte en dos tiempos. Al crearlo: la base (`software-factory`) y
un `CLAUDE.md` mínimo con lo poco que ya se sabe (qué es, para quién). El overlay de stack recién
se agrega **después** de la decisión de arquitectura — antes no hay stack que overlayear, y
elegirlo antes de tiempo es adivinar. En un repo **existente**, las tres fases (relevar, elegir
capas, escribir) se hacen en la misma alta, porque el stack y la historia ya están.

---

## Trampas ya pagadas

| Síntoma | Causa real |
|---|---|
| El repo tiene `.claude/settings.json` bien escrito y la sesión no ve nada | Esta máquina nunca agregó el marketplace `tecnowork`: el marketplace es de la máquina, no del repo. |
| Se agregó `!.claude/settings.json` al `.gitignore` y sigue sin versionarse | El directorio `.claude/` estaba excluido entero: Git no evalúa excepciones dentro de una carpeta ya ignorada. Hay que excluir por archivo (`.claude/*` + `!archivo`), no por carpeta. |
| Un overlay listado en `enabledPlugins` no aparece en `claude plugin list` | Puede hacer falta instalarlo además, con `--scope project`. |
| El plugin figura `enabled` pero una skill o un agente nuevos no aparecen en la sesión | El caché local quedó en la versión vieja: el `plugin.json` no subió de versión cuando se agregó contenido, y ni `marketplace update` ni `plugin update` vuelven a bajarlo. |
