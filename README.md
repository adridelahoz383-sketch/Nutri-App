# NutriTrack

Aplicacion web local-first de seguimiento de calorias, macronutrientes y peso corporal.
Hecha con HTML, CSS y JavaScript vanilla (ES Modules). Sin frameworks ni dependencias en runtime.

## Ejecutar

Los ES Modules requieren servir la app por HTTP (no funciona abriendo `index.html` con doble clic).

```bash
# Opcion 1: Node
npx serve .

# Opcion 2: Python
python -m http.server 8080

# Opcion 3: VS Code, extension "Live Server"
```

Luego abre http://localhost:3000 (o el puerto que indique la herramienta).

## Tests

```bash
node --test tests/
```

Sin dependencias: usa el runner nativo de Node (requiere Node >= 20).

## Estructura

- `index.html` — shell de la app
- `css/` — tokens, base, layout, componentes, widgets, vistas
- `js/domain/` — logica pura y testeable (calculos, busqueda, parseo, validacion, fechas)
- `js/core/` — store, acciones, selectores, router
- `js/storage/` — repositorio sobre localStorage, esquemas, migraciones, export/import
- `js/ui/` — helper de DOM, componentes y vistas
- `js/config.js` — todas las constantes numericas con su fuente
- `js/i18n/es.js` — todos los textos visibles
- `data/foods.js` — base de alimentos estatica
- `tests/` — tests unitarios e integracion (node:test)
- `docs/ESPECIFICACION.md` — especificacion maestra del producto

## Documentacion

Lee `docs/ESPECIFICACION.md` para la especificacion completa (formulas, modelo de datos,
criterios de aceptacion) y `docs/FOOD_DATA.md` para la metodologia de la base de alimentos.
