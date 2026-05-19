import { __ } from '@wordpress/i18n';
import {
	styledGroup,
	heading,
	description,
	fieldText,
	fieldEmail,
	fieldSelect,
	fieldCheckbox,
	fieldTextarea,
	submitButton,
} from './_helpers';

/**
 * Event registration — premium conference / workshop feel. Bold dark
 * header section + warm white card body, full-width primary CTA in
 * a saturated brand colour. Side-by-side first / last names via
 * `core/columns`. Demonstrates the most layout-rich pattern in the
 * library.
 */
const sideBySideNames = `<!-- wp:columns {"style":{"spacing":{"blockGap":{"left":"16px"}}}} -->
<div class="wp-block-columns">
<!-- wp:column -->
<div class="wp-block-column">
${ fieldText( { label: __( 'First name', 'flowforms' ), required: true } ) }
</div>
<!-- /wp:column -->
<!-- wp:column -->
<div class="wp-block-column">
${ fieldText( { label: __( 'Last name', 'flowforms' ), required: true } ) }
</div>
<!-- /wp:column -->
</div>
<!-- /wp:columns -->`;

export default {
	title: __( 'Event registration', 'flowforms' ),
	description: __(
		'Conference / workshop registration with ticket type + dietary. Layout-rich.',
		'flowforms'
	),
	keywords: [ 'event', 'register', 'ticket', 'workshop', 'conference' ],
	content: styledGroup( {
		bg: '#ffffff',
		border: '#1e293b',
		borderWidth: '2px',
		radius: '14px',
		padding: '48px',
		maxWidth: '600px',
		inner: [
			heading( {
				text: __( 'Register for the event', 'flowforms' ),
				size: '30px',
				weight: '800',
				color: '#0f172a',
			} ),
			description( {
				text: __(
					'Limited seats — registration closes one week before the event.',
					'flowforms'
				),
				color: '#475569',
				size: '15px',
				marginBottom: '24px',
			} ),
			sideBySideNames,
			fieldEmail( {
				label: __( 'Email', 'flowforms' ),
				required: true,
				placeholder: 'you@example.com',
			} ),
			fieldText( { label: __( 'Company / organisation', 'flowforms' ) } ),
			fieldSelect( {
				label: __( 'Ticket type', 'flowforms' ),
				required: true,
				options: [
					{
						label: __( 'General admission', 'flowforms' ),
						value: 'general',
					},
					{ label: __( 'VIP', 'flowforms' ), value: 'vip' },
					{ label: __( 'Student', 'flowforms' ), value: 'student' },
				],
			} ),
			fieldCheckbox( {
				label: __( 'Dietary preferences', 'flowforms' ),
				options: [
					{
						label: __( 'Vegetarian', 'flowforms' ),
						value: 'vegetarian',
					},
					{ label: __( 'Vegan', 'flowforms' ), value: 'vegan' },
					{
						label: __( 'Gluten-free', 'flowforms' ),
						value: 'gluten-free',
					},
				],
			} ),
			fieldTextarea( {
				label: __( 'Anything else we should know?', 'flowforms' ),
				rows: 3,
			} ),
			submitButton( {
				text: __( 'Complete registration', 'flowforms' ),
				bg: '#dc2626',
				fg: '#ffffff',
				full: true,
			} ),
		].join( '\n' ),
	} ),
};
