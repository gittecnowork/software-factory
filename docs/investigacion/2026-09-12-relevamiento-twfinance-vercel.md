# Relevamiento: tw-finance → Vercel

Fecha: 2026-09-12. Fuente: repo `C:\dev\twfinance` (CLAUDE.md, `compose.produccion.yml`,
`aplicaciones/api/*`, `.github/workflows/desplegar.yml`, `Caddyfile`) + documentación oficial
de Vercel, Supabase, Upstash y Railway consultada en la fecha.

## Lo que corre hoy (VPS DonWeb, Ubuntu 22.04, IP 149.50.128.237)

Cinco contenedores en `compose.produccion.yml`, un solo `.env.produccion` en el servidor:

| Servicio | Qué es | Dependencias operativas |
|---|---|---|
| caddy | TLS + proxy para `app.tw-finance.uno` y `api.tw-finance.uno` | volumen de certificados ACME |
| web | Next.js standalone, BFF con cookies HttpOnly | `API_BASE_URL=http://api:3000/v1` (red interna), `SECRETO_COOKIES` |
| api | NestJS 10, Express, Prisma 5, **BullMQ (3 colas)**, **@nestjs/schedule (cron horario)**, Redis para rate limit + idempotencia, OpenTelemetry + Sentry, `ENTRYPOINT` corre `prisma migrate deploy` antes de arrancar | Postgres (2 roles: `twfinance` dueño y `twfinance_app` con RLS), Redis, 3 secretos JWT distintos, `CORS_ORIGENES`, `TRUST_PROXY=1` |
| postgres | 17, RLS por `set_config('app.cuenta_id', …, true)` por transacción | volumen; respaldos diarios por cron a Cloudflare R2 (token con filtro de IP), dead-man's switch en healthchecks.io |
| redis | BullMQ + rate limit + idempotencia | — |

Deploy: push a `main` → GitHub Actions abre SSH con clave de comando forzado → `desplegar.sh`
en el VPS → verifica `GET /v1/conexion` desde afuera (`estado`, `base_de_datos`, `redis` en ok).

Colas BullMQ y cron (lo que NO es serverless):
- `COLA_WEBHOOKS`: procesa eventos de Mercado Pago/Stripe con reintentos.
- `COLA_COTIZACIONES_AUTO`: `@Cron` horario encola un job; el worker trae cotizaciones (dolarapi, BCP, exchange-api) y persiste por cuenta en modo sistema (sin `cuenta_id`, salta RLS).
- `COLA_AVISOS_VENCIMIENTO`: detector programado + worker outbox (canal push/email aún stub).

## Qué encaja en Vercel y qué no

| Pieza | En Vercel | Motivo |
|---|---|---|
| Web Next.js | **Sí, natural** | Es el caso de uso principal de Vercel. Monorepo pnpm+Turborepo soportado (Root Directory = `aplicaciones/web`). Cambio: `API_BASE_URL` pasa a la URL pública de la API. |
| API NestJS tal cual | **No** | Vercel Functions son efímeras: no hay proceso vivo para `@Cron`, ni workers BullMQ, ni `enableShutdownHooks`, ni migraciones en `ENTRYPOINT`. Cold start de Nest + OTel auto-instrumentación en cada arranque. |
| API NestJS adaptada | Posible, con reescritura de la capa operativa | Bootstrap por invocación cacheado, `@Cron` → Vercel Cron, BullMQ → Vercel Workflow/QStash o procesamiento inline, migraciones → paso de CI, Redis → Upstash, OTel → Vercel OTel. Es un rediseño, no una migración; contradice la regla del repo de no romper lo que anda. |
| Postgres | Fuera de Vercel (Supabase / Neon) | Vercel no aloja Postgres propio; lo integra por Marketplace. |
| Redis | Fuera de Vercel (Upstash por Marketplace, o Railway) | Upstash soporta BullMQ pero avisa que BullMQ consulta Redis constantemente y en Pay-As-You-Go eso se cobra por comando: usar plan fijo. |
| Respaldos a R2 | Reemplazados por los del proveedor de DB | Supabase Pro: diarios, 7 días. Free: sin respaldos y **pausa el proyecto tras 1 semana inactivo** (inaceptable para producción). |

