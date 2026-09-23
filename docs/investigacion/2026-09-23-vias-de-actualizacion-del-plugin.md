# Cómo le llega una versión nueva de la fábrica a cada lugar donde está instalada

Fecha: 2026-09-23. Medido en la PC principal con la publicación de la 0.6.2 (`2dc472b`, 10:19 UTC).
Etiquetas: **[obs]** observado acá; **[doc]** documentado por el proveedor; **[no verif]** sin
comprobar.

## Hay dos vías, no cuatro

Lo que parecían cuatro superficies son dos mecanismos independientes:

| Vía | Dónde se administra | Quién la usa | Nombre del marketplace |
|---|---|---|---|
| **A. Marketplace local de Claude Code** | `/plugin` en la terminal, por máquina | Claude Code en esa máquina, en los scopes `user` y `project` | El que se le dio al agregarlo. Acá: `tecnowork` |
| **B. Plugin de la cuenta de claude.ai** | App de escritorio → Personalizar → Plugins, y el diálogo "Administrar mercados" | Cowork (en la nube y en el escritorio). Claude Code también lo ve, como `software-factory@synced` | `software-factory` |

[obs] Es una sola vía la B: al apretar "Actualizar" en la app de escritorio, la copia que carga
Cowork en la nube pasó de la revisión `0001` a la `0002` en el mismo minuto (14:42 UTC).

[obs] Cuando las dos vías traen un plugin con el mismo nombre, Claude Code carga el local y avisa:
`"software-factory@synced" from claude.ai not loaded — "software-factory@tecnowork" on this
machine has the same name and takes precedence`.

## Qué pasó con la 0.6.2

| Vía | Estado del automático | Resultado | Qué la trajo |
|---|---|---|---|
| A, scope `user` | Apagado ([obs] `tecnowork` sin la marca de auto-update en `/plugin`) | No llegó en dos ventanas de 12 min. El marketplace no se volvió a leer: `lastUpdated` quedó en el 17/09 | `claude plugin update software-factory@tecnowork --scope user` |
| A, scope `project` (twfinance) | Ídem | Ídem | `claude plugin update ... --scope project`, desde el repo |
| B | Apagado hasta el 23/09; activado ese día | Seis días en 0.6.0 sin recibir la 0.6.1. Con "Sincronizar automáticamente" activado, tampoco llegó en la ventana observada | "Buscar actualizaciones" en Administrar mercados, y después "Actualizar" en la ficha del plugin |

[obs] `claude plugin update <plugin>@<marketplace> --scope <x>` refresca el marketplace por su
cuenta: no hace falta `marketplace update` antes.

[obs] Cowork no toma la versión nueva en una conversación ya abierta: los plugins se cargan al
abrirla. Hace falta una conversación nueva.

## Sin verificar

- [no verif] Si el automático de la vía A, **activado**, alcanza a los installs de scope
  `project`. En la medición estuvo apagado, así que no se puede concluir nada sobre eso.
- [no verif] Si "Sincronizar automáticamente" de la vía B actúa en un intervalo más largo que el
  observado, o solo al reiniciar la app.
- [no verif] Por qué el marketplace oficial (`claude-plugins-official`) sí se refresca solo. [doc]
  Los marketplaces oficiales traen el automático activado por defecto; los de terceros, apagado.

## Trampa encontrada: el mismo repo, dos installs

[obs] Claude Code guarda los installs de scope `project` por ruta, **tal como se escribió**, y
compara como texto. Abrir `c:\dev\twfinance` y `C:\dev\twfinance` creó dos entradas en
`installed_plugins.json`. Un `update --scope project` actualizó una sola; la otra quedó en la
versión anterior, y el CLI respondió "already at the latest version". Según con qué mayúscula se
abra la carpeta, el proyecto carga una versión u otra, sin ningún aviso.

Cómo se detecta: `claude plugin list` muestra dos entradas de scope `project` para el mismo repo.
Cómo se corrige: correr el `update --scope project` desde la carpeta escrita de cada una de las dos
formas. [obs] Para la minúscula funcionó desde PowerShell
`cmd.exe /c 'cd /d c:\dev\<repo> && claude plugin update <plugin>@tecnowork --scope project'`; el mismo comando desde Git Bash no.

## Lo que queda como procedimiento

Toda publicación termina, **en cada máquina**, con:

1. Vía A: `claude plugin update <plugin>@tecnowork --scope user`, y `--scope project` desde cada
   repo del registro con `usa_fabrica: true`. `claude plugin list` para confirmar la versión, y
   revisar que no haya entradas duplicadas del mismo repo.
2. Vía B: app de escritorio → Administrar mercados → `software-factory` → Buscar actualizaciones;
   ficha del plugin → Actualizar; confirmar la versión en la ficha; conversación nueva de Cowork.
3. [obs] Las sesiones abiertas de Cowork o de Claude Code siguen con la versión que cargaron; Claude
   Code avisa "Restart to apply changes". Reiniciarlas.

Los automáticos quedan activados en las dos vías, pero no se cuenta con ellos hasta verificarlos.
