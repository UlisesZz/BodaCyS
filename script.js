/***********************
 * CONFIG
 ***********************/
//const SCRIPT_ID = "AKfycbzFXmH1E1roQ2zDgo5gb2;
const SCRIPT_URL = "https://example.com/backend-disabled";

// WhatsApp (felicitaciones) - contacto oficial
const WHATSAPP_PHONE = "525511110000";


/***********************
 * Agregar alerta de que ya respondiste el formulario
 ***********************/

function prettyAlert(message, title = "Mensaje") {
  const modal = document.getElementById("alertModal");
  const overlay = document.getElementById("alertOverlay");
  const closeBtn = document.getElementById("alertClose");
  const okBtn = document.getElementById("alertOk");
  const titleEl = document.getElementById("alertTitle");
  const msgEl = document.getElementById("alertMsg");

  // Si por algo no existe el modal, usa el alert normal
  if (!modal || !overlay || !closeBtn || !okBtn || !titleEl || !msgEl) {
    alert(message);
    return;
  }

  titleEl.textContent = title;
  msgEl.textContent = message;

  // Bind de eventos una sola vez
  if (!modal.dataset.bound) {
    const close = () => {
      modal.classList.remove("is-open");
      modal.setAttribute("aria-hidden", "true");
      document.body.style.overflow = "";
    };

    overlay.addEventListener("click", close);
    closeBtn.addEventListener("click", close);
    okBtn.addEventListener("click", close);

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && modal.classList.contains("is-open")) close();
    });

    modal.dataset.bound = "1";
  }

  modal.classList.add("is-open");
  modal.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";

  okBtn.focus();
}



/***********************
 * TOKEN persistence + internal links
 ***********************/
(function initTokenPersistence(){
  const TOKEN_KEY = "wedding_invite_token";
  const currentUrl = new URL(window.location.href);
  const currentToken = (currentUrl.searchParams.get("t") || "").trim();

  // Guardar token si viene en la URL
  if (currentToken) {
    try {
      sessionStorage.setItem(TOKEN_KEY, currentToken);
    } catch(_) {}
  }

  function getSavedToken(){
    try {
      return (sessionStorage.getItem(TOKEN_KEY) || "").trim();
    } catch(_) {
      return "";
    }
  }

  function isIndexPath(pathname){
    return (
      pathname === "/" ||
      pathname.endsWith("/index.html") ||
      pathname === "index.html"
    );
  }

  // Si estás en index sin token, pero existe uno guardado, lo restaura
  const savedToken = getSavedToken();
  if (!currentToken && savedToken && isIndexPath(currentUrl.pathname)) {
    currentUrl.searchParams.set("t", savedToken);
    window.location.replace(currentUrl.toString());
    return;
  }

  function shouldPreserveToken(href){
    if (!href) return false;
    if (href.startsWith("#")) return false;
    if (href.startsWith("mailto:")) return false;
    if (href.startsWith("tel:")) return false;
    if (href.startsWith("javascript:")) return false;
    return true;
  }

  function buildUrlWithToken(href){
    if (!shouldPreserveToken(href)) return href;

    const tokenToUse = currentToken || savedToken;
    if (!tokenToUse) return href;

    try {
      const url = new URL(href, window.location.href);

      // Solo para mismo sitio/origen
      if (url.origin !== window.location.origin) return href;

      // Solo páginas internas html o raíz
      const path = url.pathname.toLowerCase();
      const isInternalPage =
        path.endsWith(".html") ||
        path === "/" ||
        path.endsWith("/");

      if (!isInternalPage) return href;

      url.searchParams.set("t", tokenToUse);
      return url.toString();
    } catch(_) {
      return href;
    }
  }

  // Reescribe links internos al cargar
  document.querySelectorAll('a[href]').forEach((a) => {
    const href = a.getAttribute("href");
    const newHref = buildUrlWithToken(href);
    if (newHref && newHref !== href) {
      a.setAttribute("href", newHref);
    }
  });

  // Exponer helper global por si otro bloque lo necesita
  window.__buildUrlWithToken = buildUrlWithToken;
})();

