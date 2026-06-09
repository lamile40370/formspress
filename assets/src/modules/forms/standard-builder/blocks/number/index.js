import { __ } from '@wordpress/i18n';
import { formatListNumbered as icon } from '@wordpress/icons';
import editComponent from './edit';
import { FIELD_SUPPORTS } from '../shared/supports';
import saveInnerBlocks from '../shared/save';
import { INPUT_STYLE_ATTRIBUTE } from '../shared/input-style';

export const name = 'formspress/field-number';

export const settings = {
	apiVersion: 3,
	title: __( 'Number field', 'formspress' ),
	description: __( 'Numeric input with min, max, and step.', 'formspress' ),
	category: 'formspress-fields',
	icon,
	keywords: [ __( 'number', 'formspress' ), __( 'numeric', 'formspress' ) ],
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
		min: { type: 'number' },
		max: { type: 'number' },
		step: { type: 'number' },
	},
	edit: editComponent,
	save: saveInnerBlocks,
};
