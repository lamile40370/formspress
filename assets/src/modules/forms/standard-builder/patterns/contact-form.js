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
	title: __( 'Contact form', 'flowforms' ),
	description: __(
		'Classic name + email + subject + message — clean white card.',
		'flowforms'
	),
	keywords: [ 'contact', 'form', 'support', 'message' ],
	content: styledGroup( {
		inner: [
			heading( { text: __( 'Contact us', 'flowforms' ), size: '28px' } ),
			description( {
				text: __(
					'We typically reply within one business day.',
					'flowforms'
				),
				marginBottom: '20px',
			} ),
			fieldText( {
				label: __( 'Your name', 'flowforms' ),
				required: true,
				placeholder: __( 'Jane Doe', 'flowforms' ),
			} ),
			fieldEmail( {
				label: __( 'Email', 'flowforms' ),
				required: true,
				placeholder: 'you@example.com',
			} ),
			fieldText( {
				label: __( 'Subject', 'flowforms' ),
				placeholder: __( 'How can we help?', 'flowforms' ),
			} ),
			fieldTextarea( {
				label: __( 'Message', 'flowforms' ),
				required: true,
				rows: 6,
			} ),
			submitButton( { text: __( 'Send message', 'flowforms' ) } ),
		].join( '\n' ),
	} ),
};