/***********************
 * NAV (Hamburger) - Offcanvas + cerrar fuera + back celular + botón cerrar
 ***********************/
/***********************
 * NAV (Hamburger) - Offcanvas + cerrar fuera + back celular + botón cerrar
 ***********************/
(function initNav(){
  const toggle = document.getElementById("navToggle");
  const menu = document.getElementById("navMenu");
  const backdrop = document.getElementById("navBackdrop");
  if (!toggle || !menu || !backdrop) return;

  let pushed = false;

  let closeBtn = menu.querySelector(".nav__close");
  if (!closeBtn) {
    closeBtn = document.createElement("button");
    closeBtn.type = "button";
    closeBtn.className = "nav__close";
    closeBtn.setAttribute("aria-label", "Cerrar menú");
    closeBtn.innerHTML = "✕";
    menu.insertBefore(closeBtn, menu.firstChild);
  }

  function lockBody(lock){
    document.body.classList.toggle("nav-lock", !!lock);
  }

  function isOpen(){
    return menu.classList.contains("is-open");
  }

  function openMenu(pushHistory = true){
    menu.classList.add("is-open");
    backdrop.classList.add("is-open");
    toggle.setAttribute("aria-expanded", "true");
    lockBody(true);

    if (pushHistory && !pushed) {
      try {
        history.pushState({ navMenuOpen: true }, "");
        pushed = true;
      } catch(_) {}
    }
  }

  function closeMenu(fromPopstate = false){
    menu.classList.remove("is-open");
    backdrop.classList.remove("is-open");
    toggle.setAttribute("aria-expanded", "false");
    lockBody(false);

    if (fromPopstate) {
      pushed = false;
      return;
    }

    if (pushed) {
      pushed = false;
      try { history.back(); } catch(_) {}
    }
  }

  function resolveHrefWithToken(href){
    if (typeof window.__buildUrlWithToken === "function") {
      return window.__buildUrlWithToken(href);
    }
    return href;
  }

  toggle.addEventListener("click", (e) => {
    e.stopPropagation();
    if (isOpen()) closeMenu(false);
    else openMenu(true);
  });

  closeBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    closeMenu(false);
  });

  backdrop.addEventListener("click", (e) => {
    e.stopPropagation();
    closeMenu(false);
  });

  function outsideClose(e){
    if (!isOpen()) return;
    const t = e.target;
    const clickedInsideMenu = menu.contains(t);
    const clickedToggle = toggle.contains(t);
    if (!clickedInsideMenu && !clickedToggle) closeMenu(false);
  }

  document.addEventListener("click", outsideClose, true);
  document.addEventListener("touchstart", outsideClose, true);

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && isOpen()) closeMenu(false);
  });

  window.addEventListener("popstate", () => {
    if (isOpen()) closeMenu(true);
  });

  menu.querySelectorAll("a").forEach((a) => {
    a.addEventListener("click", (e) => {
      const href = a.getAttribute("href");
      if (!href) return;

      e.preventDefault();
      closeMenu(false);

      const finalHref = resolveHrefWithToken(href);

      setTimeout(() => {
        window.location.href = finalHref;
      }, 40);
    });
  });
})();

/***********************
 * Animaciones tipo Canva (reveal on scroll)
 ***********************/
(function initReveal(){
  const candidates = document.querySelectorAll(
    ".hero__text, .strip, .count, .story__grid > *, .details__block, .full-photo, .rsvp__inner > *, .gifts__grid > *, .map__inner > *," +
    " .page-card > *"
  );

  candidates.forEach((el, i) => {
    el.classList.add("reveal");
    const d = Math.min(i * 60, 420);
    el.style.setProperty("--d", `${d}ms`);
  });

  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) e.target.classList.add("is-visible");
    });
  }, { threshold: 0.12 });

  candidates.forEach(el => io.observe(el));
})();

/***********************
 * Countdown
 ***********************/
