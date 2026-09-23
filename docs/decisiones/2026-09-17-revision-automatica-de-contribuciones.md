# Decisión: revisión automática de contribuciones a la fábrica

Fecha: 2026-09-17. Estado: **decidido; etapa 1 cerrada** (`f330a06`); etapas 2 y 3 en espera. Ver "Resolución", al final.
Insumo: la propuesta que escribió la sesión de app-AL (cuenta `juanchyhall`) el 2026-09-17,
"revisión automática de contribuciones externas".
Método: skill `refutar-antes-de-construir`.

Cómo se etiqueta cada dato (regla 3):

- **[doc]**: lo documenta el proveedor; se leyó en la fuente el 2026-09-17.
- **[obs]**: lo observamos nosotros por MCP o en la máquina.
- **[no doc]**: no está documentado y todavía no se probó.

## 0. Estado real del que se parte [obs, 2026-09-17]

- **Repo:** `gittecnowork/software-factory` era privado al momento del análisis (ese mismo día pasó
  a público: ver Resolución) y pertenece a una **cuenta personal**, no a una organización.
- **Ramas y PRs:** una sola rama, `main`, con `protected: false`. **Cero pull requests**, ni
  abiertos ni cerrados. Todos los cambios hasta hoy se pushearon directo a `main`.
- **Colaboradores:** no se pudieron listar (el MCP devolvió 403). No estaba confirmado quién es
  `juanchyhall`. La Resolución lo aclara: es Juan.
- **Consumidores en esta máquina:** según `installed_plugins.json`, solo twfinance. app-AL
  consume la fábrica desde otra cuenta y otra máquina, así que no aparece ahí.

Esto cambia la escala del problema. Hoy no hay contribuciones externas que revisar, y el error
que más se repitió (publicar sin subir la versión, regla 16) salió de pushes directos del dueño,
que un workflow disparado por `pull_request` **no** habría visto.

## 1. Lo que se sostiene

| Pieza | ¿Se sostiene? | Por qué |
|---|---|---|
| Usar GitHub Actions + `anthropics/claude-code-action@v1`, sin servidor propio | Sí | [doc] La acción existe, corre en modo automático con `prompt` y acepta `claude_args`, `plugin_marketplaces`, `plugins` y `settings`. |
| Paso 1: chequeos deterministas sin IA | **Sí, y es lo más valioso** | Automatiza la parte mecánica de `commitear-con-verificacion`: validate, bump (regla 16), `source` del marketplace, frontmatter y conteos del README. No usa secretos ni tokens de Claude. |
| Instalar desde el marketplace y no con `--plugin-dir` | Sí | Aplica la regla 12. [doc] `claude plugin marketplace add` acepta un directorio local con `.claude-plugin/marketplace.json`. |
| Merge humano, al menos al principio | Sí | Aplica la regla 15. Además, sin protección de ramas no hay otra opción (ver 2.1). |
| Topes: `--max-turns`, `timeout-minutes`, `concurrency` | Sí | [doc] Los recomienda la propia guía de costos de la acción. |
| Pasar el texto de cada agente como prompt, no invocarlo como subagente | Sí, como supuesto prudente | [no doc] No hay documentación sobre invocar subagentes de un plugin dentro de la acción. |
| Que la Fase 6 del alta se cierre con un PR | Sí | Es compatible con la regla 18: el consumidor propone y la decisión se toma en la fábrica, con el merge. |
| El límite: CI no verifica deploys ni bases reales | Sí | Bien dicho, y así se etiqueta. |

## 2. Refutaciones

### 2.1 La protección de ramas probablemente no existe en este repo

[doc] Las reglas de protección de ramas y los rulesets están disponibles en repos **públicos**
con GitHub Free, y en repos **privados solo con GitHub Pro, Team o Enterprise**. [obs] El repo es
privado, de cuenta personal, y `main` figura `protected: false`. El plan de la cuenta no se pudo
leer por MCP.

**Consecuencia:** si la cuenta es Free, el punto "`main` exige los checks 1, 2 y 3 en verde" no se
puede configurar. Los checks quedarían como aviso: un PR en rojo se puede mergear igual.

**Salidas:**

- **Pagar GitHub Pro** en la cuenta personal. El precio está a confirmar en Billing; la página de
  precios solo muestra los planes para organizaciones.
- **Mudar el repo a una organización con plan Team.** [doc] USD 4 por usuario por mes durante
  los primeros 12 meses.
