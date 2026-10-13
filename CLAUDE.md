# CONTEXTO — Gambito (PWA v2.6.2)

Léelo completo antes de tocar nada. Fuente: conversaciones previas del usuario (Julio) con Claude. Lo que está en "Decisiones" lo dijo el usuario. Lo que está en "Hechos verificados" se comprobó leyendo el código de esta carpeta.

## Qué es
Sistema cuantitativo de análisis de fútbol para eliminar la decisión emocional. Filosofía: disciplina de proceso sobre resultados; métrica principal = CLV (Closing Line Value), no tasa de acierto. Éxito = CLV positivo sostenido en 150+ apuestas prematch cerradas.

## Contenido de esta carpeta (S:\Gambito)
- `index.html` (~3.500 líneas, app completa en un solo archivo), `sw.js` (service worker, VERSION v10), `manifest.json`, íconos.
- `gambito_appsscript.gs`: backend en Google Apps Script sobre un Google Sheet.
- `gambito_registro.xlsx`: plantilla del libro (Registros, Scout_Core, Perfil_Ligas, Bitácora).
- `README.md`, `ACTUALIZAR_SHEET_LINEA2.md`: documentación.
- NO hay motor Python en esta carpeta. El motor estadístico (Poisson, Dixon-Coles, Kelly, EV) está escrito en JavaScript dentro de `index.html`. No inventes ni busques archivos Python.
- Los datos reales del usuario viven en su Google Sheet, no aquí. Esta carpeta es solo código.

## Hechos verificados
- Despliegue: GitHub Pages (frontend) + Apps Script (backend). Nada se publica hasta que el usuario suba archivos.
- Pestañas: Goal Hunter (en vivo, checklist), Scout Core (prematch), Bitácora/Metas (bankroll).
- Config por defecto en `index.html`: rho Dixon-Coles = -0.13, Kelly fraccional = 0.25, tope de stake = 3% del bankroll.
- Funciones del motor: `poissonPMF`, `dixonColesTau`, `dixonColesMatrix`, `scKellyStake`, `stakeSugeridoHoy`, `stakeFijoDelDia`.
- El README documenta hasta la v2.6.1; esta es la v2.6.2 y el service worker está en VERSION v10.

## Reglas de decisión (no cambiar)
- BET solo si edge >= 4% y EV >= 4% a la vez; debajo: LEAN o NO_BET.
- Kelly fraccional 25% prepartido; tope 3% del bankroll por apuesta.
- Veto por dinero profesional: 12% corners, 8% tarjetas. Factor corners primer tiempo: 0.45.
- Pinnacle como cuota de referencia. Dominio reciente solo ajusta lambda si el xG lo confirma.

## Decisiones del usuario sobre bankroll
- Stake diario = bankroll inicial del día / 8, sin reserva ni residuo (la columna E de la Bitácora debe dar 0.00).
- Bankroll inicial del día siguiente = MIN(BR final real, BR final planificado) del día anterior. Gambito nunca recibe dinero de G3.
- G3 (antes "Línea 2"): pseudo-Gambito independiente. Solo anota el total al cierre del día. Con 15 USD o más muestra "Total ÷ 3" (redondeado hacia abajo) como stake. Los encabezados técnicos conservan `L2`; no renombrarlos sin cambiar también el Apps Script.
- Los avisos de P/L son permisivos (no bloquean). Solo los errores de fecha siguen en rojo. El usuario puede fijar a mano el BR final real.
- Frase de premeditatio malorum visible en Nuevo registro, Scout Core y Reglas (constante `FRASE_PREMEDITATIO`).
- Metas muestra Gambito + G3 y el "Cuadre del día".

## Restricciones para trabajo autónomo
- Primero: `git init` si no es repositorio, commit inicial con el estado actual, y rama nueva `noche/gambito-2026-10-11`. Guarda además una copia intacta de `index.html` y `sw.js` en `backup/`.
- No modificar fórmulas, umbrales, rho, Kelly, ni reglas de bankroll. Si encuentras un error en ellas, NO lo corrijas: descríbelo en `AUDITORIA.md` y deja un parche propuesto en `propuestas/` sin aplicar.
- Se pueden corregir directamente solo textos, documentación (README) y cosas sin efecto en dinero ni en datos.
- No hacer push ni publicar. No tocar el contrato entre la app, el Apps Script y el Sheet (nombres de columnas y claves).
- Si `index.html` se modifica, subir `VERSION` en `sw.js`.
- Escribir en español. Si una tarea falla dos veces, anotarlo en `NOTAS_NOCHE.md` y pasar a la siguiente.
