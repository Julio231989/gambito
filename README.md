# Gambito — Goal Hunter (PWA) · v2.9.0

Consola de decisión offline-first: Goal Hunter (en vivo), Scout Core (prematch), Bitácora de bankroll.
Frontend estático en GitHub Pages + backend en Google Apps Script sobre un Google Sheet.

## Archivos (12)
| Archivo | Para qué sirve | Dónde va |
|---|---|---|
| `index.html` | La app completa | Raíz del repositorio de GitHub |
| `sw.js` | Service Worker (offline). Contiene `VERSION` | Raíz del repositorio |
| `manifest.json` | Nombre, colores e íconos | Raíz del repositorio |
| `icon-192.png`, `icon-512.png`, `icon-192-maskable.png`, `icon-512-maskable.png`, `apple-touch-icon.png`, `favicon-32.png` | Íconos | Raíz del repositorio |
| `README.md` | Este documento | Raíz del repositorio |
| `gambito_appsscript.gs` | Backend | Se pega en Apps Script (NO va a GitHub Pages) |
| `gambito_registro.xlsx` | Plantilla del libro (Registros, Scout_Core, Perfil_Ligas, Bitácora con Línea 2) | Se sube a Google Drive (NO va a GitHub Pages) |
| `ACTUALIZAR_SHEET_LINEA2.md` | Fórmulas para actualizar un Sheet que ya usas | Solo lectura (opcional en GitHub) |

### Archivos de desarrollo (v2.8.0; NO van a GitHub Pages)
| Archivo | Para qué sirve |
|---|---|
| `tests/` | Suite de pruebas. Carga el `index.html` real con un DOM simulado: `node tests/run.js` (Node 18 o superior, sin dependencias) |
| `propuestas/*.patch` | Parches de la revisión del 11-oct. **Ya aplicados en v2.8.0**; se conservan como referencia (ver `AUDITORIA.md`) |
| `REINICIO_Y_DESPLIEGUE.md` | Pasos exactos para empezar de cero con un Sheet nuevo (semilla, Objetivos, Apps Script, GitHub Pages) |
| `DECISIONES_PENDIENTES.md`, `AUDITORIA.md` | Hallazgos sobre fórmulas y reglas, con ejemplos y efecto sobre el stake |
| `MEJORAS.md`, `NOTAS_NOCHE.md`, `CLAUDE.md` | Siguientes pasos, bitácora de la última revisión y contexto del proyecto |
| `backup/` | Copia intacta de `index.html` y `sw.js` de la v2.6.2 |

## Despliegue desde cero

### A. Google Sheet + Apps Script (backend)
1. Sube `gambito_registro_v2.8.xlsx` (o `gambito_registro.xlsx` si es el nombre que usas) a Google Drive → ábrelo con Hojas de cálculo de Google → **Archivo → Guardar como hoja de cálculo de Google**. (Un .xlsx no admite Apps Script; la copia convertida sí.)
2. Verifica que las columnas `fecha` sigan como **texto plano** (formato "Texto sin formato") en Registros, Scout_Core y Bitácora. Las fechas se escriben siempre `AAAA-MM-DD`.
3. En la hoja: **Extensiones → Apps Script**. Borra el contenido de `Código.gs` y pega todo `gambito_appsscript.gs`. Guarda.
4. **Implementar → Nueva implementación → tipo "Aplicación web"**:
   - Ejecutar como: **Yo**
   - Quién tiene acceso: **Cualquier persona**
5. Autoriza los permisos cuando los pida (cuenta → Avanzado → Ir a proyecto).
6. Copia la **URL de la aplicación web** (termina en `/exec`).

### B. GitHub Pages (frontend)
1. Crea un repositorio (público; privado solo funciona con GitHub Pro).
2. Sube a la **raíz** los 10 archivos de la tabla marcados "Raíz del repositorio" (no los metas en subcarpetas).
3. **Settings → Pages → Source: Deploy from a branch → `main` → `/ (root)` → Save**.
4. Espera 1-2 minutos. La URL será `https://TU-USUARIO.github.io/NOMBRE-DEL-REPO/`.

### C. Primera apertura
1. Abre la URL de Pages **con internet** y espera unos segundos (el Service Worker descarga todo para el modo offline).
2. Botón **"Servidor / Sheet"** → pega la URL `/exec`.
3. Pestaña **Metas → "Activar hoy en Bitácora"** (crea la fila del día).
4. Instalar: Android/Chrome → menú ⋮ → *Instalar aplicación*. iPhone/Safari → Compartir → *Agregar a inicio*.
5. Prueba offline: con la app ya abierta una vez, activa modo avión, reábrela y registra algo. Al quitar el modo avión debe sincronizarse sola.

### Si ya tienes el Sheet funcionando
Solo actualiza lo que cambió: pega el nuevo `gambito_appsscript.gs` y haz **Implementar → Gestionar implementaciones → ✏️ → Versión: Nueva versión → Implementar** (guardar el código no alcanza; la URL no cambia). En Bitácora aplica las fórmulas B, D, E de abajo desde la fila 2 hasta la 367.

