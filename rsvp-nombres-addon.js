(function initRsvpNamesAddon(){
  const rsvpForm = document.getElementById("rsvpForm");
  const assistEl = document.getElementById("assist");
  const guestsEl = document.getElementById("guests");

  if (!rsvpForm || !assistEl || !guestsEl) return;

  const guestsField = guestsEl.closest(".field");
  if (!guestsField) return;

  let adultosDisponibles = [];
  let kidsRequest = null;
  let kidsCountSel = null;
  let kidsCountWrap = null;
  let kidsDetailsWrap = null;
  let adultSelectionSeq = 0;

  const style = document.createElement("style");
  style.textContent = `
    .adult-picker-wrap{
      display:none;
    }

    .adult-picker-wrap.is-visible{
      display:block;
    }

    .adult-picker{
      position:relative;
      width:100%;
    }

    .adult-picker__button{
      width:100%;
      min-height:48px;
      border:1px solid rgba(80,80,80,.18);
      background:transparent;
      border-radius:14px;
      padding:12px 44px 12px 14px;
      text-align:left;
      font-family:var(--sans);
      font-size:10px;
      font-weight:400;
      line-height:1.4;
      color:#666;
      cursor:pointer;
      position:relative;
      white-space:nowrap;
      overflow:hidden;
      text-overflow:ellipsis;
    }

    .adult-picker__button::after{
      content:"▾";
      position:absolute;
      right:14px;
      top:50%;
      transform:translateY(-50%);
      font-size:14px;
      opacity:.75;
    }

    .adult-picker.is-open .adult-picker__button::after{
      content:"▴";
    }

    .adult-picker__menu{
      display:none;
      position:absolute;
      left:0;
      right:0;
      top:calc(100% + 8px);
      background:#f7f2ea;
      border:1px solid rgba(80,80,80,.15);
      border-radius:16px;
      box-shadow:0 12px 28px rgba(0,0,0,.08);
      padding:8px;
      z-index:40;
      max-height:260px;
      overflow:auto;
    }

    .adult-picker.is-open .adult-picker__menu{
      display:block;
    }

    .adult-picker__item{
      display:flex;
      align-items:center;
      gap:10px;
      padding:10px 12px;
      border-radius:12px;
      cursor:pointer;
      user-select:none;
    }

    .adult-picker__item:hover{
      background:rgba(0,0,0,.04);
    }

    .adult-picker__check{
      width:18px;
      height:18px;
      min-width:18px;
      border:1px solid rgba(80,80,80,.25);
      border-radius:5px;
      display:inline-flex;
      align-items:center;
      justify-content:center;
      font-size:12px;
      line-height:1;
      background:#fff;
    }

    .adult-picker__item.is-selected .adult-picker__check::before{
      content:"✓";
    }

    .adult-picker__label{
      flex:1;
      line-height:1.35;
    }

    .adult-picker__help{
      display:block;
      margin-top:6px;
      font-size:11px;
      color:#7a746b;
      line-height:1.5;
    }

    .kids-details{
      display:none;
      margin-top:12px;
    }

    .kids-details.is-visible{
      display:block;
    }

    .kids-details__row{
      display:grid;
      grid-template-columns:minmax(0,1fr) 130px;
      gap:12px;
      margin-bottom:12px;
    }

    .kids-details__row .field{
      margin:0;
    }

    .kids-details__title{
      margin:0 0 10px;
      font-size:12px;
      color:#7a746b;
      line-height:1.5;
      font-family:var(--sans);
    }

    @media (max-width: 640px){
      .kids-details__row{
        grid-template-columns:1fr;
        gap:10px;
      }
    }
  `;
  document.head.appendChild(style);

  guestsField.style.display = "none";

  const adultsWrap = document.createElement("div");
  adultsWrap.className = "field field--full adult-picker-wrap";
  adultsWrap.id = "adultPickerWrap";
  adultsWrap.innerHTML = `
    <span>¿Quiénes asistirán?</span>
    <div class="adult-picker" id="adultPicker">
      <button type="button" class="adult-picker__button" id="adultPickerButton">
        Selecciona quién asistirá. 
      </button>
      <div class="adult-picker__menu" id="adultPickerMenu"></div>
    </div>
    <small class="adult-picker__help" id="adultPickerHelp">
      Selecciona a tus invitados :)
    </small>
  `;

  guestsField.insertAdjacentElement("afterend", adultsWrap);

  const adultPickerWrap = document.getElementById("adultPickerWrap");
  const adultPicker = document.getElementById("adultPicker");
  const adultPickerButton = document.getElementById("adultPickerButton");
  const adultPickerMenu = document.getElementById("adultPickerMenu");
  const adultPickerHelp = document.getElementById("adultPickerHelp");

    function getSelectedAdultItems_(){
    return [...adultPickerMenu.querySelectorAll(".adult-picker__item.is-selected")]
      .sort((a, b) => Number(a.dataset.selectedOrder || "0") - Number(b.dataset.selectedOrder || "0"));
  }

  function getSelectedAdultNames_(){
    return getSelectedAdultItems_()
      .map(el => String(el.dataset.name || "").trim())
      .filter(Boolean);
  }

  function getMaxAdultSelections_(){
    return [...guestsEl.options]
      .map(o => parseInt(String(o.value || "").trim(), 10))
      .filter(n => Number.isFinite(n) && n >= 0)
      .reduce((max, n) => Math.max(max, n), 0);
  }

  function showAdultLimitMessage_(max){
    const msg = max === 1
      ? "Solo puedes seleccionar 1 adulto para esta invitación."
      : `Solo puedes seleccionar hasta ${max} adultos para esta invitación.`;

    if (typeof window.prettyAlert === "function") {
      window.prettyAlert(msg, "Aviso");
    } else {
      alert(msg);
    }
  }

  function enforceAdultSelectionLimit_(notify = false){
    const limit = getMaxAdultSelections_();
    const selectedItems = getSelectedAdultItems_();

    if (limit <= 0) {
      selectedItems.forEach(el => {
        el.classList.remove("is-selected");
        delete el.dataset.selectedOrder;
      });
      syncGuestsFromAdults_();
      return;
    }

    if (selectedItems.length > limit) {
      selectedItems.slice(limit).forEach(el => {
        el.classList.remove("is-selected");
        delete el.dataset.selectedOrder;
      });

      syncGuestsFromAdults_();

      if (notify) {
        showAdultLimitMessage_(limit);
      }
      return;
    }

    syncGuestsFromAdults_();
  }

  function updateAdultButtonText_(){
  const count = getSelectedAdultNames_().length;
  const max = getMaxAdultSelections_();

  if (adultPickerHelp) {
    adultPickerHelp.textContent = `Tienes ${max} boletos.`;
  }

  if (count < 1) {
    adultPickerButton.textContent = "Selecciona quienes asistirán.";
  } else if (count === 1) {
    adultPickerButton.textContent = "1 seleccionado";
  } else {
    adultPickerButton.textContent = `${count} invitados seleccionados`;
  }
}

    function syncGuestsFromAdults_(){
    const count = getSelectedAdultNames_().length;
    const optionExists = [...guestsEl.options].some(o => o.value === String(count));
    const max = getMaxAdultSelections_();

    if (count > 0 && optionExists) {
      guestsEl.value = String(count);
    } else {
      guestsEl.value = "";
    }

    

    updateAdultButtonText_();
  }

    function renderAdults_(){
    adultPickerMenu.innerHTML = "";

    adultosDisponibles.forEach(name => {
      const item = document.createElement("div");
      item.className = "adult-picker__item";
      item.dataset.name = name;
      item.innerHTML = `
        <span class="adult-picker__check" aria-hidden="true"></span>
        <span class="adult-picker__label"></span>
      `;
      item.querySelector(".adult-picker__label").textContent = name;

      item.addEventListener("click", () => {
        const isSelected = item.classList.contains("is-selected");

        if (isSelected) {
          item.classList.remove("is-selected");
          delete item.dataset.selectedOrder;
          syncGuestsFromAdults_();
          return;
        }

        const limit = getMaxAdultSelections_();
        const selectedCount = getSelectedAdultNames_().length;

        if (limit > 0 && selectedCount >= limit) {
          showAdultLimitMessage_(limit);
          return;
        }

        item.classList.add("is-selected");
        item.dataset.selectedOrder = String(++adultSelectionSeq);
        syncGuestsFromAdults_();

        if (limit > 0 && getSelectedAdultNames_().length >= limit) {
          adultPicker.classList.remove("is-open");
        }
      });

      adultPickerMenu.appendChild(item);
    });

    enforceAdultSelectionLimit_(false);
  }

  function findKidsElements_(){
    kidsRequest =
      document.getElementById("kidsRequest") ||
      document.querySelector("#kidsBlock #kidsRequest");

    kidsCountSel =
      document.getElementById("kidsCount") ||
      document.querySelector("#kidsBlock #kidsCount");

    kidsCountWrap =
      document.getElementById("kidsCountWrap") ||
      document.querySelector("#kidsBlock #kidsCountWrap");
  }

  function ensureKidsDetailsWrap_(){
    findKidsElements_();
    if (!kidsCountWrap) return;

    if (!kidsDetailsWrap) {
      kidsDetailsWrap = document.createElement("div");
      kidsDetailsWrap.className = "kids-details";
      kidsDetailsWrap.id = "kidsDetailsWrap";
      kidsDetailsWrap.innerHTML = `
        <p class="kids-details__title">Escribe el nombre y selecciona la edad de cada niño por favor.</p>
        <div id="kidsDetailsRows"></div>
      `;
      kidsCountWrap.insertAdjacentElement("afterend", kidsDetailsWrap);
    }
  }

  function buildAgeOptions_(selectedValue){
    let html = `<option value="" disabled ${selectedValue === "" ? "selected" : ""}>Edad</option>`;
    for (let i = 0; i <= 15; i++) {
      html += `<option value="${i}" ${String(selectedValue) === String(i) ? "selected" : ""}>${i}</option>`;
    }
    return html;
  }

  function escapeAttr_(str){
    return String(str ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll('"', "&quot;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;");
  }

  function renderKidsDetails_(){
    ensureKidsDetailsWrap_();
    if (!kidsDetailsWrap) return;

    const rowsWrap = document.getElementById("kidsDetailsRows");
    if (!rowsWrap) return;

    const show = !!(
      kidsRequest &&
      kidsRequest.checked &&
      kidsCountSel &&
      kidsCountSel.value !== "" &&
      Number(kidsCountSel.value) > 0
    );
    kidsDetailsWrap.classList.toggle("is-visible", show);

    if (!show) {
      rowsWrap.innerHTML = "";
      return;
    }

    const count = Number(kidsCountSel.value);
    const oldNames = [...rowsWrap.querySelectorAll(".kid-name-input")].map(i => i.value || "");
    const oldAges = [...rowsWrap.querySelectorAll(".kid-age-select")].map(i => i.value || "");

    rowsWrap.innerHTML = "";

    for (let i = 0; i < count; i++) {
      const row = document.createElement("div");
      row.className = "kids-details__row";
      row.innerHTML = `
        <label class="field">
          <span>Nombre de la niña o niño número ${i + 1}</span>
          <input
            type="text"
            class="kid-name-input"
            data-index="${i}"
            placeholder="Escribe su nombre"
            value="${escapeAttr_(oldNames[i] || "")}"
          />
        </label>
        <label class="field">
          <span>Edad</span>
          <select class="kid-age-select" data-index="${i}">
            ${buildAgeOptions_(oldAges[i] || "")}
          </select>
        </label>
      `;
      rowsWrap.appendChild(row);
    }
  }

  function getKidNames_(){
    return [...document.querySelectorAll(".kid-name-input")]
      .map(el => String(el.value || "").trim())
      .filter(Boolean);
  }

  function getKidAges_(){
    return [...document.querySelectorAll(".kid-age-select")]
      .map(el => String(el.value || "").trim())
      .filter(Boolean);
  }

  function syncAdultsVisibility_(){
    const assist = assistEl.value;
    const locked = !!guestsEl.disabled && !!assistEl.disabled;

    if (locked) {
      adultPickerWrap.classList.remove("is-visible");
      return;
    }

    if (assist === "Sí") {
      adultPickerWrap.classList.add("is-visible");
      return;
    }

    adultPickerWrap.classList.remove("is-visible");
    adultPicker.classList.remove("is-open");

    [...adultPickerMenu.querySelectorAll(".adult-picker__item.is-selected")].forEach(el => {
      el.classList.remove("is-selected");
    });

    syncGuestsFromAdults_();
  }

  adultPickerButton.addEventListener("click", () => {
    if (assistEl.value !== "Sí") return;
    adultPicker.classList.toggle("is-open");
  });

  document.addEventListener("click", (e) => {
    if (!adultPicker.contains(e.target)) {
      adultPicker.classList.remove("is-open");
    }
  });

    assistEl.addEventListener("change", () => {
    setTimeout(() => {
      syncAdultsVisibility_();
      enforceAdultSelectionLimit_(false);
      renderKidsDetails_();
    }, 0);
  });

  rsvpForm.addEventListener("change", () => {
    setTimeout(() => {
      findKidsElements_();
      enforceAdultSelectionLimit_(false);
      renderKidsDetails_();
    }, 0);
  });

  rsvpForm.addEventListener("submit", function(e){
    if (assistEl.value !== "Sí") return;

    const adults = getSelectedAdultNames_();
    if (adults.length < 1) {
      e.preventDefault();
      e.stopImmediatePropagation();
      alert("Selecciona al menos una persona que asistirá.");
      adultPickerButton.focus();
      return;
    }

        const maxAdults = getMaxAdultSelections_();
    if (maxAdults > 0 && adults.length > maxAdults) {
      e.preventDefault();
      e.stopImmediatePropagation();
      enforceAdultSelectionLimit_(false);
      showAdultLimitMessage_(maxAdults);
      adultPickerButton.focus();
      return;
    }

    findKidsElements_();

    if (kidsRequest && kidsRequest.checked) {
      const expectedKids = Number(kidsCountSel?.value || "0");
      const kidNameInputs = [...document.querySelectorAll(".kid-name-input")];
      const kidAgeSelects = [...document.querySelectorAll(".kid-age-select")];

      if (expectedKids > 0) {
        if (kidNameInputs.length !== expectedKids || kidAgeSelects.length !== expectedKids) {
          e.preventDefault();
          e.stopImmediatePropagation();
          alert("No se pudieron preparar correctamente los campos de los niños.");
          return;
        }

        for (let i = 0; i < expectedKids; i++) {
          const kidName = String(kidNameInputs[i].value || "").trim();
          const kidAge = String(kidAgeSelects[i].value || "").trim();

          if (!kidName) {
            e.preventDefault();
            e.stopImmediatePropagation();
            alert(`Escribe el nombre de la niña o niño número ${i + 1}.`);
            kidNameInputs[i].focus();
            return;
          }

          if (kidAge === "") {
            e.preventDefault();
            e.stopImmediatePropagation();
            alert(`Selecciona la edad de la niña o niño número ${i + 1}.`);
            kidAgeSelects[i].focus();
            return;
          }
        }
      }
    }
  }, true);

  const originalFetch = window.fetch;
  window.fetch = async function(input, init){
    try {
      const isPost =
        init &&
        init.method &&
        String(init.method).toUpperCase() === "POST" &&
        init.body instanceof URLSearchParams;

      if (isPost) {
        const body = init.body;

        if (body.has("confirmacion")) {
          const selectedAdults = getSelectedAdultNames_().join(" | ");
          const kidNames = getKidNames_().join(" | ");
          const kidAges = getKidAges_().join(" | ");

          body.set("adultos_nombres", body.get("confirmacion") === "Sí" ? selectedAdults : "");
          body.set("ninos_nombres", body.get("confirmacion") === "Sí" ? kidNames : "");
          body.set("ninos_edades", body.get("confirmacion") === "Sí" ? kidAges : "");
        }
      }
    } catch (_) {}

    const response = await originalFetch.apply(this, arguments);

    try {
      const isGet =
        (!init || !init.method || String(init.method).toUpperCase() === "GET") &&
        typeof input === "string" &&
        input.includes("?t=");

      if (isGet) {
        const clone = response.clone();
        const data = await clone.json();

        if (data && data.ok && data.data) {
          adultosDisponibles = Array.isArray(data.data.adultosDisponibles)
            ? data.data.adultosDisponibles
            : [];

          renderAdults_();
          syncAdultsVisibility_();

          setTimeout(() => {
            findKidsElements_();
            renderKidsDetails_();
          }, 250);
        }
      }
    } catch (_) {}

    return response;
  };

  setTimeout(() => {
    syncAdultsVisibility_();
    findKidsElements_();
    renderKidsDetails_();
  }, 500);
})();