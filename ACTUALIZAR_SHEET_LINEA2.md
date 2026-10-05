# Actualizar tu Google Sheet real a la regla de Línea 2 (v2.2)

Hazlo en la pestaña **Bitacora** de tu Sheet actual (el que ya tiene tus datos). No necesitas subir de nuevo el .xlsx.
Si Google te marca error de análisis, cambia las comas `,` por punto y coma `;` (depende de la configuración regional).

## 1. Encabezados nuevos (fila 1, escribirlos EXACTOS, sin tildes)
| Celda | Texto |
|---|---|
| J1 | `Excedente L2` |
| K1 | `Saldo L2 cierre` |
| L1 | `Resultado L2 dia` |
| M1 | `Saldo L2 vigente` |
| N1 | `Chequeo` |
| P1 | `Dia desde el que rige L2` |
| Q1 | `Registros con P/L sin dia` |
| R1 | `Filas con error` |

## 2. Parámetros (fila 2)
- **P2**: escribe el número de **Día de HOY** (columna G de la fila de hoy). Los días anteriores conservan la regla vieja (hereda el BR real completo); desde hoy rige la nueva. Si empiezas de cero, pon `1`.
- **Q2**: `=SUMPRODUCT((Registros!$AP$2:$AP$3000<>"")*(((Registros!$C$2:$C$3000="")+(COUNTIF($H$2:$H$367,Registros!$C$2:$C$3000)=0))>0))`
- **R2**: `=SUMPRODUCT(--(LEN($N$2:$N$367)>0))`

## 3. Columna A — Gambito blindado (reemplaza A3 hasta A367; A2 sigue siendo tu semilla manual)
`A3`:
```
=IF(D2="","",IF(G2>=$P$2,MIN(D2,C2),D2))
```
Rellena hacia abajo hasta la fila 367. Significa: si el día anterior cerró sobre el plan, el nuevo día arranca con el BR **planificado** (solo +1 stake); si cerró por debajo, hereda el BR real tal cual.

## 4. Columnas nuevas, fila 2 (cópialas hasta la fila 367 solo después de pegar la fila 3)
`J2`:
```
=IF(OR(H2="",D2="",C2="",G2<$P$2),"",MAX(0,ROUND(D2-C2,2)))
```
`K2`: **vacía** (es la única celda que tú escribes: el total de la Línea 2 al cerrar el día).

`L2`:
```
=IF(NOT(ISNUMBER(K2)),"",ROUND(K2-0-N(J2),2))
```
`M2`:
```
=IF(ISNUMBER(K2),K2,0)
```
`N2`:
```
=IF(AND(H2="",K2=""),"",TRIM(IF(AND(H2<>"",NOT(AND(LEN(H2)=10,MID(H2,5,1)="-",MID(H2,8,1)="-"))),"Fecha con formato invalido (usa AAAA-MM-DD). ","")&IF(AND(H2<>"",COUNTIF($H$2:$H$367,H2)>1),"Fecha repetida en otro dia. ","")&IF(AND(H2<>"",ISNUMBER(B2),ISNUMBER(A2),ABS(B2-A2/8)>0.00001),"Stake distinto de Bank roll/8. ","")&IF(AND(H2<>"",ISNUMBER(E2),ABS(E2)>0.005),"Residuo distinto de 0. ","")&IF(AND(K2<>"",OR(NOT(ISNUMBER(K2)),N(K2)<0)),"Saldo L2 no numerico o negativo. ","")&IF(AND(H2<>"",H2<TEXT(TODAY(),"yyyy-mm-dd"),G2>=$P$2,K2="",OR(N(J2)>0,0>0)),"Falta cerrar el Saldo L2 de este dia. ","")&IF(AND(H2<>"",SUMPRODUCT((Registros!$C$2:$C$3000=H2)*ISTEXT(Registros!$AP$2:$AP$3000))>0),"Hay P/L guardado como texto en Registros (no suma). ","")))
```

## 5. Columnas nuevas, fila 3 (rellena hacia abajo hasta la fila 367)
`J3`:
```
=IF(OR(H3="",D3="",C3="",G3<$P$2),"",MAX(0,ROUND(D3-C3,2)))
```
`L3`:
```
=IF(NOT(ISNUMBER(K3)),"",ROUND(K3-N(M2)-N(J3),2))
```
`M3`:
```
=IF(ISNUMBER(K3),K3,N(M2))
```
`N3`:
```
=IF(AND(H3="",K3=""),"",TRIM(IF(AND(H3<>"",NOT(AND(LEN(H3)=10,MID(H3,5,1)="-",MID(H3,8,1)="-"))),"Fecha con formato invalido (usa AAAA-MM-DD). ","")&IF(AND(H3<>"",COUNTIF($H$2:$H$367,H3)>1),"Fecha repetida en otro dia. ","")&IF(AND(H3<>"",H2<>"",H3<=H2),"La fecha no es posterior a la del dia anterior. ","")&IF(AND(H3<>"",ISNUMBER(A3),ISNUMBER(D2),ISNUMBER(C2),ABS(A3-IF(G2>=$P$2,MIN(D2,C2),D2))>0.005),"Bank roll inicial no sigue la regla del dia anterior (alguien sobrescribio la formula). ","")&IF(AND(H3<>"",ISNUMBER(B3),ISNUMBER(A3),ABS(B3-A3/8)>0.00001),"Stake distinto de Bank roll/8. ","")&IF(AND(H3<>"",ISNUMBER(E3),ABS(E3)>0.005),"Residuo distinto de 0. ","")&IF(AND(K3<>"",OR(NOT(ISNUMBER(K3)),N(K3)<0)),"Saldo L2 no numerico o negativo. ","")&IF(AND(H3<>"",H3<TEXT(TODAY(),"yyyy-mm-dd"),G3>=$P$2,K3="",OR(N(J3)>0,N(M2)>0)),"Falta cerrar el Saldo L2 de este dia. ","")&IF(AND(H3<>"",SUMPRODUCT((Registros!$C$2:$C$3000=H3)*ISTEXT(Registros!$AP$2:$AP$3000))>0),"Hay P/L guardado como texto en Registros (no suma). ","")))
```

## 6. Colores (Formato > Formato condicional > "La fórmula personalizada es")
1. Rango `A2:E367, G2:N367` — fórmula `=LEN($N2)>0` — relleno rojo claro y texto rojo oscuro (fila con error).
2. Rango `Q2:R2` — fórmula `=Q2>0` — relleno rojo claro y texto rojo oscuro.
3. Rango `J2:M367` — fórmula `=AND($H2="",$K2="")` — texto gris (filas futuras).
4. Opcional: pinta K2:K367 de amarillo claro para recordar que es tu celda de entrada.

## 7. Zona horaria
Archivo > Configuración > Zona horaria: **America/Guayaquil** (el aviso "Falta cerrar el Saldo L2" depende de la fecha de hoy).

## 8. Apps Script
Pega el nuevo `gambito_appsscript.gs` y haz **Implementar > Gestionar implementaciones > ✏️ > Versión: Nueva versión > Implementar**. La URL no cambia.

## 9. Cómo se usa cada día
1. Opera Gambito normal. Si el BR real supera el planificado, la columna J muestra el excedente (provisional hasta que cierres el día).
2. Al terminar el día, en la app: **06 · Metas > Línea 2 > Total de la Línea 2 al cerrar** (incluye el excedente de ese día más lo que ganaste o perdiste en tus all-in) > Guardar. Sin señal queda guardado en el teléfono y sube solo.
3. Con 15 o más disponibles, la app muestra 3 apuestas iguales.
