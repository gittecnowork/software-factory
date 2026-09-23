---
name: aportar-a-la-fabrica
description: "Armar un aporte de un proyecto a la fábrica (skill candidata, propuesta o devolución) sin exponer nada del proyecto en el repo público. Usar antes de abrir una rama o un PR contra gittecnowork/software-factory."
---

# Aportar a la fábrica

Verificado: 2026-09-23, contra el primer aporte real que recibió la fábrica (PR #2, 2026-09-19) y
contra el README de la fábrica, regla 27. Re-chequear cuando cambie la visibilidad del repo o la
convención de `docs/pedidos/`.

El repo de la fábrica es **público, historial incluido**. Lo que entra en una rama pusheada ya se
puede leer, aunque el PR se cierre sin mergear y la rama se borre: GitHub mantiene accesible el
contenido del PR hasta que Soporte lo purga. Por eso la limpieza se hace **antes del primer push**,
no en la revisión.

## Qué es un aporte

- Una rama `aporte/<slug-neutro>` y una carpeta `docs/pedidos/AAAA-MM-DD-<slug-neutro>/`.
- Adentro:
  - `PEDIDO.md`, con los siete campos de `software-factory:contrato-de-traspaso`;
  - `DEVOLUCION.md`, con los cinco bloques, si el aporte nace de usar la fábrica;
  - `skills/<nombre>/SKILL.md` por cada skill candidata;
  - `propuestas/NN-<tema>.md` por cada cambio a una pieza existente.
- **No toca** `plugins/`, `registro/`, `README.md` ni `CLAUDE.md`. Incorporar, versionar y
  publicar lo hace la sesión de la fábrica (reglas 16 y 18).
- El **slug es neutro**: describe el tema del aporte, no el nombre del producto ni del cliente.

## La prueba de anonimato

Buscar nombres propios con `grep` no alcanza: el primer aporte pasó esa limpieza y aun así expuso
el diseño de acceso de una app en producción. La prueba es por **categorías**, y cada una tiene su
salida:

| Categoría | Qué no viaja | Cómo se reescribe |
|---|---|---|
| Acceso y sesión | Cómo entra un usuario a una app real: credenciales, códigos, tokens, rutas de login, límites de intentos | La lección general, sin el caso. Si la app tiene hoy un agujero abierto, **no se aporta**: se arregla primero en el proyecto |
| Esquema y código | Nombres reales de tablas, columnas, rutas, funciones, variables de entorno | Nombres genéricos e inventados (`usuarios`, `/recurso/:id`, `obtenerDatos()`) |
| Cifras de producción | Cantidad de migraciones, de usuarios, de llamadas, límites configurados | Sin números, o con números marcados como ejemplo |
| Rubro y cliente | Términos del dominio que ubican al cliente (su especialidad, sus métricas propias) | Un dominio neutro |
| Personas y máquinas | Cuentas, mails, nombres de host, rutas locales (`C:\Users\...`) | Nada. El autor del commit con mail `noreply` (ver abajo) |

La pregunta de cierre, que manda sobre la tabla: **"alguien que no conoce el proyecto y lee esta
carpeta, ¿puede ubicar la app o atacarla?"** Si la respuesta no es un "no" claro, se reescribe.

## Una skill candidata es una lección, no una crónica

- Lo que pasó en el proyecto se cuenta, anonimizado, en `DEVOLUCION.md`. La skill trae la regla
  general y un ejemplo inventado.
- `description` en una línea y corta (menos de 300 caracteres): se carga en todos los proyectos.
- Fecha de verificación, y paso de re-chequeo si describe el comportamiento de una herramienta
  externa (regla 7).
- Antes de proponerla, buscar si la fábrica ya tiene algo que la cubra. Si solapa, se propone como
  **fusión** con la pieza existente, no como skill nueva.

## Antes del push

1. `git config user.email` → el mail `noreply` de GitHub de la cuenta
   (`<id>+<usuario>@users.noreply.github.com`, en GitHub → Settings → Emails). El mail del autor
   queda público en cada commit.
2. `node .github/scripts/chequeos-fabrica.mjs` con código 0.
3. Una búsqueda de los identificadores privados del proyecto sobre toda la carpeta, con salida
   vacía. Los patrones los tiene el dueño del proyecto y **no se escriben** en el aporte.
4. La tabla de anonimato, recorrida categoría por categoría, y marcada en el `PEDIDO.md`: "revisado
   sin hallazgos" o qué se reescribió.

## Qué pasa después

- La sesión de la fábrica decide **pieza por pieza** y lo deja en `docs/decisiones/`. Nada se
  aplica literal (regla 15).
- Lo aceptado se reescribe desde la fábrica, con su bump, en commits propios. El PR del aporte
  puede mergearse como registro solo si pasó la prueba de anonimato; si no, se cierra sin mergear.

## Si algo se filtró

- **No se corrige con un commit encima**: el dato sigue en el historial.
- Se avisa al dueño. Se cierra el PR, se borra la rama y se pide a GitHub Support que desreferencie
  el PR y limpie su caché.
- Si lo filtrado es un secreto, **primero se rota**; después se limpia.
- Si lo filtrado describe un agujero de una app real, lo urgente es cerrarlo en el proyecto.

## Trampas ya pagadas

| Síntoma | Causa real |
|---|---|
| El aporte pasó la limpieza de nombres y dominios, y aun así exponía cómo entrar a la app de origen | La limpieza buscaba identificadores. El riesgo estaba en el **diseño**: esquema, rutas y lógica de acceso contados con sus nombres reales |
| El mail personal del autor apareció en el PR público | El mail sale de `git config user.email` y viaja en cada commit, no en los archivos. Ningún grep sobre la carpeta lo encuentra |
