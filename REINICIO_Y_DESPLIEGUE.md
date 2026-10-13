# Reinicio desde cero — Gambito v2.8.0

Para empezar a registrar el **13-oct-2026 (Día 1)** con un Sheet nuevo. El Sheet actual queda intacto como archivo.

## 1. Sheet nuevo (≈10 min)
1. Sube `gambito_registro_v2.8.xlsx` a Google Drive y ábrelo con Hojas de cálculo → **Archivo → Guardar como hoja de cálculo de Google**.
2. **Archivo → Configuración → Zona horaria: America/Guayaquil.**
3. Pestañas que debes ver: Instrucciones, Registros, Scout_Core, Perfil_Ligas, **Objetivos** (nueva) y Bitacora. Todas vienen vacías salvo Objetivos (tus 30 ítems de hoy) y Bitacora (A2 = 8 como semilla provisional, G2 = 1, P2 = 1).
4. Si Google marca error de análisis en alguna fórmula, cambia las comas `,` por punto y coma `;` (depende de la configuración regional).

## 2. Apps Script
1. **Extensiones → Apps Script**, borra lo que haya y pega todo `gambito_appsscript.gs` (v2.8.0).
2. **Implementar → Nueva implementación → Aplicación web**: ejecutar como *yo*; acceso *cualquier persona*. Autoriza los permisos.
3. Copia la URL que termina en `/exec`.

## 3. GitHub Pages
Sube solo `index.html` y `sw.js` (el `VERSION` ya está en v12, así que los teléfonos descargan la versión nueva). `manifest.json` e íconos no cambian.

## 4. En cada dispositivo (móvil y PC)
1. Abre la app → **Servidor / Sheet** → pega la URL nueva del Apps Script.
2. **07 · Config → Borrar copia local** (borra la copia del Sheet anterior y trae el estado del nuevo). Hazlo antes de registrar nada.
3. Pestaña 00 · Principal: la lista de objetivos debe decir «● leído de tu Sheet».

## 4b. Compartir links desde el móvil (Android)
1. Sube también `manifest.json` (ahora declara el destino de «Compartir»). `VERSION` ya está en v14.
2. En el teléfono **desinstala la app y vuelve a instalarla** desde Chrome (Menú → Instalar app). Android solo registra el destino de «Compartir» al instalar; actualizar no basta.
3. En Sofascore o Flashscore: abre el partido → **Compartir** → **Gambito**. xGScore también si ofrece el menú. **1xBet no permite compartir**: toma capturas de los mercados 1X2, Más/Menos 2.5 y Ambos marcan y adjúntalas a la IA (verifica las cuotas contra la pantalla antes de calcular). Se abre Scout Core con ese link en su campo y una línea te muestra cuáles tienes (✓) y cuáles faltan (○; xGScore y 1xBet son opcionales). Los links se conservan aunque cierres la app.
4. Si una app no ofrece Gambito en el menú, copia el link y pégalo a mano; el campo reconoce cualquiera.
5. Si Sofascore comparte como imagen en vez de texto, no habrá link: usa «Copiar enlace» en su lugar.

## 5. Mañana (Día 1)
1. 06 · Metas → tarjeta **Semilla de Gambito · Día 1** → escribe el bankroll con el que empiezas (cualquier valor) → **Fijar semilla**. Esto escribe `Bitacora!A2` y activa el 13-oct como Día 1. (Si prefieres, escribe A2 a mano en el Sheet y usa «Activar hoy en Bitácora».)
2. El stake del día es semilla ÷ 8. Meta del día = semilla + 1 stake (+12,5 %).
3. Desde el Día 2 todo es fórmula: arranca con el **menor** entre BR final real y BR final planificado del día anterior; todo excedente sobre el plan aparece en «Excedente L2» y es el saldo de G3. La tarjeta de semilla desaparece sola en cuanto hay un registro cerrado o un segundo día.

## Editar los objetivos
En la pestaña **Objetivos** del Sheet: cambia el texto, agrega filas al final, bórralas, o reordénalas con la columna `orden` (número menor = más arriba). `hecho = SI` los marca cumplidos; la app lo hace sola al tildar la casilla. Se actualizan al sincronizar.

## Stake de Scout Core
Es el mismo stake diario de Goal Hunter (bankroll inicial ÷ 8), solo con semáforo APOSTAR; la divergencia > 8 pp con xGscore lo reduce a la mitad. El Kelly aparece como «Kelly ref.» solo para comparar. Ver `DECISIONES_PENDIENTES.md` (riesgo y pregunta sobre el P/L de Scout Core).

## Qué no cambió
Fórmulas de la Bitácora, umbrales (edge y EV ≥ 4 %), ρ = −0,13, Kelly 25 % con tope 3 % (solo referencia), veto de movimiento de cuota, reglas de G3, contrato de columnas de Registros y Scout_Core.

## Partidos sin xG
Muchos partidos (copas, ligas menores, selecciones) no tienen xG en ninguna fuente. En Scout Core, sección «Tipo de dato», elige **Goles** y escribe en los campos de forma y temporada los goles anotados/recibidos por partido (nunca mezcles xG y goles en un mismo partido). El análisis queda marcado como de menor fiabilidad, también en `adjustments_log`. Los goles de 5 partidos son una señal mucho más ruidosa que el xG; si no hay ningún dato de ninguno de los dos tipos, no uses Scout Core para ese partido. No se cambió ningún umbral: si quieres exigir más con goles, es una regla nueva que decides tú.

## Flujo móvil recomendado
1. Compartir desde Sofascore → Gambito. 2. Compartir desde Flashscore → Gambito. 3. Capturas de 1xBet. 4. Generar prompt, copiarlo y pegarlo en la IA con las capturas. 5. Pegar el JSON en «Rellenar formulario» y revisar los números.
