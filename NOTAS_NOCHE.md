# NOTAS DE LA NOCHE — 2026-10-11 (rama noche/motor-2026-10-11)

> Bitácora de lo hecho, en orden. Resumen final y cómo ejecutar las pruebas al final del archivo (se completa en P5).

- **P0** · Repositorio git creado, commit base con el estado v2.6.2, rama `noche/motor-2026-10-11`, copia intacta de `index.html` y `sw.js` en `backup/`. Node v22 disponible (en tu PC: v24).
- **P1** · Suite de pruebas en `tests/` (arnés que carga el `index.html` real con DOM simulado, sin duplicar código). 30 pruebas + 12 «conocido». Confirmados H1–H9 en el código; **H10 no se confirma** (el README ya documenta la v2.6.2 con VERSION v10). Hallazgo nuevo: G3 «Total ÷ 3» queda 1 centavo por debajo del piso exacto en ~3 % de los totales (coma flotante).
- **P2** · Correcciones sin efecto en dinero ni en el contrato del Sheet: **H4** (lo guardado = «Mejor candidato» de la pantalla, función `scMejorCandidato`; ojo: cambia QUÉ mercado se registra cuando el de mayor EV no es el APOSTAR, pero no las columnas ni los cálculos), **H6** (ROI de Goal Hunter y Scout Core sin apuestas abiertas, `calcularROI`; el chip «stake total» sigue sumando todo), **H9** (`\\n` literal en el aviso de `manualSync`; `escaparHTML` en partido, liga, estrategia, observación, escenario, patrón, editor de registros, perfil de liga y detalle de error de sincronización). `sw.js` VERSION v10 → v11. Pruebas nuevas en `tests/p2_correcciones.test.js` (fallaban contra `backup/index.html`, pasan ahora).
- **P3** · Motor extendido ADITIVO en `index.html` (sin librerías, offline): (a) tabla plegable «Mercados adicionales (solo referencia)»: 1X/X2/12, DNB, hándicap asiático −0.5/−1/−1.5/+0.5/+1/+1.5 (con liquidación de cuartos y medias), over/under 1.5 y 3.5, top 5 marcadores, con P y cuota justa; (b) «Sin el margen de la casa» (método proporcional) con edge actual y edge sin margen lado a lado; (c) botón «Verificar con simulación (20.000)» con generador con semilla (mulberry32, semilla 20261011); (d) panel «Camino a 150 apuestas» en el historial de Scout Core. Prueba de invariancia: lambdas, probabilidades, filas (edge, EV, Kelly, semáforo) y registro guardado son idénticos a `backup/index.html`. No se agregan claves a los registros. Poisson bivariado y Monte Carlo como motor de decisión NO implementados (ver MEJORAS.md).
- **P4** · `DECISIONES_PENDIENTES.md` y `AUDITORIA.md` con ejemplos y tabla de efecto (bankroll 8, 15 y 30 USD) y 7 parches en `propuestas/` (verificados con `git apply --check` y cargando el `index.html` parcheado; NINGUNO aplicado): H1, H2, H1+H2, H3, H5, H8 y G3. Pregunta clave para ti: ¿stake de Scout Core = Kelly con tope o bankroll ÷ 8? (mi lectura: Kelly con tope; con p real 3 puntos menor que la del modelo, el 12.5 % pierde y el 3 % sigue ganando).
- **P5** · `README.md` (v2.7.0 en el historial y tabla de archivos de desarrollo), `MEJORAS.md` (siguientes pasos ordenados por valor/riesgo y por qué no se implementaron Poisson bivariado ni Monte Carlo como motor), este archivo.

---

## RESUMEN FINAL

**Hecho (rama `noche/motor-2026-10-11`, 6 commits, sin push):**
- P0 repo + `backup/`; P1 suite de pruebas; P2 correcciones H4, H6, H9 (+ `VERSION` v11); P3 motor extendido aditivo; P4 decisiones y parches; P5 documentación.
- Suite: **73 pruebas OK, 0 fallos, 11 «conocido»** (comportamientos actuales documentados que esperan tu decisión). Duración ≈ 4 s.
- Prueba de invariancia: λ, probabilidades, filas (edge, EV, Kelly, semáforo) y el registro guardado son idénticos a `backup/index.html` (salvo H4, que cambia solo *qué* mercado se registra cuando el de mayor EV no es el APOSTAR).
- No se tocaron `gambito_appsscript.gs` ni `gambito_registro.xlsx`. No se agregaron claves a los registros (prueba contra `SCOUT_CORE_HEADERS`). No se cambiaron umbrales, ρ, Kelly ni reglas de bankroll/G3.

