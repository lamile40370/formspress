import { __ } from '@wordpress/i18n';
import { check as icon } from '@wordpress/icons';
import editComponent from './edit';
import { FIELD_SUPPORTS } from '../shared/supports';
import saveInnerBlocks from '../shared/save';
import { INPUT_STYLE_ATTRIBUTE } from '../shared/input-style';

export const name = 'formspress/field-checkbox';

export const settings = {
	apiVersion: 3,
	title: __( 'Checkboxes', 'formspress' ),
	description: __(
		'One or more checkable choices from a list of options.',
		'formspress'
	),
	category: 'formspress-fields',
	icon,
	keywords: [ __( 'checkbox', 'formspress' ), __( 'choice', 'formspress' ) ],
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
