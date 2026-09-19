---
name: acceso-por-invitacion-y-codigo-propio
description: Diseñar acceso para usuarios finales sin email ni contraseña (alumnos, pacientes, clientes de un operador) con dos credenciales: una invitación de un solo uso que genera el operador, y un código corto que elige el usuario y se guarda hasheado con pepper. Activar al diseñar o auditar login por código, enlaces mágicos, PINs, o cualquier sistema donde el operador "da acceso" a sus usuarios, y cuando un identificador visible está haciendo de contraseña.
---

# Acceso por invitación y código propio

## Cuándo aplica
Productos donde un operador (coach, médico, profesor) da de alta a sus usuarios y estos entran sin email/contraseña. Especialmente cuando del otro lado hay datos sensibles (salud, menores).

## La lección
El sistema original tenía un código único (`USUARIO01`) que era identificador Y credencial: corto, visible en el panel, en conversaciones, en planillas, imposible de revocar sin renombrar al usuario, y el operador podía entrar como cualquiera de sus usuarios. Con datos de salud del otro lado, eso no es una comodidad: es un problema de diseño.

Se reemplazó por dos credenciales con roles distintos. Las trampas aparecieron en los bordes: el enlace que "venía con la invitación" devolvía sesión directa para siempre; un refresh usaba la ruta de login; el listado devolvía el hash; el auto-login de dev pisaba el flujo de recuperación.

## Modelo
- **Invitación** (`invite_code` de 6 dígitos **y** enlace con token de 256 bits): la genera el operador, **sirve una vez**, se quema al usarse (`invite_used_at`). Las dos puertas caducan juntas. El operador la ve, la manda por el canal que sea, y la regenera si hace falta.
- **Código propio** (`access_code_hash`): lo elige el usuario en su primer ingreso, con reglas (no secuencias, no repetidos, no fechas, no el de la invitación). Se guarda `sha256(código || pepper)`, con el pepper en el entorno del backend. **El operador no lo ve nunca**, ni hasheado. Si el usuario lo olvida, la salida es una invitación nueva.
- **Identificador** (`code`): queda legible y sin poder.

## Reglas
1. **El operador da acceso, no tiene acceso.** Ninguna pantalla del panel muestra el código del usuario. Ninguna ruta lo devuelve.
2. **El enlace vale lo mismo que la invitación: una vez.** Si ya se consumió, "ese enlace ya se usó". Nunca sesión directa desde un enlace guardado.
3. **Pepper obligatorio en producción**, y el backend **no arranca** sin él (`process.exit`), no avisa: agregarlo después invalida todos los códigos ya elegidos. En dev se corre sin pepper a propósito para que el seed coincida.
4. **Hash determinista** (sha256 con pepper, no bcrypt): permite buscar por hash sin recorrer la tabla. Con 6 dígitos, la protección real es el pepper + el throttle por código, no la lentitud del hash.
5. **Índice ÚNICO sobre el hash**, no sólo índice: dos usuarios con el mismo código dejarían a los dos afuera con un error incomprensible.
6. **Una invitación sin usar es "quiero registrar esta cuenta de cero"**: cualquier sesión previa en el dispositivo se descarta antes de mostrar "elegí tu código". Sin eso el camino de recuperación (usuario con sesión viva que olvidó su código) no funciona nunca.
7. **Rechazar el código de la invitación como código propio**: el operador lo vio.
8. **Reglas de elección con tasa de aceptación medida**: rechazar secuencias, repetidos, patrones, fechas y los PIN más usados dejó ~92% del millón aceptable. Suficiente.
9. **Las credenciales no viajan en listados** (ver `proyeccion-explicita-de-columnas`) ni en conversaciones con Claude (ver `no-guardar-credenciales-en-conversaciones`).

## Checklist
- [ ] ¿El operador puede ver o deducir el código del usuario por alguna vía?
- [ ] ¿Un enlace reenviado meses después abre la cuenta?
- [ ] ¿El backend arranca en producción sin pepper? Debe morir.
- [ ] ¿El hash tiene índice único?
- [ ] ¿Un usuario con sesión abierta que toca una invitación nueva puede elegir código?
- [ ] ¿La ruta legada (identificador = credencial) está apagada y verificada por red?
- [ ] ¿El throttle es por código de destino, además de por IP?

## Trampas conocidas
- **`authenticateByToken` que devuelve sesión si el usuario ya tiene código**: el operador guarda el enlace y entra cuando quiere.
- **`select('*')` sobre la tabla**: el hash y el token en cada respuesta.
- **Pepper como `console.warn`**: en producción sin la variable "todo funciona" y los códigos quedan sin protección hasta el día del dump.
- **Copy de la pantalla de acceso que depende del estado que el logout borra**: a quien ya eligió su código le pide "los 6 números que te mandé".
