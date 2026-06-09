import { __ } from '@wordpress/i18n';
import { pencil as icon } from '@wordpress/icons';
import editComponent from './edit';
import { FIELD_SUPPORTS } from '../shared/supports';
import saveInnerBlocks from '../shared/save';
import { INPUT_STYLE_ATTRIBUTE } from '../shared/input-style';

export const name = 'formspress/field-text';

export const settings = {
	apiVersion: 3,
	title: __( 'Text field', 'formspress' ),
	description: __( 'A short single-line text input.', 'formspress' ),
	category: 'formspress-fields',
	icon,
	keywords: [ __( 'text', 'formspress' ), __( 'input', 'formspress' ) ],
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
	},
	edit: editComponent,
	save: saveInnerBlocks,
};
