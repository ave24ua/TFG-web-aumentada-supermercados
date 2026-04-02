import { Config, State } from "./core.js";
import { PersistentCache } from "./persistent-cache.js";
import { Utils } from "./utils.js";
import { API } from "./data.js";
import { Icons } from "./icons.js";
import { UI } from "./ui.js";

const Dom = {
  findProductCards() {
    const set = new Set();
    for (const sel of Config.SELECTORS.productCards) {
      document.querySelectorAll(sel).forEach((el) => set.add(el));
    }

    const out = [];
    set.forEach((el) => {
      const hasImg = !!el.querySelector("img");
      const hasPrice = Config.SELECTORS.price.some((s) => !!el.querySelector(s));
      const hasName = Config.SELECTORS.name.some((s) => !!el.querySelector(s));
      if (hasImg && hasPrice && hasName) out.push(el);
    });
    return out;
  },

  isElementVisible(el) {
    if (!el || !document.body.contains(el)) return false;
    const rect = el.getBoundingClientRect();
    const style = window.getComputedStyle(el);
    return (
      rect.width > 0 &&
      rect.height > 0 &&
      style.display !== "none" &&
      style.visibility !== "hidden" &&
      style.opacity !== "0"
    );
  },

  findOpenProductDetailRoot() {
    for (const sel of Config.SELECTORS.detailRoots) {
      const matches = document.querySelectorAll(sel);
      for (const el of matches) {
        if (Dom.isElementVisible(el) && el.querySelector(Config.SELECTORS.productCards.join(", "))) {
          return el;
        }
      }
    }
    return null;
  },

  getName(card) {
    for (const sel of Config.SELECTORS.name) {
      const el = card.querySelector(sel);
      if (el) {
        const txt = (el.textContent || "").trim().replace(/\s+/g, " ");
        if (txt) return txt;
      }
    }
    return "Producto";
  },

  getBrandHint(card) {
    const aria = card.querySelector(Config.SELECTORS.openDetailBtn)?.getAttribute("aria-label") || "";
    const m = aria.match(/^(Hacendado|Deliplus|Bosque Verde|Compy|Mercadona)\b/i);
    return m ? m[1] : "";
  },

  resolveProductId(card) {
    PersistentCache.ensureHydrated();
    const name = Dom.getName(card);
    const brand = Dom.getBrandHint(card);
    const key = Utils.nameKey(name, brand);

    if (State.idByNameKey.has(key)) return State.idByNameKey.get(key);
    const cachedId = PersistentCache.getIdByNameKey(key);
    if (cachedId) {
      State.idByNameKey.set(key, String(cachedId));
      return String(cachedId);
    }

    const m = location.pathname.match(/^\/product\/(\d+)\b/);
    if (m) return m[1];

    return null;
  },
};