## Línea G3 (antes «Línea 2») — pseudo-Gambito ÷ 3, independiente de Gambito
> Nota de nombres: en la app se llama **G3**; los encabezados del Sheet y del Apps Script conservan `L2` (Excedente L2, Saldo L2 cierre…) como claves técnicas. No los renombres sin cambiar también el script.
- **Total ÷ 3:** cuando el disponible de G3 llega a $15 se muestra «Total ÷ 3» (monto por apuesta, redondeado hacia abajo).
- **Gambito blindado:** el Bank roll inicial del día siguiente es `MIN(BR final real, BR final planificado)` del día anterior. Si cierras sobre el plan, solo queda +1 stake; el excedente sale hacia la Línea 2. Si cierras por debajo, hereda el BR real. Gambito nunca recibe dinero de la Línea 2.
- **Una sola celda manual:** `Saldo L2 cierre` (col K). Se escribe desde la app (06 · Metas), también sin señal.
- Con 15 o más disponibles la app muestra 3 apuestas iguales.
- **Verificación:** la Bitácora marca en rojo la fila con error (col N) y la app muestra un banner rojo con día, fila y columna; al registrar una operación con errores pendientes pide confirmación.
- **Si ya tienes tu Sheet en uso:** sigue `ACTUALIZAR_SHEET_LINEA2.md` (incluye todas las fórmulas).

## Bitácora — fórmulas (stake = bankroll / 8, sin reserva)
- **B (stake):** `=IF(A2="","",A2/8)`
- **A (desde la fila 3):** `=IF(D2="","",IF(G2>=$P$2,MIN(D2,C2),D2))`
- **C (BR final planificado):** `=IF(OR(A2="",B2=""),"",A2+B2)` *(sin cambios)*
- **D (BR final real):** `=IF(A2="","",A2+SUMIFS(Registros!$AP:$AP,Registros!$C:$C,H2))`
- **E (Reserva = control de residuo, debe dar 0.00):** `=IF(A2="","",ROUND(A2-8*B2,2))`

## Autollenado por JSON (nuevo en v2.1)
1. En Scout Core o Goal Hunter: **Generar prompt** → **Copiar** → pégalo en Gemini o Claude con búsqueda web activada.
2. La IA responde solo con un JSON. Cópialo.
3. **Pegar JSON → autollenar**: la app lee el portapapeles y rellena las notas. Si el navegador no da permiso, aparece un cuadro para pegar y un botón *Aplicar*.
4. Lo mismo en el perfil de liga (queda como borrador hasta tocar *Guardar perfil de liga*).
Si un campo ya tenía texto, pide confirmación antes de reemplazarlo. El prompt de Sentimiento lee X: solo Grok lo hace bien.

## Actualizar la app después
Reemplaza los archivos cambiados en el repositorio y **sube `VERSION` en `sw.js`** (v3 → v4…). Así el teléfono descarta la copia vieja y la app muestra "Hay una versión nueva — Recargar".

