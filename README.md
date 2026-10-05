# Gambito — Goal Hunter (PWA) · v2.3

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

## Despliegue desde cero

### A. Google Sheet + Apps Script (backend)
1. Sube `gambito_registro.xlsx` a Google Drive → ábrelo con Hojas de cálculo de Google → **Archivo → Guardar como hoja de cálculo de Google**. (Un .xlsx no admite Apps Script; la copia convertida sí.)
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

## Línea 2 (all-in) — independiente de Gambito (nuevo en v2.2)
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
