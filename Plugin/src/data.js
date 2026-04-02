import { Config, State } from "./core.js";
import { Runtime } from "./runtime.js";
import { PersistentCache } from "./persistent-cache.js";
import { Utils } from "./utils.js";

const Indexer = {
  hookFetch() {
    const origFetch = window.fetch;

    window.fetch = async function (...args) {
      const res = await origFetch.apply(this, args);

      try {
        const clone = res.clone();
        clone
          .json()
          .then((json) => {
            Indexer.indexIfProductDetail(json);
            Indexer.indexProductsFromUnknownJson(json);
          })
          .catch(() => {});
      } catch (_) {}

      return res;
    };
  },

  indexIfProductDetail(json) {
    if (!json || typeof json !== "object") return;
    const id = json.id;
    const ean = json.ean;
    if (id && ean) {
      State.eanById.set(String(id), String(ean));
      PersistentCache.persistEanById(id, ean);

      const name = json.display_name || json.name;
      const brand = json.brand;
      if (name) {
        const key = Utils.nameKey(name, brand);
        State.idByNameKey.set(key, String(id));
        PersistentCache.persistIdByNameKey(key, id);
        Runtime.scheduleReapplyFilters();
      }
    }
  },

  indexProductsFromUnknownJson(json) {
    const stack = [json];
    let steps = 0;

    while (stack.length && steps < Config.INDEXER_STEP_LIMIT) {
      steps++;
      const node = stack.pop();
      if (!node) continue;

      if (Array.isArray(node)) {
        for (const it of node) stack.push(it);
        continue;
      }

      if (typeof node !== "object") continue;

      const id = node.id;
      const name = node.display_name || node.name || node.title;
      const brand = node.brand;

      if (id && name) {
        const key = Utils.nameKey(name, brand);
        if (!State.idByNameKey.has(key)) {
          State.idByNameKey.set(key, String(id));
          PersistentCache.persistIdByNameKey(key, id);
          Runtime.scheduleReapplyFilters();
        }
      }

      for (const k of Object.keys(node)) stack.push(node[k]);
    }
  },
};

/* <---------------------> */
/*            API          */
/* <---------------------> */
const API = {
  async getEanById(id) {
    if (State.eanById.has(id)) return State.eanById.get(id);
    const cachedEan = PersistentCache.getEanById(id);
    if (cachedEan) {
      State.eanById.set(String(id), String(cachedEan));
      return String(cachedEan);
    }

    const key = `ean_${id}`;
    if (State.inFlight.has(key)) return State.inFlight.get(key);

    const p = (async () => {
      const res = await fetch(Config.MD_API_PRODUCT(id), { method: "GET" });
      if (!res.ok) throw new Error("Mercadona API failed: " + res.status);

      const json = await res.json();
      const ean = json?.ean ? String(json.ean) : null;
      if (ean) {
        State.eanById.set(String(id), ean);
        PersistentCache.persistEanById(id, ean);
      }

      const n = json?.display_name || json?.name;
      const b = json?.brand;
      if (n && json?.id) {
        const nameKey = Utils.nameKey(n, b);
        State.idByNameKey.set(nameKey, String(json.id));
        PersistentCache.persistIdByNameKey(nameKey, json.id);
      }

      return ean;
    })();

    State.inFlight.set(key, p);
    try {
      return await p;
    } finally {
      State.inFlight.delete(key);
    }
  },

  async getOffDataByEan(ean) {
    if (State.offByEan.has(ean)) return State.offByEan.get(ean);
    const cachedOff = PersistentCache.getOffByEan(ean);
    if (cachedOff && typeof cachedOff === "object") {
      State.offByEan.set(String(ean), cachedOff);
      return cachedOff;
    }

    const key = `off_${ean}`;
    if (State.inFlight.has(key)) return State.inFlight.get(key);

    const p = (async () => {
      const res = await fetch(Config.OFF_API_PRODUCT(ean), { method: "GET" });

      if (!res.ok) {
        const outFail = {
          hasOffData: false,
          nutriscoreGrade: "No disponible",
          novaGroup: null,
          additivesN: null,
          glutenInfo: Utils.glutenInfoFromProduct(null),
          allergensInfo: Utils.makeInfoStatus("No disponible", "OFF no aporta alergenos para este producto", "unknown"),
          fiber100g: null,
          proteins100g: null,
          salt100g: null,
          saltLevelText: "No disponible",
          completeness: null,
        };
        State.offByEan.set(ean, outFail);
        PersistentCache.persistOffByEan(ean, outFail);
        return outFail;
      }

      const json = await res.json();
      const product = json?.product || null;
      const hasOffData = !!(product && typeof product === "object" && Object.keys(product).length > 0);

      if (!hasOffData) {
        const outMissing = {
          hasOffData: false,
          nutriscoreGrade: "No disponible",
          novaGroup: null,
          additivesN: null,
          glutenInfo: Utils.glutenInfoFromProduct(null),
          allergensInfo: Utils.makeInfoStatus("No disponible", "OFF no aporta alergenos para este producto", "unknown"),
          fiber100g: null,
          proteins100g: null,
          salt100g: null,
          saltLevelText: "No disponible",
          completeness: null,
        };
        State.offByEan.set(ean, outMissing);
        PersistentCache.persistOffByEan(ean, outMissing);
        return outMissing;
      }

      const nutriscoreGrade = Utils.normalizeDisplayValue(
        product?.nutriscore_grade ? String(product.nutriscore_grade) : null
      );
      const novaGroup = product?.nova_group != null ? Number(product.nova_group) : null;

      const additivesN =
        product?.additives_n != null
          ? Number(product.additives_n)
          : Array.isArray(product?.additives_tags)
          ? product.additives_tags.length
          : null;

      const glutenInfo = Utils.glutenInfoFromProduct(product);
      const allergensInfo = Utils.allergensInfoFromProduct(product);

      const fiberRaw =
        product?.nutriments?.fiber_100g != null ? product.nutriments.fiber_100g : null;
      const fiber100g = fiberRaw != null ? Number(fiberRaw) : null;

      const proteinsRaw =
        product?.nutriments?.proteins_100g != null ? product.nutriments.proteins_100g : null;
      const proteins100g = proteinsRaw != null ? Number(proteinsRaw) : null;

      const saltRaw =
        product?.nutriments?.salt_100g != null ? product.nutriments.salt_100g : null;
      const salt100g = saltRaw != null ? Number(saltRaw) : null;
      const saltLevel = Utils.saltLevelFromValue(salt100g);

      const completeness = product?.completeness != null ? Number(product.completeness) : null;

      const out = {
        hasOffData: true,
        nutriscoreGrade,
        novaGroup,
        additivesN,
        glutenInfo,
        allergensInfo,
        fiber100g,
        proteins100g,
        salt100g,
        saltLevelText: Utils.normalizeDisplayValue(saltLevel.text),
        completeness,
      };

      out.hasOffData = Utils.hasMeaningfulOffData(out);

      State.offByEan.set(ean, out);
      PersistentCache.persistOffByEan(ean, out);
      return out;
    })();

    State.inFlight.set(key, p);
    try {
      return await p;
    } finally {
      State.inFlight.delete(key);
    }
  },
};


export { Indexer, API };
