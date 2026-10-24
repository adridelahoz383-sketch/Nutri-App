// data/foods.js — base de alimentos estatica del MVP.
// Valores por 100 g (o 100 ml) de referencia de USDA FoodData Central (SR Legacy / Foundation),
// dominio publico CC0. Porciones de medidas caseras USDA FNDDS o estimacion documentada.
// Estado de coccion explicito en el nombre; lo cocido va primero en alias ambiguos.
// Metodologia completa: docs/FOOD_DATA.md

export const FOOD_DATA_VERSION = '2026-09.1';

export const FOOD_CATEGORIES = [
  'cereales', 'tuberculos', 'legumbres', 'carnes', 'pescados', 'huevos', 'lacteos',
  'frutas', 'verduras', 'grasas', 'frutos-secos', 'bebidas', 'dulces', 'preparados', 'miscelaneos',
];

const SRC = 'USDA FoodData Central';
// F(id, nombre, categoria, [kcal, prot, carbs, grasa, fibra?], porcion [g, etiqueta], opciones)
function F(id, name, category, [kcal, protein, carbs, fat, fiber], [pg, plabel], o = {}) {
  return Object.freeze({
    id, name, category,
    aliases: o.aliases ?? [],
    unit: o.unit ?? 'g',
    per100: Object.freeze({ kcal, protein, carbs, fat, ...(fiber != null ? { fiber } : {}) }),
    defaultPortion: Object.freeze({ grams: pg, label: plabel }),
    portions: Object.freeze((o.portions ?? []).map(([g2, l2]) => Object.freeze({ grams: g2, label: l2 }))),
    source: Object.freeze({ name: SRC, ref: o.ref ?? null, retrieved: '2026-09' }),
    portionSource: o.portionSource ?? 'USDA FNDDS / estimacion documentada',
    variable: o.variable === true, // preparaciones de alta variabilidad
    isCustom: false,
  });
}

