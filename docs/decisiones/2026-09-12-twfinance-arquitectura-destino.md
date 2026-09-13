# Decisión: arquitectura destino de tw-finance

Fecha: 2026-09-12. Decide: Juan. Contexto: `docs/investigacion/2026-09-12-relevamiento-twfinance-vercel.md`.

**Motivo de la migración:** dejar de operar infraestructura (no costo). Se acepta que la
factura mensual suba respecto del VPS (≈ USD 50–60/mes).

**Arquitectura elegida: A.**
- Web (Next.js, BFF) → Vercel, plan Pro (Hobby no permite uso comercial).
- API (NestJS, imagen Docker actual con `ENTRYPOINT` que migra) + Redis → Railway, proyecto `TW Finance` existente.
- Postgres → Supabase Pro, región `sa-east-1`, con los dos roles (`twfinance`, `twfinance_app`) creados antes de la primera migración.
- Sin cambios de código en la API. Cambios de configuración: `API_BASE_URL` público en la web, `CORS_ORIGENES`, variables de `.env.produccion.example` repartidas entre Vercel y Railway, `DATABASE_URL` (directa) y `DATABASE_URL_APP` (pooler) en Supabase.

**Orden de fases:** 1) web a Vercel contra la API del VPS; 2) Postgres a Supabase; 3) API + Redis a Railway y DNS de `api.tw-finance.uno`; 4) apagar VPS tras una semana con respaldos verificados y token de R2 revocado.

**Descartado:** B (todo Vercel) por requerir rediseñar colas BullMQ, cron y migraciones, con riesgo de cold starts en una API financiera consumida por la app móvil.

**Datos fijos:** repo `https://github.com/gittecnowork/twfinance` (rama `main`). El equipo de Vercel `powerpuntotw-9125's projects` tiene GitHub vinculado a la org `powerpuntotw`, no a `gittecnowork`: hay que instalar la app de GitHub de Vercel en `gittecnowork` antes de crear el proyecto.

**Prerrequisitos a cargo de Juan antes de la fase 1:** upgrade de Vercel a Pro; autorizar la app de GitHub de Vercel sobre `gittecnowork/twfinance`.
