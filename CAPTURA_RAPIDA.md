# Captura rápida desde la pantalla de estadísticas (v2.9.3)

Sin costo extra, sin servidor nuevo y **sin cambios en el Sheet ni en el Apps Script**. Solo rellena campos del formulario; no guarda nada por sí sola.

## Qué captura
La pantalla de **Estadísticas** del partido en 1xBet (también sirve la de Sofascore o Flashscore). De ahí salen la competición, los equipos (local = el primero de la línea del marcador, columna izquierda), el minuto, el marcador y las métricas. Si una fila no aparece en esa pantalla, queda vacía: no se calcula ni se inventa.

## Flujo en Android (≈ 6 toques)
1. En el partido, abre **Estadísticas** y toma la captura (que se vea el título de la competición y, abajo, la línea con marcador, equipos y tiempo).
2. Pásala a tu IA con el prompt de abajo (botón «Copiar prompt de captura» en Gambito). Para no pegarlo cada vez, guárdalo como instrucciones de un proyecto (probablemente funciona así en la app móvil; no lo verifiqué).
3. Copia el JSON que devuelve.
4. Gambito → **Nuevo registro** → «📸 Captura rápida» → **Pegar JSON de captura**.
5. Revisa lo rellenado y sigue como siempre.

## Dónde cae cada dato
| Captura | Campo de Nuevo registro |
|---|---|
| Competición | Liga (formato «País - Competición»; internacionales: «UEFA - Liga de Campeones») |
| Línea del marcador | Partido «Local vs Visitante», Score al entrar, Minuto al entrar |
| xG | xG equipo 1 / equipo 2 |
| Tiros entre los tres palos | Tiros al arco 1 / 2 |
| Corner | Corners 1 / 2 |
| % de posesión | Posesión % 1 / 2 |
| Red card (si hay alguna) | Marca «Ya hubo tarjeta roja» (nunca la desmarca) |
| Ataques, ataques peligrosos, tiros fuera, paradas, pases clave, centros, amarillas | **Solo se muestran** en el mensaje (no hay columna en el registro) |

Para guardar también esos extras haría falta añadir columnas a Registros y al Apps Script: cambia el contrato con el Sheet, por eso no lo hice sin tu aprobación.

## Protecciones
- Nunca guarda. Si un campo ya tenía otro dato, pide confirmación antes de reemplazar.
- Valida rangos (posesión 0–100, xG 0–10, etc.) y avisa si la posesión no suma ≈100. Lo imposible se ignora con aviso.
- Empareja la liga con tu perfil existente (sin tildes ni signos) para no duplicar perfiles.
- Si la IA reporta legibilidad media/baja o dudas, te las muestra.
- En Scout Core, una captura en vivo solo pone liga y partido: las métricas en vivo no entran en el análisis prematch.

## Límites honestos
- Una IA puede leer mal un número; revisa antes de guardar. El xG de 1xBet es de ellos, no necesariamente igual al de otras fuentes.
- Los nombres de equipos se toman como los escribe la fuente; no hay tabla de alias.
- Depende de una IA externa que tú abres; Gambito no la llama.

## Prompt de captura (el mismo que copia el botón)

```
Eres un transcriptor de capturas de pantalla de partidos de fútbol. NO analices, NO predigas, NO recomiendes. Solo copia lo que se VE en la imagen.

La captura normalmente es la pantalla de ESTADÍSTICAS del partido (1xBet, Sofascore o Flashscore): un título con la competición, filas con una métrica en el centro y el valor del equipo local a la izquierda y del visitante a la derecha, y abajo una línea con el marcador, los equipos y el tiempo transcurrido.

Devuélveme ÚNICAMENTE este objeto JSON, sin texto antes ni después y sin markdown:

{
  "tipo_captura": "vivo",
  "fuente": "1xBet",
  "liga": "País - Competición",
  "local": null,
  "visitante": null,
  "minuto": null,
  "marcador_local": null,
  "marcador_visitante": null,
  "metricas": {
    "local": { "xg": null, "ataques": null, "ataques_peligrosos": null, "posesion": null, "tiros_puerta": null, "tiros_fuera": null, "amarillas": null, "rojas": null, "paradas": null, "corners": null, "penaltis": null, "sustituciones": null, "pases_clave": null, "precision_pases": null, "centros": null },
    "visitante": { "xg": null, "ataques": null, "ataques_peligrosos": null, "posesion": null, "tiros_puerta": null, "tiros_fuera": null, "amarillas": null, "rojas": null, "paradas": null, "corners": null, "penaltis": null, "sustituciones": null, "pases_clave": null, "precision_pases": null, "centros": null }
  },
  "cuotas": { "local": null, "empate": null, "visitante": null, "over25": null, "under25": null, "btts_si": null, "btts_no": null, "mas_075": null },
  "legibilidad": "alta",
  "dudas": null
}

Reglas:
- liga: formato "País - Competición", en español, sin prefijos como "Fútbol." (ejemplo: "Fútbol. Israel. State Cup" → "Israel - State Cup"). En competiciones internacionales usa el organizador en lugar del país (ejemplo: "Fútbol. Liga de Campeones de la UEFA" → "UEFA - Liga de Campeones").
- local y visitante: tal como aparecen escritos en la línea del marcador ("RC Lens - Sporting CP": el primero es el local, el segundo el visitante). El valor de la izquierda en cada fila es del local; el de la derecha, del visitante. No traduzcas ni abrevies los nombres.
- minuto: entero del tiempo transcurrido (65 si marca 65:57). marcador_local y marcador_visitante: enteros del marcador, en el mismo orden local-visitante. Si no es en vivo, tipo_captura "prematch" y null en minuto y marcador.
- metricas: asigna cada fila por su SIGNIFICADO aunque la etiqueta esté en otro idioma, y copia el número tal cual (xG con sus decimales):
  xg = xG; ataques = Ataques; ataques_peligrosos = Ataques peligrosos; posesion = % de posesión; tiros_puerta = Tiros entre los tres palos / a puerta; tiros_fuera = Tiros fuera de portería; amarillas = Tarjetas amarillas; rojas = Red card / tarjetas rojas; paradas = Paradas; corners = Corner / saques de esquina; penaltis = Penalty; sustituciones = Substitutions; pases_clave = Key Passes; precision_pases = Passing Accuracy %; centros = Crosses.
- Si una fila no aparece en la captura, deja null. No calcules, no sumes y no completes un valor a partir de otro.
- cuotas: solo si se ven en la captura (número con punto decimal y todos los decimales exactos: 2.944, no 2.94); en la pantalla de estadísticas normalmente son null. mas_075 = cuota de "Más de (0.75)" del Total asiático.
- Si algo se lee con duda (borroso, cortado, ambiguo), anótalo en "dudas" y baja "legibilidad" a "media" o "baja".
- NUNCA inventes un dato que no esté en la imagen.
```
