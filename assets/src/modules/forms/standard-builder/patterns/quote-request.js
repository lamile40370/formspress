import { __ } from '@wordpress/i18n';
import {
	styledGroup,
	heading,
	description,
	fieldText,
	fieldEmail,
	fieldSelect,
	fieldTextarea,
	submitButton,
} from './_helpers';

/**
 * Quote request — professional B2B look. Light grey background card
 * with a thin accent border on top, structured for sales-qualified
 * lead capture (service, budget, project brief). Accent indigo button.
 */
export default {
	title: __( 'Quote request', 'flowforms' ),
	description: __(
		'B2B lead capture — service, budget, project details. Indigo accent.',
		'flowforms'
	),
	keywords: [ 'quote', 'lead', 'sales', 'request', 'budget', 'b2b' ],
	content: styledGroup( {
		bg: '#f9fafb',
		border: '#e5e7eb',
		borderWidth: '1px',
		radius: '12px',
		padding: '40px',
		maxWidth: '560px',
		inner: [
			heading( {
				text: __( 'Get a free quote', 'flowforms' ),
				size: '26px',
				weight: '700',
				color: '#111827',
			} ),
			description( {
				text: __(
					'Tell us about your project. We reply within 24 hours.',
					'flowforms'
				),
				color: '#6b7280',
				size: '14px',
				marginBottom: '20px',
			} ),
			fieldText( {
				label: __( 'Full name', 'flowforms' ),
				required: true,
				placeholder: __( 'Jane Doe', 'flowforms' ),
			} ),
			fieldEmail( {
				label: __( 'Work email', 'flowforms' ),
				required: true,
				placeholder: 'jane@company.com',
			} ),
			fieldText( {
				label: __( 'Company', 'flowforms' ),
				placeholder: __( 'Acme Inc.', 'flowforms' ),
			} ),
			fieldSelect( {
				label: __( 'Service needed', 'flowforms' ),
				required: true,
				options: [
					{ label: __( 'Design', 'flowforms' ), value: 'design' },
					{
						label: __( 'Development', 'flowforms' ),
						value: 'development',
					},
					{
						label: __( 'Consulting', 'flowforms' ),
						value: 'consulting',
					},
					{ label: __( 'Other', 'flowforms' ), value: 'other' },
				],
			} ),
			fieldSelect( {
				label: __( 'Estimated budget', 'flowforms' ),
				options: [
					{ label: '< $5k', value: 'lt5k' },
					{ label: '$5k – $20k', value: '5to20' },
					{ label: '$20k – $100k', value: '20to100' },
					{ label: '> $100k', value: 'gt100' },
				],
			} ),
			fieldTextarea( {
				label: __( 'Tell us about the project', 'flowforms' ),
				rows: 5,
				required: true,
			} ),
			submitButton( {
				text: __( 'Request quote', 'flowforms' ),
				bg: '#4f46e5',
				fg: '#ffffff',
			} ),
		].join( '\n' ),
	} ),
};
