import { __ } from '@wordpress/i18n';
import { formatListBullets as icon } from '@wordpress/icons';
import editComponent from './edit';
import { FIELD_SUPPORTS } from '../shared/supports';
import saveInnerBlocks from '../shared/save';
import { INPUT_STYLE_ATTRIBUTE } from '../shared/input-style';

export const name = 'formspress/field-textarea';

export const settings = {
	apiVersion: 3,
	title: __( 'Textarea', 'flowforms' ),
	description: __( 'A multi-line text input.', 'flowforms' ),
	category: 'formspress-fields',
	icon,
	keywords: [ __( 'textarea', 'flowforms' ), __( 'paragraph', 'flowforms' ) ],
	supports: FIELD_SUPPORTS,
	attributes: {
		fieldId: { type: 'string', default: '' },
		label: { type: 'string', default: '' },
		required: { type: 'boolean', default: false },
		help: { type: 'string', default: '' },
		placeholder: { type: 'string', default: '' },
		defaultValue: { type: 'string', default: '' },
		inputStyle: INPUT_STYLE_ATTRIBUTE,
		rows: { type: 'number', default: 4 },
	},
	edit: editComponent,
	save: saveInnerBlocks,
};
