import { __ } from '@wordpress/i18n';
import { envelope as icon } from '@wordpress/icons';
import editComponent from './edit';
import { FIELD_SUPPORTS } from '../shared/supports';
import saveInnerBlocks from '../shared/save';
import { INPUT_STYLE_ATTRIBUTE } from '../shared/input-style';

export const name = 'formspress/field-email';

export const settings = {
	apiVersion: 3,
	title: __( 'Email field', 'flowforms' ),
	description: __( 'Collect an email address.', 'flowforms' ),
	category: 'formspress-fields',
	icon,
	keywords: [ __( 'email', 'flowforms' ), __( 'address', 'flowforms' ) ],
	supports: FIELD_SUPPORTS,
	attributes: {
		fieldId: { type: 'string', default: '' },
		label: { type: 'string', default: '' },
		required: { type: 'boolean', default: false },
		help: { type: 'string', default: '' },
		placeholder: { type: 'string', default: '' },
		defaultValue: { type: 'string', default: '' },
		inputStyle: INPUT_STYLE_ATTRIBUTE,
	},
	edit: editComponent,
	save: saveInnerBlocks,
};
