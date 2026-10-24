# Licencias y atribuciones

## Iconos
`assets/icons.svg` — iconos dibujados a mano inspirados en el estilo de Lucide (lucide.dev, licencia ISC).
Disenio propio; no se copian paths de terceros.

## Datos de composicion de alimentos
Los valores de referencia por 100 g/ml de `data/foods.js` proceden de
**USDA FoodData Central** (U.S. Department of Agriculture, Agricultural Research Service, 2019.
fdc.nal.usda.gov), publicados en dominio publico bajo **CC0 1.0 Universal**.
Porciones de medidas caseras de USDA FNDDS/SR Legacy o estimaciones propias documentadas
(`portionSource` en cada alimento). Las preparaciones tipicas marcadas con `variable: true`
son estimaciones de alta variabilidad.

## Formulas
- BMR: Mifflin-St Jeor (1990), Am J Clin Nutr 51(2):241-247.
- Factores de actividad: multiplicadores clasicos coherentes con rangos PAL FAO/WHO/UNU (2004).
- Proteina: ISSN Position Stand (2017); Iraki et al. (2019).
- Tendencia de peso: media movil exponencial inspirada en The Hacker's Diet (Walker, 2005).

Ver `docs/ESPECIFICACION.md` §35 para la lista completa de fuentes.
