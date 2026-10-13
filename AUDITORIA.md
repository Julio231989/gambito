# AUDITORIA — Gambito v2.6.2 → v2.8.0 (2026-10-11 / 2026-10-12)

Resumen de hallazgos sobre fórmulas y reglas. El 11-oct se describieron y quedaron como parches sin aplicar; **el 12-oct el usuario ordenó aplicar todos** (al empezar de cero no hay historial que se contamine) y la v2.8.0 los incluye. Los archivos de `propuestas/` se conservan como referencia. El detalle, ejemplos numéricos y efecto sobre el stake están en `DECISIONES_PENDIENTES.md`.

| # | Hallazgo | ¿Confirmado en el código? | Estado |
|---|---|---|---|
| H1 | Kelly usa `edge` en vez de EV: fracción subestimada por un factor = cuota | Sí | **Aplicado en v2.8.0** (H1+H2 combinados). El Kelly ya no fija el stake de Scout Core (ver D1 en `DECISIONES_PENDIENTES.md`): queda como columna «Kelly ref.» informativa |
| H2 | Piso 0.50 > tope 3 % si bankroll < 16.67: stake siempre = 3 %, incluso con edge negativo | Sí | **Aplicado en v2.8.0** (sin edge → 0; el piso nunca supera al tope) |
| H3 | `EV ≥ 4 %` redundante con `edge ≥ 4 %` (EV = cuota × edge) | Sí | **Aplicado en v2.8.0** (el EV mostrado y guardado se divide entre 2 con el veto, igual que el edge) |
| H4 | Se guardaba el mercado de mayor EV, no el que muestra la pantalla | Sí | **Corregido** (sin efecto en fórmulas ni contrato) |
| H5 | P/L automático de Scout Core con `stake_kelly`, sin campo de stake real | Sí | **Aplicado en v2.8.0** (campo opcional «Stake real apostado» al cerrar; no se guarda como columna) |
| H6 | ROI con apuestas abiertas en el denominador (Goal Hunter y Scout Core) | Sí | **Corregido** |
| H7 | Edge contra 1/cuota (con margen) | Sí | Sin cambio de reglas; sección informativa «sin margen» añadida |
| H8 | Scout Core no usa over 1.5/3.5 como mercados y no aplica límites diarios | Sí (intención no confirmable por los textos) | **Aplicado en v2.8.0** (aviso no bloqueante de stop-loss/límites de Goal Hunter en Scout Core); over 1.5/3.5 siguen solo en la tabla informativa |
| H9 | `\\n` literal en el aviso de `manualSync`; textos de usuario sin escapar en `innerHTML` | Sí | **Corregido** (`escaparHTML`) |
| H10 | README termina en v2.6.1 y el SW está en v10 | **No** (el README ya documenta la v2.6.2 con VERSION v10) | Sin acción; README llega a v2.8.0 y VERSION v12 |
| N1 | G3 «Total ÷ 3» queda 1 centavo corto en ~3 % de los totales (coma flotante) | Sí (hallazgo nuevo) | **Aplicado en v2.8.0** (aritmética en centavos enteros; prueba sobre los 18.501 totales de 15.00 a 200.00) |

## Cambios de reglas ordenados por el usuario el 12-oct-2026 (v2.8.0)

| # | Cambio | Dónde |
|---|---|---|
| D1 | **Stake de Scout Core = bankroll inicial del día ÷ 8** (el mismo de Goal Hunter), solo con semáforo APOSTAR; la divergencia > 8 pp con xGscore lo reduce a la mitad; con BORDERLINE o PASAR el stake es 0. El Kelly 25 % con tope 3 % se sigue calculando pero solo se muestra como «Kelly ref.». Se guarda en la misma columna `stake_kelly` (no se cambia el contrato). Contra la recomendación del asistente, que era mantener Kelly con tope; ver riesgo en `DECISIONES_PENDIENTES.md`. | `scCalcular` |
| D2 | Semilla manual del Día 1 desde la app (acción `bitacora_semilla`): escribe `Bitacora!A2` y solo funciona mientras no haya registros con P/L ni un segundo día. Todo lo demás (ritmo +12,5 %, MIN(real, planificado), excedente a G3) sigue siendo fórmula del Sheet, sin cambios. | `gambito_appsscript.gs`, Metas |
| D3 | Objetivos desde el Sheet (pestaña `Objetivos`: orden, objetivo, hecho, fecha_logro). Acciones `objetivos` y `objetivo_marcar`. | `gambito_appsscript.gs`, Principal |
| D4 | Recomendación «Más de 0.75» (goles asiáticos) en Scout Core, solo informativa: no toca semáforo, edge ni stake. | `totalOverProbs`, `scHtmlExtendido` |

Los cambios de `gambito_appsscript.gs` son aditivos: no se tocan cabeceras, columnas calculadas ni acciones existentes.