## Dos arquitecturas posibles

### A. Vercel + Railway + Supabase (recomendada: cero cambios de código en la API)
- Web → Vercel (Pro: USD 20/asiento/mes; Hobby prohíbe uso comercial).
- API (imagen Docker actual, con su `ENTRYPOINT` y migraciones) + Redis → Railway (Hobby USD 5/mes con USD 5 de crédito; una API Nest chica ronda USD 4–8/mes en uso). El proyecto `TW Finance` ya existe en Railway y el `Dockerfile` ya funcionó ahí (`DESPLIEGUE-RAILWAY.md`).
- Postgres → Supabase Pro (USD 25/mes, región `sa-east-1`, respaldos diarios). Prisma con pooler Supavisor en modo transacción para runtime + `DIRECT_URL` para migraciones. Crear los dos roles antes de la primera migración (mismo problema que resolvió `10-rol-aplicacion.sh`).
- Costo estimado: USD 50–60/mes. Contra el VPS: más caro, pero sin servidor que operar, respaldos gestionados, previews por PR en la web y escalado automático.

### B. Todo Vercel (Functions + Marketplace)
- Web y API en Vercel, Postgres en Supabase/Neon, Redis en Upstash, cron en Vercel Cron, colas reescritas.
- Costo similar o menor en infraestructura, pero semanas de rediseño de la API y riesgo de cold starts en una API que consume una app móvil con login por PIN y operaciones de dinero idempotentes.
- Solo tiene sentido si el objetivo es eliminar todo contenedor, no si el objetivo es dejar el VPS.

## Fases (para la opción A), cada una reversible por DNS
1. **Web a Vercel** apuntando a la API que sigue en el VPS. Cambios: `API_BASE_URL` público, `CORS_ORIGENES` (si cambia el dominio de la web durante la prueba), cookies `Secure`. DNS de `app.tw-finance.uno` → Vercel. Riesgo bajo.
2. **Postgres a Supabase**: crear roles, `pg_dump`/`pg_restore` en ventana de mantenimiento, correr `prisma migrate deploy` (debe reportar "sin cambios"), verificar RLS con un `cuenta_id` de prueba.
3. **API + Redis a Railway** con las variables de `.env.produccion.example`; puerto del dominio = puerto que escucha la app (aprendizaje de Railway registrado en el repo). DNS de `api.tw-finance.uno` → Railway. Actualizar `EXPO_PUBLIC_API_BASE_URL` en `eas.json` si cambia la URL (si el dominio se mantiene, no hace falta rebuild de la móvil).
4. **Apagar el VPS** después de una semana con respaldos de Supabase verificados y el token de R2 revocado. Desactivar `desplegar.yml` (SSH) y reemplazarlo por los deploys nativos de Vercel/Railway desde GitHub.

## Pregunta abierta (decide el diseño)
¿Por qué se migra? Si es **costo**, la opción A cuesta más que el VPS y hay que decirlo antes. Si es **operación** (no administrar servidor, respaldos, certificados, actualizaciones de Ubuntu) o **flujo de trabajo** (previews, deploy por PR), la opción A se justifica.

## Assets que este piloto deja en la fábrica
- skill `desplegar-next-en-vercel-monorepo` (pnpm + Turborepo, Root Directory, variables, dominios).
- skill `migrar-postgres-a-supabase-con-prisma` (roles, pooler vs directa, RLS, dump/restore, verificación).
- skill `api-contenedor-en-railway` (Dockerfile con ENTRYPOINT, puerto del dominio, variables, Redis privado).
- agente `verificador-de-deploy` (health, CORS, cookies, webhooks fail-closed, cron encolando).
- overlay `tw-finance` con las particularidades del repo (dos tokens, dos copias de la spec, dinero como string).