- **Aceptar checks de aviso** mientras el único que mergea sea Juan.
- **Hacer el repo público: descartado.** El registro guarda nombres de clientes (ver 3.2).

### 2.2 Un disparador solo `pull_request` no cubre el caso que más costó

[obs] Todo el historial son pushes directos a `main`. El paso 1 tiene que correr también en
`push` a `main`: después del hecho, pero antes de que otra máquina haga `plugin update`. La otra
opción es que Juan también trabaje por PR, y eso sin protección de ramas depende de disciplina.

### 2.3 `--comment` no es un argumento de `claude_args`

[doc] `--comment` es un argumento **de la skill `/code-review`**, y va dentro del `prompt`. Lo que
va en `claude_args` es `--allowedTools "mcp__github_inline_comment__create_inline_comment"`, y la
acción solo levanta ese servidor MCP si está nombrado ahí. Con un prompt propio (el texto de
`revisor.md`), hay que habilitar esa herramienta y ordenarle explícitamente que la use. Sin eso,
el resultado queda solo en el log de la corrida.

### 2.4 `plugin_marketplaces` recibe URLs de Git, no la rama del PR

[doc] El input `plugin_marketplaces` es una "lista de URLs Git de marketplaces". Para probar **la
rama del PR** hay que hacer checkout y correr en un paso de shell:

```
claude plugin marketplace add ./
claude plugin install <plugin>@tecnowork --scope project
```

La URL del repo privado apunta a `main` y además necesita credenciales. Que el `add` de una ruta
local funcione en un runner igual que en la máquina de Juan es [no doc] y es lo primero que hay que
probar (regla 24). La propuesta ya lo marcaba así.

### 2.5 Revisar con IA en cada `synchronize` multiplica el costo sin necesidad

Con `synchronize`, el revisor corre en **cada push** al PR. Con cero PRs hoy no cuesta nada, pero
el diseño escala mal. Conviene disparar el revisor en `ready_for_review`, o a mano con un
comentario `@claude` (modo interactivo), o con una etiqueta.

### 2.6 Los hooks del plugin en CI

[no doc] No está documentado si los hooks de un plugin corren dentro de la acción. La propuesta
dice que el hook "no aplica en CI" por otro motivo (nadie edita ahí), que es correcto. No hay que
apoyar nada en que corran.

## 3. Lo que se rompe en silencio

1. **Checks verdes que no protegen nada.** Sin protección de ramas (2.1), un check en rojo no
   frena el merge ni el push directo. Parece una puerta y es un cartel.
2. **El registro y la visibilidad del repo quedan atados.** `registro/proyectos.yaml` (del
   2026-09-16) guarda clientes y ids de recursos. Cualquier plan para ahorrar haciendo público el
   repo rompe esa decisión.
3. **Los logs de Actions guardan lo que el modelo lee.** Un prompt que vuelca archivos al log los
   deja visibles para quien tenga acceso de lectura al repo. Hoy no hay secretos en el repo
   (CLAUDE.md, condición 6), y esa condición pasa a ser también un requisito del CI.
4. **El verificador solo prueba esta máquina de mentira.** Que un plugin cargue en un runner
   Linux limpio no dice nada de los installs de scope `project` de cada consumidor (lo que pasó con
   twfinance el 2026-09-16). La propagación (paso 4 de la propuesta) **no** es automática para
   Claude Code: sigue siendo `update --scope project` desde cada repo del registro.

## 4. Alternativas comparadas

| Opción | Costo mensual | Trabajo | Qué da | Qué pierde |
|---|---|---|---|---|
| **A. Propuesta completa** (tres jobs en cada push al PR) | Minutos de Actions + tokens del revisor y del verificador en cada push | Alto: tres jobs y un PR de prueba | Revisión con los roles de la fábrica | Gasta por push; sin protección de ramas, los checks no frenan nada |
| **B. Por etapas** (recomendada, **elegida**) | Etapa 1: USD 0. [doc] En repos públicos los minutos de Actions no se cobran; en privados, una cuenta Free trae 2.000 por mes | Etapa 1: bajo | El chequeo de la regla 16 en cada push y cada PR, hoy mismo | La revisión con IA llega cuando haya PRs reales que revisar |
| **C. Code Review administrado de Anthropic** | [doc] USD 15-25 por revisión, cobrado aparte | Casi nulo | Revisión con varios agentes; lee `REVIEW.md` | [doc] Solo planes Team y Enterprise. Su check termina siempre "neutral" y nunca bloquea. No conoce los roles de la fábrica |
| **D. Nada** (seguir con la skill local) | USD 0 | Nulo | — | Depende de que alguien se acuerde. Ya falló tres veces (0.5.1 a 0.5.3) |

