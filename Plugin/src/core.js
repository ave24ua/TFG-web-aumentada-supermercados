const Config = {
  LANG: "es",
  WAREHOUSE: "alc1",

  MD_API_PRODUCT: (id) =>
    `https://tienda.mercadona.es/api/products/${id}/?lang=${Config.LANG}&wh=${Config.WAREHOUSE}`,
  OFF_API_PRODUCT: (ean) => `https://world.openfoodfacts.org/api/v2/product/${ean}.json`,

  SELECTORS: {
    productCards: ['[data-testid="product-cell"]', ".product-cell"],
    name: ['[data-testid="product-cell-name"]', ".product-cell__description-name", "h4", "h3"],
    price: ['[data-testid="product-price"]', ".product-price__unit-price"],
    openDetailBtn: '[data-testid="open-product-detail"]',
    detailRoots: [
      '[data-testid="product-detail"]',
      '[data-testid="modal"]',
      '[role="dialog"][aria-modal="true"]',
      '[role="dialog"]',
      '.product-detail',
      '.modal-container',
      '.modal-dialog',
    ],
  },

  MUTATION_DEBOUNCE_MS: 250,
  INDEXER_STEP_LIMIT: 2500,
  FILTER_CONCURRENCY: 4,

  STORAGE: {
    infoOptionsKey: "tm_md_tooltip_options_v4",
    filterOptionsKey: "tm_md_filter_options_v3",
    cacheEanByIdKey: "tm_md_cache_eanById_v1",
    cacheOffByEanKey: "tm_md_cache_offByEan_v3",
    cacheIdByNameKey: "tm_md_cache_idByNameKey_v1",
  },

  CACHE_TTL: {
    eanByIdMs: 30 * 24 * 60 * 60 * 1000,
    offByEanMs: 7 * 24 * 60 * 60 * 1000,
    idByNameKeyMs: 7 * 24 * 60 * 60 * 1000,
  },

  INFO_OPTIONS: [
    { key: "nutriscore", label: "Nutri-Score" },
    { key: "nova", label: "NOVA (procesado)" },
    { key: "additives", label: "Aditivos" },
    { key: "gluten", label: "Gluten" },
    { key: "allergens", label: "Alérgenos" },
    { key: "fiber", label: "Fibra" },
    { key: "proteins", label: "Proteínas" },
    { key: "salt_level", label: "Nivel de sal" },
  ],

  INFO_HELP: {
    nutriscore: "Resume la calidad nutricional general del alimento con una escala de A a E.",
    nova: "Indica el grado de procesamiento industrial del alimento segun la clasificacion NOVA.",
    additives: "Muestra cuantos aditivos detecta Open Food Facts para ese producto.",
    gluten: "Se basa en alergenos, trazas y etiquetas de OFF para indicar si contiene gluten o no.",
    allergens: "Resume los alergenos y trazas declarados por Open Food Facts para ese producto.",
    fiber: "Muestra la cantidad de fibra por 100 g o 100 ml y la clasifica visualmente.",
    proteins: "Muestra la cantidad de proteínas por 100 g o 100 ml y la clasifica visualmente.",
    salt_level: "Clasifica la sal por cada 100 g o 100 ml en bajo, medio o alto.",
  },

  FILTER_HELP: {
    threshold: "Define el Nutri-Score minimo que aceptas para mostrar el producto como valido.",
    mode: "Decide si los productos que no cumplen se ocultan o solo se remarcan en rojo.",
    hideNoNutriScore: "Oculta productos que tienen ficha en Open Food Facts pero no incluyen Nutri-Score.",
    hideNoInfo: "Oculta productos para los que Open Food Facts no tiene una ficha util.",
    hideGluten: "Oculta productos que OFF marca como contienen gluten.",
  },

  FILTER_THRESHOLDS: [
    { value: "none", label: "Sin filtro" },
    { value: "a", label: "Solo A" },
    { value: "b", label: "B o mejor" },
    { value: "c", label: "C o mejor" },
    { value: "d", label: "D o mejor" },
  ],

  FILTER_MODES: [
    { value: "mark", label: "Remarcar en rojo" },
    { value: "hide", label: "Ocultar" },
  ],
};

/* <---------------------> */
/*           STATE         */
/* <---------------------> */
const State = {
  eanById: new Map(),
  offByEan: new Map(),
  idByNameKey: new Map(),
  inFlight: new Map(),
  persistentHydrated: false,

  uiInjected: false,

  filterQueue: [],
  filterQueueSet: new Set(),
  filterWorkerActive: 0,
};


export { Config, State };