export const FOODS = Object.freeze([
  // ---------- CEREALES Y DERIVADOS ----------
  F('arroz-blanco-cocido', 'Arroz blanco cocido', 'cereales', [130, 2.7, 28.2, 0.3, 0.4], [150, '1 taza'], {
    aliases: ['arroz', 'arroz blanco'],
    portions: [[75, '1/2 taza'], [150, '1 taza'], [200, '1 taza grande']],
  }),
  F('arroz-integral-cocido', 'Arroz integral cocido', 'cereales', [123, 2.7, 25.6, 1.0, 1.6], [150, '1 taza'], {
    aliases: ['arroz integral'], portions: [[150, '1 taza']],
  }),
  F('pasta-cocida', 'Pasta cocida (espagueti, macarron)', 'cereales', [158, 5.8, 30.9, 0.9, 1.8], [140, '1 taza'], {
    aliases: ['pasta', 'espagueti', 'espaguetis', 'macarrones', 'fideos', 'tallarines'],
    portions: [[140, '1 taza'], [200, '1 plato']],
  }),
  F('quinoa-cocida', 'Quinoa cocida', 'cereales', [120, 4.4, 21.3, 1.9, 2.8], [150, '1 taza'], {
    aliases: ['quinoa', 'quinua'],
  }),
  F('avena-cruda', 'Avena en hojuelas (cruda)', 'cereales', [379, 13.2, 67.7, 6.5, 10.1], [40, '1/2 taza'], {
    aliases: ['avena', 'hojuelas de avena', 'oatmeal'], portions: [[40, '1/2 taza'], [80, '1 taza']],
  }),
  F('pan-blanco', 'Pan blanco', 'cereales', [265, 9.0, 49.0, 3.2, 2.7], [30, '1 rebanada'], {
    aliases: ['pan', 'pan de molde', 'pan tajado'], portions: [[30, '1 rebanada'], [60, '2 rebanadas']],
  }),
  F('pan-integral', 'Pan integral', 'cereales', [247, 13.0, 41.0, 3.4, 7.0], [32, '1 rebanada'], {
    aliases: ['pan integral', 'pan de molde integral'], portions: [[32, '1 rebanada']],
  }),
  F('pan-rollo', 'Pan (rollo/baguette)', 'cereales', [272, 9.0, 52.0, 3.2, 2.2], [50, '1 unidad'], {
    aliases: ['pan frances', 'baguette', 'pan duro', 'pan blandito'], variable: true,
  }),
  F('arepa-maiz', 'Arepa de maiz (asada, sin relleno)', 'cereales', [219, 5.5, 46.0, 1.8, 3.0], [120, '1 unidad'], {
    aliases: ['arepa'], portionSource: 'estimacion propia', variable: true,
  }),
  F('tortilla-maiz', 'Tortilla de maiz', 'cereales', [218, 5.7, 44.6, 2.9, 6.3], [26, '1 unidad'], {
    aliases: ['tortilla'], portions: [[26, '1 unidad'], [52, '2 unidades']],
  }),
  F('tortilla-trigo', 'Tortilla de trigo (wrap)', 'cereales', [304, 8.2, 50.0, 8.0, 2.6], [49, '1 unidad'], {
    aliases: ['tortilla de harina', 'wrap'],
  }),
  F('pan-pita', 'Pan pita', 'cereales', [275, 9.1, 55.7, 1.2, 2.2], [60, '1 unidad'], {
    aliases: ['pan pita', 'pita'],
  }),
  F('tofu', 'Tofu (firme)', 'legumbres', [76, 8.1, 1.9, 4.2, 0.3], [124, '1/2 taza'], {
    aliases: ['tofu'],
  }),
  F('corn-flakes', 'Cereal de maiz (corn flakes)', 'cereales', [357, 7.5, 84.0, 0.4, 3.3], [30, '1 taza'], {
    aliases: ['cereal', 'corn flakes', 'hojuelas de maiz'],
  }),
  F('granola', 'Granola', 'cereales', [471, 10.0, 64.0, 20.0, 7.0], [55, '1/2 taza'], {
    aliases: ['granola', 'muesli'],
  }),
  F('galletas-saladas', 'Galletas saladas (saltinas)', 'cereales', [434, 9.2, 71.5, 11.3, 2.9], [15, '5 galletas'], {
    aliases: ['galletas saladas', 'saltinas', 'galletas de soda'],
  }),
  F('avena-cocida', 'Avena cocida (con agua)', 'cereales', [71, 2.5, 12.0, 1.5, 1.7], [234, '1 taza'], {
    aliases: ['avena cocida', 'porridge'],
  }),

  // ---------- TUBERCULOS Y PLATANOS ----------
  F('papa-cocida', 'Papa cocida (con piel)', 'tuberculos', [87, 1.9, 20.1, 0.1, 1.8], [150, '1 papa mediana'], {
    aliases: ['papa', 'patata cocida'], portions: [[150, '1 mediana'], [200, '1 grande']],
  }),
  F('papa-frita', 'Papas fritas', 'tuberculos', [312, 3.4, 41.0, 15.0, 3.8], [117, 'porcion mediana'], {
    aliases: ['papas fritas', 'papas a la francesa'], portionSource: 'estimacion propia', variable: true,
  }),
  F('batata-cocida', 'Batata/boniato cocido', 'tuberculos', [86, 1.6, 20.1, 0.1, 3.0], [150, '1 unidad mediana'], {
    aliases: ['batata', 'boniato', 'camote'],
  }),
  F('yuca-cocida', 'Yuca cocida', 'tuberculos', [160, 1.4, 38.3, 0.3, 1.8], [140, '1 trozo'], {
    aliases: ['yuca', 'mandioca', 'casava'],
  }),
  F('platano-cocido', 'Platano verde cocido', 'tuberculos', [122, 1.3, 31.9, 0.4, 2.3], [140, '1 unidad'], {
    aliases: ['platano cocido', 'platano verde'],
  }),
  F('patacon', 'Patacon/toston (frito)', 'tuberculos', [232, 1.5, 41.0, 7.0, 2.5], [80, '2 unidades'], {
    aliases: ['patacon', 'toston', 'tostones'], portionSource: 'estimacion propia', variable: true,
  }),

  // ---------- LEGUMBRES ----------
  F('lentejas-cocidas', 'Lentejas cocidas', 'legumbres', [116, 9.0, 20.1, 0.4, 7.9], [180, '1 taza'], {
    aliases: ['lentejas', 'lenteja'],
  }),
  F('frijoles-negros-cocidos', 'Frijoles negros cocidos', 'legumbres', [132, 8.9, 23.7, 0.5, 8.7], [172, '1 taza'], {
    aliases: ['frijoles', 'frijol negro', 'caraotas', 'porotos negros'],
  }),
  F('frijoles-rojos-cocidos', 'Frijoles rojos cocidos', 'legumbres', [127, 8.7, 22.8, 0.5, 7.4], [177, '1 taza'], {
    aliases: ['frijoles rojos', 'frijol bola roja', 'habichuelas rojas', 'porotos'],
  }),
  F('garbanzos-cocidos', 'Garbanzos cocidos', 'legumbres', [164, 8.9, 27.4, 2.6, 7.6], [164, '1 taza'], {
    aliases: ['garbanzo', 'garbanzos'],
  }),
  F('guisantes-cocidos', 'Arvejas/guisantes cocidos', 'legumbres', [84, 5.4, 15.6, 0.2, 5.5], [160, '1 taza'], {
    aliases: ['arvejas', 'guisantes', 'chicharos', 'petit pois'],
  }),
  F('hummus', 'Hummus', 'legumbres', [166, 7.9, 14.3, 9.6, 6.0], [30, '2 cucharadas'], {
    aliases: ['humus'],
  }),

  // ---------- CARNES ----------
  F('pechuga-pollo-asada', 'Pechuga de pollo asada/a la plancha', 'carnes', [165, 31.0, 0, 3.6], [120, '1 pechuga mediana'], {
    aliases: ['pollo', 'pechuga', 'pechuga de pollo', 'pollo a la plancha'],
    portions: [[120, '1 mediana'], [85, '1 pequena'], [200, '1 grande']],
  }),
  F('muslo-pollo-asado', 'Muslo de pollo asado (sin piel)', 'carnes', [209, 26.0, 0, 10.9], [90, '1 muslo'], {
    aliases: ['muslo', 'muslo de pollo', 'pernil de pollo'],
  }),
  F('carne-molida', 'Carne molida de res cocida (90% magra)', 'carnes', [217, 26.1, 0, 11.8], [100, 'porcion'], {
    aliases: ['carne molida', 'carne picada', 'carne de res molida'],
  }),
  F('carne-res-asada', 'Carne de res asada (lomo)', 'carnes', [271, 26.0, 0, 17.9], [120, '1 filete'], {
    aliases: ['carne', 'carne de res', 'res', 'filete', 'lomo', 'bistec'], variable: true,
  }),
  F('cerdo-lomo-asado', 'Lomo de cerdo asado', 'carnes', [206, 29.5, 0, 9.1], [100, '1 filete'], {
    aliases: ['cerdo', 'lomo de cerdo', 'chuleta de cerdo'],
  }),
  F('tocino', 'Tocino/tocineta frita', 'carnes', [541, 37.0, 1.4, 42.0], [16, '2 tiras'], {
    aliases: ['tocino', 'tocineta', 'bacon'],
  }),
  F('jamon-cocido', 'Jamon cocido', 'carnes', [145, 20.9, 1.5, 5.5], [28, '1 tajada'], {
    aliases: ['jamon'],
  }),
  F('chorizo', 'Chorizo', 'carnes', [455, 24.0, 1.9, 38.3], [75, '1 unidad'], {
    aliases: ['chorizo', 'longaniza'], variable: true,
  }),
  F('salchicha', 'Salchicha (tipo viena)', 'carnes', [290, 10.3, 4.0, 25.9], [50, '1 unidad'], {
    aliases: ['salchicha', 'salchicha viena', 'perro caliente salchicha'], variable: true,
  }),

  // ---------- PESCADOS ----------
  F('atun-lata-agua', 'Atun en lata (en agua, escurrido)', 'pescados', [116, 25.5, 0, 0.8], [100, '1 lata pequena'], {
    aliases: ['atun', 'atun en lata', 'atun en agua'], portions: [[100, '1 lata'], [142, '1 lata grande']],
  }),
  F('salmon-asado', 'Salmon asado', 'pescados', [206, 22.0, 0, 12.3], [125, '1 filete'], {
    aliases: ['salmon'],
  }),
  F('tilapia', 'Tilapia cocida', 'pescados', [128, 26.0, 0, 2.7], [120, '1 filete'], {
    aliases: ['tilapia', 'mojarra'],
  }),
  F('sardina-lata', 'Sardinas en lata (en aceite, escurridas)', 'pescados', [208, 24.6, 0, 11.5], [92, '1 lata'], {
    aliases: ['sardina', 'sardinas'],
  }),
  F('camarones-cocidos', 'Camarones cocidos', 'pescados', [99, 24.0, 0.2, 0.3], [85, 'porcion'], {
    aliases: ['camaron', 'camarones', 'gambas', 'langostinos'],
  }),

  // ---------- HUEVOS ----------
  F('huevo-cocido', 'Huevo entero cocido', 'huevos', [155, 13.0, 1.1, 10.6], [50, '1 unidad'], {
    aliases: ['huevo', 'huevos', 'huevo duro'], portions: [[50, '1 unidad'], [100, '2 unidades']],
  }),
  F('huevo-frito', 'Huevo frito', 'huevos', [196, 13.6, 0.8, 14.8], [46, '1 unidad'], {
    aliases: ['huevo frito', 'huevos fritos'],
  }),
  F('huevo-revuelto', 'Huevo revuelto', 'huevos', [149, 10.0, 1.6, 11.0], [61, '1 unidad'], {
    aliases: ['huevos revueltos', 'revueltos', 'perico'], variable: true,
  }),
  F('clara-huevo', 'Clara de huevo cocida', 'huevos', [52, 10.9, 0.7, 0.2], [33, '1 clara'], {
    aliases: ['clara de huevo', 'claras'],
  }),

  // ---------- LACTEOS ----------
  F('leche-entera', 'Leche entera', 'lacteos', [61, 3.2, 4.8, 3.3], [244, '1 vaso'], {
    aliases: ['leche', 'leche entera'], unit: 'ml', portions: [[244, '1 vaso'], [200, '1 vaso pequeno']],
  }),
  F('leche-desnatada', 'Leche desnatada/descremada', 'lacteos', [34, 3.4, 5.0, 0.1], [245, '1 vaso'], {
    aliases: ['leche desnatada', 'leche descremada'], unit: 'ml',
  }),
  F('yogur-natural', 'Yogur natural entero', 'lacteos', [61, 3.5, 4.7, 3.3], [170, '1 envase'], {
    aliases: ['yogur', 'yogurt', 'yogurt natural'],
  }),
  F('yogur-griego', 'Yogur griego natural (desnatado)', 'lacteos', [59, 10.3, 3.6, 0.4], [170, '1 envase'], {
    aliases: ['yogur griego', 'yogurt griego'],
  }),
  F('queso-fresco', 'Queso fresco/blanco', 'lacteos', [276, 18.0, 3.5, 21.0], [40, '1 tajada'], {
    aliases: ['queso', 'queso fresco', 'queso blanco', 'quesito'], variable: true,
  }),
  F('queso-mozzarella', 'Queso mozzarella', 'lacteos', [254, 24.3, 2.9, 15.9], [28, '1 tajada'], {
    aliases: ['mozzarella', 'queso mozzarella'],
  }),
  F('queso-cheddar', 'Queso cheddar', 'lacteos', [402, 24.9, 1.3, 33.3], [28, '1 tajada'], {
    aliases: ['cheddar', 'queso cheddar'],
  }),
  F('queso-crema', 'Queso crema', 'lacteos', [342, 5.9, 4.1, 34.2], [28, '2 cucharadas'], {
    aliases: ['queso crema', 'cream cheese', 'filadelfia'],
  }),
  F('requeson', 'Requeson (cottage)', 'lacteos', [98, 11.1, 3.4, 4.3], [113, '1/2 taza'], {
    aliases: ['requeson', 'cottage'],
  }),
  F('queso-parmesano', 'Queso parmesano', 'lacteos', [431, 38.0, 4.1, 28.6, 0], [10, '1 cucharada rallado'], {
    aliases: ['parmesano', 'queso parmesano'],
  }),
  F('crema-agria', 'Crema agria', 'lacteos', [198, 2.4, 4.6, 19.4, 0], [24, '2 cucharadas'], {
    aliases: ['crema agria', 'sour cream', 'nata agria'],
  }),
  F('mantequilla', 'Mantequilla', 'lacteos', [717, 0.9, 0.1, 81.1], [10, '1 porcion'], {
    aliases: ['mantequilla', 'manteca'], portions: [[5, '1 cucharadita'], [10, '1 porcion']],
  }),

  // ---------- FRUTAS ----------
  F('banano', 'Banano (guineo)', 'frutas', [89, 1.1, 22.8, 0.3, 2.6], [118, '1 mediano'], {
    aliases: ['banano', 'banana', 'guineo', 'cambur'], portions: [[118, '1 mediano'], [136, '1 grande'], [90, '1 pequeno']],
  }),
  F('manzana', 'Manzana', 'frutas', [52, 0.3, 13.8, 0.2, 2.4], [182, '1 mediana'], {
    aliases: ['manzana'], portions: [[182, '1 mediana'], [125, '1 pequena']],
  }),
  F('pera', 'Pera', 'frutas', [57, 0.4, 15.2, 0.1, 3.1], [178, '1 mediana'], {
    aliases: ['pera'],
  }),
  F('naranja', 'Naranja', 'frutas', [47, 0.9, 11.8, 0.1, 2.4], [131, '1 mediana'], {
    aliases: ['naranja'],
  }),
  F('mandarina', 'Mandarina', 'frutas', [53, 0.8, 13.3, 0.3, 1.8], [88, '1 mediana'], {
    aliases: ['mandarina', 'tangerina', 'clementina'],
  }),
  F('uvas', 'Uvas', 'frutas', [69, 0.7, 18.1, 0.2, 0.9], [92, '1 taza'], {
    aliases: ['uva', 'uvas'],
  }),
  F('fresas', 'Fresas', 'frutas', [32, 0.7, 7.7, 0.3, 2.0], [144, '1 taza'], {
    aliases: ['fresa', 'fresas', 'frutilla'],
  }),
  F('arandanos', 'Arandanos', 'frutas', [57, 0.7, 14.5, 0.3, 2.4], [148, '1 taza'], {
    aliases: ['arandano', 'arandanos', 'mora azul'],
  }),
  F('mango', 'Mango', 'frutas', [60, 0.8, 15.0, 0.4, 1.6], [165, '1 taza'], {
    aliases: ['mango'],
  }),
  F('pina', 'Pina', 'frutas', [50, 0.5, 13.1, 0.1, 1.4], [165, '1 taza'], {
    aliases: ['pina', 'anana'],
  }),
  F('sandia', 'Sandia', 'frutas', [30, 0.6, 7.6, 0.2, 0.4], [152, '1 taza'], {
    aliases: ['sandia', 'patilla', 'melon de agua'],
  }),
  F('melon', 'Melon', 'frutas', [34, 0.8, 8.2, 0.2, 0.9], [160, '1 taza'], {
    aliases: ['melon'],
  }),
  F('papaya', 'Papaya', 'frutas', [43, 0.5, 10.8, 0.3, 1.7], [145, '1 taza'], {
    aliases: ['papaya', 'lechosa', 'fruta bomba'],
  }),
  F('kiwi', 'Kiwi', 'frutas', [61, 1.1, 14.7, 0.5, 3.0], [69, '1 unidad'], {
    aliases: ['kiwi'],
  }),
  F('aguacate', 'Aguacate (palta)', 'frutas', [160, 2.0, 8.5, 14.7, 6.7], [75, '1/2 unidad'], {
    aliases: ['aguacate', 'palta', 'avocado'], portions: [[75, '1/2 unidad'], [150, '1 unidad']],
  }),
  F('durazno', 'Durazno/melocoton', 'frutas', [39, 0.9, 9.5, 0.3, 1.5], [150, '1 mediano'], {
    aliases: ['durazno', 'melocoton', 'prisco'],
  }),
  F('ciruela', 'Ciruela', 'frutas', [46, 0.7, 11.4, 0.3, 1.4], [66, '1 unidad'], {
    aliases: ['ciruela'],
  }),
  F('limon', 'Limon', 'frutas', [29, 1.1, 9.3, 0.3, 2.8], [48, '1 unidad'], {
    aliases: ['limon', 'lima'],
  }),
  F('mora', 'Mora (zarzamora)', 'frutas', [43, 1.4, 9.6, 0.5, 5.3], [144, '1 taza'], {
    aliases: ['mora', 'zarzamora'],
  }),
  F('coco', 'Coco (pulpa rallada)', 'frutas', [354, 3.3, 15.2, 33.5, 9.0], [28, '1 punado'], {
    aliases: ['coco', 'coco rallado'],
  }),

  // ---------- VERDURAS ----------
  F('tomate', 'Tomate', 'verduras', [18, 0.9, 3.9, 0.2, 1.2], [123, '1 mediano'], {
    aliases: ['tomate'],
  }),
  F('lechuga', 'Lechuga', 'verduras', [15, 1.4, 2.9, 0.2, 1.3], [47, '1 taza'], {
    aliases: ['lechuga', 'ensalada de lechuga'],
  }),
  F('cebolla', 'Cebolla', 'verduras', [40, 1.1, 9.3, 0.1, 1.7], [110, '1 mediana'], {
    aliases: ['cebolla'],
  }),
  F('zanahoria', 'Zanahoria', 'verduras', [41, 0.9, 9.6, 0.2, 2.8], [61, '1 mediana'], {
    aliases: ['zanahoria'],
  }),
  F('pepino', 'Pepino', 'verduras', [15, 0.7, 3.6, 0.1, 0.5], [52, '1/2 taza'], {
    aliases: ['pepino', 'cohombro'],
  }),
  F('brocoli-cocido', 'Brocoli cocido', 'verduras', [35, 2.4, 7.2, 0.4, 3.3], [78, '1/2 taza'], {
    aliases: ['brocoli', 'brocoli cocido', 'brecol'],
  }),
  F('espinaca-cocida', 'Espinaca cocida', 'verduras', [23, 3.0, 3.8, 0.3, 2.4], [180, '1 taza'], {
    aliases: ['espinaca', 'espinacas'],
  }),
  F('champinones', 'Champinones', 'verduras', [22, 3.1, 3.3, 0.3, 1.0], [96, '1 taza'], {
    aliases: ['champinon', 'champinones', 'hongos', 'setas'],
  }),
  F('calabacin', 'Calabacin/zucchini', 'verduras', [17, 1.2, 3.1, 0.3, 1.0], [124, '1 taza'], {
    aliases: ['calabacin', 'zucchini', 'zapallito'],
  }),
  F('pimenton', 'Pimenton/pimiento rojo', 'verduras', [31, 1.0, 6.0, 0.3, 2.1], [119, '1 mediano'], {
    aliases: ['pimenton', 'pimiento', 'pimiento rojo', 'paprika'],
  }),
  F('maiz-dulce', 'Maiz dulce cocido (grano)', 'verduras', [96, 3.4, 21.0, 1.5, 2.4], [164, '1 taza'], {
    aliases: ['maiz', 'maiz dulce', 'choclo', 'elote'],
  }),
  F('coliflor-cocida', 'Coliflor cocida', 'verduras', [23, 1.8, 4.1, 0.5, 3.3], [62, '1/2 taza'], {
    aliases: ['coliflor'],
  }),
  F('repollo', 'Repollo/col', 'verduras', [25, 1.3, 5.8, 0.1, 2.5], [89, '1 taza'], {
    aliases: ['repollo', 'col'],
  }),
  F('verduras-mixtas', 'Ensalada mixta (lechuga, tomate, pepino)', 'verduras', [17, 1.0, 3.4, 0.2, 1.5], [100, '1 plato'], {
    aliases: ['ensalada', 'ensalada mixta', 'verduras'], portionSource: 'estimacion propia', variable: true,
  }),

  // ---------- GRASAS ----------
  F('aceite-oliva', 'Aceite de oliva', 'grasas', [884, 0, 0, 100], [14, '1 cucharada'], {
    aliases: ['aceite de oliva', 'aceite'], portions: [[5, '1 cucharadita'], [14, '1 cucharada']],
  }),
  F('aceite-vegetal', 'Aceite vegetal (girasol/canola)', 'grasas', [884, 0, 0, 100], [14, '1 cucharada'], {
    aliases: ['aceite vegetal', 'aceite de girasol', 'aceite de canola'],
    portions: [[5, '1 cucharadita'], [14, '1 cucharada']],
  }),
  F('mayonesa', 'Mayonesa', 'grasas', [680, 1.0, 0.6, 74.9], [14, '1 cucharada'], {
    aliases: ['mayonesa', 'mayo'],
  }),

  // ---------- FRUTOS SECOS Y SEMILLAS ----------
  F('almendras', 'Almendras', 'frutos-secos', [579, 21.2, 21.6, 49.9, 12.5], [28, '1 punado'], {
    aliases: ['almendra', 'almendras'],
  }),
  F('nueces', 'Nueces', 'frutos-secos', [654, 15.2, 13.7, 65.2, 6.7], [28, '1 punado'], {
    aliases: ['nuez', 'nueces', 'nuez de castilla'],
  }),
  F('mani', 'Mani/cacahuete tostado', 'frutos-secos', [567, 25.8, 16.1, 49.2, 8.5], [28, '1 punado'], {
    aliases: ['mani', 'cacahuete', 'cacahuate', 'manies'],
  }),
  F('crema-mani', 'Crema de mani/cacahuete', 'frutos-secos', [588, 25.1, 20.0, 50.0, 6.0], [32, '2 cucharadas'], {
    aliases: ['crema de mani', 'mantequilla de mani', 'peanut butter'],
  }),
  F('chia', 'Semillas de chia', 'frutos-secos', [486, 16.5, 42.1, 30.7, 34.4], [12, '1 cucharada'], {
    aliases: ['chia', 'semillas de chia'],
  }),
  F('pasas', 'Uvas pasas', 'frutos-secos', [299, 3.1, 79.2, 0.5, 3.7], [43, '1/4 taza'], {
    aliases: ['pasas', 'uva pasa', 'uvas pasas'],
  }),

  // ---------- BEBIDAS ----------
  F('cafe-negro', 'Cafe negro (sin azucar)', 'bebidas', [2, 0.3, 0, 0], [240, '1 taza'], {
    aliases: ['cafe', 'cafe negro', 'tinto', 'americano'], unit: 'ml',
  }),
  F('te', 'Te (sin azucar)', 'bebidas', [1, 0, 0.3, 0], [240, '1 taza'], {
    aliases: ['te', 'te negro', 'te verde', 'infusion'], unit: 'ml',
  }),
  F('jugo-naranja', 'Jugo de naranja', 'bebidas', [45, 0.7, 10.4, 0.2, 0.2], [248, '1 vaso'], {
    aliases: ['jugo de naranja', 'zumo de naranja', 'naranjada'], unit: 'ml',
  }),
  F('refresco-cola', 'Refresco de cola (azucarado)', 'bebidas', [42, 0, 10.6, 0], [330, '1 lata'], {
    aliases: ['gaseosa', 'cola', 'refresco', 'coca cola', 'soda'], unit: 'ml', variable: true,
  }),
  F('jugo-natural', 'Jugo natural de fruta (con agua)', 'bebidas', [40, 0.4, 9.8, 0.1, 0.3], [250, '1 vaso'], {
    aliases: ['jugo', 'jugo natural', 'zumo'], unit: 'ml', portionSource: 'estimacion propia', variable: true,
  }),
  F('cerveza', 'Cerveza', 'bebidas', [43, 0.5, 3.6, 0], [330, '1 lata/botella'], {
    aliases: ['cerveza'], unit: 'ml',
  }),
  F('vino-tinto', 'Vino tinto', 'bebidas', [85, 0.1, 2.6, 0], [147, '1 copa'], {
    aliases: ['vino', 'vino tinto'], unit: 'ml',
  }),
  F('bebida-deportiva', 'Bebida deportiva', 'bebidas', [26, 0, 6.4, 0], [360, '1 botella'], {
    aliases: ['bebida deportiva', 'suero', 'gatorade'], unit: 'ml', variable: true,
  }),
  F('agua', 'Agua', 'bebidas', [0, 0, 0, 0], [250, '1 vaso'], {
    aliases: ['agua'], unit: 'ml',
  }),

  // ---------- DULCES ----------
  F('chocolate-negro', 'Chocolate negro (70%)', 'dulces', [598, 7.8, 45.9, 42.6, 10.9], [28, '4 cuadros'], {
    aliases: ['chocolate', 'chocolate negro'],
  }),
  F('chocolate-leche', 'Chocolate con leche', 'dulces', [535, 7.7, 59.2, 29.7, 3.4], [28, '4 cuadros'], {
    aliases: ['chocolate con leche'],
  }),
  F('helado-vainilla', 'Helado de vainilla', 'dulces', [207, 3.5, 23.6, 11.0, 0.7], [66, '1 bola'], {
    aliases: ['helado'], variable: true,
  }),
  F('azucar', 'Azucar blanca', 'dulces', [387, 0, 99.9, 0], [12, '1 cucharada'], {
    aliases: ['azucar'], portions: [[4, '1 cucharadita'], [12, '1 cucharada']],
  }),
  F('miel', 'Miel', 'dulces', [304, 0.3, 82.4, 0], [21, '1 cucharada'], {
    aliases: ['miel'],
  }),
  F('mermelada', 'Mermelada', 'dulces', [278, 0.4, 69.0, 0.1, 1.1], [20, '1 cucharada'], {
    aliases: ['mermelada', 'jalea'],
  }),
  F('galletas-chocolate', 'Galletas con chips de chocolate', 'dulces', [488, 5.7, 64.0, 24.8, 2.4], [32, '2 unidades'], {
    aliases: ['galletas dulces', 'galletas de chocolate'], variable: true,
  }),
  F('dona', 'Dona/pastelito glaseado', 'dulces', [452, 4.9, 51.1, 25.2, 1.5], [75, '1 unidad'], {
    aliases: ['dona', 'donut', 'rosquilla'], variable: true,
  }),

  // ---------- PREPARADOS (alta variabilidad) ----------
  F('pizza', 'Pizza (queso, estilo pizzeria)', 'preparados', [266, 11.0, 33.0, 9.8, 2.3], [107, '1 porcion'], {
    aliases: ['pizza'], portionSource: 'estimacion propia', variable: true,
  }),
  F('empanada', 'Empanada de carne (frita)', 'preparados', [289, 7.7, 28.5, 15.9, 1.5], [100, '1 unidad'], {
    aliases: ['empanada'], portionSource: 'estimacion propia', variable: true,
  }),
  F('hamburguesa', 'Hamburguesa con pan (simple)', 'preparados', [295, 15.0, 24.0, 14.0, 1.0], [180, '1 unidad'], {
    aliases: ['hamburguesa'], portionSource: 'estimacion propia', variable: true,
  }),
  F('sancocho', 'Sancocho/sopa de pollo casera', 'preparados', [75, 5.0, 8.0, 2.5, 1.0], [350, '1 plato'], {
    aliases: ['sancocho', 'sopa de pollo'], portionSource: 'estimacion propia', variable: true,
  }),
]);
