# Overlay: TW Finance

Qué va acá: lo que solo es cierto de este repo y no se reutiliza en ningún otro.
Candidatos: el invariante de los dos tokens (`token_cuenta` / `token_miembro`) y su drift con
`cliente.ts`, el dinero como string decimal de 4 decimales, las dos copias de la spec OpenAPI que
deben quedar idénticas, y los tres 401 distintos de la app móvil.

Antes de escribir algo acá, preguntarse si en realidad pertenece a `stack-next-nest-prisma` o a
`software-factory`. Un overlay de proyecto que crece mucho suele ser una señal de que hay una
capacidad reutilizable sin extraer.
