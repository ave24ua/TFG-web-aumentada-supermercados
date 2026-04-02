import { Config, State } from "./core.js";
import { Utils } from "./utils.js";
import { Icons } from "./icons.js";

const UI = {
  init() {
    if (State.uiInjected) return;
    State.uiInjected = true;

    UI.injectMenu();
    UI.injectStyles();
    UI.ensureTooltip();
    UI.ensureMenuHelpTooltip();
  },

  setMenuButtonState(btn, open) {
    btn.innerHTML = `
      <span class="tm-md-btn-main">
        <span class="tm-md-btn-icon">${Icons.menu}</span>
        <span class="tm-md-btn-text">Info nutricional</span>
      </span>
      <span class="tm-md-btn-chevron">${open ? Icons.chevronUp : Icons.chevronDown}</span>
    `;
  },

  createHelpIcon(text) {
    const help = document.createElement("span");
    help.className = "tm-md-help";
    help.innerHTML = Icons.help;
    help.tabIndex = 0;

    const show = (ev) => UI.showMenuHelpTooltip(ev, text);
    const hide = () => UI.hideMenuHelpTooltip();

    help.addEventListener("mouseenter", show);
    help.addEventListener("mousemove", show);
    help.addEventListener("mouseleave", hide);
    help.addEventListener("focus", (ev) => show(ev));
    help.addEventListener("blur", hide);

    return help;
  },

  appendLabelWithHelp(container, label, helpText) {
    if (helpText) {
      container.appendChild(UI.createHelpIcon(helpText));
    }

    const text = document.createElement("span");
    text.className = "tm-md-label";
    text.textContent = label;
    container.appendChild(text);
  },

  ensureMenuHelpTooltip() {
    if (document.getElementById("tm-md-menu-help")) return;
    const t = document.createElement("div");
    t.id = "tm-md-menu-help";
    document.body.appendChild(t);
  },

  showMenuHelpTooltip(ev, text) {
    const t = document.getElementById("tm-md-menu-help");
    if (!t) return;

    t.textContent = text;
    t.style.display = "block";

    const clientX = ev?.clientX ?? 0;
    const clientY = ev?.clientY ?? 0;
    const maxX = Math.max(12, window.innerWidth - 280);
    const maxY = Math.max(12, window.innerHeight - 120);

    t.style.left = Math.min(clientX + 12, maxX) + "px";
    t.style.top = Math.min(clientY + 12, maxY) + "px";
  },

  hideMenuHelpTooltip() {
    const t = document.getElementById("tm-md-menu-help");
    if (t) t.style.display = "none";
  },

  injectMenu() {
    if (document.getElementById("tm-md-wrapper")) return;

    const wrapper = document.createElement("div");
    wrapper.id = "tm-md-wrapper";

    const btn = document.createElement("div");
    btn.id = "tm-md-btn";
    UI.setMenuButtonState(btn, false);

    const menu = document.createElement("div");
    menu.id = "tm-md-menu";
    menu.dataset.open = "false";

    const infoTitle = document.createElement("div");
    infoTitle.className = "tm-md-section-title";
    infoTitle.textContent = "Campos del tooltip";
    menu.appendChild(infoTitle);

    const infoOptions = Utils.getSelectedInfoOptions();

    for (const opt of Config.INFO_OPTIONS) {
      const row = document.createElement("label");
      row.className = "tm-md-row";
      row.setAttribute("for", `tm-md-opt-${opt.key}`);

      const left = document.createElement("div");
      left.className = "tm-md-left";
      UI.appendLabelWithHelp(left, opt.label, Config.INFO_HELP[opt.key]);

      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.id = `tm-md-opt-${opt.key}`;
      checkbox.className = "tm-md-check";
      checkbox.checked = !!infoOptions[opt.key];

      checkbox.addEventListener("change", () => {
        const current = Utils.getSelectedInfoOptions();
        current[opt.key] = checkbox.checked;
        Utils.setSelectedInfoOptions(current);
      });

      row.appendChild(left);
      row.appendChild(checkbox);
      menu.appendChild(row);
    }

    const separator = document.createElement("div");
    separator.className = "tm-md-separator";
    menu.appendChild(separator);

    const filterTitle = document.createElement("div");
    filterTitle.className = "tm-md-section-title";
    filterTitle.textContent = "Filtro visual por Nutri-Score";
    menu.appendChild(filterTitle);

    const filterOptions = Utils.getFilterOptions();

    const thresholdRow = document.createElement("div");
    thresholdRow.className = "tm-md-control";

    const thresholdLabel = document.createElement("label");
    thresholdLabel.className = "tm-md-control-label";
    thresholdLabel.textContent = "Mostrar productos";
    thresholdLabel.appendChild(UI.createHelpIcon(Config.FILTER_HELP.threshold));

    const thresholdSelect = document.createElement("select");
    thresholdSelect.className = "tm-md-select";

    for (const item of Config.FILTER_THRESHOLDS) {
      const option = document.createElement("option");
      option.value = item.value;
      option.textContent = item.label;
      option.selected = filterOptions.threshold === item.value;
      thresholdSelect.appendChild(option);
    }

    thresholdSelect.addEventListener("change", () => {
      const current = Utils.getFilterOptions();
      current.threshold = thresholdSelect.value;
      Utils.setFilterOptions(current);
      Filters.reapplyAll();
    });

    thresholdRow.appendChild(thresholdLabel);
    thresholdRow.appendChild(thresholdSelect);
    menu.appendChild(thresholdRow);

    const modeRow = document.createElement("div");
    modeRow.className = "tm-md-control";

    const modeLabel = document.createElement("label");
    modeLabel.className = "tm-md-control-label";
    modeLabel.textContent = "Acción";
    modeLabel.appendChild(UI.createHelpIcon(Config.FILTER_HELP.mode));

    const modeSelect = document.createElement("select");
    modeSelect.className = "tm-md-select";

    for (const item of Config.FILTER_MODES) {
      const option = document.createElement("option");
      option.value = item.value;
      option.textContent = item.label;
      option.selected = filterOptions.mode === item.value;
      modeSelect.appendChild(option);
    }

    modeSelect.addEventListener("change", () => {
      const current = Utils.getFilterOptions();
      current.mode = modeSelect.value;
      Utils.setFilterOptions(current);
      Filters.reapplyAll();
    });

    modeRow.appendChild(modeLabel);
    modeRow.appendChild(modeSelect);
    menu.appendChild(modeRow);

    const hideNoNutriScoreRow = document.createElement("label");
    hideNoNutriScoreRow.className = "tm-md-row";
    hideNoNutriScoreRow.setAttribute("for", "tm-md-hide-no-nutriscore");

    const hideNoNutriScoreLeft = document.createElement("div");
    hideNoNutriScoreLeft.className = "tm-md-left";

    const hideNoNutriScoreText = document.createElement("span");
    hideNoNutriScoreText.className = "tm-md-label";
    hideNoNutriScoreText.textContent = "ocultar alimentos sin Nutri-Score";

    hideNoNutriScoreLeft.appendChild(UI.createHelpIcon(Config.FILTER_HELP.hideNoNutriScore));
    hideNoNutriScoreLeft.appendChild(hideNoNutriScoreText);

    const hideNoNutriScoreCheckbox = document.createElement("input");
    hideNoNutriScoreCheckbox.type = "checkbox";
    hideNoNutriScoreCheckbox.id = "tm-md-hide-no-nutriscore";
    hideNoNutriScoreCheckbox.className = "tm-md-check";
    hideNoNutriScoreCheckbox.checked = !!filterOptions.hideNoNutriScore;

    hideNoNutriScoreCheckbox.addEventListener("change", () => {
      const current = Utils.getFilterOptions();
      current.hideNoNutriScore = hideNoNutriScoreCheckbox.checked;
      Utils.setFilterOptions(current);
      Filters.reapplyAll();
    });

    hideNoNutriScoreRow.appendChild(hideNoNutriScoreLeft);
    hideNoNutriScoreRow.appendChild(hideNoNutriScoreCheckbox);
    menu.appendChild(hideNoNutriScoreRow);

    const hideNoInfoRow = document.createElement("label");
    hideNoInfoRow.className = "tm-md-row";
    hideNoInfoRow.setAttribute("for", "tm-md-hide-no-info");

    const hideNoInfoLeft = document.createElement("div");
    hideNoInfoLeft.className = "tm-md-left";

    const hideNoInfoText = document.createElement("span");
    hideNoInfoText.className = "tm-md-label";
    hideNoInfoText.textContent = "ocultar alimentos sin información";

    hideNoInfoLeft.appendChild(UI.createHelpIcon(Config.FILTER_HELP.hideNoInfo));
    hideNoInfoLeft.appendChild(hideNoInfoText);

    const hideNoInfoCheckbox = document.createElement("input");
    hideNoInfoCheckbox.type = "checkbox";
    hideNoInfoCheckbox.id = "tm-md-hide-no-info";
    hideNoInfoCheckbox.className = "tm-md-check";
    hideNoInfoCheckbox.checked = !!filterOptions.hideNoInfo;

    hideNoInfoCheckbox.addEventListener("change", () => {
      const current = Utils.getFilterOptions();
      current.hideNoInfo = hideNoInfoCheckbox.checked;
      Utils.setFilterOptions(current);
      Filters.reapplyAll();
    });

    hideNoInfoRow.appendChild(hideNoInfoLeft);
    hideNoInfoRow.appendChild(hideNoInfoCheckbox);
    menu.appendChild(hideNoInfoRow);

    const hideGlutenRow = document.createElement("label");
    hideGlutenRow.className = "tm-md-row";
    hideGlutenRow.setAttribute("for", "tm-md-hide-gluten");

    const hideGlutenLeft = document.createElement("div");
    hideGlutenLeft.className = "tm-md-left";

    const hideGlutenText = document.createElement("span");
    hideGlutenText.className = "tm-md-label";
    hideGlutenText.textContent = "ocultar alimentos con gluten";

    hideGlutenLeft.appendChild(UI.createHelpIcon(Config.FILTER_HELP.hideGluten));
    hideGlutenLeft.appendChild(hideGlutenText);

    const hideGlutenCheckbox = document.createElement("input");
    hideGlutenCheckbox.type = "checkbox";
    hideGlutenCheckbox.id = "tm-md-hide-gluten";
    hideGlutenCheckbox.className = "tm-md-check";
    hideGlutenCheckbox.checked = !!filterOptions.hideGluten;

    hideGlutenCheckbox.addEventListener("change", () => {
      const current = Utils.getFilterOptions();
      current.hideGluten = hideGlutenCheckbox.checked;
      Utils.setFilterOptions(current);
      Filters.reapplyAll();
    });

    hideGlutenRow.appendChild(hideGlutenLeft);
    hideGlutenRow.appendChild(hideGlutenCheckbox);
    menu.appendChild(hideGlutenRow);

    const note = document.createElement("div");
    note.className = "tm-md-note";
    note.textContent = "Los productos se cargan y actualizan automáticamente, sin pasar el ratón.";
    menu.appendChild(note);

    wrapper.appendChild(btn);
    wrapper.appendChild(menu);
    document.body.appendChild(wrapper);

    btn.addEventListener("click", (ev) => {
      ev.preventDefault();
      ev.stopPropagation();

      const nextOpen = menu.dataset.open !== "true";
      menu.dataset.open = nextOpen ? "true" : "false";
      menu.style.display = nextOpen ? "block" : "none";
      UI.setMenuButtonState(btn, nextOpen);
    });

    document.addEventListener("click", (e) => {
      if (!wrapper.contains(e.target)) {
        menu.style.display = "none";
        menu.dataset.open = "false";
        UI.setMenuButtonState(btn, false);
        UI.hideMenuHelpTooltip();
      }
    });
  },

  injectStyles() {
    if (document.getElementById("tm-md-style")) return;

    const style = document.createElement("style");
    style.id = "tm-md-style";
    style.textContent = `
      #tm-md-wrapper{
        position: fixed; top: 16px; right: 16px; z-index: 999999;
        font-family: system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif;
      }
      #tm-md-btn{
        cursor: pointer; border: 1px solid rgba(0,0,0,0.10);
        background: linear-gradient(135deg, #fff8ec 0%, #ffffff 52%, #f4fbf6 100%);
        padding: 10px 12px; border-radius: 14px; box-shadow: 0 10px 24px rgba(0,0,0,0.12);
        font-weight: 700; user-select: none;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        min-width: 188px;
      }
      .tm-md-btn-main{
        display: inline-flex;
        align-items: center;
        gap: 10px;
        min-width: 0;
      }
      .tm-md-btn-icon{
        width: 34px;
        height: 34px;
        min-width: 34px;
        border-radius: 11px;
        background: linear-gradient(135deg, #ffe2b2 0%, #fff1d8 100%);
        color: #8a4b00;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        box-shadow: inset 0 0 0 1px rgba(138,75,0,0.10);
      }
      .tm-md-btn-icon svg{
        width: 20px;
        height: 20px;
        fill: currentColor;
      }
      .tm-md-btn-text{
        font-size: 14px;
        color: #1f2937;
        line-height: 1.15;
      }
      .tm-md-btn-chevron{
        width: 18px;
        height: 18px;
        color: rgba(17,24,39,0.75);
        display: inline-flex;
        align-items: center;
        justify-content: center;
      }
      .tm-md-btn-chevron svg{
        width: 18px;
        height: 18px;
        fill: currentColor;
      }
      #tm-md-menu{
        margin-top: 10px; width: 290px; background: white; border: 1px solid rgba(0,0,0,0.12);
        border-radius: 12px; box-shadow: 0 10px 28px rgba(0,0,0,0.16);
        padding: 10px; display: none;
      }
      .tm-md-section-title{
        font-size: 13px;
        font-weight: 700;
        margin: 4px 2px 8px 2px;
        opacity: 0.85;
      }
      .tm-md-separator{
        height: 1px;
        background: rgba(0,0,0,0.08);
        margin: 10px 0;
      }
      .tm-md-row{
        display: flex; align-items: center; justify-content: space-between;
        padding: 8px 8px; border-radius: 10px; cursor: pointer;
        gap: 10px;
      }
      .tm-md-row:hover{ background: rgba(0,0,0,0.05); }
      .tm-md-left{ display:flex; align-items:center; gap:10px; }
      .tm-md-label{ font-size: 14px; }
      .tm-md-check{ cursor: pointer; }
      .tm-md-help{
        width: 18px;
        height: 18px;
        min-width: 18px;
        border-radius: 999px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        color: rgba(17,24,39,0.58);
        background: rgba(17,24,39,0.06);
      }
      .tm-md-help svg{
        width: 12px;
        height: 12px;
        fill: currentColor;
      }
      .tm-md-help:hover,
      .tm-md-help:focus{
        color: #0f5132;
        background: rgba(15,81,50,0.10);
        outline: none;
      }
      .tm-md-control{
        display: flex;
        flex-direction: column;
        gap: 6px;
        padding: 8px 8px;
      }
      .tm-md-control-label{
        font-size: 13px;
        opacity: 0.9;
        display: inline-flex;
        align-items: center;
        gap: 8px;
      }
      .tm-md-select{
        height: 34px;
        border: 1px solid rgba(0,0,0,0.15);
        border-radius: 8px;
        padding: 0 10px;
        background: white;
      }
      .tm-md-note{
        font-size: 12px;
        opacity: 0.7;
        padding: 6px 8px 2px 8px;
        line-height: 1.3;
      }
      #tm-md-menu-help{
        position: fixed;
        z-index: 1000001;
        display: none;
        max-width: 240px;
        padding: 8px 10px;
        border-radius: 10px;
        background: rgba(17,24,39,0.96);
        color: white;
        font-size: 12px;
        line-height: 1.35;
        box-shadow: 0 12px 28px rgba(0,0,0,0.25);
        pointer-events: none;
      }

      .tm-md-badge{
        position: absolute; top: 10px; left: 10px;
        width: 32px; height: 32px; border-radius: 999px;
        border: 2px solid white;
        box-shadow: 0 4px 14px rgba(0,0,0,0.18);
        z-index: 9999;
        cursor: help;
        background: rgba(255,255,255,0.96);
        display: flex;
        align-items: center;
        justify-content: center;
        backdrop-filter: blur(2px);
      }
      .tm-md-badge svg{
        width: 18px;
        height: 18px;
        display: block;
        opacity: 0.9;
        fill: rgba(0,0,0,0.82);
      }
      .tm-md-badge-suppressed{
        display: none !important;
      }

      .tm-md-muted{
        filter: grayscale(1);
        opacity: 0.40 !important;
        transition: opacity 0.18s ease;
      }

      .tm-md-pass{
        position: relative;
        background: rgba(20, 138, 68, 0.16);
        box-shadow: inset 0 0 0 3px rgba(20, 138, 68, 0.82), 0 0 0 1px rgba(20, 138, 68, 0.10);
      }

      .tm-md-fail{
        position: relative;
        background: rgba(214, 45, 45, 0.16);
        box-shadow: inset 0 0 0 3px rgba(214, 45, 45, 0.84), 0 0 0 1px rgba(214, 45, 45, 0.10);
      }

      .tm-md-unknown{
        position: relative;
        filter: saturate(1.08);
        background: rgba(255, 205, 36, 0.18);
        box-shadow: inset 0 0 0 3px rgba(255, 189, 8, 0.86), 0 0 0 1px rgba(255, 189, 8, 0.08);
      }

      .tm-md-no-off{
        position: relative;
        filter: saturate(1.06);
        background: rgba(255, 128, 24, 0.18);
        box-shadow: inset 0 0 0 3px rgba(245, 112, 0, 0.86), 0 0 0 1px rgba(245, 112, 0, 0.08);
      }

      .tm-md-loading-card{
        position: relative;
        filter: grayscale(0.95);
        opacity: 0.72;
        background: rgba(107, 114, 128, 0.12);
        box-shadow: inset 0 0 0 2px rgba(107, 114, 128, 0.46);
      }

      .tm-md-loading-overlay{
        position: absolute;
        inset: 0;
        z-index: 10002;
        display: flex;
        align-items: center;
        justify-content: center;
        background: rgba(255,255,255,0.14);
        backdrop-filter: blur(1px);
        pointer-events: none;
      }

      .tm-md-loading-overlay .tm-md-spinner-svg{
        width: 34px;
        height: 34px;
      }

      .tm-md-loading-overlay .tm-md-spinner-svg circle{
        stroke: rgba(0,0,0,0.72);
      }

      .tm-md-hidden{
        display: none !important;
      }

      .tm-md-unknown-label{
        position: absolute;
        left: 8px;
        right: 8px;
        bottom: 8px;
        z-index: 10001;
        background: rgba(255, 214, 64, 0.96);
        color: #2f2400;
        border-radius: 10px;
        padding: 6px 8px;
        font-size: 11px;
        font-weight: 700;
        text-align: center;
        line-height: 1.2;
        box-shadow: 0 6px 16px rgba(0,0,0,0.15);
      }

      .tm-md-unknown-label.warning{
        background: rgba(255, 214, 64, 0.96);
        color: #2f2400;
      }

      .tm-md-unknown-label.missing{
        background: rgba(255, 151, 58, 0.96);
        color: #3e1d00;
      }

      #tm-md-tooltip{
        position: fixed; z-index: 1000000; display: none;
        min-width: 260px;
        max-width: 360px;
        padding: 12px;
        border-radius: 16px;
        background: rgba(16,18,22,0.96);
        color: white;
        box-shadow: 0 14px 34px rgba(0,0,0,0.34);
        font-family: system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif;
        font-size: 13px; line-height: 1.25;
        pointer-events: none;
        backdrop-filter: blur(8px);
      }

      .tm-md-tip-title{
        opacity: 0.97;
        margin-bottom: 10px;
        font-size: 14px;
        font-weight: 700;
        line-height: 1.3;
      }

      .tm-md-tip-list{
        display: flex;
        flex-direction: column;
        gap: 8px;
      }
      .tm-md-tip-list.grid{
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        grid-auto-rows: minmax(0, auto);
        gap: 8px;
      }
      .tm-md-tip-list.grid .tm-md-tip-card{
        align-items: flex-start;
      }

      .tm-md-tip-card{
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 8px 10px;
        border-radius: 12px;
        background: rgba(255,255,255,0.06);
        min-width: 0;
        overflow: hidden;
      }

      .tm-md-tip-card-icon{
        width: 26px;
        height: 26px;
        min-width: 26px;
        border-radius: 999px;
        background: rgba(255,255,255,0.1);
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .tm-md-tip-card-icon svg{
        width: 15px;
        height: 15px;
        fill: white;
        opacity: 0.95;
      }

      .tm-md-tip-card-body{
        min-width: 0;
        width: 100%;
        flex: 1 1 auto;
        display: flex;
        flex-direction: column;
        gap: 2px;
        overflow: hidden;
      }

      .tm-md-tip-card-label{
        font-size: 11px;
        opacity: 0.72;
        text-transform: uppercase;
        letter-spacing: .04em;
      }

      .tm-md-tip-card-value{
        font-size: 13px;
        font-weight: 700;
        line-height: 1.2;
        width: 100%;
        min-width: 0;
        overflow-wrap: anywhere;
        word-break: break-word;
      }

      .tm-md-status{
        display: flex;
        flex-direction: column;
        align-items: flex-start;
        gap: 6px;
        width: 100%;
        min-width: 0;
      }

      .tm-md-status-pill{
        display: inline-flex;
        align-items: center;
        justify-content: center;
        min-height: 24px;
        padding: 0 10px;
        border-radius: 999px;
        font-size: 12px;
        font-weight: 800;
        letter-spacing: 0.01em;
        max-width: 100%;
        text-align: center;
        white-space: normal;
      }

      .tm-md-status-pill.safe{
        background: rgba(58, 185, 115, 0.18);
        color: #b6ffd1;
      }

      .tm-md-status-pill.warning{
        background: rgba(255, 196, 72, 0.18);
        color: #ffe2a2;
      }

      .tm-md-status-pill.danger{
        background: rgba(255, 106, 106, 0.18);
        color: #ffc0c0;
      }

      .tm-md-status-pill.unknown{
        background: rgba(255,255,255,0.10);
        color: rgba(255,255,255,0.88);
      }

      .tm-md-status-pill.missing{
        background: rgba(255, 151, 58, 0.18);
        color: #ffd2ae;
      }

      .tm-md-status-note{
        font-size: 11px;
        font-weight: 600;
        opacity: 0.74;
        width: 100%;
        min-width: 0;
        overflow-wrap: anywhere;
      }

      .tm-md-chip-list{
        display: flex;
        flex-wrap: wrap;
        gap: 6px;
        margin-top: 6px;
        width: 100%;
        min-width: 0;
      }

      .tm-md-chip{
        display: inline-flex;
        align-items: center;
        justify-content: center;
        min-height: 22px;
        padding: 0 8px;
        border-radius: 999px;
        font-size: 11px;
        font-weight: 700;
        letter-spacing: 0.01em;
        max-width: 100%;
        text-align: center;
        white-space: normal;
        overflow-wrap: anywhere;
      }

      .tm-md-chip.allergen{
        background: rgba(255, 106, 106, 0.18);
        color: #ffc0c0;
      }

      .tm-md-chip.trace{
        background: rgba(255, 196, 72, 0.18);
        color: #ffe2a2;
      }

      .tm-md-tip-footer{
        opacity: 0.72;
        margin-top: 10px;
        font-size: 12px;
      }

      .tm-md-tip-warn{
        opacity: 0.95;
        margin-top: 10px;
        font-size: 12px;
        color: #ffd28c;
      }

      .tm-md-empty{
        padding: 8px 10px;
        border-radius: 12px;
        background: rgba(255,255,255,0.06);
      }

      .tm-md-loading{
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 8px 10px;
        border-radius: 12px;
        background: rgba(255,255,255,0.06);
      }

      .tm-md-spinner{
        width: 22px;
        height: 22px;
        min-width: 22px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
      }

      .tm-md-spinner-svg{
        width: 22px;
        height: 22px;
        animation: tm-md-spin 0.9s linear infinite;
      }

      .tm-md-spinner-svg circle{
        stroke: white;
        opacity: 0.9;
        stroke-dasharray: 36 113;
        stroke-dashoffset: 0;
        animation: tm-md-spinner-dash 1.4s ease-in-out infinite;
      }

      .tm-md-nutri{
        display: inline-flex;
        align-items: center;
        gap: 4px;
        flex-wrap: nowrap;
      }

      .tm-md-nutri-seg{
        width: 20px;
        height: 18px;
        border-radius: 5px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        font-size: 10px;
        font-weight: 800;
        color: rgba(255,255,255,0.75);
        background: rgba(255,255,255,0.16);
        border: 1px solid rgba(255,255,255,0.08);
      }

      .tm-md-nutri-seg.active{
        width: 26px;
        height: 22px;
        color: white;
        box-shadow: 0 0 0 2px rgba(255,255,255,0.15);
        transform: scale(1.05);
      }

      .tm-md-nutri-unknown{
        font-size: 13px;
        font-weight: 700;
      }

      .tm-md-scale{
        display: flex;
        align-items: center;
        gap: 4px;
        flex-wrap: wrap;
        width: 100%;
        min-width: 0;
      }

      .tm-md-scale-seg{
        min-width: 18px;
        max-width: 100%;
        height: 18px;
        padding: 0 6px;
        border-radius: 5px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        font-size: 10px;
        font-weight: 800;
        color: rgba(255,255,255,0.78);
        border: 1px solid rgba(255,255,255,0.08);
        opacity: 0.48;
      }

      .tm-md-scale-seg.active{
        opacity: 1;
        min-width: 26px;
        height: 22px;
        box-shadow: 0 0 0 2px rgba(255,255,255,0.15);
        transform: scale(1.04);
      }

      .tm-md-scale-caption{
        margin-top: 6px;
        font-size: 11px;
        font-weight: 700;
        opacity: 0.86;
        width: 100%;
        min-width: 0;
        overflow-wrap: anywhere;
      }

      @keyframes tm-md-spin {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
      }

      @keyframes tm-md-spinner-dash {
        0% {
          stroke-dasharray: 12 113;
          stroke-dashoffset: 0;
        }
        50% {
          stroke-dasharray: 62 113;
          stroke-dashoffset: -18;
        }
        100% {
          stroke-dasharray: 12 113;
          stroke-dashoffset: -75;
        }
      }
    `;
    document.head.appendChild(style);
  },

  ensureTooltip() {
    if (document.getElementById("tm-md-tooltip")) return;
    const t = document.createElement("div");
    t.id = "tm-md-tooltip";
    document.body.appendChild(t);
  },

  showTooltip(x, y, html) {
    const t = document.getElementById("tm-md-tooltip");
    if (!t) return;

    t.innerHTML = html;
    t.style.display = "block";

    const offsetX = 14;
    const offsetY = 14;
    const viewportPadding = 16;
    const list = t.querySelector(".tm-md-tip-list");
    const cardCount = Number(list?.dataset.cardCount || 0);
    const hasWarn = !!t.querySelector(".tm-md-tip-warn");
    const hasFooter = !!t.querySelector(".tm-md-tip-footer");

    if (list) {
      list.classList.remove("grid");
    }

    const availableRight = Math.max(0, window.innerWidth - (x + offsetX) - viewportPadding);
    const availableLeft = Math.max(0, x - offsetX - viewportPadding);
    const availableBottom = Math.max(0, window.innerHeight - (y + offsetY) - viewportPadding);
    const availableTop = Math.max(0, y - offsetY - viewportPadding);
    const maxAvailableWidth = Math.max(availableRight, availableLeft);
    const maxAvailableHeight = Math.max(availableBottom, availableTop);
    const estimatedSingleColumnHeight =
      56 + cardCount * 74 + (hasWarn ? 34 : 0) + (hasFooter ? 24 : 0);

    const canUseGridWidth = maxAvailableWidth >= 430 && window.innerWidth >= 560;
    const shouldUseGrid =
      cardCount >= 2 &&
      canUseGridWidth &&
      estimatedSingleColumnHeight > Math.max(280, maxAvailableHeight);

    const targetMaxWidth = Math.min(
      shouldUseGrid ? 540 : 360,
      Math.max(260, window.innerWidth - viewportPadding * 2)
    );

    t.style.maxWidth = `${targetMaxWidth}px`;

    if (list && shouldUseGrid) {
      list.classList.add("grid");
    }

    const rect = t.getBoundingClientRect();
    let left = x + offsetX;
    let top = y + offsetY;

    if (left + rect.width > window.innerWidth - viewportPadding) {
      left = x - rect.width - offsetX;
    }
    if (top + rect.height > window.innerHeight - viewportPadding) {
      top = y - rect.height - offsetY;
    }

    left = Math.min(
      Math.max(viewportPadding, left),
      Math.max(viewportPadding, window.innerWidth - rect.width - viewportPadding)
    );
    top = Math.min(
      Math.max(viewportPadding, top),
      Math.max(viewportPadding, window.innerHeight - rect.height - viewportPadding)
    );

    t.style.left = `${left}px`;
    t.style.top = `${top}px`;
  },

  hideTooltip() {
    const t = document.getElementById("tm-md-tooltip");
    if (t) t.style.display = "none";
  },

  loadingTooltipHtml(title, message = "Cargando información…") {
    return `
      <div class="tm-md-tip-title">${Utils.escapeHtml(title)}</div>
      <div class="tm-md-loading">
        <span class="tm-md-spinner">${Icons.spinner}</span>
        <div>${Utils.escapeHtml(message)}</div>
      </div>
    `;
  },

  nutriVisualHtml(grade) {
    const g = String(grade || "").toLowerCase();
    if (!Utils.isValidNutriGrade(g)) return "";

    const letters = ["a", "b", "c", "d", "e"];
    const segs = letters
      .map((letter) => {
        const active = letter === g ? "active" : "";
        const bg = Utils.nutriColor(letter);
        return `<span class="tm-md-nutri-seg ${active}" style="background:${bg}">${letter.toUpperCase()}</span>`;
      })
      .join("");

    return `<span class="tm-md-nutri">${segs}</span>`;
  },

  scaleVisualHtml({ levels, activeValue, caption = "" }) {
    const segs = levels
      .map((level) => {
        const active = String(level.value) === String(activeValue) ? "active" : "";
        return `<span class="tm-md-scale-seg ${active}" style="background:${level.color}">${Utils.escapeHtml(level.label)}</span>`;
      })
      .join("");

    const captionHtml = caption ? `<div class="tm-md-scale-caption">${Utils.escapeHtml(caption)}</div>` : "";
    return `
      <span class="tm-md-scale">${segs}</span>
      ${captionHtml}
    `;
  },

  novaVisualHtml(novaGroup) {
    if (novaGroup == null || Number.isNaN(novaGroup)) return "";
    return UI.scaleVisualHtml({
      levels: [
        { value: 1, label: "1", color: "#1e8f4d" },
        { value: 2, label: "2", color: "#6dbd45" },
        { value: 3, label: "3", color: "#f2c94c" },
        { value: 4, label: "4", color: "#d64545" },
      ],
      activeValue: Number(novaGroup),
      caption: `Grupo ${novaGroup}`,
    });
  },

  additivesVisualHtml(additivesN) {
    if (additivesN == null || Number.isNaN(additivesN)) return "";
    const level = additivesN <= 1 ? "low" : additivesN <= 4 ? "medium" : "high";
    return UI.scaleVisualHtml({
      levels: [
        { value: "low", label: "Bajo", color: "#1e8f4d" },
        { value: "medium", label: "Medio", color: "#f2c94c" },
        { value: "high", label: "Alto", color: "#d64545" },
      ],
      activeValue: level,
      caption: `${additivesN} aditivos`,
    });
  },

  nutrientScaleVisualHtml(value, { lowLabel, mediumLabel, highLabel, lowMax, mediumMax, unit = "g" }) {
    if (value == null || Number.isNaN(value)) return "";
    const level = value < lowMax ? "low" : value < mediumMax ? "medium" : "high";
    return UI.scaleVisualHtml({
      levels: [
        { value: "low", label: lowLabel, color: "#f2994a" },
        { value: "medium", label: mediumLabel, color: "#f2c94c" },
        { value: "high", label: highLabel, color: "#1e8f4d" },
      ],
      activeValue: level,
      caption: `${value.toFixed(1)} ${unit}/100g`,
    });
  },

  allergensVisualHtml(allergensInfo) {
    const info = allergensInfo || {};
    const hasAllergens = Array.isArray(info.allergens) && info.allergens.length > 0;
    const hasTraces = Array.isArray(info.traces) && info.traces.length > 0;
    if (!hasAllergens && !hasTraces) return UI.infoStatusHtml(allergensInfo);

    const chips = [];
    for (const tag of info.allergens || []) {
      chips.push(`<span class="tm-md-chip allergen">${Utils.escapeHtml(Utils.humanizeTag(tag))}</span>`);
    }
    for (const tag of info.traces || []) {
      chips.push(`<span class="tm-md-chip trace">${Utils.escapeHtml(Utils.humanizeTag(tag))}</span>`);
    }

    return `
      ${UI.infoStatusHtml(allergensInfo)}
      <div class="tm-md-chip-list">${chips.join("")}</div>
    `;
  },

  infoStatusHtml(infoObj) {
    const info = infoObj || {};
    const status = Utils.normalizeDisplayValue(info.status);
    const detail = Utils.normalizeDisplayValue(info.detail);
    const tone = ["safe", "warning", "danger", "unknown", "missing"].includes(info.tone)
      ? info.tone
      : "unknown";
    const detailHtml =
      detail !== "No disponible" ? `<span class="tm-md-status-note">${Utils.escapeHtml(detail)}</span>` : "";

    return `
      <span class="tm-md-status">
        <span class="tm-md-status-pill ${tone}">${Utils.escapeHtml(status)}</span>
        ${detailHtml}
      </span>
    `;
  },

  glutenStatusHtml(glutenInfo) {
    return UI.infoStatusHtml(glutenInfo);
  },

  infoCardHtml({ icon, label, valueHtml }) {
    return `
      <div class="tm-md-tip-card">
        <div class="tm-md-tip-card-icon">${icon}</div>
        <div class="tm-md-tip-card-body">
          <div class="tm-md-tip-card-label">${Utils.escapeHtml(label)}</div>
          <div class="tm-md-tip-card-value">${valueHtml}</div>
        </div>
      </div>
    `;
  },

  tooltipHtml({ title, cardsHtml, footer, warn, cardCount = 0 }) {
    const safeTitle = Utils.escapeHtml(title);
    const footerHtml = footer ? `<div class="tm-md-tip-footer">${Utils.escapeHtml(footer)}</div>` : "";
    const warnHtml = warn ? `<div class="tm-md-tip-warn">${Utils.escapeHtml(warn)}</div>` : "";
    const emptyHtml =
      !cardsHtml && !warn
        ? `<div class="tm-md-empty">No has seleccionado campos en el menú.</div>`
        : "";
    return `
      <div class="tm-md-tip-title">${safeTitle}</div>
      <div class="tm-md-tip-list" data-card-count="${Number(cardCount) || 0}">
        ${cardsHtml || emptyHtml}
      </div>
      ${warnHtml}
      ${footerHtml}
    `;
  },
};


export { UI };
