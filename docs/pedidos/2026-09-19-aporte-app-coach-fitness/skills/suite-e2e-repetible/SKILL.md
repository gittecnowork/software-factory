---
name: suite-e2e-repetible
description: Hacer que una suite e2e (Playwright o similar) contra una base real pueda terminar en verde dos veces seguidas: teardown por spec, reset de base y reinicio del backend antes de cada corrida, skips explícitos, rate limiters contemplados y un README que diga qué escribe cada spec. Activar cuando una suite falla de forma distinta entre corridas, cuando un spec deja datos que otro lee, cuando aparecen 429 o timeouts "aleatorios", o antes de meter e2e en CI.
---

# Suite e2e repetible

## Cuándo aplica
Cualquier suite que escriba en una base compartida. Antes de CI, siempre.

## La lección
La suite del proyecto origen no podía terminar una corrida completa en verde, y nadie lo sabía porque cada dev corría specs sueltos. Tres causas distintas, todas silenciosas:

- **Corte estructural:** un spec le cambiaba la credencial al usuario de prueba y no la devolvía. El proyecto siguiente (android, después de ios) arrancaba con el usuario muerto: 13 rojos que no eran bugs.
- **Deriva de datos:** un spec del panel escribía fecha de pago y teléfono; otro del mobile los leía. La primera corrida daba PRs ("¡la rompiste!"), las siguientes no — y **el test aceptaba los dos textos**, así que derivaba en silencio en vez de fallar.
- **Rate limiter en memoria:** 120 peticiones/min por IP, y el panel dispara ~20 por usuario abierto. La corrida completa lo rozaba y fabricaba 429 que parecían bugs de producto — sin body en el error, se veían como timeouts aleatorios.

## Reglas
1. **Cada spec devuelve lo que muta.** Teardown por API (no SQL), en `afterEach`, que funcione aunque el test muera a mitad de camino (ubicar al usuario por identificador, no por estado del test).
2. **Antes de cada corrida completa:** reset de base + **reinicio del backend**. Los limitadores y throttles viven en memoria del proceso: un reset de base no los limpia.
3. **Dos corridas seguidas como criterio.** La segunda delata la deriva que la primera esconde.
4. **`test.skip` explícito y con motivo** cuando el estado no permite el caso (ej. "el seed no trae fecha de pago"). Nunca un assert que acepte dos resultados.
5. **El error de los helpers incluye la respuesta del backend.** Un 429 legible vale más que un timeout misterioso.
6. **Documentar qué escribe cada spec** en un README del e2e: tabla spec → tablas que toca → cómo lo revierte. Y los dos pasos previos a cada corrida.
7. **Limitadores medidos, no adivinados.** Anotar el pico de peticiones/min de la suite y dejar el límite con la medición en el comentario. Y revisarlo si el tráfico baja (ej. después de sacar un refresh por navegación).
8. **Workers en 1 no es la solución a la deriva.** Si ya están en 1 y sigue fallando, no es carga: es datos o limitador.

## Checklist
- [ ] `db reset` + reinicio del backend → suite completa → verde.
- [ ] Repetir sin reset → mismos números, o los skips esperados.
- [ ] Ningún spec deja credenciales, fechas de pago, ni contadores cambiados.
- [ ] Ningún assert acepta más de un resultado "para que pase".
- [ ] README del e2e con la tabla de efectos por spec.
- [ ] Los helpers de login muestran el body del error.
- [ ] El README raíz no promete algo que la suite ya no cumple ("los tests no crean usuarios").

## Trampas conocidas
- **`input[value="..."]` en Angular** no matchea nunca: Angular escribe la propiedad, no el atributo. Un borrado "exitoso" se salteaba en silencio.
- **Contar cards pegado al click de borrar**, antes del re-render. Esperar por condición, no por timeout.
- **Varios backends corriendo** (nodemons huérfanos) compitiendo por el puerto: cada cambio levanta uno y el test le pega al viejo. Matar los ajenos antes de correr.
- **Spec que se llama `05-` y otro `00-`** para forzar orden: funciona dentro de un proyecto, no entre proyectos. El teardown es la solución, el nombre es el parche.
