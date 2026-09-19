# Propuesta 04: decir desde qué superficie funciona cada rol

Toca: el README de la fábrica ("Lo no verificado" o una sección nueva) y, si se acepta,
`skills/contrato-de-traspaso/SKILL.md`. Lo del README no lleva bump; lo de la skill sí.

## Qué se observó

El plugin se sincroniza a Cowork igual que a Claude Code. En una sesión de Cowork en la nube,
vinculada a la PC donde vive el repo, los cinco agentes aparecen listados y se pueden invocar. Se
lanzó el `revisor` con una ficha mínima: leer un archivo del repo. Resultado en `DEVOLUCION.md`,
Evidencia: tres intentos, tres errores. El agente corre en un contenedor Linux; el repo se alcanza
solo con las herramientas del puente al dispositivo, y la lista `tools:` de cada agente no las
incluye. Para `implementador` y `verificador` es peor que un error: su `Bash` existe y funciona,
pero es el del contenedor, así que un `git status` respondería sobre un directorio que no es el
repo.

No se probó en Cowork local de escritorio (pendiente, regla 23).

## Por qué importa

La falla es silenciosa hasta el primer `Read`. Un orquestador que no lo sepa escribe una ficha
perfecta, el agente devuelve "no pude leer nada", y se pierde una vuelta. Con un agente con shell,
el riesgo es peor: evidencia con código de salida 0 sobre el lugar equivocado.

## Opciones

1. **Documentarlo y nada más.** Una tabla en el README: superficie × rol × funciona o no, con fecha.
   Costo: casi nulo. Es la recomendada para empezar.
2. **Ficha con contenido incluido.** Para los roles de solo lectura, el orquestador pega en
   "Insumos" el contenido de los archivos. Sirve para revisiones chicas. Habría que decirlo en el
   contrato: "si quien ejecuta no comparte tu sistema de archivos, los insumos van adentro de la
   ficha, no como rutas".
3. **Abrir la lista `tools:`** para incluir las herramientas del puente. No se recomienda sin
   pensarlo: la separación de roles de la fábrica **es** esa lista. Un revisor con shell remoto deja
   de ser un revisor.

## Texto propuesto para el contrato (opción 2)

En "La ficha", campo 3, Insumos:

> Una ruta solo sirve si quien ejecuta ve el mismo sistema de archivos que vos. Un subagente puede
> correr en otra máquina o en un contenedor: si no estás seguro, el primer paso de la ficha es que
> confirme que puede leer un archivo conocido, y si no puede, que frene ahí.
