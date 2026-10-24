# Base de alimentos (`data/foods.js`)

## Fuentes

- **Nutrientes por 100 g/ml**: USDA FoodData Central (SR Legacy / Foundation Foods),
  dominio publico CC0 1.0. Valores de referencia; no son analisis del alimento concreto
  que consume el usuario.
- **Porciones de medida casera**: USDA FNDDS cuando existe equivalente; en caso
  contrario estimacion propia marcada en `portionSource`.
- **Estado de coccion**: siempre explicito en el nombre ("cocido", "crudo", "frito").
  Los valores corresponden al estado indicado; cocer cambia densidad de nutrientes.

## Criterios

- Nombres en espanol latinoamericano, con aliases colombianos frecuentes
  (banano/guineo, platano, arepa, frijol, etc.).
- Cada alimento declara `per100 { kcal, protein, carbs, fat, fiber? }`,
  `defaultPortion { grams, label }` y opcionalmente `portions` alternativas.
- `variable: true` marca preparaciones de alta variabilidad (arepas, sancochos,
  fritos): la app las muestra con la etiqueta de estimacion.
- La fibra no entra en el calculo de kcal del registro (USDA ya contabiliza
  energia metabolizable); se guarda solo como referencia.

## Limitaciones conocidas

- Las preparaciones tipicas (bandeja paisa, ajiaco, empanadas) varian mucho por
  receta; los valores son puntos de partida honestos, no cifras exactas.
- No hay codigos de barras ni API externa: el catalogo es estatico y ampliable
  con alimentos personalizados desde Perfil.
- Frutas/verduras por unidad usan pesos de referencia medios de USDA.

## Mantenimiento

- Anadir alimento: nueva entrada `F(...)` con id kebab-case unico, categoria de
  `FOOD_CATEGORIES`, porcion por defecto y `portionSource`.
- Los tests (`tests/foods.test.js`) verifican ids unicos, categorias validas,
  saneado de esquema y coherencia Atwater en >= 85 % del catalogo.
- Cambiar un alimento NO altera registros historicos: cada entrada del diario
  guarda una copia (`per100` snapshot) del valor usado.
