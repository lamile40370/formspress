import { __ } from '@wordpress/i18n';
import { cart as icon } from '@wordpress/icons';
import editComponent from './edit';
import { FIELD_SUPPORTS } from '../shared/supports';
import saveInnerBlocks from '../shared/save';
import { INPUT_STYLE_ATTRIBUTE } from '../shared/input-style';

export const name = 'formspress/field-product';

export const settings = {
	apiVersion: 3,
	title: __( 'Product', 'formspress' ),
	description: __( 'A checkout product with quantity and unit price.', 'formspress' ),
	category: 'formspress-fields',
	icon,
	keywords: [
		__( 'product', 'formspress' ),
		__( 'checkout', 'formspress' ),
		__( 'price', 'formspress' ),
	],
	supports: FIELD_SUPPORTS,
	attributes: {
		fieldId: { type: 'string', default: '' },
		label: { type: 'string', default: '' },
		required: { type: 'boolean', default: false },
		help: { type: 'string', default: '' },
		placeholder: { type: 'string', default: '' },
		defaultValue: { type: 'string', default: '' },
		inputStyle: INPUT_STYLE_ATTRIBUTE,
		conditions: { type: 'object' },
		productName: { type: 'string', default: '' },
		price: { type: 'number', default: 0 },
		currency: { type: 'string', default: 'EUR' },
		minQuantity: { type: 'number', default: 0 },
		maxQuantity: { type: 'number' },
		stepQuantity: { type: 'number', default: 1 },
		productLayout: { type: 'string', default: 'stacked' },
		showProductName: { type: 'boolean', default: true },
		showUnitPrice: { type: 'boolean', default: true },
		showQuantityLabel: { type: 'boolean', default: true },
		showLineTotal: { type: 'boolean', default: true },
		quantityLabel: { type: 'string', default: 'Quantity' },
	},
	edit: editComponent,
	save: saveInnerBlocks,
};
