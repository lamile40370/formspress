import { __ } from '@wordpress/i18n';
import {
	heading,
	description,
	fieldEmail,
	fieldText,
	submitButton,
} from './_helpers';

/**
 * Cover hero — a `core/cover` as the form's root container. Bold
 * full-bleed treatment with a dark overlay, white text on top, and
 * an inline-feeling form below the headline. Demonstrates that the
 * root container doesn't have to be `core/group` — `core/cover`,
 * `core/columns` and `core/media-text` are all recognised root types.
 *
 * The cover block carries an overlay colour (#0f172a, ~75% opacity)
 * over an optional background image. Users can swap the background
 * image from the Block tab once they insert the pattern.
 *
 * Constrained inner layout (520px) so the form sits centred on top of
 * the cover, regardless of viewport width.
 */
const inner = [
	heading( {
		text: __( 'Start your free trial', 'flowforms' ),
		size: '36px',
		weight: '800',
		align: 'center',
		color: '#ffffff',
		marginBottom: '8px',
	} ),
	description( {
		text: __(
			'No credit card required. 14 days, full access, cancel anytime.',
			'flowforms'
		),
		color: '#e2e8f0',
		size: '16px',
		align: 'center',
		marginBottom: '28px',
	} ),
	fieldText( {
		label: __( 'Work email', 'flowforms' ),
		required: true,
		placeholder: 'jane@company.com',
	} ),
	fieldEmail( {
		label: __( 'Confirm email', 'flowforms' ),
		required: true,
		placeholder: 'jane@company.com',
	} ),
	submitButton( {
		text: __( "Get started — it's free", 'flowforms' ),
		bg: '#ffffff',
		fg: '#0f172a',
		full: true,
	} ),
].join( '\n' );

const coverAttrs = {
	dimRatio: 70,
	overlayColor: 'black',
	customOverlayColor: '#0f172a',
	minHeight: 560,
	minHeightUnit: 'px',
	contentPosition: 'center center',
	isDark: true,
	layout: { type: 'constrained', contentSize: '520px' },
	style: {
		spacing: {
			padding: {
				top: '64px',
				right: '32px',
				bottom: '64px',
				left: '32px',
			},
		},
	},
};

const coverInlineStyle =
	'padding-top:64px;padding-right:32px;padding-bottom:64px;padding-left:32px;min-height:560px';
const overlayInlineStyle = 'background-color:#0f172a';

export default {
	title: __( 'Cover hero', 'flowforms' ),
	description: __(
		'Full-bleed cover block as the form root — hero headline + email capture.',
		'flowforms'
	),
	keywords: [
		'cover',
		'hero',
		'landing',
		'lead',
		'optin',
		'trial',
		'signup',
	],
	content: `<!-- wp:cover ${ JSON.stringify( coverAttrs ) } -->
<div class="wp-block-cover is-light has-custom-content-position is-position-center-center" style="${ coverInlineStyle }"><span aria-hidden="true" class="wp-block-cover__background has-background-dim-70 has-background-dim has-black-background-color" style="${ overlayInlineStyle }"></span><div class="wp-block-cover__inner-container">
${ inner }
</div></div>
<!-- /wp:cover -->`,
};
