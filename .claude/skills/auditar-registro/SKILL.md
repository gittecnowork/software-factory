---
name: auditar-registro
description: "Comparar registro/proyectos.yaml con lo que hay de verdad en Supabase, Vercel y Railway (solo lectura), o incorporar la entrada que devolvió un alta de proyecto. Usar al recibir una entrada de la Fase 6 del alta, antes de revisar costos o publicar un cambio de plugin, o cuando se pregunte qué proyectos ocupan recursos de Tecnowork."
---

# Auditar el registro de proyectos

Verificado: 2026-09-16, contra los MCP de Supabase, Vercel y Railway conectados a la cuenta. Antes
de usar esta skill, repetir el paso 1: la cobertura de los conectores cambia.

Skill **local de este repo** (`.claude/skills/`): el registro vive acá y solo se edita desde esta
sesión (regla 18). No va en el plugin porque no aplica en ningún otro proyecto.

## Alcance

- **Solo lectura** sobre Supabase, Vercel y Railway. Esta skill nunca crea, pausa, transfiere ni
  borra un recurso, aunque lo encuentre huérfano: lo reporta, y la decisión es de Juan (regla 4).
- Edita únicamente `registro/proyectos.yaml`. No toca repos de proyectos (regla 18).
- Termina cuando se cruzaron los tres proveedores y quedó el reporte. No investiga por qué existe
  un recurso más allá de sus metadatos (regla 6).

## Paso 1 — Qué puede ver cada MCP

1. Supabase: `list_organizations`, y `get_organization` para cada org (da el plan).
2. Vercel: `list_teams`.
3. Railway: `list-projects` (trae el workspace).

Comparar con el bloque `cobertura_mcp` del registro y actualizarlo si cambió. **Lo que un MCP no
alcanza no se da por inexistente.** Al 2026-09-16, el MCP de Supabase solo ve la org de
desarrollo: un recurso de producción en Supabase que no aparece por MCP queda como "no
observable", no como "huérfano" ni como "borrado".

## Paso 2 — Inventario real

- Supabase: `list_projects` (ref, org, región, estado).
- Vercel: `list_projects` para cada equipo (id, nombre, repo vinculado).
- Railway: `list-projects` (id, nombre, workspace).
- Consumidores de la fábrica en esta máquina: leer `~/.claude/plugins/installed_plugins.json` (en Windows,
  `%USERPROFILE%\.claude\plugins\installed_plugins.json`).
  Cada install de scope `project` trae la ruta del repo y su versión. Es la prueba de qué repos usan
  la fábrica **en esta máquina**; otra máquina puede tener otros.

## Paso 3 — Cruce

Por cada recurso, buscarlo en el registro **por id**, no por nombre: los nombres cambian entre
proveedores (`twfinance-web` en Vercel, `TW Finance` en Railway).

| Resultado | Qué significa | Qué se hace |
|---|---|---|
| Está en el proveedor y en el registro, y coincide | OK | Actualizar `verificado_el` |
| Está en el proveedor y no en el registro | Huérfano o alta sin registrar | Proponer entrada con `verificado: false`; si el repo vinculado lo identifica, usar su nombre como `id` |
| Está en el registro y no en el proveedor visible | Borrado, renombrado o fuera de cobertura | Mirar el Paso 1 antes de concluir. Si el proveedor sí se ve entero, marcar para confirmar; no borrar la entrada |
| Coincide el id y difiere org, región o repo | Transferencia o cambio de vínculo | Actualizar y anotar la fecha en `notas` |

Controles extra, que salen del doc 06 del Proyecto:

- **Lugares Free de Supabase:** contar los proyectos activos en orgs `free`. Con 2 ocupados, el
  próximo desarrollo va a Docker local. Informarlo siempre, aunque no haya ningún cambio.
- **Desarrollo en una org paga:** un proyecto con `estado: desarrollo` en una org que no es
  `free` cuesta desde el día uno. Se reporta primero.
- **Producción en Vercel Hobby:** el uso comercial está prohibido en ese plan. Si `list_teams`
  devuelve un equipo `hobby` con un proyecto en `produccion`, se reporta.
- **Consumidores sin registrar o desactualizados:** si un install de scope `project` de un plugin
  `@tecnowork` corresponde a un repo que no figura en el registro con `usa_fabrica: true`, es un alta
  sin registrar. Si un install tiene una versión menor que la del `plugin.json` de este repo, hay que
  correr `claude plugin update <plugin>@tecnowork --scope project` **desde ese repo**. La skill lo
  informa; no lo corre.

## Paso 4 — Incorporar una entrada de un alta

Cuando la entrada viene del bloque de la Fase 6 de `alta-de-proyecto-en-la-fabrica`:

1. Cada id que trae se confirma por MCP antes de pegarlo. Lo que el reporte da por hecho y no se
   observa queda `verificado: false` (regla 20: es una premisa, no un hecho).
2. Si el `id` ya existe, se aplica solo el cambio, sin duplicar la entrada.
3. Se revisa que no traiga secretos. Si trae alguno, **no se pega**: se reporta.

## Salida

1. `registro/proyectos.yaml` actualizado, con `actualizado:` en la fecha del día.
2. Un reporte corto con:
   - huérfanos;
   - entradas sin confirmar;
   - lugares Free ocupados;
   - alertas de costo;
   - lo que quedó fuera de la cobertura de los MCP.
3. **Correcciones al insumo** (regla 9): lo que el registro o el reporte del alta decían y
   resultó falso.

Esta skill no commitea. El commit se hace con `software-factory:commitear-con-verificacion`.

## Trampas ya pagadas

| Síntoma | Causa real |
|---|---|
| Un proyecto de producción en Supabase "no existe" | El MCP de Supabase está conectado solo a la org de desarrollo. No es un borrado: está fuera de cobertura. |
| El nombre de la org en el panel no coincide con el doc 06 (`TecnoWork Dev` y `Tecnowork Desarrollo`) | Se registra el nombre que devuelve el MCP y se identifica la org por su id, no por el nombre. |