## Historial
- **v2.3** — Frase de premeditatio malorum visible en Nuevo registro, Scout Core y Reglas (se edita en la constante `FRASE_PREMEDITATIO` de `index.html`); `VERSION` v5. No cambia el Apps Script ni el Sheet.
- **v2.2** — Línea 2 (all-in) con excedente automático, cierre de día desde la app (también offline), verificación de Bitácora en rojo (Sheet y app); `VERSION` v4. Requiere nueva versión del Apps Script.
- **v2.1** — Autollenado por JSON (notas cualitativas y perfil de liga); `VERSION` v3.
- **v2** — Offline real (SheetJS y fuentes en caché), subida automática de pendientes al volver la señal, tiempos de espera de red, guardado local por claves, chip de conexión, stake = bankroll/8 sin reserva, Apps Script con candado e idempotente, Bitácora sin límite de filas.
- **v2.4** — Avisos de P/L permisivos (no bloquean ni preguntan; van plegados en 06 · Metas; solo los errores de fecha siguen en rojo; el BR final fijado a mano desde la app no genera aviso). Línea 2 → **G3** con «Total ÷ 3». `VERSION` v6. Solo cambian `index.html` y `sw.js`; no hay que tocar Apps Script ni Sheet.
- **v2.5** — 06 · Metas: tarjeta «Cuadre del día» (Gambito BR final real − excedente de hoy + total G3 = total esperado en la casa, con campo opcional para comparar) y stake del día (BR inicial ÷ 8) en la tarjeta Bankroll. `VERSION` v7. Solo cambian `index.html` y `sw.js`.
- **v2.6** — 06 · Metas reorganizado: Hoy (Gambito + G3 + cuadre) → cierre de G3 → proyecciones a 31 días (Gambito y G3, +33.3%/día recalculado sobre el total real de la noche) → mantenimiento plegado. G3 muestra stake (total ÷ 3) y meta del día. `VERSION` v8. Solo cambian `index.html` y `sw.js`.
- **v2.6.1** — 06 · Metas: campo «Fijar el cierre de hoy a mano» (BR final real) dentro de la tarjeta Gambito · hoy; marca «(fijado a mano)». `VERSION` v9. Solo `index.html` y `sw.js`.
- **v2.6.2** — Notas de alineación/motivación (Nuevo registro y Scout Core) en una sola columna, más altas y que crecen solas al pegar el JSON. 06 · Metas: «Meta unificada de hoy — Gambito + G3» (arranque = cierre de ayer). `VERSION` v10. Solo `index.html` y `sw.js`.
- **v2.9.0** — Versión final del reinicio. (a) Flashscore como fuente reconocida al compartir (incluye el link corto `flashscore.es/r/?t=1&id=…`); campos de links: Sofascore, Flashscore, xGScore (opcional) y 1xBet (opcional, 1xBet no permite compartir: se usa captura de los mercados 1X2, Más/Menos 2.5 y Ambos marcan). (b) Selector «Tipo de dato: xG / goles» en Scout Core: con goles el análisis se marca en pantalla y en `adjustments_log` como de menor fiabilidad; no cambia fórmulas, umbrales ni columnas. (c) El prompt incluye solo los links que tienes, describe qué capturas adjuntar y pide `tipo_dato`. `VERSION` v14.
- **v2.8.1** — Compartir desde Android (Web Share Target): `manifest.json` declara `share_target`; al compartir un partido desde Sofascore, xGScore o 1xBet, la app instalada se abre en Scout Core con el link en su campo (reconocido por dominio; si es un dominio desconocido va al primer campo libre y se avisa). Si el título es «Local vs Visitante» propone el partido. Los 3 links quedan como borrador y se borran al guardar el análisis. `VERSION` v13; hay que reinstalar o actualizar la app en el teléfono para que Android registre el destino de compartir.
- **v2.8.0** — Reinicio desde cero (12-oct-2026). (a) **Semilla manual del Día 1**: en 06 · Metas aparece «Semilla de Gambito · Día 1» mientras no haya historial; escribe `Bitacora!A2` con cualquier valor y el Sheet sigue calculando el ritmo (+12,5 %), MIN(real, planificado) y el excedente a G3. (b) **Objetivos desde el Sheet**: nueva pestaña `Objetivos` (orden, objetivo, hecho, fecha_logro); la app muestra el mismo formato, marca «hecho» en el Sheet y funciona sin señal con copia local. (c) **Recomendación «Más de 0.75»** en Scout Core (cuota justa, desglose de ganancia/media ganancia/pérdida, EV con la cuota que veas y comparación con 0.5, 1.0, 1.25 y 1.5). (d) **Stake de Scout Core = bankroll ÷ 8** solo con APOSTAR (el Kelly queda como «Kelly ref.»). (e) Parches aplicados: Kelly con EV y piso ≤ tope (H1, H2), EV coherente con el veto (H3), stake real al cerrar (H5), aviso de límites de Goal Hunter (H8) y redondeo en centavos de G3. (f) Flujo: botón «Correr Scout Core de este partido» y aviso al final de Nuevo registro; prompt sin links vacíos y con la liga ya escrita; el importador tolera texto alrededor del JSON y marca `sede_neutral`. (g) «Borrar copia local» ahora limpia todo (úsalo al cambiar de Sheet). Cambian `index.html`, `sw.js` (`VERSION` v12), `gambito_appsscript.gs` (acciones nuevas, aditivas) y `gambito_registro.xlsx` (pestaña Objetivos). Pasos de despliegue en `REINICIO_Y_DESPLIEGUE.md`.
- **v2.7.0** — Scout Core: (a) tabla plegable «Mercados adicionales (solo referencia)» — doble oportunidad 1X/X2/12, empate no acción, hándicap asiático ±0.5/±1/±1.5 (con liquidación de cuartos y medias), over/under 1.5 y 3.5 y los 5 marcadores más probables, con probabilidad del modelo y cuota justa; (b) «Sin el margen de la casa» (método proporcional) con el edge actual y el edge sin margen, solo informativo; (c) botón «Verificar con simulación (20.000)» con generador con semilla; (d) panel «Camino a 150 apuestas» (CLV promedio, % con CLV positivo, intervalo, Brier; con menos de 30 datos avisa «muestra insuficiente»). Correcciones sin efecto en dinero ni en el contrato del Sheet: lo guardado coincide con el «Mejor candidato» de la pantalla (primero APOSTAR, si no, mayor EV); el ROI de Goal Hunter y de Scout Core ya no cuenta las apuestas abiertas en el denominador; aviso de `manualSync` con saltos de línea reales; textos de usuario escapados en pantalla. No cambian fórmulas, umbrales, ρ, Kelly ni reglas de bankroll/G3. `VERSION` v11. Solo cambian `index.html` y `sw.js`; no hay que tocar Apps Script ni Sheet.
