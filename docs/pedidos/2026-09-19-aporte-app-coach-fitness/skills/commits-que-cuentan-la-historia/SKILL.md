---
name: commits-que-cuentan-la-historia
description: Escribir mensajes de commit que expliquen el porqué del cambio, el bug que resolvían y la decisión tomada, de modo que el historial sirva como documentación. Activar al commitear cualquier cambio no trivial, al armar un release, y especialmente cuando un commit anterior describió algo que no contenía y hay que corregir la historia donde el próximo la va a buscar.
---

# Commits que cuentan la historia

## Cuándo aplica
Todo commit que no sea un typo. Con más razón: fixes de seguridad, cambios de comportamiento, decisiones que alguien va a cuestionar.

## La lección
El historial es el documento que sobrevive. CLAUDE.md se pierde entre cuentas, la memoria del agente no viaja, los chats se archivan. `git log` queda. Un commit que dice "fix auth" no le sirve a nadie en tres meses; uno que dice **qué estaba roto, por qué, y qué se decidió** evita re-diagnosticar.

Y cuando un commit anterior mintió (describió un fix que no contenía), el commit que lo corrige tiene que decirlo con nombre y hash: es donde el próximo que investigue va a mirar.

## Reglas
1. **Primera línea: tipo(alcance): qué cambia**, en voz activa, menos de 72 caracteres. `fix(auth): el mobile deja de usar rutas de login para refrescar sesión`.
2. **Cuerpo: el porqué antes que el qué.** Qué estaba mal, qué consecuencia tenía, cuál era la causa. El diff ya muestra el qué.
3. **Las decisiones no obvias, escritas.** "Split logout() vs clearSession(): ensureAuth() limpia justo antes del auto-login, así que si esa limpieza dejara marca el arranque en frío se bloquearía a sí mismo." Sin eso, alguien lo "simplifica" y rompe.
4. **Los hallazgos colaterales, nombrados.** "El toggle de RIR compartía el bug y nunca se reportó porque más arriba en la página el salto se confunde con scroll normal."
5. **Corregir la historia explícitamente.** Si el commit `abc123` describía un fix que no contenía: "el commit abc123 describía este fix pero no lo contenía; este sí".
6. **Un commit, una historia.** Fix y tests del fix pueden ir juntos si son la misma historia. Un fix de CSS y un cambio de auth, nunca.
7. **Release = merge commit con resumen**, no squash: la historia de la rama es la documentación.

## Plantilla

```
tipo(alcance): qué cambia, en una línea

Qué estaba mal y qué consecuencia tenía (una o dos frases).

Causa. Si no era obvia, cómo se encontró.

Decisión tomada y por qué, sobre todo si hay una alternativa que parece
más simple y no sirve.

Hallazgos colaterales, si los hay.

Cómo se verificó (mutación, Network, curl — lo observable).
```

## Checklist
- [ ] ¿Alguien que no estuvo puede entender por qué existe este cambio?
- [ ] ¿Está la causa, no sólo el síntoma?
- [ ] ¿Las decisiones que parecen raras tienen su porqué?
- [ ] Si corrige un commit anterior, ¿lo nombra con hash?
- [ ] ¿El mensaje es verdad? (ver `verificar-reportes-de-agentes`)

## Trampas conocidas
- **Mensaje escrito antes de verificar.** Un commit del proyecto origen describía un fix que el diff no contenía. El mensaje se escribió a partir del reporte, no del código.
- **Co-Authored-By automático** que el repo no usa. Decidir la convención y sostenerla; no es grave, pero mezclarlas es ruido.
- **Squash que borra la historia** de una rama de 40 commits con diagnósticos adentro. Merge con `--no-ff`.
