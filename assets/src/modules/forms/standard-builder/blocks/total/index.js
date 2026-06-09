import { __ } from '@wordpress/i18n';
import { receipt as icon } from '@wordpress/icons';
import editComponent from './edit';
import { FIELD_SUPPORTS } from '../shared/supports';
import saveInnerBlocks from '../shared/save';
import { INPUT_STYLE_ATTRIBUTE } from '../shared/input-style';

export const name = 'formspress/field-total';

export const settings = {
	apiVersion: 3,
	title: __( 'Total', 'formspress' ),
	description: __( 'Displays the checkout total from product quantities.', 'formspress' ),
	category: 'formspress-fields',
	icon,
	keywords: [
		__( 'total', 'formspress' ),
		__( 'checkout', 'formspress' ),
		__( 'payment', 'formspress' ),
	],
	supports: FIELD_SUPPORTS,
	attributes: {
		fieldId: { type: 'string', default: 'total' },
		label: { type: 'string', default: 'Total' },
		required: { type: 'boolean', default: false },
		help: { type: 'string', default: '' },
		placeholder: { type: 'string', default: '' },
		defaultValue: { type: 'string', default: '' },
		inputStyle: INPUT_STYLE_ATTRIBUTE,
		conditions: { type: 'object' },
		currency: { type: 'string', default: 'EUR' },
		totalLayout: { type: 'string', default: 'inline' },
		showLabel: { type: 'boolean', default: true },
	},
	edit: editComponent,
	save: saveInnerBlocks,
};
