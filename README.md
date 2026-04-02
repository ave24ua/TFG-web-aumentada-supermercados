# NutriVisor

Proyecto académico de web aumentada aplicado al supermercado online, orientado a enriquecer la experiencia de compra con información nutricional ampliada, indicadores visuales y filtros automáticos sobre los productos mostrados en la web de Mercadona.

## Visión general

`NutriVisor` nace como un Trabajo de Fin de Grado centrado en cómo integrar datos abiertos de alimentación en interfaces de comercio electrónico para facilitar decisiones de compra más informadas, rápidas y comprensibles.

El proyecto añade una capa de interpretación visual sobre los productos del supermercado online y combina:

- datos internos accesibles desde la propia web de Mercadona;
- códigos EAN resueltos dinámicamente;
- información nutricional y de composición procedente de Open Food Facts;
- reglas visuales que transforman datos complejos en señales rápidas de lectura.

## Qué aporta

Sobre cada producto visible, `NutriVisor` puede mostrar:

- `Nutri-Score`
- `NOVA`
- `Aditivos`
- `Gluten`
- `Alérgenos`
- `Fibra`
- `Proteínas`
- `Nivel de sal`

Además, el sistema permite aplicar filtros visuales automáticos para resaltar, ocultar o marcar productos en función de distintos criterios nutricionales y de disponibilidad de información.

## Estructura del repositorio

Este repositorio contiene dos líneas principales del proyecto:

### 1. Userscript para Tampermonkey

Archivo principal:

- `Script`

Esta versión fue el punto de partida funcional del sistema. Está diseñada como userscript para ejecutarse sobre `https://tienda.mercadona.es/*` y contiene la lógica completa de:

- interceptación de `fetch` en la SPA;
- resolución de `idMercadona -> EAN`;
- consulta a Open Food Facts;
- generación de tooltips nutricionales;
- filtros visuales y estados de tarjeta;
- caché en memoria y persistencia local.

### 2. Plugin para Google Chrome

Carpeta principal:

- `Plugin/`

Esta carpeta contiene la evolución del proyecto hacia una extensión compatible con Chrome bajo `Manifest V3`.

La versión del plugin:

- mantiene la funcionalidad esencial del userscript;
- reorganiza el código en módulos para facilitar mantenimiento y escalabilidad;
- se compila con `Vite`;
- genera una build final lista para pruebas o distribución en la carpeta `dist`.

Subestructura destacada del plugin:

- `Plugin/src/`: código fuente modular.
- `Plugin/public/`: manifiesto y recursos públicos.
- `Plugin/dist/`: versión compilada de la extensión.

## Arquitectura funcional

El sistema sigue un flujo general como este:

1. Detecta tarjetas de producto en la interfaz de Mercadona.
2. Aprende identificadores internos interceptando respuestas de la SPA.
3. Resuelve el EAN del producto mediante la API de Mercadona.
4. Consulta Open Food Facts para obtener información nutricional ampliada.
5. Transforma esos datos en visualizaciones claras y filtros automáticos.

## Componentes lógicos principales

En la implementación actual, el proyecto se organiza conceptualmente en bloques como:

- configuración y selectores;
- estado y cachés;
- utilidades y normalización;
- persistencia local;
- indexación de productos;
- acceso a APIs;
- interfaz y estilos;
- resolución DOM;
- filtros visuales;
- badges y tooltips;
- arranque general de la aplicación.

## Enfoque académico

`NutriVisor` se desarrolla con finalidad académica, investigadora y demostrativa. El proyecto no tiene ánimo de lucro y se plantea como una exploración aplicada sobre:

- web aumentada;
- experiencia de usuario en e-commerce;
- integración de datos abiertos;
- visualización de información nutricional en contexto de compra.

## Estado del proyecto

El repositorio recoge tanto la versión funcional original basada en Tampermonkey como la versión modular preparada para evolución hacia extensión de navegador.

En su estado actual, el proyecto ya demuestra:

- enriquecimiento visual de fichas de producto;
- filtrado automático sin interacción extra del usuario;
- persistencia local y optimización de llamadas;
- transición desde prototipo userscript a extensión moderna bajo `Manifest V3`.