**Recomendación: B.** Su costo: escribir y probar un workflow de shell con 5 chequeos, más la
disciplina de mirar el check después de cada push mientras no haya protección de ramas. Es más
trabajo que D, y menos gasto y menos superficie que A.

**Descartadas a propósito:**

- **C:** por plan y por costo, y porque no bloquea.
- **Repo público:** por el registro.
- **Revisor en cada `synchronize`:** por costo sin volumen que lo justifique.

## 5. Seguridad

- **El secreto cambia de modelo de amenaza.** Si se usa `CLAUDE_CODE_OAUTH_TOKEN` [doc: se genera
  con `claude setup-token`, sirve para Pro, Max, Team y Enterprise, y está atado a la suscripción
  de quien lo generó], el token de la suscripción de Juan pasa a vivir en los secretos del repo.
  Cualquier colaborador con escritura puede abrir una rama con un workflow propio que use ese
  secreto: consumir cupo de Juan o intentar filtrarlo.
- **Se acepta solo si:** los colaboradores con escritura son personas de confianza (hoy, a lo
  sumo `juanchyhall`, sin confirmar), y existe un camino de rotación. [no doc] Cómo se revoca un
  token de `setup-token` antes de su vencimiento no está documentado en lo que se leyó: hay que
  confirmarlo antes de cargarlo.
- **Si la fábrica suma gente:** usar una API key de la consola con límite de gasto, que es lo que
  recomienda la documentación para secretos compartidos. Otra opción es la federación de
  identidad (OIDC), que evita guardar un secreto de larga duración.
- **La etapa 1 no usa ningún secreto de Claude.** Es otra razón para empezar por ella.
- **Permisos de la app de Claude en GitHub:** [doc] se aceptan todos o ninguno, e incluyen
  escritura sobre Contents, Workflows y Actions. Si alguna vez el alcance importa, existe la
  opción de una app propia con permisos mínimos.

## 6. Arquitectura objetivo

```
push a main ─┐
             ├─► job "chequeos" (shell, sin IA, sin secretos) ──► ✔/✘ en el commit o el PR
PR a main  ──┘
PR listo + @claude o etiqueta ─► job "revisor" (claude-code-action, prompt = revisor.md
                                  + reglas del README) ──► comentarios inline
PR que toca plugins/ ─► job "verificador" (checkout → marketplace add ./ → install
                         → claude -p corto) ──► ✔/✘
merge (humano) ─► main ─► cada consumidor: update --scope project desde su repo (registro)
```

**Lo que no cambia:**

- el circuito de consumidores (rama + pedido) hasta que la etapa 3 esté probada;
- la skill `commitear-con-verificacion`, que sigue siendo el control antes del push;
- la regla 18;
- el merge humano.

## 7. Plan por etapas

1. **Etapa 1: chequeos deterministas.** Workflow `.github/workflows/chequeos.yml`, disparado por
   `push` a `main` y por `pull_request`, con los chequeos del paso 1 de la propuesta.
   - La regla 16 compara contra el commit anterior en los push y contra `origin/main` en los PR.
   - Instala el CLI con npm y corre `claude plugin validate`. Que no pida autenticación es
     [no doc], y es el primer punto a observar.
   - **Termina cuando** un commit de prueba sin bump, en una rama de prueba, da ✘; el mismo commit
     con bump da ✔; y ambos resultados se ven en GitHub.
2. **Etapa 2: verificador.** Job de shell que instala desde el checkout como marketplace local.
   - **Termina cuando** una skill nueva de una rama aparece en `claude plugin list` del runner con
     la versión nueva. Si hace falta `claude -p` para verlo, se usa con `--max-turns 1` y un
     modelo chico.
   - Depende de la autenticación (decisión 8.2) solo si se usa `claude -p`.
3. **Etapa 3: revisor con IA**, disparado a mano o con una etiqueta.
   - **Termina cuando** el PR de prueba "malo" de la propuesta (sin bump, con nombre de cliente,
     sin fechas) recibe comentarios inline que nombran cada falla, y el "bueno" no recibe falsos
     positivos graves.
   - **Recién ahí** se escribe en el README cómo contribuir por PR.