/* <---------------------> */
/*          FILTERS        */
/* <---------------------> */
const Filters = {
  ensureUnknownLabel(card, { text, tone = "warning" }) {
    let label = card.querySelector(":scope > .tm-md-unknown-label");
    if (!label) {
      label = document.createElement("div");
      label.className = "tm-md-unknown-label";
      card.appendChild(label);
    }
    label.classList.remove("warning", "missing");
    label.classList.add(tone);
    label.textContent = text;
  },

  ensureLoadingOverlay(card) {
    let overlay = card.querySelector(":scope > .tm-md-loading-overlay");
    if (!overlay) {
      overlay = document.createElement("div");
      overlay.className = "tm-md-loading-overlay";
      overlay.innerHTML = Icons.spinner;
      card.appendChild(overlay);
    }
  },

  removeLoadingOverlay(card) {
    const overlay = card.querySelector(":scope > .tm-md-loading-overlay");
    if (overlay) overlay.remove();
  },

  clearCard(card) {
    card.classList.remove(
      "tm-md-muted",
      "tm-md-hidden",
      "tm-md-unknown",
      "tm-md-no-off",
      "tm-md-pass",
      "tm-md-fail",
      "tm-md-loading-card"
    );
    const label = card.querySelector(":scope > .tm-md-unknown-label");
    if (label) label.remove();
    Filters.removeLoadingOverlay(card);
  },

  markLoading(card) {
    Filters.clearCard(card);
    card.classList.add("tm-md-loading-card");
    Filters.ensureLoadingOverlay(card);
  },

  schedule(card) {
    if (!card || State.filterQueueSet.has(card)) return;
    State.filterQueue.push(card);
    State.filterQueueSet.add(card);
    Filters.runWorkers();
  },

  runWorkers() {
    while (State.filterWorkerActive < Config.FILTER_CONCURRENCY && State.filterQueue.length > 0) {
      const card = State.filterQueue.shift();
      State.filterQueueSet.delete(card);
      State.filterWorkerActive++;
      Filters.evaluateCard(card)
        .catch(() => {})
        .finally(() => {
          State.filterWorkerActive--;
          Filters.runWorkers();
        });
    }
  },

  async evaluateCard(card) {
    if (!card || !document.body.contains(card)) return;

    const filterOptions = Utils.getFilterOptions();
    const useNutriFilter = filterOptions.threshold !== "none";
    const hideNoNutriScore = !!filterOptions.hideNoNutriScore;
    const hideNoInfo = !!filterOptions.hideNoInfo;
    const useGlutenFilter = !!filterOptions.hideGluten;

    if (!useNutriFilter && !hideNoNutriScore && !hideNoInfo && !useGlutenFilter) {
      Filters.clearCard(card);
      return;
    }

    const id = Dom.resolveProductId(card);
    if (!id) {
      Filters.markLoading(card);
      return;
    }

    Filters.markLoading(card);

    const ean = await API.getEanById(id);
    if (!ean) {
      Filters.markLoading(card);
      return;
    }

    const off = await API.getOffDataByEan(ean);
    const realGrade = String(off.nutriscoreGrade || "").toLowerCase();
    const glutenStatus = String(off?.glutenInfo?.status || "").toLowerCase();

    Filters.clearCard(card);

    if (useGlutenFilter && glutenStatus === "contiene gluten") {
      card.classList.add("tm-md-hidden");
      return;
    }

    if (!useNutriFilter && !hideNoNutriScore && !hideNoInfo) {
      return;
    }

    if (!off.hasOffData) {
      if (hideNoInfo) {
        card.classList.add("tm-md-hidden");
      } else {
        card.classList.add("tm-md-no-off");
        Filters.ensureUnknownLabel(card, {
          text: "Información OFF no disponible",
          tone: "missing",
        });
      }
      return;
    }

    if (!Utils.isValidNutriGrade(realGrade)) {
      if (hideNoNutriScore) {
        card.classList.add("tm-md-hidden");
      } else {
        card.classList.add("tm-md-unknown");
        Filters.ensureUnknownLabel(card, {
          text: "Nutri-Score no disponible",
          tone: "warning",
        });
      }
      return;
    }

    if (!useNutriFilter) {
      return;
    }

    const pass = Utils.passesNutriThreshold(realGrade, filterOptions.threshold);

    if (pass) {
      card.classList.add("tm-md-pass");
      return;
    }

    if (filterOptions.mode === "hide") {
      card.classList.add("tm-md-hidden");
    } else {
      card.classList.add("tm-md-fail");
    }
  },

  reapplyAll() {
    const cards = Dom.findProductCards();
    for (const card of cards) {
      Filters.schedule(card);
    }
  },
};

