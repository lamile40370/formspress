# FlowForms — Developer Notes

## Architecture quick-reference

- **PHP namespace**: `FlowForms\` → `src/`
- **REST namespace**: `flowforms/v1`
- **DB table prefix**: `ff_` (ff_forms, ff_entries, ff_entry_values, ff_migrations)
- **Option name**: `flowforms_settings`, `flowforms_version`
- **Admin menu slug**: `flowforms`
- **Text domain**: `flowforms`

## Module pattern

Each module lives in `src/Modules/<Name>/` and must:
1. Extend `AbstractModule`, implement `get_id()` and `get_name()`
2. Return `Routes::class` from `get_routes()` if it has REST endpoints
3. Return the migrations directory path from `get_migrations_path()` if it has migrations
4. Register services via `register_services(Container $c)`
5. Add WordPress hooks in `boot()` via `add_action` / `add_filter` directly
6. Register itself in `ModuleRegistry::register_modules()` under the `flowforms_modules` filter

> **Important**: The `#[Action]` / `#[Filter]` PHP 8 Attributes are only processed for classes explicitly passed to `HookRegistry::register()`. Modules are NOT auto-registered there — use `add_action()` in `boot()` instead.

## Adding a module — checklist

1. Create `src/Modules/<Name>/<Name>Module.php` (extend AbstractModule)
2. Create `src/Modules/<Name>/Routes.php` (extend AbstractRoutes) + endpoint classes
3. Create `src/Modules/<Name>/Migrations/YYYY_MM_DD_NNNNNN_<class>.php` if DB tables needed
4. Add module class to the `flowforms_modules` array in `ModuleRegistry.php`
5. Create `assets/src/modules/<name>/` with React components + `index.js` exporting routes
6. Import and spread routes in `assets/src/App.js`
7. Run `npm run build`

## Migration filename → class name

The `MigrationRunner` strips the first 4 underscore-separated parts (YYYY, MM, DD, NNNNNN) and titlecases the rest. Example:
`2026_05_07_000001_create_forms_table.php` → class `CreateFormsTable`

The migration class must NOT be namespaced (top-level class), and must extend `FlowForms\Core\AbstractMigration`.

## Public REST endpoint

The `SubmitForm` endpoint (`POST /forms/{id}/submit`) must use `'permission_callback' => '__return_true'`. It cannot go through `AbstractRoutes::route()` which always applies `manage_options`. Register it directly with `register_rest_route()` in `Routes::register()`.

## Blocks

- Both blocks (`flowforms/form`, `flowforms/flow-form`) are registered via `BlocksModule::register_blocks()` on `init`
- PHP registration uses `register_block_type( 'flowforms/form', [ ... render_callback ... ] )` — no block.json needed
- JS registration via `registerBlockType()` in `assets/src/editor/index.js` — single `editor` webpack bundle
- Editor script (`flowforms-editor`) is enqueued by `Assets.php` on `enqueue_block_editor_assets`
- Frontend CSS/JS (`assets/frontend/forms.css` + `assets/frontend/forms.js`) are standalone (no build step), enqueued by `FormRenderer::enqueue_frontend_assets()` once per page

## Frontend forms (no-build JS)

`assets/frontend/forms.js` is a vanilla JS IIFE — handles both standard form AJAX submission and flow form step-by-step navigation. It reads `window.ffData.apiRoot` and `window.ffData.nonce` set by `FormRenderer::enqueue_frontend_assets()`.

## Build commands

```bash
cd flowforms
composer install          # generates vendor/autoload.php
npm install               # first time only
npm run build             # production build → assets/build/
npm run start             # watch mode
```

## FSE theme integration

Frontend CSS uses CSS custom properties mapped to WordPress theme.json presets:
- `--wp--preset--color--primary` → primary brand colour
- `--wp--preset--font-size--medium` → base font size
- `--wp--preset--font-family--body` → body font
- `--wp--custom--border-radius` → border radius

All form field styles inherit these, so forms automatically match the active FSE theme.

## Admin UI conventions

- **Always use `<DataViews>` for any listing screen.** Forms, Templates,
  Entries, Integrations, Email templates, Logs — every collection rendered
  in the admin must mount `@wordpress/dataviews`, with appropriate
  `fields`, `filters`, `actions`, `getItemId`, and the `ff-page--dataviews`
  + `ff-dataviews-container` wrappers so it inherits the starter-plugin
  toolbar / pagination chrome. No bespoke `<Card>` grids or hand-rolled
  table rows for listings.

- **DataViews layout**: default to grid (`type: 'grid'`, set
  `mediaField` + `titleField` + `descriptionField`) for collections
  that benefit from a thumbnail (form templates, integrations, email
  designs). Default to table (`type: 'table'`) for transactional
  records (entries, logs). Always declare both layouts in
  `defaultLayouts` so the layout switcher works.

- **Page wrapper**: every admin page lives inside
  `<div className="ff-page ff-page--dataviews">` with a
  `<PageHeader>` on top and a `<div className="ff-page__body">`
  containing the DataViews container. The `_admin.scss` `.ff-page`
  rules handle padding / scrolling / pagination border behaviour
  identically to the starter-plugin Items page.

- **Native WP components everywhere**: prefer
  `@wordpress/components` (and `@wordpress/block-editor`'s
  `TabbedSidebar` via private-API unlock — see `lib/wp-private.js`)
  over custom HTML. Settings panels use `<PanelBody>`; the
  `.components-panel__body > * + *` SCSS rule in `_admin.scss`
  ensures 16 px spacing between controls when
  `__nextHasNoMarginBottom` is set.
