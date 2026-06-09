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
 * Contact form — clean white card with subtle border, the universal
 * default. Sober typography, dark filled submit. Works on every theme.
 */
export default {
	title: __( 'Contact form', 'formspress' ),
	description: __(
		'Classic name + email + subject + message — clean white card.',
		'formspress'
	),
	keywords: [ 'contact', 'form', 'support', 'message' ],
	content: styledGroup( {
		inner: [
			heading( { text: __( 'Contact us', 'formspress' ), size: '28px' } ),
			description( {
				text: __(
					'We typically reply within one business day.',
					'formspress'
				),
				marginBottom: '20px',
			} ),
			fieldText( {
				label: __( 'Your name', 'formspress' ),
				required: true,
				placeholder: __( 'Jane Doe', 'formspress' ),
			} ),
			fieldEmail( {
				label: __( 'Email', 'formspress' ),
				required: true,
				placeholder: 'you@example.com',
			} ),
			fieldText( {
				label: __( 'Subject', 'formspress' ),
				placeholder: __( 'How can we help?', 'formspress' ),
			} ),
			fieldTextarea( {
				label: __( 'Message', 'formspress' ),
				required: true,
				rows: 6,
			} ),
			submitButton( { text: __( 'Send message', 'formspress' ) } ),
		].join( '\n' ),
	} ),
};
