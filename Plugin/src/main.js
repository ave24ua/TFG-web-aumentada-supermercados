import { Runtime } from "./runtime.js";
import { PersistentCache } from "./persistent-cache.js";
import { Indexer } from "./data.js";
import { UI } from "./ui.js";
import { Filters, Badges } from "./dom-filters.js";

function init() {
  Runtime.setReapplyFilters(() => Filters.reapplyAll());
  PersistentCache.hydrateStateFromLocalStorage();
  Indexer.hookFetch();

  document.addEventListener("DOMContentLoaded", () => {
    UI.init();
    Badges.init();
  });
}

export { init };
