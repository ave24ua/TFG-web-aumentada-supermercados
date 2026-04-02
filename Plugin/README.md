# NutriVisor Extension

`NutriVisor` es una extensión de navegador orientada a enriquecer la lectura nutricional de productos mostrados en la web de Mercadona mediante una capa visual informativa apoyada en Open Food Facts.

## Finalidad

La extensión transforma información nutricional y de composición en señales visuales rápidas, comprensibles y directamente integradas en la interfaz de compra.

Su propósito es facilitar una interpretación más inmediata de los productos sin exigir al usuario abrir fichas externas ni consultar bases de datos por separado.

## Capacidades principales

La extensión puede mostrar sobre los productos:

- `Nutri-Score`
- `NOVA`
- `Aditivos`
- `Gluten`
- `Alérgenos`
- `Fibra`
- `Proteínas`
- `Nivel de sal`

También incorpora filtros visuales configurables para:

- resaltar productos que cumplen un umbral de `Nutri-Score`;
- remarcar u ocultar productos que no lo cumplen;
- ocultar productos sin `Nutri-Score`;
- ocultar productos sin información útil;
- ocultar productos con gluten.

## Cómo funciona

`NutriVisor` actúa directamente sobre `https://tienda.mercadona.es/*` y combina:

- detección de tarjetas de producto en la interfaz;
- resolución de identificadores internos del sitio;
- obtención de códigos EAN;
- consulta de Open Food Facts;
- representación visual en tooltips, badges y estados de tarjeta.

## Estructura técnica

La versión de extensión está organizada de forma modular para facilitar su mantenimiento y evolución:

- `src/`: fuente modular de la extensión.
- `public/`: manifiesto y recursos públicos.
- `dist/`: build final preparada para Chrome.

La build final se genera con `Vite`, manteniendo la extensión alineada con `Manifest V3`.

## Marco del proyecto

`NutriVisor` forma parte de un proyecto académico y no tiene ánimo de lucro. Su orientación es investigadora y demostrativa, con foco en:

- web aumentada aplicada a e-commerce;
- visualización de información nutricional;
- apoyo a decisiones de compra más informadas;
- integración práctica de datos abiertos en interfaces reales.
