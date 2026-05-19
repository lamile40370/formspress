import { __ } from '@wordpress/i18n';
import { arrowRight as icon } from '@wordpress/icons';
import { InnerBlocks } from '@wordpress/block-editor';
import editComponent from './edit';

export const name = 'formspress/field-submit';

/**
 * Thin semantic wrapper around a single `core/button`. The wrapper is
 * what makes a button submit-typed when read by FormRenderer; the inner
 * `core/button` owns the visual styling and inherits everything the
 * post editor's native button has (theme.json, all `supports`, etc.).
 *
 * Wrapper-level supports are minimal — anything visual happens on the
 * inner button. We do keep `align` so the user can wide/full the whole
 * submit row.
 */
export const settings = {
	apiVersion: 3,
	title: __( 'Submit button', 'flowforms' ),
	description: __(
		'Submits the form. Inherits all native WordPress button styling.',
		'flowforms'
	),
	category: 'formspress-fields',
	icon,
	keywords: [ __( 'submit', 'flowforms' ), __( 'button', 'flowforms' ) ],
	supports: {
		html: false,
		reusable: false,
		anchor: true,
		className: true,
		align: [ 'wide', 'full' ],
	},
	// No attributes here — the inner `core/button` carries `text`, color,
	// border, typography, etc. directly. FormRenderer reads them off
	// `innerBlocks[0]->attrs` and emits `<button type="submit">`.
	attributes: {},
	edit: editComponent,
	save: () => <InnerBlocks.Content />,
};
