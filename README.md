# Gambito — Goal Hunter (PWA)

## Qué cambia respecto a la versión anterior
Antes la app corría como archivo local (`file://`), abierta con doble clic. Eso bloquea
dos cosas de una PWA real: el Service Worker (caché offline real) y el aviso automático
"Instalar aplicación". Sirviéndola por HTTPS desde GitHub Pages, ambas funcionan.

La hoja de cálculo y el Apps Script **no cambian** — siguen siendo los mismos, con la
misma URL de despliegue que ya tienes configurada.

## Archivos de esta carpeta
- `index.html` — la app completa (mismo diseño y funcionalidad de siempre, más las
  etiquetas de PWA).
- `manifest.json` — nombre, colores e íconos de la app instalada.
- `sw.js` — Service Worker: cachea la app y sus recursos externos para que funcione
  sin conexión después de la primera carga.
- `icon-192.png`, `icon-512.png` — ícono normal.
- `icon-192-maskable.png`, `icon-512-maskable.png` — versión con margen de seguridad,
  para que Android no recorte el logo al aplicar máscaras circulares/redondeadas.
- `apple-touch-icon.png`, `favicon-32.png` — ícono para iPhone y pestaña del navegador.

## Cómo publicarlo en GitHub Pages (una sola vez)

1. Crea un repositorio nuevo en GitHub (puede ser público o privado — Pages funciona
   con ambos si tienes GitHub Pro, o público si es cuenta gratuita).
2. Sube **todos** los archivos de esta carpeta a la raíz del repositorio (no los metas
   en una subcarpeta).
3. Ve a **Settings → Pages** del repositorio.
4. En "Source", selecciona **"Deploy from a branch"** → rama `main` → carpeta `/ (root)`.
5. Guarda. GitHub te da una URL parecida a:
   `https://tu-usuario.github.io/nombre-del-repo/`
6. Espera 1-2 minutos (el primer despliegue tarda un poco) y abre esa URL.

## La primera vez que abras la URL nueva

Como es un origen (dominio) distinto al `file://` de antes, el navegador no tiene
guardada tu URL del Apps Script todavía — te la va a pedir de nuevo, una sola vez:
botón **"Servidor / Sheet"** → pega la misma URL que ya usabas (termina en `/exec`).
No hace falta reimplementar el Apps Script ni tocar el Sheet — es la misma data de
siempre, solo estás abriendo la app desde un lugar distinto.

## Instalar en el teléfono
- **Android/Chrome:** al abrir la URL debería aparecer solo el aviso "Instalar
  aplicación" en la parte inferior. Si no aparece, menú (⋮) → "Instalar aplicación".
- **iPhone/Safari:** botón compartir (cuadrado con flecha) → "Agregar a inicio".

## Actualizar la app después
Cuando yo te dé cambios nuevos del HTML, solo reemplaza `index.html` en el repositorio
(`git push` o subir el archivo de nuevo desde la web de GitHub) — no hace falta que
nadie reinstale nada, la próxima vez que abran la app el Service Worker trae la
versión nueva sola.
