import { __ } from '@wordpress/i18n';
import editComponent from './edit';

export const name = 'formspress/field-page-break';

export const settings = {
	apiVersion: 3,
	title: __( 'Page Break', 'formspress' ),
	description: __(
		'Starts a new step in the public form.',
		'formspress'
	),
	category: 'formspress-fields',
	icon: 'controls-pause',
	keywords: [
		__( 'page', 'formspress' ),
		__( 'step', 'formspress' ),
		__( 'pagination', 'formspress' ),
	],
	supports: {
		html: false,
		reusable: false,
	},
	attributes: {},
	edit: editComponent,
	save: () => null,
};