/* <---------------------> */
/*           BADGES        */
/* <---------------------> */
const Badges = {
  init() {
    Badges.repaint();

    let timer = null;
    const obs = new MutationObserver(() => {
      clearTimeout(timer);
      timer = setTimeout(Badges.repaint, Config.MUTATION_DEBOUNCE_MS);
    });
    obs.observe(document.body, { childList: true, subtree: true });
  },

  repaint() {
    const cards = Dom.findProductCards();
    for (const card of cards) {
      Badges.ensureBadge(card);
      Filters.schedule(card);
    }
    Badges.syncBadgeVisibility();
  },

  ensureBadge(card) {
    const cs = window.getComputedStyle(card);
    if (cs.position === "static") card.style.position = "relative";

    let badge = card.querySelector(":scope > .tm-md-badge");
    if (!badge) {
      badge = document.createElement("div");
      badge.className = "tm-md-badge";
      badge.innerHTML = Icons.info;
      card.prepend(badge);
      Badges.attachHover(badge, card);
    }
  },

  syncBadgeVisibility() {
    const detailRoot = Dom.findOpenProductDetailRoot();
    const badges = document.querySelectorAll(".tm-md-badge");

    for (const badge of badges) {
      const card = badge.closest(Config.SELECTORS.productCards.join(", "));
      const shouldHide = !!(detailRoot && card && !detailRoot.contains(card));
      badge.classList.toggle("tm-md-badge-suppressed", shouldHide);
    }
  },

  buildCardsHtml(off, infoOptions) {
    const cards = [];
    const hasOffData = !!off?.hasOffData;

    if (infoOptions.nutriscore) {
      const realGrade = String(off.nutriscoreGrade || "").toLowerCase();
      const nutriInfo = !hasOffData
        ? Utils.fieldUnavailableInfo("Nutri-Score", false)
        : !Utils.isValidNutriGrade(realGrade)
        ? Utils.makeInfoStatus(
            "Sin Nutri-Score",
            "OFF tiene ficha pero no incluye Nutri-Score para este producto",
            "warning"
          )
        : null;
      cards.push(
        UI.infoCardHtml({
          icon: Icons.info,
          label: "Nutri-Score",
          valueHtml: nutriInfo ? UI.infoStatusHtml(nutriInfo) : UI.nutriVisualHtml(realGrade),
        })
      );
    }

    if (infoOptions.nova) {
      const novaMissing = off.novaGroup == null || Number.isNaN(off.novaGroup);
      cards.push(
        UI.infoCardHtml({
          icon: Icons.nova,
          label: "NOVA",
          valueHtml: novaMissing
            ? UI.infoStatusHtml(Utils.novaInfoFromValue(off.novaGroup, hasOffData))
            : UI.novaVisualHtml(off.novaGroup),
        })
      );
    }

    if (infoOptions.additives) {
      const additivesMissing = off.additivesN == null || Number.isNaN(off.additivesN);
      cards.push(
        UI.infoCardHtml({
          icon: Icons.additives,
          label: "Aditivos",
          valueHtml: additivesMissing
            ? UI.infoStatusHtml(Utils.additivesInfoFromValue(off.additivesN, hasOffData))
            : UI.additivesVisualHtml(off.additivesN),
        })
      );
    }

    if (infoOptions.gluten) {
      cards.push(
        UI.infoCardHtml({
          icon: Icons.gluten,
          label: "Gluten",
          valueHtml: UI.glutenStatusHtml(
            hasOffData ? off.glutenInfo : Utils.fieldUnavailableInfo("gluten", false)
          ),
        })
      );
    }

    if (infoOptions.allergens) {
      cards.push(
        UI.infoCardHtml({
          icon: Icons.allergens,
          label: "Alérgenos",
          valueHtml: UI.allergensVisualHtml(
            hasOffData
              ? off.allergensInfo
              : Utils.fieldUnavailableInfo("alergenos", false)
          ),
        })
      );
    }

    if (infoOptions.fiber) {
      const fiberMissing = off.fiber100g == null || Number.isNaN(off.fiber100g);
      cards.push(
        UI.infoCardHtml({
          icon: Icons.fiber,
          label: "Fibra",
          valueHtml: fiberMissing
            ? UI.infoStatusHtml(Utils.fiberInfoFromValue(off.fiber100g, hasOffData))
            : UI.nutrientScaleVisualHtml(off.fiber100g, {
                lowLabel: "Baja",
                mediumLabel: "Media",
                highLabel: "Alta",
                lowMax: 3,
                mediumMax: 6,
              }),
        })
      );
    }

    if (infoOptions.proteins) {
      const proteinsMissing = off.proteins100g == null || Number.isNaN(off.proteins100g);
      cards.push(
        UI.infoCardHtml({
          icon: Icons.proteins,
          label: "Proteínas",
          valueHtml: proteinsMissing
            ? UI.infoStatusHtml(Utils.proteinsInfoFromValue(off.proteins100g, hasOffData))
            : UI.nutrientScaleVisualHtml(off.proteins100g, {
                lowLabel: "Bajas",
                mediumLabel: "Medias",
                highLabel: "Altas",
                lowMax: 5,
                mediumMax: 10,
              }),
        })
      );
    }

    if (infoOptions.salt_level) {
      cards.push(
        UI.infoCardHtml({
          icon: Icons.salt,
          label: "Nivel de sal",
          valueHtml: UI.infoStatusHtml(Utils.saltInfoFromValue(off.saltLevelText, hasOffData)),
        })
      );
    }

    return {
      html: cards.join(""),
      count: cards.length,
    };
  },

  attachHover(badge, card) {
    const stopTracking = () => {
      UI.hideTooltip();

      if (badge._tmOnMove) document.removeEventListener("mousemove", badge._tmOnMove);
      if (badge._tmOnScroll) window.removeEventListener("scroll", badge._tmOnScroll, true);
      if (badge._tmOnVis) document.removeEventListener("visibilitychange", badge._tmOnVis);

      badge._tmOnMove = null;
      badge._tmOnScroll = null;
      badge._tmOnVis = null;
    };

    const onMove = (ev) => {
      if (!badge.matches(":hover")) {
        stopTracking();
        return;
      }
      const t = document.getElementById("tm-md-tooltip");
      if (t && t.style.display === "block") UI.showTooltip(ev.clientX, ev.clientY, t.innerHTML);
    };

    const onScroll = () => stopTracking();
    const onVis = () => {
      if (document.hidden) stopTracking();
    };

    badge.addEventListener("mouseenter", async (ev) => {
      stopTracking();

      const name = Dom.getName(card);
      const infoOptions = Utils.getSelectedInfoOptions();

      UI.showTooltip(ev.clientX, ev.clientY, UI.loadingTooltipHtml(name, "Cargando información…"));

      const id = Dom.resolveProductId(card);
      if (!id) {
        UI.showTooltip(
          ev.clientX,
          ev.clientY,
          UI.tooltipHtml({
            title: name,
            cardsHtml: "",
            warn: "No disponible",
            footer: "",
          })
        );

        document.addEventListener("mousemove", onMove);
        window.addEventListener("scroll", onScroll, true);
        document.addEventListener("visibilitychange", onVis);

        badge._tmOnMove = onMove;
        badge._tmOnScroll = onScroll;
        badge._tmOnVis = onVis;
        return;
      }

      try {
        const ean = await API.getEanById(id);
        if (!ean) {
          UI.showTooltip(
            ev.clientX,
            ev.clientY,
            UI.tooltipHtml({
              title: name,
              cardsHtml: "",
              warn: "No disponible",
              footer: `ID: ${id}`,
            })
          );

          document.addEventListener("mousemove", onMove);
          window.addEventListener("scroll", onScroll, true);
          document.addEventListener("visibilitychange", onVis);

          badge._tmOnMove = onMove;
          badge._tmOnScroll = onScroll;
          badge._tmOnVis = onVis;
          return;
        }

        const off = await API.getOffDataByEan(ean);
        const cardsData = Badges.buildCardsHtml(off, infoOptions);

        let warn = "";
        if (!off.hasOffData) {
          warn = "Open Food Facts no tiene una ficha util para este producto.";
        } else if (off.completeness != null && off.completeness < 0.4) {
          warn = "Datos incompletos en Open Food Facts (puede faltar información).";
        }

        UI.showTooltip(
          ev.clientX,
          ev.clientY,
          UI.tooltipHtml({
            title: name,
            cardsHtml: cardsData.html,
            cardCount: cardsData.count,
            warn,
            footer: `EAN: ${ean}`,
          })
        );
      } catch (e) {
        UI.showTooltip(
          ev.clientX,
          ev.clientY,
          UI.tooltipHtml({
            title: name,
            cardsHtml: "",
            warn: "No disponible",
            footer: "",
          })
        );
      }

      document.addEventListener("mousemove", onMove);
      window.addEventListener("scroll", onScroll, true);
      document.addEventListener("visibilitychange", onVis);

      badge._tmOnMove = onMove;
      badge._tmOnScroll = onScroll;
      badge._tmOnVis = onVis;
    });

    badge.addEventListener("mouseleave", stopTracking);
  },
};


export { Dom, Filters, Badges };
