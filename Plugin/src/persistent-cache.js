import { Config, State } from "./core.js";

const PersistentCache = {
  stores: {
    eanById: null,
    offByEan: null,
    idByNameKey: null,
  },

  loadStore(storageKey) {
    try {
      const raw = localStorage.getItem(storageKey);
      if (!raw) return {};
      const parsed = JSON.parse(raw);
      return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {};
    } catch {
      try {
        localStorage.setItem(storageKey, JSON.stringify({}));
      } catch {}
      return {};
    }
  },

  saveStore(storageKey, obj) {
    try {
      localStorage.setItem(storageKey, JSON.stringify(obj || {}));
    } catch {}
  },

  cleanupExpiredEntries(storeObj, ttlMs) {
    const out = {};
    const now = Date.now();
    const src = storeObj && typeof storeObj === "object" ? storeObj : {};

    for (const [key, entry] of Object.entries(src)) {
      if (!entry || typeof entry !== "object") continue;
      const ts = Number(entry.ts);
      if (!Number.isFinite(ts)) continue;
      if (now - ts > ttlMs) continue;
      out[key] = { value: entry.value, ts };
    }

    return out;
  },

  getValidEntry(storeObj, key, ttlMs) {
    const entry = storeObj?.[key];
    if (!entry || typeof entry !== "object") return null;
    const ts = Number(entry.ts);
    if (!Number.isFinite(ts)) return null;
    if (Date.now() - ts > ttlMs) return null;
    return entry.value;
  },

  setEntry(storeObj, key, value) {
    storeObj[key] = {
      value,
      ts: Date.now(),
    };
  },

  ensureHydrated() {
    if (!State.persistentHydrated) {
      PersistentCache.hydrateStateFromLocalStorage();
    }
  },

  hydrateStateFromLocalStorage() {
    const eanStore = PersistentCache.cleanupExpiredEntries(
      PersistentCache.loadStore(Config.STORAGE.cacheEanByIdKey),
      Config.CACHE_TTL.eanByIdMs
    );
    const offStore = PersistentCache.cleanupExpiredEntries(
      PersistentCache.loadStore(Config.STORAGE.cacheOffByEanKey),
      Config.CACHE_TTL.offByEanMs
    );
    const idStore = PersistentCache.cleanupExpiredEntries(
      PersistentCache.loadStore(Config.STORAGE.cacheIdByNameKey),
      Config.CACHE_TTL.idByNameKeyMs
    );

    PersistentCache.stores.eanById = eanStore;
    PersistentCache.stores.offByEan = offStore;
    PersistentCache.stores.idByNameKey = idStore;

    PersistentCache.saveStore(Config.STORAGE.cacheEanByIdKey, eanStore);
    PersistentCache.saveStore(Config.STORAGE.cacheOffByEanKey, offStore);
    PersistentCache.saveStore(Config.STORAGE.cacheIdByNameKey, idStore);

    for (const [id, entry] of Object.entries(eanStore)) {
      if (entry?.value != null) State.eanById.set(String(id), String(entry.value));
    }

    for (const [ean, entry] of Object.entries(offStore)) {
      if (entry?.value && typeof entry.value === "object") State.offByEan.set(String(ean), entry.value);
    }

    for (const [nameKey, entry] of Object.entries(idStore)) {
      if (entry?.value != null) State.idByNameKey.set(String(nameKey), String(entry.value));
    }

    State.persistentHydrated = true;
  },

  getEanById(id) {
    PersistentCache.ensureHydrated();
    return PersistentCache.getValidEntry(
      PersistentCache.stores.eanById,
      String(id),
      Config.CACHE_TTL.eanByIdMs
    );
  },

  getOffByEan(ean) {
    PersistentCache.ensureHydrated();
    return PersistentCache.getValidEntry(
      PersistentCache.stores.offByEan,
      String(ean),
      Config.CACHE_TTL.offByEanMs
    );
  },

  getIdByNameKey(nameKey) {
    PersistentCache.ensureHydrated();
    return PersistentCache.getValidEntry(
      PersistentCache.stores.idByNameKey,
      String(nameKey),
      Config.CACHE_TTL.idByNameKeyMs
    );
  },

  persistEanById(id, ean) {
    if (id == null || !ean) return;
    PersistentCache.ensureHydrated();
    PersistentCache.setEntry(PersistentCache.stores.eanById, String(id), String(ean));
    PersistentCache.saveStore(Config.STORAGE.cacheEanByIdKey, PersistentCache.stores.eanById);
  },

  persistOffByEan(ean, offData) {
    if (!ean || !offData || typeof offData !== "object") return;
    PersistentCache.ensureHydrated();
    PersistentCache.setEntry(PersistentCache.stores.offByEan, String(ean), offData);
    PersistentCache.saveStore(Config.STORAGE.cacheOffByEanKey, PersistentCache.stores.offByEan);
  },

  persistIdByNameKey(nameKey, id) {
    if (!nameKey || id == null) return;
    PersistentCache.ensureHydrated();
    PersistentCache.setEntry(PersistentCache.stores.idByNameKey, String(nameKey), String(id));
    PersistentCache.saveStore(Config.STORAGE.cacheIdByNameKey, PersistentCache.stores.idByNameKey);
  },
};


export { PersistentCache };
