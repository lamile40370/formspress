import { __ } from '@wordpress/i18n';
import {
	styledGroup,
	heading,
	description,
	fieldEmail,
	submitButton,
} from './_helpers';

/**
 * Newsletter signup — bold hero treatment. Deep navy card, large
 * centered heading, white text, inverted (white) submit button.
 * High contrast — designed to live above the fold.
 */
export default {
	title: __( 'Newsletter signup', 'formspress' ),
	description: __(
		'Bold dark hero card, centered, single email field.',
		'formspress'
	),
	keywords: [ 'newsletter', 'subscribe', 'optin', 'email', 'list' ],
	content: styledGroup( {
		bg: '#0f172a',
		fg: '#ffffff',
		border: null,
		radius: '16px',
		padding: '56px',
		maxWidth: '520px',
		textAlign: 'center',
		inner: [
			heading( {
				text: __( 'Join our newsletter', 'formspress' ),
				size: '32px',
				weight: '700',
				align: 'center',
				color: '#ffffff',
			} ),
			description( {
				text: __(
					'One email a week. No spam — unsubscribe anytime.',
					'formspress'
				),
				size: '15px',
				color: '#cbd5e1',
				align: 'center',
				marginBottom: '24px',
			} ),
			fieldEmail( {
				label: __( 'Email address', 'formspress' ),
				required: true,
				placeholder: 'you@example.com',
			} ),
			submitButton( {
				text: __( 'Subscribe', 'formspress' ),
				bg: '#ffffff',
				fg: '#0f172a',
				full: true,
			} ),
		].join( '\n' ),
	} ),
};
