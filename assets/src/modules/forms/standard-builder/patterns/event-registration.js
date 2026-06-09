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
${ fieldText( { label: __( 'First name', 'formspress' ), required: true } ) }
</div>
<!-- /wp:column -->
<!-- wp:column -->
<div class="wp-block-column">
${ fieldText( { label: __( 'Last name', 'formspress' ), required: true } ) }
</div>
<!-- /wp:column -->
</div>
<!-- /wp:columns -->`;

export default {
	title: __( 'Event registration', 'formspress' ),
	description: __(
		'Conference / workshop registration with ticket type + dietary. Layout-rich.',
		'formspress'
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
				text: __( 'Register for the event', 'formspress' ),
				size: '30px',
				weight: '800',
				color: '#0f172a',
			} ),
			description( {
				text: __(
					'Limited seats — registration closes one week before the event.',
					'formspress'
				),
				color: '#475569',
				size: '15px',
				marginBottom: '24px',
			} ),
			sideBySideNames,
			fieldEmail( {
				label: __( 'Email', 'formspress' ),
				required: true,
				placeholder: 'you@example.com',
			} ),
			fieldText( { label: __( 'Company / organisation', 'formspress' ) } ),
			fieldSelect( {
				label: __( 'Ticket type', 'formspress' ),
				required: true,
				options: [
					{
						label: __( 'General admission', 'formspress' ),
						value: 'general',
					},
					{ label: __( 'VIP', 'formspress' ), value: 'vip' },
					{ label: __( 'Student', 'formspress' ), value: 'student' },
				],
			} ),
			fieldCheckbox( {
				label: __( 'Dietary preferences', 'formspress' ),
				options: [
					{
						label: __( 'Vegetarian', 'formspress' ),
						value: 'vegetarian',
					},
					{ label: __( 'Vegan', 'formspress' ), value: 'vegan' },
					{
						label: __( 'Gluten-free', 'formspress' ),
						value: 'gluten-free',
					},
				],
			} ),
			fieldTextarea( {
				label: __( 'Anything else we should know?', 'formspress' ),
				rows: 3,
			} ),
			submitButton( {
				text: __( 'Complete registration', 'formspress' ),
				bg: '#dc2626',
				fg: '#ffffff',
				full: true,
			} ),
		].join( '\n' ),
	} ),
};
