import {
	registerBlockType,
	getBlockType,
	getCategories,
	setCategories,
	setDefaultBlockName,
	getBlockTypes,
	registerBlockStyle,
} from '@wordpress/blocks';
import { registerCoreBlocks } from '@wordpress/block-library';
import { __ } from '@wordpress/i18n';

import * as text from './text';
import * as email from './email';
import * as textarea from './textarea';
import * as number from './number';
import * as select from './select';
import * as radio from './radio';
import * as checkbox from './checkbox';
import * as submit from './submit';

const ALL = [ text, email, textarea, number, select, radio, checkbox, submit ];

let done = false;

/**
 * Re-register every block style WordPress already knows about
 * server-side (PHP `register_block_style()` + theme.json
 * `styles.blocks.*.variations` that core processes into the registry
 * on init) into the JS-side `wp.blocks` registry.
 *
 * The native post editor gets this for free because the
 * `enqueue_block_editor_assets` action fires there, letting themes
 * enqueue a companion JS that calls `wp.blocks.registerBlockStyle()`.
 * Our custom admin page deliberately does NOT fire that action (to
 * avoid third-party listeners interfering with our setup), so we
 * have to bridge the registry ourselves.
 *
 * Source: `flowFormsData.blockStyleVariations` — dumped from
 * `WP_Block_Styles_Registry::get_instance()->get_all_registered()`.
 */
function registerServerBlockStyles() {
	const all = window.flowFormsData?.blockStyleVariations;
	if ( ! all || 'object' !== typeof all ) return;

	Object.entries( all ).forEach( ( [ blockName, styles ] ) => {
		if ( ! styles || 'object' !== typeof styles ) return;
		Object.values( styles ).forEach( ( style ) => {
			if ( ! style?.name ) return;
			try {
				registerBlockStyle( blockName, {
					name: style.name,
					label: style.label || style.name,
					isDefault: !! style.is_default,
				} );
			} catch ( e ) {
				// Style already registered — fine, ignore silently.
			}
		} );
	} );
}

export default function registerBlocks() {
	if ( done ) {
		return;
	}
	done = true;

	// 1. Make sure WP's core blocks (paragraph, heading, columns, group,
	//    image, separator, spacer, …) are registered — required so the
	//    default block appender + the inserter work, and so the user can
	//    actually compose forms with layout blocks. The function is a
	//    no-op on the second call so it's safe to invoke unconditionally.
	if ( getBlockTypes().length === 0 ) {
		registerCoreBlocks();
	}

	// 2. Add our category at the top of the inserter.
	const cats = getCategories();
	if ( ! cats.some( ( c ) => c.slug === 'formspress-fields' ) ) {
		setCategories( [
			{
				slug: 'formspress-fields',
				title: __( 'Form fields', 'flowforms' ),
			},
			...cats,
		] );
	}

	// 3. Register our form field blocks.
	ALL.forEach( ( { name, settings } ) => {
		if ( ! getBlockType( name ) ) {
			registerBlockType( name, settings );
		}
	} );

	// 4. Make `core/paragraph` the default block — this is what the
	//    BlockList default appender inserts when clicked. Without a
	//    default, the appender silently no-ops.
	setDefaultBlockName( 'core/paragraph' );

	// 5. Bridge the server-side block-style registry into JS so the
	//    Block Inspector's "Styles" picker shows the same options the
	//    native post editor does (e.g. Paragraph → Default / Display /
	//    Subtitle / Annotation; Button → Fill / Outline; …).
	registerServerBlockStyles();
}