4. **Protección de ramas**, cuando exista el plan que la habilita (8.1).
5. **Actualizar la Fase 6 del alta** para cerrarse por PR, **después** de la etapa 3 y con bump
   del plugin (regla 16).

Orden que importa: la 1 no depende de nada y ataca el error más caro. La 3 no se hace antes de
que existan PRs reales.

## 8. Decisiones que bloquean (de Juan)

1. **Plan de GitHub.** ¿La cuenta `gittecnowork` es Free? Si es así, ¿se paga Pro, se muda el
   repo a una organización con Team, o se aceptan checks de aviso?
2. **Autenticación para las etapas 2 y 3:** token de la suscripción (qué plan tiene Juan hoy) o
   API key con tope de gasto.
3. **Quién contribuye.** ¿`juanchyhall` es una cuenta de Juan o de otra persona? ¿Es colaborador
   con escritura? Esto decide si el token de la suscripción es aceptable (sección 5).
4. **Arrancar la etapa 1 ya**, que no tiene costo ni secretos. Es la recomendación.

## Resolución (Juan, 2026-09-17)

Estas respuestas mandan sobre lo que dicen las secciones anteriores.

1. **Costo cero.** La fábrica es propia y de prueba: no se paga nada en GitHub ni en Claude por
   este circuito.
2. **La cuenta `gittecnowork` es Free y el repo pasó a ser público.** Consecuencias:
   - [doc] Los minutos de Actions no se cobran en repos públicos.
   - [doc] La protección de ramas y los rulesets quedan disponibles.
   - El descarte de "hacer público el repo" (2.1 y 4) queda sin efecto. En su lugar, el registro
     pasa a usar alias para los clientes (cabecera de `registro/proyectos.yaml`).
   - La IP del VPS se sacó del texto actual de `docs/investigacion/`, pero **sigue en el
     historial**. Se acepta porque el dominio público ya la resuelve. Lo que protege al VPS es
     su configuración, no ocultar la IP.
   - [obs] Se revisó el historial completo con patrones de secretos (claves, tokens, JWT,
     connection strings) y no apareció ninguno.
3. **`juanchyhall` es Juan**, desde otra computadora de pruebas. No hay terceros con escritura, y
   el riesgo de la sección 5 se reduce a los PR de forks. [doc] Esos PR no reciben secretos.
4. **Etapa 1: sí, y cerrada.** Se implementó con `.github/workflows/chequeos.yml` y
   `.github/scripts/chequeos-fabrica.mjs`.
   - [obs] Commit `f330a06`: la corrida en GitHub dio verde. El PR #1 de prueba, sin bump, dio
     rojo con `[bump] software-factory`, y se cerró sin mergear.
   - [obs] `claude plugin validate` corre sin autenticación: probado con un HOME vacío, CLI
     2.1.274.
   - [obs] Pasado por el historial completo, commit por commit, el script marca 5 publicaciones
     sin bump y 3 desfasajes del README.
5. **Etapas 2 y 3: en espera.** Con costo cero, la etapa 3 solo puede usar el token de la
   suscripción, que no cobra aparte pero consume cupo del plan. Se decide cuando haya PRs reales.
6. **Protección de rama: sin exigir PR por ahora.** Exigir PR rompería el flujo actual de push
   directo desde Claude Code. Lo recomendado ahora es un ruleset que solo bloquee force-push y el
   borrado de `main`, que no cambia el flujo y protege el historial público. Exigir el check
   `chequeos` llega cuando el trabajo pase a hacerse por PR.

## 9. Fuentes

Leídas el 2026-09-17:

- Claude Code, GitHub Actions: https://code.claude.com/docs/en/github-actions
- Claude Code, Code Review: https://code.claude.com/docs/en/code-review
- Claude Code, autenticación y `setup-token`: https://code.claude.com/docs/en/authentication
- Claude Code, marketplaces locales: https://code.claude.com/docs/en/discover-plugins
- Acción: https://github.com/anthropics/claude-code-action
- GitHub, protección de ramas:
  https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches/about-protected-branches
- GitHub, rulesets:
  https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-rulesets/about-rulesets
- GitHub, minutos de Actions:
  https://docs.github.com/en/billing/concepts/product-billing/github-actions
- GitHub, precios: https://github.com/pricing
- README de la fábrica, reglas 3, 12, 15, 16, 18 y 24.
