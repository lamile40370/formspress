import { __ } from '@wordpress/i18n';
import { category as icon } from '@wordpress/icons';
import editComponent from './edit';
import { FIELD_SUPPORTS } from '../shared/supports';
import saveInnerBlocks from '../shared/save';
import { INPUT_STYLE_ATTRIBUTE } from '../shared/input-style';

export const name = 'formspress/field-radio';

export const settings = {
	apiVersion: 3,
	title: __( 'Radio buttons', 'flowforms' ),
	description: __( 'A single choice from a list of options.', 'flowforms' ),
	category: 'formspress-fields',
	icon,
	keywords: [ __( 'radio', 'flowforms' ), __( 'choice', 'flowforms' ) ],
	supports: FIELD_SUPPORTS,
	attributes: {
		fieldId: { type: 'string', default: '' },
		label: { type: 'string', default: '' },
		required: { type: 'boolean', default: false },
		help: { type: 'string', default: '' },
		placeholder: { type: 'string', default: '' },
		defaultValue: { type: 'string', default: '' },
		inputStyle: INPUT_STYLE_ATTRIBUTE,
		options: { type: 'array', default: [] },
	},
	edit: editComponent,
	save: saveInnerBlocks,
};