(function initCountdown(){
  const countdownEl = document.getElementById("countdown");
  if (!countdownEl) return;

  const WEDDING_DATE = new Date(2026, 5, 20, 16, 0, 0);

  function pad2(n){ return String(n).padStart(2, "0"); }

  function renderCountdown({days, hours, minutes, seconds}){
    countdownEl.innerHTML = `
      <div class="tcell">
        <div class="tnum">${days}</div>
        <div class="tlab">DÍAS</div>
      </div>
      <div class="sep">:</div>
      <div class="tcell">
        <div class="tnum">${pad2(hours)}</div>
        <div class="tlab">HORAS</div>
      </div>
      <div class="sep">:</div>
      <div class="tcell">
        <div class="tnum">${pad2(minutes)}</div>
        <div class="tlab">MINUTOS</div>
      </div>
      <div class="sep">:</div>
      <div class="tcell">
        <div class="tnum">${pad2(seconds)}</div>
        <div class="tlab">SEGUNDOS</div>
      </div>
    `;
  }

  function updateCountdown(){
    const now = new Date();
    const diff = WEDDING_DATE - now;

    if(diff <= 0){
      countdownEl.innerHTML = `<div class="tnum">¡HOY!</div>`;
      return;
    }

    const totalSeconds = Math.floor(diff / 1000);
    const days = Math.floor(totalSeconds / (3600 * 24));
    const hours = Math.floor((totalSeconds % (3600 * 24)) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    renderCountdown({days, hours, minutes, seconds});
  }

  updateCountdown();
  setInterval(updateCountdown, 1000);
})();

/***********************
 * RSVP (Google Sheets) - TOKEN + One-time
 * - Confirmación Sí/No
 * - “¿Cuántos asistirán?” = ADULTOS (incluyéndote)
 * - No. boletos = TOTAL (adultos + niños)
 * - Flujo 2 pasos:
 *   1) Sin activar niños: adultos máx = boletos - niñosMax
 *   2) Activando niños: eliges menores (1..niñosMax) y adultos máx = boletos - menores
 * - Enlaces de un solo uso con columna Respondido (0/1)
 ***********************/
(function initRSVP(){
  const rsvpForm = document.getElementById("rsvpForm");
  if (!rsvpForm) return;

  if (!SCRIPT_URL) {
  console.warn("Backend deshabilitado en la versión pública.");

  const btnSubmit = document.getElementById("btnSubmit");
  if (btnSubmit) {
    btnSubmit.disabled = true;
    btnSubmit.textContent = "Demo";
  }

  return;
  }

  const debugLine = document.getElementById("debugLine");
  const btnSubmit = document.getElementById("btnSubmit");

  const afterSend = document.getElementById("afterSend");
  const btnWhats = document.getElementById("btnWhats");
  const congratsMessage = document.getElementById("congratsMessage");

  const assistEl = document.getElementById("assist");
  const guestsEl = document.getElementById("guests"); // ADULTOS
  const kidsPolicyNoteEl = document.getElementById("kidsPolicyNote");

  // Forzar Sí/No, quitar Tal vez si existiera
  if (assistEl) {
    [...assistEl.options].forEach(opt => {
      if (String(opt.value).trim().toLowerCase() === "tal vez") opt.remove();
    });
  }

  const params = new URLSearchParams(window.location.search);
  const token = (params.get("t") || "").trim(); // ✅ ahora usamos token ?t=

  let boletosMax = 0; // total (adultos + niños)
  let ninosMax = 0;   // niños permitidos (max)

  // UI niños
  let kidsBlock = null;
  let kidsRequest = null;
  let kidsCountWrap = null;
  let kidsCountSel = null;

  // Modal warning
  let kidsModal = null;

  function toInt_(v){
    const n = parseInt(String(v ?? "").trim(), 10);
    return Number.isFinite(n) && n >= 0 ? n : 0;
  }

  function ensureGuestsZeroOption_(){
    if (!guestsEl) return;
    let opt = guestsEl.querySelector('option[value="0"][data-autozero="1"]');
    if (!opt) {
      opt = document.createElement("option");
      opt.value = "0";
      opt.textContent = "0";
      opt.dataset.autozero = "1";
      const first = guestsEl.querySelector('option[value=""]');
      if (first && first.nextSibling) guestsEl.insertBefore(opt, first.nextSibling);
      else guestsEl.appendChild(opt);
    }
  }

  function removeGuestsZeroOption_(){
    if (!guestsEl) return;
    const opt = guestsEl.querySelector('option[value="0"][data-autozero="1"]');
    if (opt) opt.remove();
  }

  function buildKidsModal_(){
    if (kidsModal) return;

    kidsModal = document.createElement("div");
    kidsModal.id = "kidsModal";
    kidsModal.className = "kids-modal";
    kidsModal.innerHTML = `
      <div class="kids-modal__backdrop" data-close="1"></div>
      <div class="kids-modal__dialog" role="dialog" aria-modal="true">
        <div class="kids-modal__text">
          <p>Será una noche larga, con pista llena y copas en alto 🥂</p>
          <p>¿Seguro que quieres incluir a los pequeños en esta misión?</p>
        </div>
        <div class="kids-modal__actions">
          <button type="button" class="kids-btn kids-btn--yes" id="kidsYes">Sí, incluir niños</button>
          <button type="button" class="kids-btn kids-btn--no" id="kidsNo">No, solo adultos</button>
        </div>
      </div>
    `;

    document.body.appendChild(kidsModal);

    const close = () => {
      kidsModal.classList.remove("is-open");
      document.body.classList.remove("modal-lock");
    };

    kidsModal.addEventListener("click", (e) => {
      const t = e.target;
      if (t && t.dataset && t.dataset.close) close();
    });

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && kidsModal.classList.contains("is-open")) close();
    });

    kidsModal.querySelector("#kidsYes")?.addEventListener("click", () => {
      setKidsRequested_(true);
      close();
    });
    kidsModal.querySelector("#kidsNo")?.addEventListener("click", () => {
      setKidsRequested_(false);
      close();
    });
  }

  function openKidsModal_(){
    buildKidsModal_();
    if (!kidsModal) return;
    kidsModal.classList.add("is-open");
    document.body.classList.add("modal-lock");
  }

  function buildKidsUI_(){
    if (kidsBlock) return;

    const grid = rsvpForm.querySelector(".form__grid");
    if (!grid) return;

    kidsBlock = document.createElement("div");
    kidsBlock.id = "kidsBlock";
    kidsBlock.className = "kids-block field--full";
    kidsBlock.style.display = "none";
    kidsBlock.innerHTML = `
      <label class="kids-check">
        <input type="checkbox" id="kidsRequest" />
        <span>Solicitar asistencia con niños</span>
      </label>
      <div class="kids-note"></div>
      <div class="kids-count" id="kidsCountWrap" style="display:none;">
        <label class="field">
          <span>Número de niños</span>
          <select id="kidsCount" name="kidsCount"></select>
        </label>
      </div>
    `;

    const foodField = document.getElementById("food")?.closest(".field");
    if (foodField && foodField.parentElement === grid) grid.insertBefore(kidsBlock, foodField);
    else grid.appendChild(kidsBlock);

    kidsRequest = kidsBlock.querySelector("#kidsRequest");
    kidsCountWrap = kidsBlock.querySelector("#kidsCountWrap");
    kidsCountSel = kidsBlock.querySelector("#kidsCount");

    if (kidsRequest) {
      kidsRequest.addEventListener("click", (e) => {
        if (!isKidsEligibleNow_()) return;
        e.preventDefault();
        openKidsModal_();
      });
    }

    kidsCountSel?.addEventListener("change", () => {
      rebuildAdultsOptions_();
    });
  }

  // cuando está activo “niños”, NO permitimos 0
  function fillKidsOptions_(){
    if (!kidsCountSel) return;

    const previousValue = kidsCountSel.value || "";
    kidsCountSel.innerHTML = "";

    const placeholder = document.createElement("option");
    placeholder.value = "";
    placeholder.textContent = "Selecciona";
    placeholder.disabled = true;
    placeholder.selected = true;
    kidsCountSel.appendChild(placeholder);

    for (let i = 1; i <= ninosMax; i++) {
      const opt = document.createElement("option");
      opt.value = String(i);
      opt.textContent = String(i);
      kidsCountSel.appendChild(opt);
    }

    if (previousValue && Number(previousValue) >= 1 && Number(previousValue) <= ninosMax) {
      kidsCountSel.value = previousValue;
    } else {
      kidsCountSel.value = "";
    }
  }

  function isKidsEligibleNow_(){
    return ninosMax >= 1 && assistEl && assistEl.value === "Sí";
  }

  function setKidsRequested_(on){
    if (!kidsRequest) return;
    kidsRequest.checked = !!on;

    if (kidsCountWrap) kidsCountWrap.style.display = on ? "block" : "none";

    if (kidsCountSel) {
      if (on) fillKidsOptions_();
      else kidsCountSel.innerHTML = "";
    }

    rebuildAdultsOptions_();
  }

  // function showKidsSection_(show){
  //   buildKidsUI_();
  //   if (!kidsBlock) return;
  //   kidsBlock.style.display = show ? "block" : "none";
  //   if (!show) setKidsRequested_(false);
  // }
