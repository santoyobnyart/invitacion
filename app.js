/* ============================================================
   SANTOYO FEST · app.js
   ============================================================ */

/* ----  CONFIG ---- */
/* ✏️  Edita aquí los datos del evento */
const CONFIG = {
  fecha:     new Date(2026, 10, 7, 14, 0, 0),  // año, mes(0-11), día, hora, min
  direccion: "https://maps.app.goo.gl/WZNTEoWX7Nggmu2W6",
  /* Cuando tengas el endpoint de Google Apps Script, pégalo aquí: */
  sheetEndpoint: "",
};

/* ---- FECHA Y MAPA ---- */
const fmt = new Intl.DateTimeFormat("es-MX", {
  weekday: "long", day: "numeric", month: "long",
  hour: "2-digit", minute: "2-digit",
});
const fechaEl = document.getElementById("fecha");
if (fechaEl) fechaEl.textContent = fmt.format(CONFIG.fecha);

const mapaEl = document.getElementById("mapa");
if (CONFIG.direccion && mapaEl) {
  mapaEl.href = CONFIG.direccion.startsWith("http")
    ? CONFIG.direccion
    : "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent(CONFIG.direccion);
} else if (mapaEl) {
  mapaEl.style.display = "none";
}

/* ---- GLOW CURSOR ---- */
const glowEl = document.getElementById("glow");
if (glowEl) {
  window.addEventListener("pointermove", ({ clientX: x, clientY: y }) => {
    glowEl.style.setProperty("--x", x + "px");
    glowEl.style.setProperty("--y", y + "px");
  });
}

/* ============================================================
   COUNTDOWN
   ============================================================ */
const cdEls = {
  d: document.getElementById("cd-d"),
  h: document.getElementById("cd-h"),
  m: document.getElementById("cd-m"),
  s: document.getElementById("cd-s"),
};
const prev = {};

function updateCountdown() {
  const diff = CONFIG.fecha - new Date();

  if (diff <= 0) {
    const countEl = document.querySelector(".count");
    if (countEl) {
      countEl.innerHTML = '<div class="cell" style="grid-column:1/-1"><span class="num" style="font-size:2rem">¡La fiesta ya comenzó! 🎉</span></div>';
    }
    clearInterval(timerCD);
    return;
  }

  const vals = {
    d: Math.floor(diff / 864e5),
    h: Math.floor(diff / 36e5) % 24,
    m: Math.floor(diff / 6e4) % 60,
    s: Math.floor(diff / 1e3) % 60,
  };

  for (const [key, val] of Object.entries(vals)) {
    if (!cdEls[key]) continue;
    const str = String(val).padStart(2, "0");
    if (prev[key] !== str) {
      cdEls[key].textContent = str;
      cdEls[key].classList.remove("tick");
      void cdEls[key].offsetWidth; // reflow para reiniciar animación
      cdEls[key].classList.add("tick");
      prev[key] = str;
    }
  }
}

const timerCD = setInterval(updateCountdown, 1000);
updateCountdown();

/* ============================================================
   BOTÓN MÚSICA
   ============================================================ */
const audio  = document.getElementById("audio");
const btnM   = document.getElementById("btnMusica");

function setMusicState(playing) {
  if (!btnM) return;
  if (playing) {
    btnM.textContent = "❚❚ Pausar";
    btnM.classList.add("on");
  } else {
    btnM.textContent = "♪ Música";
    btnM.classList.remove("on");
  }
}

if (btnM && audio) {
  btnM.addEventListener("click", () => {
    if (audio.paused) {
      audio.play().catch(() => {});
      setMusicState(true);
    } else {
      audio.pause();
      setMusicState(false);
    }
  });
}

/* ============================================================
   RSVP: abrir formulario
   ============================================================ */
const rsvpEl  = document.getElementById("rsvp");
const btnRsvp = document.getElementById("btnRsvp");

