import { __ } from '@wordpress/i18n';
import { chevronDown as icon } from '@wordpress/icons';
import editComponent from './edit';
import { FIELD_SUPPORTS } from '../shared/supports';
import saveInnerBlocks from '../shared/save';
import { INPUT_STYLE_ATTRIBUTE } from '../shared/input-style';

export const name = 'formspress/field-select';

export const settings = {
	apiVersion: 3,
	title: __( 'Select', 'formspress' ),
	description: __( 'A dropdown of selectable options.', 'formspress' ),
	category: 'formspress-fields',
	icon,
	keywords: [ __( 'select', 'formspress' ), __( 'dropdown', 'formspress' ) ],
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
		options: { type: 'array', default: [] },
	},
	edit: editComponent,
	save: saveInnerBlocks,
};