function showKidsSection_(show){
  buildKidsUI_();
  if (!kidsBlock) return;

  kidsBlock.style.display = show ? "block" : "none";
  if (kidsPolicyNoteEl) kidsPolicyNoteEl.style.display = show ? "block" : "none";

  if (!show) setKidsRequested_(false);
}


  function currentKidsSelected_(){
    if (!kidsRequest || !kidsRequest.checked) return 0;
    return toInt_(kidsCountSel ? kidsCountSel.value : "0");
  }

  // ADULTOS con flujo 2 pasos
  function rebuildAdultsOptions_(){
    if (!guestsEl) return;

    let maxAdults;

    if (kidsRequest && kidsRequest.checked) {
      const kidsSelected = currentKidsSelected_(); // 1..ninosMax
      maxAdults = boletosMax - kidsSelected;
    } else {
      maxAdults = boletosMax - ninosMax;
    }

    if (assistEl && assistEl.value === "Sí") {
      if (maxAdults < 1) maxAdults = 1;
    } else {
      if (maxAdults < 0) maxAdults = 0;
    }

    const prev = guestsEl.value;

    guestsEl.innerHTML = `<option value="" selected disabled>Selecciona…</option>`;
    const start = (assistEl && assistEl.value === "Sí") ? 1 : 0;

    for (let i = start; i <= maxAdults; i++) {
      const opt = document.createElement("option");
      opt.value = String(i);
      opt.textContent = String(i);
      guestsEl.appendChild(opt);
    }

    if (prev && prev !== "0") {
      const exists = [...guestsEl.options].some(o => o.value === prev);
      guestsEl.value = exists ? prev : "";
    }
  }

  function syncAssistUI_(){
    if (!assistEl || !guestsEl) return;

    if (assistEl.value && assistEl.value !== "Sí" && assistEl.value !== "No") {
      assistEl.value = "";
    }

    if (assistEl.value === "No") {
      ensureGuestsZeroOption_();
      guestsEl.value = "0";
      guestsEl.disabled = true;
      showKidsSection_(false);
      return;
    }

    guestsEl.disabled = false;
    removeGuestsZeroOption_();
    if (guestsEl.value === "0") guestsEl.value = "";

    if (ninosMax >= 1 && assistEl.value === "Sí") showKidsSection_(true);
    else showKidsSection_(false);

    rebuildAdultsOptions_();
  }

  if (assistEl) assistEl.addEventListener("change", syncAssistUI_);

  // ✅ Si no hay token, no carga nada
  if (!token) {
    if (debugLine) debugLine.textContent = "⚠️ Falta token en la URL. Usa ?t=TU_TOKEN";
    return;
  }

  // ✅ GET por token
  fetch(`${SCRIPT_URL}?t=${encodeURIComponent(token)}`)
    .then(r => r.json())
    .then(resp => {
      if (!resp || resp.ok === false) {
        if (debugLine) debugLine.textContent = `GET: ${resp?.error || "No se pudo cargar invitado"}`;
        return;
      }

      const invitado = resp.data;

      if (invitado?.nombre) {
        const nameEl = document.getElementById("name");
        if (nameEl) nameEl.value = invitado.nombre;
      }

      boletosMax = toInt_(invitado?.boletos);
      ninosMax = toInt_(invitado?.ninos);

      // ✅ Si ya respondido (1) bloquea todo
      const responded = String(invitado?.respondido ?? "0").trim();
      if (responded === "1") {
        if (debugLine) debugLine.textContent = "Este enlace ya fue usado.";
        ["name","assist","guests","food"].forEach(idf => {
          const el = document.getElementById(idf);
          if (el) el.disabled = true;
        });
        if (btnSubmit) btnSubmit.disabled = true;
        // aún deja WhatsApp si existe
        return;
      }

      rebuildAdultsOptions_();
      if (ninosMax >= 1) buildKidsUI_();
      syncAssistUI_();

      if (debugLine) debugLine.textContent = `OK boletos=${boletosMax}, niñosMax=${ninosMax}`;
    })
    .catch(err => {
      if (debugLine) debugLine.textContent = `⚠️ Error GET: ${String(err)}`;
    });

  // WhatsApp felicitaciones (no se toca)
  if (btnWhats) {
    btnWhats.addEventListener("click", () => {
      const name = (document.getElementById("name")?.value || "").trim();
      const custom = (congratsMessage?.value || "").trim();
      const msg = custom || "¡Muchas felicidades, Cristina y Sergio! 🫶";

      const textMsg =
`${msg}

De: ${name || "Invitado"}`;

      const url = `https://wa.me/${WHATSAPP_PHONE}?text=${encodeURIComponent(textMsg)}`;
      window.open(url, "_blank");
    });
  }

  // Submit
  rsvpForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const name = document.getElementById("name").value.trim();
    const assist = assistEl ? assistEl.value : "";
    const adultsRaw = guestsEl ? guestsEl.value : ""; // ADULTOS
    const food = (document.getElementById("food")?.value || "").trim();

    if (!name || !assist || (assist !== "Sí" && assist !== "No")) {
      alert("Completa nombre y confirmación (Sí / No).");
      return;
    }

    // No asiste
    if (assist === "No") {
      await send_(0, 0, "No");
      return;
    }

    // Sí asiste
    if (!adultsRaw) {
      alert("Selecciona cuántos ADULTOS asistirán.");
      return;
    }

    const adults = parseInt(adultsRaw, 10);
    if (!Number.isFinite(adults) || adults < 1) {
      alert("Adultos inválido.");
      return;
    }

    let solicitarNinos = "No";
    let kids = 0;

    if (ninosMax >= 1 && kidsRequest && kidsRequest.checked) {
      solicitarNinos = "Sí";
      kids = currentKidsSelected_(); // 1..ninosMax
      if (kids < 1) {
        alert("Selecciona el número de menores.");
        return;
      }
    }

    const total = adults + kids;

    if (total > boletosMax) {
      alert("El total (adultos + menores) excede los boletos asignados.");
      return;
    }

    await send_(total, kids, solicitarNinos);

    async function send_(totalAsistentes, menores, solicitar){
      try {
        if (btnSubmit) {
          btnSubmit.disabled = true;
          btnSubmit.textContent = "Enviando...";
        }

        const body = new URLSearchParams({
          t: token, // ✅ ahora mandamos token
          confirmacion: assist,
          asistentes: String(totalAsistentes), // TOTAL
          alergias: food || "N/A",
          solicitar_ninos: solicitar,
          asistentes_menores: String(menores)
        });

        const res = await fetch(SCRIPT_URL, { method: "POST", body });
        const text = await res.text();

        let saved = null;
        try { saved = JSON.parse(text); } catch(_) {}

        if (saved && saved.ok === false) {
          prettyAlert(`No se pudo guardar: ${saved.error || "Error"}`, "Aviso");
          if (btnSubmit) {
            btnSubmit.disabled = false;
            btnSubmit.textContent = "Enviar Confirmación";
          }
          return;
        }
      } catch (err) {
        alert("Error guardando en Google Sheets.");
        if (btnSubmit) {
          btnSubmit.disabled = false;
          btnSubmit.textContent = "Enviar Confirmación";
        }
        return;
      }

      try {
        ["name","assist","guests","food"].forEach(idf => {
          const el = document.getElementById(idf);
          if (el) el.disabled = true;
        });
        if (kidsRequest) kidsRequest.disabled = true;
        if (kidsCountSel) kidsCountSel.disabled = true;

        if (btnSubmit) {
          btnSubmit.textContent = "Confirmación enviada";
          btnSubmit.disabled = true;
        }

        if (afterSend) {
          afterSend.style.display = "block";
          afterSend.classList.add("reveal");
          requestAnimationFrame(() => afterSend.classList.add("is-visible"));
        }

        prettyAlert("¡Listo! Tu confirmación quedó registrada.", "Confirmación");
      } catch(_) {}
    }
  });
})();

