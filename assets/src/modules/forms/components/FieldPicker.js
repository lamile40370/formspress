import { Button, __experimentalGrid as Grid } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

/**
 * Static fallback list, used if PHP didn't ship a fieldTypes schema
 * (e.g. when the plugin admin script is loaded without
 * `wp_localize_script` — Storybook, tests, third-party embeds).
 */
const STATIC_FIELD_TYPES = [
	{
		type: 'text',
		label: __( 'Text', 'flowforms' ),
		icon: 'editor-insertmore',
		group: 'basic',
	},
	{
		type: 'email',
		label: __( 'Email', 'flowforms' ),
		icon: 'email-alt',
		group: 'basic',
	},
	{
		type: 'phone',
		label: __( 'Phone', 'flowforms' ),
		icon: 'phone',
		group: 'basic',
	},
	{
		type: 'number',
		label: __( 'Number', 'flowforms' ),
		icon: 'calculator',
		group: 'basic',
	},
	{
		type: 'url',
		label: __( 'URL', 'flowforms' ),
		icon: 'admin-links',
		group: 'basic',
	},
	{
		type: 'textarea',
		label: __( 'Long Text', 'flowforms' ),
		icon: 'editor-paragraph',
		group: 'basic',
	},
	{
		type: 'select',
		label: __( 'Dropdown', 'flowforms' ),
		icon: 'menu',
		group: 'choice',
	},
	{
		type: 'radio',
		label: __( 'Radio', 'flowforms' ),
		icon: 'marker',
		group: 'choice',
	},
	{
		type: 'checkbox',
		label: __( 'Checkbox', 'flowforms' ),
		icon: 'yes-alt',
		group: 'choice',
	},
	{
		type: 'yes_no',
		label: __( 'Yes / No', 'flowforms' ),
		icon: 'yes',
		group: 'choice',
	},
	{
		type: 'date',
		label: __( 'Date', 'flowforms' ),
		icon: 'calendar',
		group: 'advanced',
	},
	{
		type: 'time',
		label: __( 'Time', 'flowforms' ),
		icon: 'clock',
		group: 'advanced',
	},
	{
		type: 'file',
		label: __( 'File Upload', 'flowforms' ),
		icon: 'upload',
		group: 'advanced',
	},
	{
		type: 'rating',
		label: __( 'Rating', 'flowforms' ),
		icon: 'star-filled',
		group: 'advanced',
	},
	{
		type: 'opinion_scale',
		label: __( 'Opinion Scale', 'flowforms' ),
		icon: 'editor-ol',
		group: 'advanced',
	},
	{
		type: 'nps',
		label: __( 'NPS', 'flowforms' ),
		icon: 'chart-bar',
		group: 'advanced',
	},
	{
		type: 'hidden',
		label: __( 'Hidden', 'flowforms' ),
		icon: 'hidden',
		group: 'advanced',
	},
	{
		type: 'row',
		label: __( 'Columns', 'flowforms' ),
		icon: 'columns',
		group: 'layout',
	},
	{
		type: 'statement',
		label: __( 'Statement', 'flowforms' ),
		icon: 'format-quote',
		group: 'layout',
	},
	{
		type: 'section',
		label: __( 'Section', 'flowforms' ),
		icon: 'minus',
		group: 'layout',
	},
	{
		type: 'page_break',
		label: __( 'Page Break', 'flowforms' ),
		icon: 'controls-pause',
		group: 'layout',
	},
];

/**
 * Read the dynamic field-type registry shipped by PHP. Falls back to the
 * static list above if the registry isn't on `window.flowFormsData`
 * (backwards-compat — older third-party admin pages that copy this list).
 */
function readFieldTypes() {
	const fromPhp = window.flowFormsData?.fieldTypes;
	if ( ! Array.isArray( fromPhp ) || fromPhp.length === 0 ) {
		return STATIC_FIELD_TYPES;
	}
	/* Normalize PHP shape ({id, label, group, icon}) to the legacy ({type, label, group, icon}) JS shape. */
	return fromPhp.map( ( t ) => ( {
		type: t.id || t.type,
		label: t.label,
		group: t.group || 'custom',
		icon: t.icon || 'admin-generic',
		settings: t.settings || [],
		description: t.description || '',
	} ) );
}

export const FIELD_TYPES = readFieldTypes();

const GROUPS = [
	{ id: 'basic', label: __( 'Basic Fields', 'flowforms' ) },
	{ id: 'choice', label: __( 'Choice Fields', 'flowforms' ) },
	{ id: 'advanced', label: __( 'Advanced Fields', 'flowforms' ) },
	{ id: 'layout', label: __( 'Layout', 'flowforms' ) },
	{ id: 'custom', label: __( 'Custom Fields', 'flowforms' ) },
];

const FieldPicker = ( { onAdd } ) => (
	<div className="ff-field-picker">
		{ GROUPS.map( ( group ) => {
			const items = FIELD_TYPES.filter( ( f ) => f.group === group.id );
			if ( items.length === 0 ) {
				return null;
			}
			return (
				<div key={ group.id } className="ff-field-picker__group">
					<p className="ff-field-picker__group-label">
						{ group.label }
					</p>
					<Grid columns={ 2 } gap={ 1 }>
						{ items.map( ( field ) => (
							<Button
								key={ field.type }
								variant="secondary"
								size="small"
								className="ff-field-picker__item"
								onClick={ () => onAdd( field.type ) }
								label={ field.description || undefined }
							>
								<span
									className={ `dashicons dashicons-${ field.icon }` }
								/>
								{ field.label }
							</Button>
						) ) }
					</Grid>
				</div>
			);
		} ) }
	</div>
);

export default FieldPicker;
