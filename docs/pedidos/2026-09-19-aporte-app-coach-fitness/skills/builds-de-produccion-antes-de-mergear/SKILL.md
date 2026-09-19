---
name: builds-de-produccion-antes-de-mergear
description: Correr los builds de producción de todos los proyectos (no sólo tsc ni el build de desarrollo) antes de mergear a main, e inspeccionar el bundle resultante buscando URLs de localhost, flags de desarrollo encendidos y valores de entorno faltantes. Activar antes de cualquier merge a la rama que deploya, cuando un proyecto lleva tiempo sin deployarse, o cuando "tsc pasa" se está usando como sinónimo de "compila".
---

# Builds de producción antes de mergear

## Cuándo aplica
Antes de cada merge a `main` (o a la rama que dispara el deploy). Sin excepción si el proyecto lleva semanas sin deployar.

## La lección
`tsc` pasaba, `ng build --configuration development` pasaba, la suite pasaba. **El build de producción del panel fallaba desde hacía cuatro meses** (presupuesto de estilos) y el del mobile también (dos claves faltantes en `environment.prod.ts` + otro presupuesto). Nadie lo sabía porque nadie deployaba y nadie corría el build de producción en local.

Cuando por fin se corrió, además de los errores aparecieron cosas que sólo se ven en el bundle: había que confirmar que apuntaba a la API de producción y no a localhost, y que el auto-login de desarrollo salía apagado (`devCode:""`). Es la forma en que un repo se equivoca en sentido inverso: flags de dev llegando a producción.

## Reglas
1. **`tsc` no es compilar.** No aplica `fileReplacements`, no valida templates de Angular, no mide presupuestos. El build de producción es el único que reproduce lo que va a hacer Vercel/Railway.
2. **Todos los proyectos**, no sólo el que se tocó. Un monorepo con panel + mobile + backend tiene tres builds.
3. **Inspeccionar el bundle:** `grep` sobre el JS compilado buscando `localhost`, la URL de la API esperada, y cada flag de desarrollo con su valor de producción (`devCode:""`, `production:!0`).
4. **Comparar los environments** clave por clave (ver `secretos-y-entornos`) — es donde aparecen las claves que faltan en el de producción.
5. **Los warnings de presupuesto se leen**, no se ignoran: un warning hoy es el error de dentro de dos meses. Si el tope se mueve, con motivo (ver `presupuesto-css-con-motivo`).
6. **Sobre la rama mergeada, antes del push.** Mergear localmente, correr los tres builds + tests, y recién ahí pushear. Si algo falla: `reset --hard` a origin y contar.
7. **Mismos comandos que el CI/host.** Si Vercel corre `npm run build`, correr `npm run build`; no un equivalente aproximado.
8. **La configuración del host se verifica contra el host, no contra un simulador.** Reglas de rewrite, headers, redirects y 404 dependen de la implementación del proveedor: un servidor local que "replica el orden" puede dar verde y producción dar lo contrario. Los preview deployments existen para esto — se itera contra el preview, que es el mismo motor que producción, y recién con el preview verde se mergea. Pasó con un lookahead en `vercel.json` que funcionaba en la simulación local y no en Vercel.

## Checklist
- [ ] Build de producción de cada proyecto: exit 0.
- [ ] `grep localhost` en los bundles → cero.
- [ ] URL de la API de producción presente en los bundles.
- [ ] Flags de dev en el bundle con su valor de producción.
- [ ] Warnings de presupuesto leídos y decididos.
- [ ] Todo esto sobre `main` mergeado, antes del push.

## Trampas conocidas
- **"Compila" = `tsc`.** No.
- **El build de desarrollo como proxy.** No mide presupuestos ni usa `environment.prod.ts`.
- **Meses sin deployar** = meses sin correr el build que importa. Programarlo aunque no se deploye.
