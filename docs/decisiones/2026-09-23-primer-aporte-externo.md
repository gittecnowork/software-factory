# Decisión: primer aporte externo (PR #2)

Fecha: 2026-09-23. Decide: Juan, sobre el análisis de la sesión de la fábrica.
Insumo: el PR #2 (2026-09-19), cerrado sin mergear por exponer detalles internos de una app en
producción. Este documento **no repite** esos detalles: registra solo qué se hizo con cada pieza.

## Resumen

27 piezas: 4 propuestas y 23 skills candidatas. La versión 0.7.0 incorpora las 4 propuestas, total
o parcialmente, y una skill nueva que nace del propio incidente (`aportar-a-la-fabrica`). Las skills
candidatas se decidieron así: 2 nuevas en la base y 3 fusiones para la 0.8.0; el resto va a
overlays que se crean recién cuando haya un segundo proyecto que los use, o no entra.

La convención de aportes por `docs/pedidos/` queda **adoptada**, con la regla 27.

## Propuestas

| # | Tema | Decisión | Dónde quedó |
|---|---|---|---|
| 01 | Todo hallazgo dice quién puede dispararlo | Aceptada, ampliada: suma el actor "proceso o agente con acceso" y el caso de una credencial del equipo que se filtra | `revisor.md`, `analista-de-requerimiento.md`, "Errores que ya pagamos" del contrato (0.7.0) |
| 02 | El hook fuera del stack donde nació | Parcial: el alcance real del hook (no ve ediciones por shell) y las migraciones ya escritas entran a la base. Los archivos propios de otros stacks esperan a verificar si un overlay puede traer su propio hook (regla 24) | `implementador.md`, el hook, el README (0.7.0) |
| 03 | Alta de un repo que ignora `CLAUDE.md` | Aceptada | Fase 0 y "Trampas ya pagadas" de `alta-de-proyecto-en-la-fabrica` (0.7.0) |
| 04 | Desde dónde corre cada rol | Opciones 1 y 2 aceptadas; la 3 (abrir la lista `tools:` de los agentes) descartada, porque la separación de roles es esa lista | Campo 3 del contrato (0.7.0) y `docs/investigacion/2026-09-23-vias-de-actualizacion-del-plugin.md` |

## Skills candidatas

| Skill | Decisión | Motivo |
|---|---|---|
| `diagnostico-antes-de-parche` | Base, 0.8.0 | Proceso puro, sin equivalente. Entra con descripción corta y ejemplos neutros |
| `verificar-tests-por-mutacion` | Base, 0.8.0 | Completa al verificador: la única prueba de que un test mira lo que dice mirar |
| `verificar-reportes-de-agentes` | Fusión con `contrato-de-traspaso`, 0.8.0 | Falta cómo se **recibe** una devolución. Solapa con la regla 14 y el verificador: no suma una skill |
| `orquestar-claude-code` | Fusión con `contrato-de-traspaso`, 0.8.0 | Aporta "una tanda verificable por pedido" y "confirmá o refutá". Se descarta "no re-diagnostiques", que choca con las reglas 15, 20 y 25 |
| `commits-que-cuentan-la-historia` | Fusión con `commitear-con-verificacion`, 0.8.0 | Compite con ella por el mismo disparo. Aporta la plantilla del cuerpo y la corrección nombrando el hash |
| `no-guardar-credenciales-en-conversaciones` y `secretos-y-entornos` | Una sola skill de secretos, a definir | Se pisan entre sí y con la condición 6 del `CLAUDE.md`. El comando para generar secretos que traían no sirve (no es criptográfico) |
| `matriz-estado-de-partida`, `suite-e2e-repetible` | Overlay futuro de e2e | No todo proyecto tiene e2e de navegador |
| `migraciones-a-supabase-cloud` | Overlay futuro por servicio | Supabase cruza stacks: la capa 2 necesita overlays por servicio además de por stack |
| `overlays-en-ionic-y-stacking-contexts`, `sesion-mobile-e-interceptor-401`, `presupuesto-css-con-motivo`, `auto-login-de-desarrollo` | Overlay futuro de ese stack | Específicas del stack |
| `builds-de-produccion-antes-de-mergear` | Su núcleo, al verificador; el resto, al overlay de stack | El núcleo ya está en las reglas 12 y 24 |
| `configuracion-del-operador-en-el-panel`, `tools-de-claude-para-un-panel` | Overlay futuro de patrones de producto, reescritas | Son diseño de producto, no proceso |
| `acceso-por-invitacion-y-codigo-propio`, `refresh-no-es-login`, `proyeccion-explicita-de-columnas`, `rate-limiting-sensato` | No entran como están | Describían el diseño de seguridad de una app real. Si se reescriben genéricas y corregidas, pueden ir a un overlay de seguridad |
| `checks-alineados-con-el-codigo` | Parte de un futuro overlay de backend | La mitad sobre escalas del dominio no se generaliza |
| `runbook-de-deploy-en-fases` | Se queda en el proyecto | Depende de su flujo de ramas y su infraestructura |

## Lo que quedó pendiente

- Ampliar el chequeo de CI para los aportes (mail `noreply` del autor, aviso por patrones de
  esquema bajo `docs/pedidos/`). Hoy lo cubre la skill, no la máquina.
- La purga del PR #2 en GitHub Support.
