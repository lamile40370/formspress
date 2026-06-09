import { __ } from '@wordpress/i18n';
import {
	styledGroup,
	heading,
	description,
	fieldRadio,
	fieldTextarea,
	fieldEmail,
	submitButton,
} from './_helpers';

/**
 * Feedback / survey — soft mint background, green accent button.
 * Optimistic, low-friction. Used for post-purchase NPS, doc-page
 * helpfulness, page-rating widgets.
 */
export default {
	title: __( 'Feedback', 'formspress' ),
	description: __(
		'Rate experience + free-form comment. Mint card, green accent.',
		'formspress'
	),
	keywords: [ 'feedback', 'rating', 'survey', 'review', 'nps' ],
	content: styledGroup( {
		bg: '#ecfdf5',
		border: '#a7f3d0',
		borderWidth: '1px',
		radius: '14px',
		padding: '40px',
		maxWidth: '520px',
		inner: [
			heading( {
				text: __( 'Help us improve', 'formspress' ),
				size: '24px',
				weight: '700',
				color: '#065f46',
			} ),
			description( {
				text: __(
					'Two minutes — your feedback shapes the next release.',
					'formspress'
				),
				color: '#047857',
				size: '14px',
				marginBottom: '20px',
			} ),
			fieldRadio( {
				label: __( 'How was your experience?', 'formspress' ),
				required: true,
				options: [
					{
						label: __( 'Excellent', 'formspress' ),
						value: 'excellent',
					},
					{ label: __( 'Good', 'formspress' ), value: 'good' },
					{ label: __( 'Average', 'formspress' ), value: 'average' },
					{ label: __( 'Poor', 'formspress' ), value: 'poor' },
				],
			} ),
			fieldTextarea( {
				label: __( 'Anything we should know?', 'formspress' ),
				rows: 4,
			} ),
			fieldEmail( {
				label: __( 'Email (optional)', 'formspress' ),
				placeholder: __(
					"We'll only use it to follow up.",
					'formspress'
				),
			} ),
			submitButton( {
				text: __( 'Send feedback', 'formspress' ),
				bg: '#059669',
				fg: '#ffffff',
			} ),
		].join( '\n' ),
	} ),
};