**Discrepancias entre las instrucciones y el código / archivos (gana el código):**
- H10 no se confirma: el README ya documentaba la v2.6.2 (con `VERSION v10`), a diferencia de lo que dice CLAUDE.md.
- CLAUDE.md nombra la rama `noche/gambito-2026-10-11`; el encargo pedía `noche/motor-2026-10-11`. Usé la del encargo (más específica).
- La regla MIN(BR real, BR planificado) no está en `index.html`, solo en las fórmulas del Sheet (README / `ACTUALIZAR_SHEET_LINEA2.md`). La prueba evalúa la fórmula documentada, no el Sheet real.
- El «residuo 0.00» se cumple en el Sheet; en la app el stake mostrado se redondea a centavos (documentado, no es error).
- H4 sí cambia el dato guardado (qué mercado se registra), aunque no el contrato; CLAUDE.md solo permite correcciones «sin efecto en datos». Seguí el encargo (P2 lo pedía expresamente); está aislado en un commit y es revertible.

**Hallazgo nuevo:** G3 «Total ÷ 3» queda 1 centavo corto en ~3 % de los totales (coma flotante). Parche en `propuestas/G3_redondeo-centavos.patch`, sin aplicar.

**Pendiente de ti:** `DECISIONES_PENDIENTES.md` (pregunta clave: ¿stake de Scout Core = Kelly con tope o bankroll ÷ 8?).

**Limitaciones de esta noche:** no pude ejecutar nada en tu PC (no hay terminal): todo corrió en una copia en la nube; el repositorio git viaja como `gambito_noche.bundle`. La app se revisó en Chromium sin errores de JavaScript, pero no en un teléfono ni con tu Google Sheet real (sin red). El Service Worker no se probó (no funciona en `file://`).

## Cómo ejecutar las pruebas
```
cd S:\Gambito
node tests/run.js
```
Requiere Node 18+ (en tu PC hay v24). Sin dependencias. Código de salida 0 = todo OK. Para ejecutarlas contra otra versión del HTML: `set GAMBITO_INDEX=backup\index.html && node tests/run.js` (en PowerShell: `$env:GAMBITO_INDEX='backup\index.html'`); las pruebas de P2 deben fallar contra el original: así se comprobó que detectan los defectos.

## Cómo recuperar el repositorio git
`git clone gambito_noche.bundle Gambito_git -b noche/motor-2026-10-11` crea un clon con los 6 commits. Para publicar: sube a GitHub solo los archivos de la tabla «Raíz del repositorio» del README (no `tests/`, `propuestas/`, `backup/` ni los .md de trabajo).

---
## 12-oct-2026 · Reinicio y v2.8.0 (sesión con el usuario)
- Orden del usuario: reiniciar de cero; semilla manual; Objetivos desde el Sheet; recomendación «Más de 0.75»; integrar los pendientes.
- Respuestas: libro nuevo (el actual queda de archivo), aplicar todos los parches, **stake de Scout Core = bankroll ÷ 8** (contra mi recomendación; riesgo anotado en `DECISIONES_PENDIENTES.md`), Objetivos = orden/objetivo/hecho/fecha_logro.
- El encargo de la noche prohibía tocar `gambito_appsscript.gs` y el xlsx; esta sesión lo autoriza explícitamente (hay que redesplegar el Sheet). Los cambios del script son aditivos.
- La plantilla xlsx no estaba en mi entorno: la traje desde la carpeta del usuario (staging), añadí la hoja Objetivos y la guardé como `gambito_registro_v2.8.xlsx` sin tocar el original.
- Suite: 96 pruebas OK, 0 fallos, 6 «conocido». Prueba de humo en Chromium sin errores de JavaScript (solo avisos de red y Service Worker por abrir con `file://`).
- v2.8.1 (compartir desde Android) y v2.9.0 (Flashscore, campos opcionales, selector xG/goles) aplicados el mismo día. Suite: 104 pruebas OK, 0 fallos, 6 «conocido». Prueba en Chromium real sin errores de JavaScript.

- 13-oct (v2.9.1): decisión del usuario → el P/L de Scout Core entra en la Bitácora. Fórmula D y chequeo N (texto) en el xlsx v2.9 verificados con LibreOffice (10 + 1.50 − 0.50 = 11.00); Q2 cuenta también Scout_Core con fecha fuera de Bitácora. Corregida la columna citada antes (AW, no AU). Suite: 110 OK.