/***********************
 * Mobile Zoom/Center Fix
 ***********************/
(function initZoomCenterFix(){
  function snapX(){
    if (window.scrollX !== 0) {
      window.scrollTo(0, window.scrollY);
    }
  }

  window.addEventListener("load", () => setTimeout(snapX, 0));

  const vv = window.visualViewport;

  if (vv) {
    let lastScale = vv.scale || 1;

    const onViewportChange = () => {
      const scale = vv.scale || 1;
      snapX();

      if (scale === 1 && lastScale !== 1) {
        setTimeout(snapX, 80);
        setTimeout(snapX, 200);
      }

      lastScale = scale;
    };

    vv.addEventListener("resize", onViewportChange, { passive: true });
    vv.addEventListener("scroll", onViewportChange, { passive: true });
  } else {
    window.addEventListener("resize", () => setTimeout(snapX, 0));
  }

  window.addEventListener("orientationchange", () => setTimeout(snapX, 250));
})();



  // Mostrar mensaje "ya respondida" SOLO si el link ya fue usado y el usuario recarga la página.
  (function () {
    const msg = document.getElementById('alreadyRespondedMsg');
    if (!msg) return;

    const maxMs = 3500;
    const stepMs = 120;
    let elapsed = 0;

    const timer = setInterval(() => {
      elapsed += stepMs;

      const btn = document.getElementById('btnSubmit');
      const assist = document.getElementById('assist');
      const guests = document.getElementById('guests');
      const name = document.getElementById('name');

      // Caso "ya respondido": el script deshabilita campos y botón, pero NO cambia el texto del botón.
      const looksResponded =
        btn && btn.disabled &&
        String(btn.textContent || '').trim().toLowerCase() === 'enviar confirmación' &&
        ((assist && assist.disabled) || (guests && guests.disabled) || (name && name.disabled));

      if (looksResponded) {
        msg.style.display = 'block';
        clearInterval(timer);
        return;
      }

      if (elapsed >= maxMs) clearInterval(timer);
    }, stepMs);
  })();











  (function initIntroEnvelope(){

  const intro = document.getElementById("introEnvelope");
  if(!intro) return;

  const STORAGE_KEY = "cs_intro_seen_v6";

  function isReloadNavigation(){
    try{
      const nav = performance.getEntriesByType("navigation");
      if(nav && nav.length && nav[0].type === "reload") return true;
    }catch(e){}

    try{
      if(performance.navigation && performance.navigation.type === 1) return true;
    }catch(e){}

    return false;
  }

  if(isReloadNavigation()){
    sessionStorage.removeItem(STORAGE_KEY);
  }

  if(sessionStorage.getItem(STORAGE_KEY) === "1"){
    intro.remove();
    return;
  }

  sessionStorage.setItem(STORAGE_KEY, "1");

  intro.classList.add("is-visible");
  intro.setAttribute("aria-hidden", "false");
  document.body.classList.add("intro-lock");

  let closed = false;

  function closeIntro(){
    if(closed) return;
    closed = true;

    intro.classList.add("is-hiding");
    intro.setAttribute("aria-hidden", "true");
    document.body.classList.remove("intro-lock");

    setTimeout(() => {
      if(intro && intro.parentNode){
        intro.remove();
      }
    }, 350);
  }

  intro.addEventListener("click", closeIntro);

  intro.addEventListener("keydown", (e) => {
    if(e.key === "Enter" || e.key === " " || e.key === "Escape"){
      e.preventDefault();
      closeIntro();
    }
  });

})();