# DECISIONES PENDIENTES — Gambito v2.8.0 (actualizado el 2026-10-12)

El 12-oct el usuario respondió las decisiones de la revisión del 11-oct. Lo resuelto está en `AUDITORIA.md`. Esto es lo que **sigue abierto**.

## Resuelto el 12-oct
- Stake de Scout Core: **bankroll ÷ 8** (decisión del usuario).
- Parches H1, H2, H3, H5, H8 y redondeo de G3: **aplicados**.
- Reinicio con Sheet nuevo, semilla manual del Día 1, Objetivos desde el Sheet, recomendación «Más de 0.75»: **hechos**.

## Abierto 1 · Riesgo del stake ÷ 8 en Scout Core (recordatorio, no bloquea nada)
Con la tabla de la revisión anterior (`g` = crecimiento esperado del logaritmo del bankroll por apuesta, cuota 2.00): si la probabilidad real es 3 puntos menor que la que estima el modelo (p real 52 % frente a 55 %), 12,5 % por apuesta da **−0,29 %** por apuesta, mientras que 3 % da +0,08 %. El Kelly completo para esos edges es 6,7–10 %. Los datos apuntan a que ÷ 8 supera el Kelly completo en prematch con edges de 4–10 %, así que el resultado depende de que el modelo esté bien calibrado, y eso solo lo dirá el CLV de las primeras 150 apuestas. La app deja visible la columna «Kelly ref.» al lado del stake para que veas la distancia en cada análisis. Si más adelante quieres volver a Kelly con tope, es cambiar una línea (`stakeKelly` en `scCalcular`).

## Abierto 2 · ¿El P/L de Scout Core debe entrar en la Bitácora?
La fórmula de «BR final real» suma solo `Registros!AP` (Goal Hunter). Con stake ÷ 8 en Scout Core, el bankroll de mañana **no incluye** lo que ganes o pierdas en Scout Core, y el stake de ÷ 8 se calcula sobre un bankroll que no lo refleja. Opciones: (a) dejarlo así y usar G3/saldo de la casa como cuadre; (b) sumar `Scout_Core!AU` (P/L) a la fórmula de «BR final real» en el Sheet (cambio en fórmulas del Sheet: hay que decidirlo antes de empezar para no mezclar días). Mi lectura: si Scout Core apuesta dinero real con el mismo bankroll, (b) es lo coherente; no lo apliqué porque cambia la regla de bankroll.

## Abierto 3 · Otras decisiones pendientes
- **H7 (edge contra la probabilidad con margen):** sin cambio; existe la sección informativa «Sin el margen de la casa».
- **over 1.5 / over 3.5 como mercados con cuota:** exigiría campos y columnas nuevas.
- **Pinnacle vs 1xBet:** el prompt ya pide la cuota de la casa donde apuestas (1xBet) y avisa si usa otra; guardar las dos cuotas exige columnas nuevas.
- **Compartir links desde el móvil:** hecho para Android en v2.8.1 (ver `REINICIO_Y_DESPLIEGUE.md`, 4b). No funciona en iPhone.
- **Borrador del formulario (móvil):** hoy solo existe borrador del perfil de liga. Si la pestaña se recarga a mitad de un análisis se pierde lo escrito.
- **Notas cualitativas** (sentimiento, H2H, clima, alineación, motivación) siguen sin pesar en λ, edge, EV ni stake.
- **Residuo de bankroll ÷ 8:** hasta ±0,04 USD con bankrolls que no son múltiplo de 0,08 (limitación física; la fórmula del Sheet sí da 0,00).
