# MEJORAS — siguientes pasos, ordenados por valor frente a riesgo

Criterio: valor para tu objetivo (CLV positivo sostenido en 150+ apuestas prematch cerradas) frente al riesgo de tocar dinero, reglas o el contrato con el Sheet.

## Prioridad alta (mucho valor, riesgo bajo)
1. **Decidir los puntos de `DECISIONES_PENDIENTES.md`** (stake de Scout Core, H1/H2/H5/H8 y el redondeo de G3). Son los únicos cambios que afectan dinero y están listos como parche.
2. **Backtest con los cerrados.** Con las apuestas ya cerradas del Sheet: calibración (la probabilidad del modelo frente a la frecuencia real, por tramos), Brier por mercado y CLV por liga. Es solo lectura: se puede hacer con el panel «Camino a 150» como base. Hasta tener ~150 cerradas, sus conclusiones son provisionales.
3. **Cuota de cierre más fácil de capturar.** El CLV depende de apuntar la cuota de cierre al terminar. Un recordatorio en la tarjeta de «Análisis pendientes» costaría poco.

## Prioridad media
4. **De-vig con Pinnacle.** Hoy hay método proporcional sobre las cuotas que cargas. Con la cuota de Pinnacle como referencia (tu criterio de cierre), se podría usar su probabilidad sin margen como «verdad de mercado» para el CLV y para calibrar. Método alternativo para cuotas muy asimétricas: potencia o Shin (el proporcional subestima el sesgo favorito–longshot). Requiere campos de cuota de Pinnacle: columnas nuevas, es decir, tocar el Apps Script.
5. **Importación de cuotas.** Pegar un texto o JSON de cuotas (como ya haces con las notas) para rellenar los campos de cuota. Es solo interfaz; no toca el contrato.
6. **Módulo de corners y tarjetas.** Tus reglas ya mencionan el veto por dinero profesional (12 % corners, 8 % tarjetas) y el factor 0.45 del primer tiempo, pero el motor solo cubre goles, 1X2, over/under y BTTS. Un módulo propio (Poisson/binomial negativa para corners, con sobredispersión) exige datos de corners a favor y en contra, campos nuevos y columnas nuevas en el Sheet. Valor alto si es tu mercado; riesgo medio por el contrato.
7. **Calibrar ρ y la mezcla forma/temporada (70/30)** contra tus cerrados, en vez de usar el valor del paper. Es un cambio de reglas: solo con tu decisión y datos suficientes.

## Prioridad baja o con reservas
8. **Over/Under 1.5 y 3.5 como mercados con cuota.** Hoy son referencia informativa. Convertirlos en mercados completos pide campos y columnas nuevas.
9. **Hándicap asiático con cuota.** Igual que el anterior; además las casas ofrecen líneas de cuarto con distinta liquidez.
10. **Aumentar el límite de goles de la matriz (7).** Con λ ≈ 4.5 se pierde ~9 % de la masa de Poisson por encima de 7 goles antes de normalizar; en los rangos habituales (λ < 3) es despreciable. Cambiarlo toca el motor: solo si empiezas a analizar partidos con λ muy altas.

## Por qué NO se implementaron Poisson bivariado ni Monte Carlo como motor de decisión
- **Monte Carlo como motor de decisión:** el motor ya calcula la distribución **exacta** de marcadores (la matriz Dixon-Coles) y de ella salen todas las probabilidades por suma. Simular desde esa misma matriz solo añade ruido de muestreo (con 20.000 partidos, ±0.7 puntos porcentuales al 95 %). Por eso la simulación quedó únicamente como botón de autoverificación del motor, que comprueba que la suma analítica y el muestreo coinciden.
- **Poisson bivariado:** modela la dependencia entre los goles de ambos equipos con un tercer parámetro (covarianza λ₃). Nadie ha calibrado ese parámetro con tus datos y, sin calibrarlo, cualquier valor sería inventado. Dixon-Coles ya corrige la dependencia en los marcadores bajos (0-0, 1-0, 0-1, 1-1) con ρ. Cambiar de modelo sin un backtest que muestre una mejora en tus cerrados no tiene respaldo; el paso previo es el punto 2 y, después, comparar ambos modelos con Brier/log-loss sobre los mismos partidos.
