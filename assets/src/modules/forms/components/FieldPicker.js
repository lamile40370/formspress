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
		label: __( 'Text', 'formspress' ),
		icon: 'editor-insertmore',
		group: 'basic',
	},
	{
		type: 'email',
		label: __( 'Email', 'formspress' ),
		icon: 'email-alt',
		group: 'basic',
	},
	{
		type: 'phone',
		label: __( 'Phone', 'formspress' ),
		icon: 'phone',
		group: 'basic',
	},
	{
		type: 'number',
		label: __( 'Number', 'formspress' ),
		icon: 'calculator',
		group: 'basic',
	},
	{
		type: 'url',
		label: __( 'URL', 'formspress' ),
		icon: 'admin-links',
		group: 'basic',
	},
	{
		type: 'textarea',
		label: __( 'Long Text', 'formspress' ),
		icon: 'editor-paragraph',
		group: 'basic',
	},
	{
		type: 'select',
		label: __( 'Dropdown', 'formspress' ),
		icon: 'menu',
		group: 'choice',
	},
	{
		type: 'radio',
		label: __( 'Radio', 'formspress' ),
		icon: 'marker',
		group: 'choice',
	},
	{
		type: 'checkbox',
		label: __( 'Checkbox', 'formspress' ),
		icon: 'yes-alt',
		group: 'choice',
	},
	{
		type: 'yes_no',
		label: __( 'Yes / No', 'formspress' ),
		icon: 'yes',
		group: 'choice',
	},
	{
		type: 'date',
		label: __( 'Date', 'formspress' ),
		icon: 'calendar',
		group: 'advanced',
	},
	{
		type: 'time',
		label: __( 'Time', 'formspress' ),
		icon: 'clock',
		group: 'advanced',
	},
	{
		type: 'hidden',
		label: __( 'Hidden', 'formspress' ),
		icon: 'hidden',
		group: 'advanced',
	},
	{
		type: 'row',
		label: __( 'Columns', 'formspress' ),
		icon: 'columns',
		group: 'layout',
	},
	{
		type: 'statement',
		label: __( 'Statement', 'formspress' ),
		icon: 'format-quote',
		group: 'layout',
	},
	{
		type: 'section',
		label: __( 'Section', 'formspress' ),
		icon: 'minus',
		group: 'layout',
	},
	{
		type: 'page_break',
		label: __( 'Page Break', 'formspress' ),
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
	{ id: 'basic', label: __( 'Basic Fields', 'formspress' ) },
	{ id: 'choice', label: __( 'Choice Fields', 'formspress' ) },
	{ id: 'advanced', label: __( 'Advanced Fields', 'formspress' ) },
	{ id: 'layout', label: __( 'Layout', 'formspress' ) },
	{ id: 'custom', label: __( 'Custom Fields', 'formspress' ) },
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
