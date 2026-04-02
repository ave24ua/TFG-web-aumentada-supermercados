import { Config } from "./core.js";

const Runtime = {
  reapplyTimer: null,
  reapplyFilters: null,

  setReapplyFilters(fn) {
    Runtime.reapplyFilters = typeof fn === "function" ? fn : null;
  },

  scheduleReapplyFilters() {
    clearTimeout(Runtime.reapplyTimer);
    Runtime.reapplyTimer = setTimeout(() => {
      if (typeof Runtime.reapplyFilters === "function") {
        Runtime.reapplyFilters();
      }
    }, Config.MUTATION_DEBOUNCE_MS);
  },
};

export { Runtime };