if (btnRsvp && rsvpEl) {
  btnRsvp.addEventListener("click", () => {
    rsvpEl.classList.add("open");
    rsvpEl.setAttribute("aria-hidden", "false");
    rsvpEl.scrollIntoView({ behavior: "smooth", block: "center" });
    setTimeout(() => {
      const input = document.getElementById("nombre");
      if (input) input.focus();
    }, 400);

    /* Al confirmar también empieza la música */
    if (audio && audio.paused) {
      audio.play().catch(() => {});
      setMusicState(true);
    }
  });
}

/* ============================================================
   RSVP: enviar formulario
   ============================================================ */
const formEl   = document.getElementById("form");
const submitEl = document.getElementById("submitBtn");
const succEl   = document.getElementById("successView");
const formView = document.getElementById("formView");

if (formEl) {
  formEl.addEventListener("submit", async (e) => {
    e.preventDefault();

    const nombre = document.getElementById("nombre").value.trim();
    if (!nombre) {
      document.getElementById("nombre").focus();
      return;
    }

    const payload = {
      nombre,
      acompanantes: Number(document.getElementById("acompanantes").value),
      timestamp: new Date().toISOString(),
    };

    submitEl.disabled = true;
    submitEl.textContent = "Enviando…";

    try {
      if (CONFIG.sheetEndpoint) {
        await fetch(CONFIG.sheetEndpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } else {
        /* Sin endpoint: simula un pequeño delay y muestra éxito */
        console.log("📋 RSVP registrado (sin endpoint):", payload);
        await new Promise(r => setTimeout(r, 600));
      }

      formView.style.display = "none";
      if (succEl) {
        succEl.style.display = "block";
        succEl.classList.add("show");
      }
    } catch (err) {
      console.error(err);
      submitEl.disabled = false;
      submitEl.textContent = "Confirmar ✦";
      alert("Hubo un error al enviar. Intenta de nuevo.");
    }
  });
}

/* ============================================================
   STICKERS ARRASTRABLES
   ============================================================ */
function initStickers() {
  const hero = document.querySelector(".hero");
  if (!hero) return;

  const stickers = hero.querySelectorAll(".sticker");
  const heroRect  = hero.getBoundingClientRect();

  stickers.forEach(el => {
    /* Posición inicial desde data-x / data-y (%) */
    const px = parseFloat(el.dataset.x ?? 0);
    const py = parseFloat(el.dataset.y ?? 0);
    el.style.left = px + "%";
    el.style.top  = py + "%";

    let startX, startY, startLeft, startTop, isDragging = false;

    /* ---- POINTER EVENTS (mouse + touch unificado) ---- */
    el.addEventListener("pointerdown", onDown);

    function onDown(e) {
      e.preventDefault();
      isDragging = true;
      el.classList.add("dragging");
      el.setPointerCapture(e.pointerId);

      const rect = hero.getBoundingClientRect();
      const elRect = el.getBoundingClientRect();

      startX = e.clientX;
      startY = e.clientY;
      startLeft = ((elRect.left - rect.left) / rect.width)  * 100;
      startTop  = ((elRect.top  - rect.top)  / rect.height) * 100;
    }

    el.addEventListener("pointermove", (e) => {
      if (!isDragging) return;
      e.preventDefault();

      const rect = hero.getBoundingClientRect();
      const dx = ((e.clientX - startX) / rect.width)  * 100;
      const dy = ((e.clientY - startY) / rect.height) * 100;

      el.style.left = (startLeft + dx) + "%";
      el.style.top  = (startTop  + dy) + "%";
    });

    el.addEventListener("pointerup", () => {
      isDragging = false;
      el.classList.remove("dragging");
    });

    el.addEventListener("pointercancel", () => {
      isDragging = false;
      el.classList.remove("dragging");
    });
  });
}

initStickers();

/* ============================================================
   FIN
   ============================================================ */
