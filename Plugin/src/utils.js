import { Config } from "./core.js";

const Utils = {
  norm(s) {
    return String(s || "")
      .toLowerCase()
      .replace(/[®™]/g, "")
      .replace(/\s+/g, " ")
      .trim();
  },

  nameKey(name, brand) {
    return `${Utils.norm(name)}|${Utils.norm(brand || "")}`;
  },

  escapeHtml(s) {
    return String(s)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  },

  normalizeDisplayValue(value) {
    if (value == null) return "No disponible";
    const s = String(value).trim();
    if (!s) return "No disponible";

    const normalized = s.toLowerCase();
    if (
      normalized === "unknown" ||
      normalized === "no determinado" ||
      normalized === "no disponible" ||
      normalized === "not available" ||
      normalized === "n/a" ||
      normalized === "null" ||
      normalized === "undefined"
    ) {
      return "No disponible";
    }

    return s;
  },

  getSelectedInfoOptions() {
    try {
      const raw = localStorage.getItem(Config.STORAGE.infoOptionsKey);
      if (!raw) return Utils.defaultInfoOptions();
      const obj = JSON.parse(raw);
      const defaults = Utils.defaultInfoOptions();
      const out = {};
      for (const opt of Config.INFO_OPTIONS) {
        out[opt.key] = opt.key in obj ? !!obj[opt.key] : !!defaults[opt.key];
      }
      return out;
    } catch {
      return Utils.defaultInfoOptions();
    }
  },

  setSelectedInfoOptions(optionsObj) {
    localStorage.setItem(Config.STORAGE.infoOptionsKey, JSON.stringify(optionsObj));
  },

  defaultInfoOptions() {
    return {
      nutriscore: true,
      nova: true,
      additives: true,
      gluten: true,
      allergens: true,
      fiber: true,
      proteins: true,
      salt_level: true,
    };
  },

  getFilterOptions() {
    try {
      const raw = localStorage.getItem(Config.STORAGE.filterOptionsKey);
      if (!raw) return Utils.defaultFilterOptions();
      const obj = JSON.parse(raw);
      const legacyHideUnknown = !!obj?.hideUnknown;
      return {
        threshold: obj?.threshold || "none",
        mode: obj?.mode || "mark",
        hideNoNutriScore:
          "hideNoNutriScore" in (obj || {}) ? !!obj?.hideNoNutriScore : legacyHideUnknown,
        hideNoInfo: !!obj?.hideNoInfo,
        hideGluten: !!obj?.hideGluten,
      };
    } catch {
      return Utils.defaultFilterOptions();
    }
  },

  setFilterOptions(optionsObj) {
    localStorage.setItem(Config.STORAGE.filterOptionsKey, JSON.stringify(optionsObj));
  },

  defaultFilterOptions() {
    return {
      threshold: "none",
      mode: "mark",
      hideNoNutriScore: false,
      hideNoInfo: false,
      hideGluten: false,
    };
  },

  toStringArray(value) {
    if (Array.isArray(value)) return value.map((item) => String(item || "").trim()).filter(Boolean);
    if (value == null) return [];
    const single = String(value).trim();
    return single ? [single] : [];
  },

  hasAnyExactTag(values, expectedTags) {
    const set = new Set(Utils.toStringArray(values).map((item) => item.toLowerCase()));
    for (const tag of expectedTags) {
      if (set.has(String(tag).toLowerCase())) return true;
    }
    return false;
  },

  hasAnyTagFragment(values, fragments) {
    const haystack = Utils.toStringArray(values).map((item) => item.toLowerCase());
    return fragments.some((fragment) =>
      haystack.some((item) => item.includes(String(fragment).toLowerCase()))
    );
  },

  textContainsAny(text, fragments) {
    const normalized = String(text || "").toLowerCase();
    if (!normalized) return false;
    return fragments.some((fragment) => normalized.includes(String(fragment).toLowerCase()));
  },

  makeInfoStatus(status, detail, tone = "unknown") {
    return {
      status: Utils.normalizeDisplayValue(status),
      detail: Utils.normalizeDisplayValue(detail),
      tone,
    };
  },

  isValidNutriGrade(grade) {
    return ["a", "b", "c", "d", "e"].includes(String(grade || "").toLowerCase());
  },

  fieldUnavailableInfo(fieldLabel, hasOffData, detailIfOff = "") {
    if (!hasOffData) {
      return Utils.makeInfoStatus(
        "Sin datos OFF",
        "Open Food Facts no tiene ficha util para este producto",
        "missing"
      );
    }

    return Utils.makeInfoStatus(
      "No disponible",
      detailIfOff || `OFF no aporta este dato para ${fieldLabel.toLowerCase()}`,
      "unknown"
    );
  },

  saltLevelFromValue(salt100g) {
    if (salt100g == null || Number.isNaN(salt100g)) {
      return { level: null, text: "No disponible" };
    }

    const v = salt100g;
    if (v <= 0.3) return { level: "bajo", text: `Bajo (${v.toFixed(2)} g/100g)` };
    if (v <= 1.25) return { level: "medio", text: `Medio (${v.toFixed(2)} g/100g)` };
    return { level: "alto", text: `Alto (${v.toFixed(2)} g/100g)` };
  },

  humanizeTag(tag) {
    return String(tag || "")
      .replace(/^([a-z]{2}):/i, "")
      .replace(/-/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase())
      .trim();
  },

  uniqueNonEmpty(values) {
    return [...new Set(Utils.toStringArray(values).filter(Boolean))];
  },

  allergensInfoFromProduct(product) {
    const allergens = Utils.uniqueNonEmpty(product?.allergens_tags || product?.allergens_hierarchy).filter((tag) =>
      !String(tag).toLowerCase().includes("en:none")
    );
    const traces = Utils.uniqueNonEmpty(product?.traces_tags || product?.traces_hierarchy).filter((tag) =>
      !String(tag).toLowerCase().includes("en:none")
    );

    if (!product || (!allergens.length && !traces.length)) {
      return Utils.makeInfoStatus(
        "No disponible",
        "OFF no aporta alergenos o trazas estructurados para este producto",
        "unknown"
      );
    }

    if (allergens.length && traces.length) {
      return {
        status: `${allergens.length} alérgenos`,
        detail: `${traces.length} trazas`,
        tone: "danger",
        allergens,
        traces,
      };
    }

    if (allergens.length) {
      return {
        status: `${allergens.length} alérgenos`,
        detail: "Alergenos declarados",
        tone: "danger",
        allergens,
        traces: [],
      };
    }

    return {
      status: `${traces.length} trazas`,
      detail: "Trazas declaradas",
      tone: "warning",
      allergens: [],
      traces,
    };
  },

  glutenInfoFromProduct(product) {
    const allergenTags = Utils.toStringArray(product?.allergens_tags || product?.allergens_hierarchy);
    const traceTags = Utils.toStringArray(product?.traces_tags || product?.traces_hierarchy);
    const labelsTags = Utils.toStringArray(product?.labels_tags || product?.labels_hierarchy);
    const declaredAllergens = [
      product?.allergens,
      product?.allergens_from_ingredients,
      product?.allergens_from_user,
    ]
      .filter(Boolean)
      .join(" | ");

    const hasGlutenAllergen =
      Utils.hasAnyTagFragment(allergenTags, ["gluten"]) ||
      Utils.textContainsAny(declaredAllergens, ["gluten"]);
    const hasGlutenTrace =
      Utils.hasAnyTagFragment(traceTags, ["gluten"]) ||
      Utils.textContainsAny(product?.traces, ["gluten"]);
    const isGlutenFree = Utils.hasAnyExactTag(labelsTags, ["en:gluten-free", "en:no-gluten"]);
    const isVeryLowGluten = Utils.hasAnyExactTag(labelsTags, ["en:very-low-gluten"]);

    if (hasGlutenAllergen && isGlutenFree) {
      return {
        status: "Revisar OFF",
        detail: "Datos contradictorios entre alergenos y etiqueta",
        tone: "warning",
      };
    }

    if (hasGlutenAllergen) {
      return {
        status: "Contiene gluten",
        detail: "Alergeno declarado en Open Food Facts",
        tone: "danger",
      };
    }

    if (hasGlutenTrace) {
      return {
        status: "Puede contener gluten",
        detail: "Trazas declaradas en Open Food Facts",
        tone: "warning",
      };
    }

    if (isGlutenFree) {
      return {
        status: "Sin gluten",
        detail: "Etiqueta sin gluten en Open Food Facts",
        tone: "safe",
      };
    }

    if (isVeryLowGluten) {
      return {
        status: "Muy bajo en gluten",
        detail: "Etiqueta especifica en Open Food Facts",
        tone: "warning",
      };
    }

    return {
      status: "No disponible",
      detail: "OFF no aporta un campo claro para este producto",
      tone: "unknown",
    };
  },

  novaInfoFromValue(novaGroup, hasOffData) {
    if (novaGroup == null || Number.isNaN(novaGroup)) {
      return Utils.fieldUnavailableInfo("NOVA", hasOffData, "OFF no indica el grupo NOVA de este producto");
    }

    return Utils.makeInfoStatus(`Grupo ${novaGroup}`, "Clasificacion NOVA disponible", "safe");
  },

  additivesInfoFromValue(n, hasOffData) {
    if (n == null || Number.isNaN(n)) {
      return Utils.fieldUnavailableInfo(
        "aditivos",
        hasOffData,
        "OFF no aporta un recuento de aditivos para este producto"
      );
    }

    if (n <= 1) return Utils.makeInfoStatus(`${n} aditivos`, "Nivel bajo de aditivos", "safe");
    if (n <= 4) return Utils.makeInfoStatus(`${n} aditivos`, "Nivel medio de aditivos", "warning");
    return Utils.makeInfoStatus(`${n} aditivos`, "Nivel alto de aditivos", "danger");
  },

  fiberInfoFromValue(value, hasOffData) {
    if (value == null || Number.isNaN(value)) {
      return Utils.fieldUnavailableInfo("fibra", hasOffData, "OFF no aporta la fibra por 100 g o 100 ml");
    }

    if (value < 3) return Utils.makeInfoStatus(`${value.toFixed(1)} g`, "Nivel bajo de fibra", "warning");
    if (value < 6) return Utils.makeInfoStatus(`${value.toFixed(1)} g`, "Nivel medio de fibra", "safe");
    return Utils.makeInfoStatus(`${value.toFixed(1)} g`, "Nivel alto de fibra", "safe");
  },

  proteinsInfoFromValue(value, hasOffData) {
    if (value == null || Number.isNaN(value)) {
      return Utils.fieldUnavailableInfo(
        "proteinas",
        hasOffData,
        "OFF no aporta las proteínas por 100 g o 100 ml"
      );
    }

    if (value < 5) return Utils.makeInfoStatus(`${value.toFixed(1)} g`, "Nivel bajo de proteínas", "warning");
    if (value < 10) return Utils.makeInfoStatus(`${value.toFixed(1)} g`, "Nivel medio de proteínas", "safe");
    return Utils.makeInfoStatus(`${value.toFixed(1)} g`, "Nivel alto de proteínas", "safe");
  },

  saltInfoFromValue(text, hasOffData) {
    const normalized = Utils.normalizeDisplayValue(text);
    if (normalized === "No disponible") {
      return Utils.fieldUnavailableInfo(
        "sal",
        hasOffData,
        "OFF no aporta el contenido de sal por 100 g o 100 ml"
      );
    }

    if (normalized.startsWith("Bajo")) return Utils.makeInfoStatus(normalized, "Contenido bajo en sal", "safe");
    if (normalized.startsWith("Medio")) return Utils.makeInfoStatus(normalized, "Contenido medio en sal", "warning");
    return Utils.makeInfoStatus(normalized, "Contenido alto en sal", "danger");
  },

  hasMeaningfulOffData(offData) {
    if (!offData || typeof offData !== "object") return false;

    if (Utils.isValidNutriGrade(offData.nutriscoreGrade)) return true;
    if (offData.novaGroup != null && !Number.isNaN(offData.novaGroup)) return true;
    if (offData.additivesN != null && !Number.isNaN(offData.additivesN)) return true;
    if (offData.fiber100g != null && !Number.isNaN(offData.fiber100g)) return true;
    if (offData.proteins100g != null && !Number.isNaN(offData.proteins100g)) return true;
    if (offData.salt100g != null && !Number.isNaN(offData.salt100g)) return true;

    const glutenStatus = Utils.normalizeDisplayValue(offData?.glutenInfo?.status);
    if (glutenStatus !== "No disponible") return true;

    const allergens = Array.isArray(offData?.allergensInfo?.allergens)
      ? offData.allergensInfo.allergens.filter(Boolean)
      : [];
    const traces = Array.isArray(offData?.allergensInfo?.traces)
      ? offData.allergensInfo.traces.filter(Boolean)
      : [];
    if (allergens.length || traces.length) return true;

    return false;
  },

  nutriValue(grade) {
    const map = { a: 1, b: 2, c: 3, d: 4, e: 5 };
    return map[String(grade || "").toLowerCase()] || null;
  },

  passesNutriThreshold(grade, threshold) {
    if (!threshold || threshold === "none") return true;
    const g = Utils.nutriValue(grade);
    const t = Utils.nutriValue(threshold);
    if (g == null || t == null) return true;
    return g <= t;
  },

  formatNovaGroup(novaGroup) {
    if (novaGroup == null || Number.isNaN(novaGroup)) return "No disponible";
    return `Grupo ${novaGroup}`;
  },

  formatAdditivesCount(n) {
    if (n == null || Number.isNaN(n)) return "No disponible";
    return `${n}`;
  },

  formatSaltLevel(text) {
    return Utils.normalizeDisplayValue(text);
  },

  nutriColor(letter) {
    const l = String(letter || "").toLowerCase();
    const map = {
      a: "#1e8f4d",
      b: "#6dbd45",
      c: "#f2c94c",
      d: "#f2994a",
      e: "#d64545",
    };
    return map[l] || "#6b7280";
  },
};


export { Utils };
