---
name: auto-login-de-desarrollo
description: Implementar un auto-login de desarrollo (devCode, usuario fijo) que no pise el trabajo del desarrollador ni haga ilegibles los diagnósticos: sólo en arranque en frío sin sesión previa, nunca después de un logout explícito, con rastro en consola, con un único portero, y apagable de verdad aunque haya sesión guardada. Activar al agregar o tocar cualquier atajo de login para desarrollo, y ante cualquier comportamiento raro de sesión en local antes de sospechar del producto.
---

# Auto-login de desarrollo

## Cuándo aplica
Cualquier atajo que loguee solo en desarrollo. Y cualquier bug de sesión en local: **sospechar primero de esto**.

## La lección
El auto-login se re-disparaba después de "Cerrar sesión" — y no volvía como el usuario que se estaba probando, sino como el del `devCode`. Hizo aparentar **tres bugs distintos que no existían**: de sesiones, de invitaciones y de copy. Tres rondas completas de diagnóstico.

Después aparecieron dos más: el chequeo de "devCode desajustado" comparaba contra una clave ausente en toda sesión abierta a mano, así que echaba al usuario equivocado (un usuario nuevo elegía su código y terminaba adentro como el de dev). Y `devCode: ''` no apagaba nada si ya habías entrado alguna vez: el descarte de la sesión vieja estaba adentro de un `if (devCode)`. Este último no lo vio ningún test porque todos arrancaban con navegador limpio, y **un dev que toca ese flag nunca estrena navegador**.

## Reglas
1. **Sólo en arranque en frío sin sesión previa.** Nunca después de un logout explícito: un logout que se auto-deshace no es un logout, y en dev hace imposible probar cualquier cosa del ciclo de acceso.
2. **Marca persistente de logout explícito** (`localStorage`), que el auto-login consulta y que sólo un login manual exitoso borra. No un flag de instancia: el logout navega y el componente se recrea.
3. **Un único portero** (`canDevAutoLogin()`) consultado por todos los disparadores. Con dos reglas duplicadas, a una le faltó una condición.
4. **Rastro en consola siempre que corra:** `[dev] auto-login con devCode XXXXXX (usuario: NOMBRE)`. Buena parte de la confusión fue no distinguir "entré yo" de "entró solo".
5. **Apagarlo tiene que apagarlo aunque haya sesión guardada.** El descarte de una sesión de dev obsoleta corre en el constructor del servicio, fuera de cualquier `if (devCode)`.
6. **No pisar a un usuario real.** Si la sesión la abrió una persona (login manual, invitación), es intocable: el "desajuste" se detecta contra una marca propia del auto-login, no contra la ausencia de una clave.
7. **Bloqueado mientras haya un flujo de acceso en curso** (elegir código, invitación canjeada): si no, se mete en el medio y cancela la recuperación sin que nadie lo note.
8. **Usa el camino real de login**, no una ruta legada: si el login del producto cambia, el atajo cambia con él.
9. **En producción: apagado y verificado en el bundle** (`devCode:""` en el JS compilado). Es la forma en que un repo se equivoca en sentido inverso.

## Checklist
- [ ] Cerrar sesión → queda afuera; F5 → sigue afuera.
- [ ] Entrar a mano con otro usuario → ese usuario queda, el devCode no lo pisa.
- [ ] Usuario nuevo por invitación en incógnito → nunca aparece el usuario de dev.
- [ ] `devCode: ''` con sesión previa guardada → cae en acceso.
- [ ] Cambiar el devCode → descarta la sesión vieja y entra con el nuevo.
- [ ] Cada auto-login deja su línea en consola.
- [ ] Bundle de producción con el flag vacío.

## Trampas conocidas
- **Tests con contexto limpio** que no ven nada de esto. Ver `matriz-estado-de-partida`.
- **Comparar `user.code` contra `devCode`** cuando pasaron a ser conceptos distintos (identificador vs credencial): siempre distinto → logout en cada navegación.
- **Diagnosticar el producto antes de descartar el atajo.** Ante cualquier rareza de sesión en local: `devCode: ''` primero.
