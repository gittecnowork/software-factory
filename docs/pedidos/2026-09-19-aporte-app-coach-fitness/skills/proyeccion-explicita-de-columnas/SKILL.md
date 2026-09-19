---
name: proyeccion-explicita-de-columnas
description: Evitar que credenciales, hashes y tokens salgan por la API cuando una tabla mezcla datos públicos con secretos, usando una lista explícita de columnas permitidas, un sanitizador aplicado a toda salida, y un test que falle si cualquier consulta vuelve a pedir '*'. Activar al revisar o escribir cualquier endpoint que devuelva filas de tablas con password_hash, tokens, códigos de invitación, secretos TOTP o API keys — y en especial rutas públicas sin sesión.
---

# Proyección explícita de columnas

## Cuándo aplica
Toda tabla que tenga al lado de los datos normales alguna columna que no debe salir: `password_hash`, `access_token`, `invite_code`, `access_code_hash`, `totp_secret`, `anthropic_api_key`, `token_version`.

## La lección
`getUsersByOperator` hacía `select('*')`. El listado que el panel cargaba en cada apertura devolvía, de cada usuario, su token de acceso (la credencial viva de la invitación), el hash de su código personal, y su código de invitación. Nadie lo pidió, nadie lo miró, el panel sólo leía tres campos — y la credencial viajaba igual en cada respuesta, cacheable y logueable.

Con el pepper vacío de desarrollo, ese hash se revierte con una tabla precomputada del millón de códigos: el código del usuario a una búsqueda de distancia.

`select('*')` es cómo nació el bug. La próxima columna sensible que se agregue nace filtrada sólo si el filtro es una lista, no una resta.

## Reglas
1. **Allowlist, no denylist.** `USER_OPERATOR_COLUMNS = ['id','name',...]` como proyección en TODAS las consultas de la tabla (listado, detalle, alta, update, toggles). Lo que no está en la lista no existe para ese consumidor.
2. **Segunda capa: sanitizador de salida.** `sanitizeForOperator(row)` que recorte a la misma lista aunque una consulta futura vuelva a pedir `*`. Se aplica antes de enriquecer (lo computado pasa igual).
3. **Las excepciones son explícitas y mínimas.** La única ruta que devuelve la credencial es la que existe para eso (`/access-link`), y devuelve `has_own_code: true/false`, nunca el hash.
4. **Rutas públicas (sin sesión) tienen su propia lista aún más corta**, y se lee tres veces qué hay en la misma tabla al lado: `operadores.password_hash`, `totp_secret`, `anthropic_api_key` viven junto a `calendly_url`.
5. **Test de regresión que caza el futuro:** stub que devuelve la fila completa ignorando la proyección, y assert que ninguna salida trae una columna sensible, que ningún `select` sobre la tabla pide `*` o una columna prohibida, y que la excepción legítima sigue devolviendo lo suyo.
6. **Los updates con `.select()` de vuelta también proyectan.** Un `update(...).select('*')` filtra igual que un `select`.

## Checklist
- [ ] ¿Qué columnas tiene la tabla? (mirar el schema, no adivinar)
- [ ] ¿Cuáles de esas son secretos? ¿Están TODAS fuera de la lista?
- [ ] ¿La lista se usa en listado, detalle, alta, update, toggles?
- [ ] ¿Hay sanitizador en la salida?
- [ ] ¿Hay test que falle con `select('*')`?
- [ ] ¿Las rutas sin sesión tienen lista propia?
- [ ] `curl` como el consumidor: ¿aparece alguna columna sensible? Pegar la respuesta completa.

## Trampas conocidas
- **"El panel sólo usa tres campos, no importa qué devuelva."** La respuesta viaja igual, se cachea igual, se loguea igual.
- **Un hash "no es la credencial".** Con 6 dígitos y sin pepper, es la credencial con un paso más.
- **La ruta pública agregada después** (`/operador/public`) sobre una tabla que ya tenía secretos: cada ruta nueva es una oportunidad de repetir el bug.
