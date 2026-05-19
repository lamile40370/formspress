import { __ } from '@wordpress/i18n';
import {
	styledGroup,
	heading,
	description,
	fieldText,
	fieldEmail,
	fieldTextarea,
	submitButton,
} from './_helpers';

/**
 * Two-column contact — compact layout with first/last name on the
 * same row via `core/columns`. White card, subtle border, dark
 * filled submit. Demonstrates the `columns` block playing well with
 * our field blocks.
 */
const sideBySideNames = `<!-- wp:columns {"style":{"spacing":{"blockGap":{"left":"16px"}}}} -->
<div class="wp-block-columns">
<!-- wp:column -->
<div class="wp-block-column">
${ fieldText( {
	label: __( 'First name', 'flowforms' ),
	required: true,
	placeholder: __( 'Jane', 'flowforms' ),
} ) }
</div>
<!-- /wp:column -->
<!-- wp:column -->
<div class="wp-block-column">
${ fieldText( {
	label: __( 'Last name', 'flowforms' ),
	required: true,
	placeholder: __( 'Doe', 'flowforms' ),
} ) }
</div>
<!-- /wp:column -->
</div>
<!-- /wp:columns -->`;

export default {
	title: __( 'Two-column contact form', 'flowforms' ),
	description: __(
		'Compact layout with side-by-side first / last name columns.',
		'flowforms'
	),
	keywords: [ 'columns', 'contact', 'compact', 'inline' ],
	content: styledGroup( {
		bg: '#ffffff',
		border: '#e5e7eb',
		radius: '12px',
		padding: '40px',
		maxWidth: '640px',
		inner: [
			heading( {
				text: __( 'Get in touch', 'flowforms' ),
				size: '26px',
				weight: '700',
				color: '#111827',
			} ),
			description( {
				text: __(
					'Drop us a line — we read every message.',
					'flowforms'
				),
				color: '#6b7280',
				size: '14px',
				marginBottom: '20px',
			} ),
			sideBySideNames,
			fieldEmail( {
				label: __( 'Email', 'flowforms' ),
				required: true,
				placeholder: 'you@example.com',
			} ),
			fieldTextarea( {
				label: __( 'Message', 'flowforms' ),
				rows: 5,
				required: true,
			} ),
			submitButton( { text: __( 'Send message', 'flowforms' ) } ),
		].join( '\n' ),
	} ),
};
