const defaultConfig = require( '@wordpress/scripts/config/webpack.config' );
const path = require( 'path' );

/**
 * Two output trees:
 *   - assets/build/  for the admin + legacy editor bundles
 *   - blocks/{slug}/ for native Gutenberg blocks (block.json colocates
 *     `index.js` next to `block.json` + `render.php`).
 *
 * `view.js` files live under blocks/{slug}/ directly — they're plain
 * ESM modules that import `@wordpress/interactivity`, which WordPress
 * resolves via its importmap when loaded as `viewScriptModule`.
 */
module.exports = {
	...defaultConfig,
	entry: {
		index: path.resolve( __dirname, 'assets/src/index.js' ),
		editor: path.resolve( __dirname, 'assets/src/editor/index.js' ),
		'../../blocks/form/index': path.resolve(
			__dirname,
			'assets/src/blocks/form/block-editor.js'
		),
		'../../blocks/flow-form/index': path.resolve(
			__dirname,
			'assets/src/blocks/flow-form/block-editor.js'
		),
	},
	output: {
		...defaultConfig.output,
		path: path.resolve( __dirname, 'assets/build' ),
	},
};
