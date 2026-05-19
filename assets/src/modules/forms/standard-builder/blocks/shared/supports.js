/**
 * Shared `supports` profiles for the form field blocks.
 *
 * Declaring these flags in `block.json` (or in `settings.supports`) is
 * what unlocks the FULL native Gutenberg inspector — color picker on the
 * theme palette, typography panel (font family / size / weight / line-
 * height / letter-spacing), spacing (padding / margin / block gap), border
 * (width / color / radius / style), dimensions (min height, aspect ratio),
 * align (left/center/right/wide/full), anchor + className, etc.
 *
 * Each control respects theme.json — same behaviour as `core/paragraph`,
 * `core/heading`, `core/group` and friends.
 *
 * Two profiles:
 *   - `FIELD_SUPPORTS`  — for input-type fields (label + input + help)
 *   - `BUTTON_SUPPORTS` — for the submit button (mirrors `core/button`)
 */

export const FIELD_SUPPORTS = {
	html: false,
	reusable: false,
	anchor: true,
	className: true,
	align: false,
	color: {
		text: true,
		background: true,
		link: false,
		gradients: false,
	},
	typography: {
		fontSize: true,
		lineHeight: true,
		__experimentalFontFamily: true,
		__experimentalFontWeight: true,
		__experimentalFontStyle: true,
		__experimentalLetterSpacing: true,
		__experimentalTextTransform: true,
		__experimentalDefaultControls: {
			fontSize: true,
		},
	},
	spacing: {
		margin: true,
		padding: true,
		blockGap: true,
		__experimentalDefaultControls: {
			margin: false,
			padding: true,
		},
	},
	__experimentalBorder: {
		color: true,
		radius: true,
		style: true,
		width: true,
		__experimentalDefaultControls: {
			color: true,
			radius: true,
		},
	},
	dimensions: {
		minHeight: false,
	},
	layout: {
		default: { type: 'flex', orientation: 'vertical' },
		allowSwitching: false,
		allowEditing: false,
	},
};

/**
 * Submit button mirrors `core/button` settings so the user gets the
 * same look-and-feel they're used to from the post editor.
 */
export const BUTTON_SUPPORTS = {
	html: false,
	reusable: false,
	anchor: true,
	className: true,
	align: [ 'left', 'center', 'right', 'wide', 'full' ],
	color: {
		text: true,
		background: true,
		gradients: true,
		__experimentalDefaultControls: {
			background: true,
			text: true,
		},
	},
	typography: {
		fontSize: true,
		lineHeight: true,
		__experimentalFontFamily: true,
		__experimentalFontWeight: true,
		__experimentalFontStyle: true,
		__experimentalLetterSpacing: true,
		__experimentalTextTransform: true,
		__experimentalDefaultControls: {
			fontSize: true,
		},
	},
	spacing: {
		margin: true,
		padding: true,
		__experimentalDefaultControls: {
			padding: true,
		},
	},
	__experimentalBorder: {
		color: true,
		radius: true,
		style: true,
		width: true,
		__experimentalDefaultControls: {
			color: true,
			radius: true,
			width: true,
		},
	},
	shadow: true,
	__experimentalSelector: '.wp-block-button__link',
};
