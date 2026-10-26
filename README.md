# 🎉 SantoyoFest

La invitación digital de los 30 años de Santoyo. Una sola página, bonita, con
countdown, música y un formulario de RSVP que escribe directo a un Google
Sheet. Sin frameworks, sin build, sin dramas.

**🔗 Live:** https://santoyobnyart.github.io/invitacion/

## ¿Qué trae la app?

- 🖼️ Hero con efecto 3D al mover el mouse (`hero-tilt`)
- ⏳ Countdown en vivo hasta la fiesta
- 🎵 Botón de música que se activa solo al confirmar asistencia
- ✅ Formulario de RSVP (nombre + acompañantes) que guarda en un Google Sheet
- 📍 Link directo a la ubicación en Maps

## El stack (literal 3 archivos)

| Archivo | Qué hace |
|---|---|
| `index.html` | Toda la estructura de la página |
| `style.css` | Todo el diseño (orbs, glow, animaciones, el countdown, el form) |
| `app.js` | El countdown, el botón de música, el tilt 3D y el envío del RSVP |

No hay `npm install`, no hay build step. Para probar cambios localmente basta
con abrir `index.html` en el navegador (o usar la extensión "Live Server" si
quieres que el audio/recarga funcionen mejor).

## ¿Cómo llega el RSVP al Sheet?

```
[Formulario en index.html]
        ↓ fetch (no-cors)
[app.js → CONFIG.sheetEndpoint]
        ↓ POST
[Google Apps Script Web App]
        ↓ appendRow()
[Google Sheet, pestaña "Lista"]
```

El endpoint vive en `app.js`, dentro de `CONFIG.sheetEndpoint`. Como el fetch
usa `mode: "no-cors"`, el navegador **nunca** nos dice si el guardado falló o
no — por diseño, para evitar el preflight de CORS. Esto significa que si algo
se rompe del lado de Apps Script, la página igual va a mostrar "¡Nos vemos!"
como si todo hubiera salido bien. 🙃

### ⚠️ La trampa que ya nos mordió una vez

Editar el script en el editor de Apps Script **no actualiza** el Web App que
ya está publicado. Hay que ir explícitamente a:

> Implementar → Administrar implementaciones → ✏️ (editar) → Versión: Nueva
> versión → Implementar

Si cambias el `Código.gs` y no haces esto, el `/exec` público se queda
corriendo la versión vieja para siempre, aunque todo se vea guardado bien en
el editor.

## Cosas que vas a querer editar

Todo lo "de contenido" vive arriba de `app.js`, en el objeto `CONFIG`:

```js
const CONFIG = {
  fecha: new Date(2026, 10, 7, 14, 0, 0),  // fecha y hora de la fiesta
  direccion: "https://maps.app.goo.gl/...", // link de Google Maps
  sheetEndpoint: "https://script.google.com/macros/s/.../exec",
};
```

- **Cambiar la fecha/hora de la fiesta** → `CONFIG.fecha`
- **Cambiar la ubicación** → `CONFIG.direccion`
- **Cambiar a dónde se guarda el RSVP** → `CONFIG.sheetEndpoint`

## Deploy

El sitio se sirve directo desde GitHub Pages en la rama `main`. No hay CI ni
pasos intermedios: cada `git push` a `main` se refleja solo en 1-2 minutos.

```bash
git add .
git commit -m "lo que hiciste"
git push origin main
```

Y ya — espera un par de minutos y recarga el sitio.
