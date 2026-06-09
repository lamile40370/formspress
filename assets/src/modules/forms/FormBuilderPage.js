import { useState, useEffect, useCallback, useRef } from '@wordpress/element';
import {
	Button,
	Spinner,
	TextControl,
	TextareaControl,
	SelectControl,
	ToggleControl,
	PanelBody,
	TabPanel,
	ColorPalette,
	Dropdown,
	Popover,
	RangeControl,
	SearchControl,
	FontSizePicker,
	Flex,
	FlexItem,
	FlexBlock,
	Toolbar,
	ToolbarGroup,
	ToolbarButton,
	__experimentalText as Text,
	__experimentalHeading as Heading,
	__experimentalVStack as VStack,
	__experimentalHStack as HStack,
	__experimentalToggleGroupControl as ToggleGroupControl,
	__experimentalToggleGroupControlOption as ToggleGroupControlOption,
} from '@wordpress/components';
import { __, sprintf } from '@wordpress/i18n';
import { useParams, useNavigate } from 'react-router-dom';
import { trash, chevronUp, chevronDown, plus } from '@wordpress/icons';
import { get, put } from '../../api/client';
import { form as formEndpoint } from '../../api/endpoints';
import { FIELD_TYPES } from './components/FieldPicker';
import ActionsPanel from './components/ActionsPanel';
import ConditionsPanel from './components/ConditionsPanel';
import EditorSkeleton from './components/EditorSkeleton';
import SaveAsTemplateModal from './SaveAsTemplateModal';

/**
 * Flatten a (possibly nested) field tree so condition-builder dropdowns can
 * reference fields living inside rows/cols.
 */
const flattenFieldTree = ( fields ) => {
	const out = [];
	for ( const f of fields || [] ) {
		if ( f.type === 'row' ) {
			for ( const col of f.cols || [] ) {
				for ( const child of col.fields || [] ) {
					out.push( child );
				}
			}
			continue;
		}
		out.push( f );
	}
	return out;
};

/* `share` substituted for non-existent `shareSquare` (see @wordpress/icons). */

/* ── Width icons ─────────────────────────────────────────────────── */

const WidthFullIcon = () => (
	<svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
		<rect x="2" y="7" width="16" height="6" rx="1" />
	</svg>
);
const WidthHalfIcon = () => (
	<svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
		<rect x="2" y="7" width="7" height="6" rx="1" />
		<rect x="11" y="7" width="7" height="6" rx="1" opacity="0.35" />
	</svg>
);
const WidthThirdIcon = () => (
	<svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
		<rect x="2" y="7" width="4" height="6" rx="1" />
		<rect x="8" y="7" width="4" height="6" rx="1" opacity="0.35" />
		<rect x="14" y="7" width="4" height="6" rx="1" opacity="0.35" />
	</svg>
);

/* ── Constants ────────────────────────────────────────────────────── */

const generateId = () => 'field_' + Math.random().toString( 36 ).slice( 2, 8 );
const generateColId = () => 'col_' + Math.random().toString( 36 ).slice( 2, 8 );

const getFieldDefaults = ( type ) => {
	if ( type === 'row' ) {
		return {
			id: 'row_' + Math.random().toString( 36 ).slice( 2, 8 ),
			type: 'row',
			cols: [
				{ id: generateColId(), width: '1/2', fields: [] },
				{ id: generateColId(), width: '1/2', fields: [] },
			],
		};
	}
	const def = {
		id: generateId(),
		type,
		label: FIELD_TYPES.find( ( f ) => f.type === type )?.label || type,
		required: false,
		width: 'full',
	};
	if ( [ 'select', 'radio', 'checkbox' ].includes( type ) )
		def.options = [ 'Option 1', 'Option 2' ];
	if ( type === 'rating' ) def.max = 5;
	return def;
};

/* ── Layout presets for Row blocks ────────────────────────────────── */

const LAYOUT_PRESETS = [
	{ id: '50-50', label: '50 / 50', widths: [ '1/2', '1/2' ] },
	{ id: '33-33-33', label: '33 / 33 / 33', widths: [ '1/3', '1/3', '1/3' ] },
	{
		id: '25-25-25-25',
		label: '25 / 25 / 25 / 25',
		widths: [ '1/4', '1/4', '1/4', '1/4' ],
	},
	{ id: '33-67', label: '33 / 67', widths: [ '1/3', '2/3' ] },
	{ id: '67-33', label: '67 / 33', widths: [ '2/3', '1/3' ] },
	{ id: '25-50-25', label: '25 / 50 / 25', widths: [ '1/4', '1/2', '1/4' ] },
	{ id: '25-75', label: '25 / 75', widths: [ '1/4', '3/4' ] },
	{ id: '75-25', label: '75 / 25', widths: [ '3/4', '1/4' ] },
];

/* ── Path helpers (tree manipulation) ─────────────────────────────── */
/* Path forms: [topIdx]  OR  [topIdx, colIdx, fieldIdx] */

const pathEq = ( a, b ) => {
	if ( ! a || ! b ) return false;
	if ( a.length !== b.length ) return false;
	for ( let i = 0; i < a.length; i++ ) if ( a[ i ] !== b[ i ] ) return false;
	return true;
};

const getFieldAtPath = ( fields, path ) => {
	if ( ! path || path.length === 0 ) return null;
	if ( path.length === 1 ) return fields[ path[ 0 ] ] || null;
	if ( path.length === 3 )
		return (
			fields[ path[ 0 ] ]?.cols?.[ path[ 1 ] ]?.fields?.[ path[ 2 ] ] ||
			null
		);
	return null;
};

const updateFieldAtPath = ( fields, path, updater ) => {
	if ( path.length === 1 ) {
		return fields.map( ( f, i ) => ( i === path[ 0 ] ? updater( f ) : f ) );
	}
	if ( path.length === 3 ) {
		return fields.map( ( f, i ) => {
			if ( i !== path[ 0 ] || f.type !== 'row' ) return f;
			const cols = ( f.cols || [] ).map( ( c, ci ) => {
				if ( ci !== path[ 1 ] ) return c;
				const colFields = ( c.fields || [] ).map( ( cf, cfi ) =>
					cfi === path[ 2 ] ? updater( cf ) : cf
				);
				return { ...c, fields: colFields };
			} );
			return { ...f, cols };
		} );
	}
	return fields;
};

const removeFieldAtPath = ( fields, path ) => {
	if ( path.length === 1 )
		return fields.filter( ( _, i ) => i !== path[ 0 ] );
	if ( path.length === 3 ) {
		return fields.map( ( f, i ) => {
			if ( i !== path[ 0 ] || f.type !== 'row' ) return f;
			const cols = ( f.cols || [] ).map( ( c, ci ) => {
				if ( ci !== path[ 1 ] ) return c;
				return {
					...c,
					fields: ( c.fields || [] ).filter(
						( _, cfi ) => cfi !== path[ 2 ]
					),
				};
			} );
			return { ...f, cols };
		} );
	}
	return fields;
};

/* parent: array describing where to insert. afterIdx = -1 → prepend. */
const insertFieldAtParent = ( fields, parent, afterIdx, newField ) => {
	if ( parent.length === 0 ) {
		const idx = afterIdx + 1;
		return [ ...fields.slice( 0, idx ), newField, ...fields.slice( idx ) ];
	}
	if ( parent.length === 2 ) {
		return fields.map( ( f, i ) => {
			if ( i !== parent[ 0 ] || f.type !== 'row' ) return f;
			const cols = ( f.cols || [] ).map( ( c, ci ) => {
				if ( ci !== parent[ 1 ] ) return c;
				const cf = c.fields || [];
				const idx = afterIdx + 1;
				return {
					...c,
					fields: [
						...cf.slice( 0, idx ),
						newField,
						...cf.slice( idx ),
					],
				};
			} );
			return { ...f, cols };
		} );
	}
	return fields;
};

/* Move a field at `path` by `delta` (-1 / +1) within its parent siblings. */
const moveFieldAtPath = ( fields, path, delta ) => {
	if ( path.length === 1 ) {
		const target = path[ 0 ] + delta;
		if ( target < 0 || target >= fields.length ) return fields;
		const next = [ ...fields ];
		[ next[ path[ 0 ] ], next[ target ] ] = [
			next[ target ],
			next[ path[ 0 ] ],
		];
		return next;
	}
	if ( path.length === 3 ) {
		return fields.map( ( f, i ) => {
			if ( i !== path[ 0 ] || f.type !== 'row' ) return f;
			const cols = ( f.cols || [] ).map( ( c, ci ) => {
				if ( ci !== path[ 1 ] ) return c;
				const cf = [ ...( c.fields || [] ) ];
				const target = path[ 2 ] + delta;
				if ( target < 0 || target >= cf.length ) return c;
				[ cf[ path[ 2 ] ], cf[ target ] ] = [
					cf[ target ],
					cf[ path[ 2 ] ],
				];
				return { ...c, fields: cf };
			} );
			return { ...f, cols };
		} );
	}
	return fields;
};

/* Apply a layout preset to a row, preserving existing fields. */
const applyLayoutPreset = ( row, widths ) => {
	const oldCols = row.cols || [];
	const totalCols = widths.length;
	const newCols = widths.map( ( w, i ) => ( {
		id: oldCols[ i ]?.id || generateColId(),
		width: w,
		fields: oldCols[ i ]?.fields || [],
	} ) );
	if ( oldCols.length > totalCols ) {
		const leftover = oldCols
			.slice( totalCols )
			.flatMap( ( c ) => c.fields || [] );
		newCols[ totalCols - 1 ] = {
			...newCols[ totalCols - 1 ],
			fields: [ ...newCols[ totalCols - 1 ].fields, ...leftover ],
		};
	}
	return { ...row, cols: newCols };
};

const DEFAULT_STYLE = {
	primary_color: '#2271b1',
	btn_text_color: '#ffffff',
	bg_color: '#ffffff',
	text_color: '#1d2327',
	border_color: '#c3c4c7',
	label_color: '#1d2327',
	font_size: 16,
	label_weight: '600',
	font_family: 'inherit',
	field_spacing: 20,
	border_radius: 4,
	border_style: 'solid',
	border_width: 1,
	input_padding_x: 14,
	input_padding_y: 10,
	btn_radius: 4,
	btn_width: 'auto',
	btn_style: 'solid',
};

/* Theme variations sourced from the active FSE theme's theme.json
   (incl. style variations). Falls back to a tiny built-in palette
   if the theme exposes none. */
const FALLBACK_THEME_PRESETS = [
	{
		id: 'default',
		label: __( 'Classic', 'formspress' ),
		bg: '#ffffff',
		text: '#1d2327',
		primary: '#2271b1',
		btnText: '#ffffff',
	},
	{
		id: 'dark',
		label: __( 'Dark', 'formspress' ),
		bg: '#1a1a1a',
		text: '#f0f0f0',
		primary: '#6bb6ff',
		btnText: '#1a1a1a',
	},
];

const THEME_PRESETS = ( () => {
	const v = Array.isArray( window.flowFormsData?.themeVariations )
		? window.flowFormsData.themeVariations
		: [];
	return v.length > 0 ? v : FALLBACK_THEME_PRESETS;
} )();

/* Resolved theme palette/font lists from theme.json (admin assets). */
const THEME_PALETTE = ( () => {
	const p = Array.isArray( window.flowFormsData?.themePalette )
		? window.flowFormsData.themePalette
		: [];
	return p
		.filter( ( c ) => c && c.color && c.slug )
		.map( ( c ) => ( {
			name: c.name || c.slug,
			color: c.color,
			slug: c.slug,
		} ) );
} )();

const THEME_FONT_FAMILIES = ( () => {
	const f = Array.isArray( window.flowFormsData?.themeFontFamilies )
		? window.flowFormsData.themeFontFamilies
		: [];
	return f.filter( ( ff ) => ff && ff.fontFamily );
} )();

const THEME_FONT_SIZES = ( () => {
	const f = Array.isArray( window.flowFormsData?.themeFontSizes )
		? window.flowFormsData.themeFontSizes
		: [];
	return f
		.filter( ( fs ) => fs && fs.size )
		.map( ( fs ) => ( {
			name: fs.name || fs.slug,
			slug: fs.slug,
			size: fs.size,
		} ) );
} )();

const FALLBACK_FONT_SIZES = [
	{ name: __( 'Small', 'formspress' ), slug: 'small', size: '14px' },
	{ name: __( 'Medium', 'formspress' ), slug: 'medium', size: '16px' },
	{ name: __( 'Large', 'formspress' ), slug: 'large', size: '18px' },
	{ name: __( 'X-Large', 'formspress' ), slug: 'x-large', size: '22px' },
];

const FALLBACK_FONT_FAMILIES = [
	{
		slug: 'inherit',
		name: __( 'Theme default', 'formspress' ),
		fontFamily: 'inherit',
	},
	{ slug: 'system', name: 'System UI', fontFamily: 'system-ui, sans-serif' },
	{ slug: 'arial', name: 'Arial', fontFamily: 'Arial, sans-serif' },
	{ slug: 'georgia', name: 'Georgia', fontFamily: 'Georgia, serif' },
	{ slug: 'inter', name: 'Inter', fontFamily: "'Inter', sans-serif" },
	{ slug: 'roboto', name: 'Roboto', fontFamily: "'Roboto', sans-serif" },
	{
		slug: 'open-sans',
		name: 'Open Sans',
		fontFamily: "'Open Sans', sans-serif",
	},
];

const FONT_FAMILY_OPTIONS = ( () => {
	const list =
		THEME_FONT_FAMILIES.length > 0
			? THEME_FONT_FAMILIES
			: FALLBACK_FONT_FAMILIES;
	const opts = list.map( ( ff ) => ( {
		value: ff.fontFamily,
		label: ff.name,
	} ) );
	if ( ! opts.some( ( o ) => o.value === 'inherit' ) ) {
		opts.unshift( {
			value: 'inherit',
			label: __( 'Theme default', 'formspress' ),
		} );
	}
	return opts;
} )();

const FONT_SIZE_LIST = ( () => {
	const raw =
		THEME_FONT_SIZES.length > 0 ? THEME_FONT_SIZES : FALLBACK_FONT_SIZES;
	/* FontSizePicker expects { name, slug, size }; size can be a string with unit. */
	return raw.map( ( fs ) => ( {
		name: fs.name,
		slug: fs.slug,
		size: fs.size,
	} ) );
} )();

/* Convert a theme variation's btnRadius (e.g. "4px", "0.5rem", 8) to a number of px.
   Best-effort: rem -> 16, em -> 16, unitless -> as-is. */
const parsePxValue = ( raw ) => {
	if ( raw === null || raw === undefined || raw === '' ) return null;
	if ( typeof raw === 'number' && isFinite( raw ) ) return raw;
	const s = String( raw ).trim();
	const m = s.match( /^(-?\d+(?:\.\d+)?)\s*(px|rem|em)?$/i );
	if ( ! m ) return null;
	const n = parseFloat( m[ 1 ] );
	const unit = ( m[ 2 ] || 'px' ).toLowerCase();
	if ( unit === 'px' ) return Math.round( n );
	if ( unit === 'rem' || unit === 'em' ) return Math.round( n * 16 );
	return Math.round( n );
};

/* ── Color swatch control (uses theme palette swatches + custom picker) ── */

const ColorSwatchControl = ( { label, value, onChange } ) => (
	<Flex
		align="flex-start"
		justify="space-between"
		direction="column"
		gap={ 1 }
		style={ { padding: '6px 0', borderBottom: '1px solid #f0f0f1' } }
	>
		<FlexItem>
			<span style={ { fontSize: 13, color: '#1d2327' } }>{ label }</span>
		</FlexItem>
		<FlexItem style={ { width: '100%' } }>
			<ColorPalette
				colors={ THEME_PALETTE }
				value={ value || '' }
				onChange={ ( v ) => onChange( v || '' ) }
				disableAlpha
				clearable
				enableAlpha={ false }
				__experimentalIsRenderedInSidebar
			/>
		</FlexItem>
	</Flex>
);

/* ── Field preview (static, canvas-only) ─────────────────────────── */

const FieldPreviewBlock = ( { field, style } ) => {
	const radius = style?.border_radius ?? 4;
	const borderColor = style?.border_color || '#c3c4c7';
	const borderWidth = style?.border_width ?? 1;
	const borderStyleProp = style?.border_style || 'solid';
	const paddingX = style?.input_padding_x ?? 14;
	const paddingY = style?.input_padding_y ?? 10;
	const inputStyle = {
		display: 'block',
		width: '100%',
		maxWidth: 400,
		border:
			borderStyleProp === 'none'
				? 'none'
				: `${ borderWidth }px ${ borderStyleProp } ${ borderColor }`,
		borderRadius: radius,
		padding: `${ paddingY }px ${ paddingX }px`,
		fontSize: 14,
		color: '#a7aaad',
		background: '#fafafa',
		boxSizing: 'border-box',
		pointerEvents: 'none',
	};

	if (
		[ 'text', 'email', 'phone', 'number', 'url', 'date', 'time' ].includes(
			field.type
		)
	) {
		return (
			<input
				readOnly
				style={ inputStyle }
				placeholder={
					field.placeholder || __( 'Your answer…', 'formspress' )
				}
			/>
		);
	}
	if ( field.type === 'textarea' ) {
		return (
			<textarea
				readOnly
				style={ { ...inputStyle, minHeight: 72, resize: 'none' } }
				placeholder={
					field.placeholder || __( 'Your answer…', 'formspress' )
				}
			/>
		);
	}
	if ( field.type === 'select' ) {
		return (
			<select style={ inputStyle }>
				<option>{ __( 'Select…', 'formspress' ) }</option>
				{ ( field.options || [] ).map( ( o, i ) => (
					<option key={ i }>{ o }</option>
				) ) }
			</select>
		);
	}
	if ( field.type === 'radio' || field.type === 'checkbox' ) {
		return (
			<div style={ { display: 'flex', flexDirection: 'column', gap: 6 } }>
				{ ( field.options || [] ).map( ( o, i ) => (
					<label
						key={ i }
						style={ {
							display: 'flex',
							alignItems: 'center',
							gap: 8,
							fontSize: 14,
							color: '#606060',
							cursor: 'default',
						} }
					>
						<input
							type={ field.type }
							readOnly
							style={ { pointerEvents: 'none' } }
						/>
						{ o }
					</label>
				) ) }
			</div>
		);
	}
	if ( field.type === 'rating' ) {
		return (
			<div style={ { fontSize: 26, color: '#ddd', letterSpacing: 2 } }>
				{ Array.from( { length: field.max || 5 } ).map( ( _, i ) => (
					<span
						key={ i }
						style={ { color: i < 3 ? '#dba617' : '#e0e0e0' } }
					>
						★
					</span>
				) ) }
			</div>
		);
	}
	if ( field.type === 'section' ) {
		return (
			<div
				style={ {
					borderBottom: `1px solid ${ borderColor }`,
					paddingBottom: 8,
					color: '#606060',
					fontSize: 13,
				} }
			>
				{ field.content || '' }
			</div>
		);
	}
	if ( field.type === 'page_break' ) {
		return (
			<div
				style={ {
					display: 'flex',
					alignItems: 'center',
					gap: 8,
					color: '#a7aaad',
					fontSize: 13,
				} }
			>
				<span style={ { flex: 1, borderTop: '1px dashed #ddd' } } />
				{ __( 'Page Break', 'formspress' ) }
				<span style={ { flex: 1, borderTop: '1px dashed #ddd' } } />
			</div>
		);
	}
	return null;
};

/* ── Field inserter popover (legacy, used by inline appender) ─────── */

const FieldGroups = [
	{ id: 'basic', label: __( 'Basic', 'formspress' ) },
	{ id: 'choice', label: __( 'Choice', 'formspress' ) },
	{ id: 'advanced', label: __( 'Advanced', 'formspress' ) },
	{ id: 'layout', label: __( 'Layout', 'formspress' ) },
];

/* French labels for the sidebar inserter group titles. */
const FieldGroupsFR = {
	basic: __( 'Texte', 'formspress' ),
	choice: __( 'Choix', 'formspress' ),
	advanced: __( 'Avancé', 'formspress' ),
	layout: __( 'Mise en page', 'formspress' ),
};

const FieldInserterPopover = ( {
	onAdd,
	onClose,
	anchor,
	excludeTypes = [],
} ) => {
	const [ search, setSearch ] = useState( '' );
	const inputRef = useRef( null );

	useEffect( () => {
		if ( inputRef.current ) inputRef.current.focus();
	}, [] );

	const filtered = FieldGroups.map( ( g ) => ( {
		...g,
		types: FIELD_TYPES.filter(
			( f ) =>
				f.group === g.id &&
				! excludeTypes.includes( f.type ) &&
				( ! search ||
					f.label.toLowerCase().includes( search.toLowerCase() ) )
		),
	} ) ).filter( ( g ) => g.types.length > 0 );

	const firstType = filtered[ 0 ]?.types[ 0 ];

	return (
		<Popover
			placement="top-start"
			onClose={ onClose }
			anchor={ anchor }
			className="ff-std-inserter-popover"
			focusOnMount={ false }
		>
			<div className="ff-std-inserter-popover__content">
				<div className="ff-std-inserter-popover__search-wrap">
					<SearchControl
						ref={ inputRef }
						value={ search }
						onChange={ setSearch }
						placeholder={ __( 'Search', 'formspress' ) }
						className="ff-std-inserter-popover__search-control"
						onKeyDown={ ( e ) => {
							if ( e.key === 'Escape' ) onClose();
							if ( e.key === 'Enter' && firstType ) {
								onAdd( firstType.type );
								onClose();
							}
						} }
						__nextHasNoMarginBottom
					/>
				</div>
				<div className="ff-std-inserter-popover__body">
					{ filtered.length === 0 && (
						<p className="ff-std-inserter-popover__empty">
							{ __( 'No results.', 'formspress' ) }
						</p>
					) }
					{ filtered.map( ( group ) => (
						<div
							key={ group.id }
							className="ff-std-inserter-popover__section"
						>
							<p className="ff-std-inserter-popover__group">
								{ group.label }
							</p>
							<div className="ff-std-inserter-popover__grid">
								{ group.types.map( ( ft ) => (
									<Button
										key={ ft.type }
										className="ff-std-inserter-popover__item"
										onClick={ () => {
											onAdd( ft.type );
											onClose();
										} }
									>
										<span
											className={ `ff-std-inserter-popover__item-icon dashicons dashicons-${ ft.icon }` }
										/>
										<span className="ff-std-inserter-popover__item-label">
											{ ft.label }
										</span>
									</Button>
								) ) }
							</div>
						</div>
					) ) }
				</div>
			</div>
		</Popover>
	);
};

/* ── Field tree view (left panel) — navigation only ──────────────── */

const TreeRow = ( {
	field,
	path,
	depth,
	selectedPath,
	onSelect,
	onDelete,
} ) => {
	const def = FIELD_TYPES.find( ( f ) => f.type === field.type );
	const isSelected = pathEq( selectedPath, path );
	const isRow = field.type === 'row';

	return (
		<>
			<div
				className={ `ff-std-tree__item${
					isSelected ? ' is-selected' : ''
				}${ isRow ? ' is-row' : '' }` }
				style={ { paddingLeft: 16 + depth * 14 } }
				onClick={ () => onSelect( path ) }
			>
				<span
					className={ `ff-std-tree__item-icon dashicons dashicons-${
						def?.icon || 'admin-generic'
					}` }
				/>
				<span className="ff-std-tree__item-label">
					{ isRow
						? sprintf(
								__( 'Row (%d cols)', 'formspress' ),
								( field.cols || [] ).length
						  )
						: field.label || <em>{ field.type }</em> }
					{ field.required && (
						<span className="ff-std-tree__required">*</span>
					) }
				</span>
				<Button
					icon={ trash }
					isDestructive
					size="small"
					className="ff-std-tree__item-del"
					onClick={ ( e ) => {
						e.stopPropagation();
						onDelete( path );
					} }
					label={ __( 'Delete', 'formspress' ) }
				/>
			</div>
			{ isRow &&
				( field.cols || [] ).map( ( col, ci ) => (
					<div key={ col.id }>
						<div
							className="ff-std-tree__col-label"
							style={ { paddingLeft: 16 + ( depth + 1 ) * 14 } }
						>
							{ sprintf(
								__( 'Col %1$d · %2$s', 'formspress' ),
								ci + 1,
								col.width
							) }
						</div>
						{ ( col.fields || [] ).map( ( cf, fi ) => (
							<TreeRow
								key={ cf.id }
								field={ cf }
								path={ [ path[ 0 ], ci, fi ] }
								depth={ depth + 2 }
								selectedPath={ selectedPath }
								onSelect={ onSelect }
								onDelete={ onDelete }
							/>
						) ) }
					</div>
				) ) }
		</>
	);
};

const FieldTreeView = ( { fields, selectedPath, onSelect, onDelete } ) => {
	const total = fields.reduce(
		( n, f ) =>
			n +
			1 +
			( f.type === 'row'
				? ( f.cols || [] ).reduce(
						( m, c ) => m + ( c.fields || [] ).length,
						0
				  )
				: 0 ),
		0
	);
	return (
		<div className="ff-std-tree">
			<div className="ff-std-tree__header">
				<span className="ff-std-tree__title">
					{ __( 'Fields', 'formspress' ) }
				</span>
				<span className="ff-std-tree__count">{ total }</span>
			</div>
			<div className="ff-std-tree__list">
				{ fields.length === 0 && (
					<div className="ff-std-tree__empty">
						<span className="dashicons dashicons-feedback" />
						<p>
							{ __(
								'Use the + buttons in the canvas to add fields.',
								'formspress'
							) }
						</p>
					</div>
				) }
				{ fields.map( ( field, i ) => (
					<TreeRow
						key={ field.id }
						field={ field }
						path={ [ i ] }
						depth={ 0 }
						selectedPath={ selectedPath }
						onSelect={ onSelect }
						onDelete={ onDelete }
					/>
				) ) }
			</div>
		</div>
	);
};

/* ── Block Appender — inline canvas inserter (like Gutenberg) ────── */

const StandardBlockAppender = ( {
	onAdd,
	isAlwaysVisible = false,
	excludeTypes = [],
	variant,
} ) => {
	const [ isOpen, setOpen ] = useState( false );
	const btnRef = useRef( null );

	const isLabeled = variant === 'primary' || variant === 'secondary';

	return (
		<div
			className={ `ff-std-appender${
				isAlwaysVisible ? ' is-always-visible' : ''
			}${ isLabeled ? ' is-labeled' : '' }` }
			onClick={ ( e ) => e.stopPropagation() }
		>
			<Button
				ref={ btnRef }
				icon={ plus }
				variant={ variant }
				className="ff-std-appender__btn"
				onClick={ () => setOpen( true ) }
				label={ isLabeled ? undefined : __( 'Add field', 'formspress' ) }
			>
				{ isLabeled ? __( 'Add your first field', 'formspress' ) : null }
			</Button>
			{ isOpen && (
				<FieldInserterPopover
					onAdd={ onAdd }
					onClose={ () => setOpen( false ) }
					anchor={ btnRef.current }
					excludeTypes={ excludeTypes }
				/>
			) }
		</div>
	);
};

/* ── Standard field block (canvas) ───────────────────────────────── */
/* Renders the visual block only — the toolbar is rendered by a single
   floating Popover at the page root, anchored to this block via its
   data-block-id attribute. */

const StandardFieldBlock = ( {
	field,
	isSelected,
	onClick,
	onUpdate,
	formStyle,
} ) => {
	const labelRef = useRef( null );

	useEffect( () => {
		if ( isSelected && labelRef.current ) labelRef.current.focus();
	}, [ isSelected ] );

	const isLayout = [ 'section', 'page_break' ].includes( field.type );

	return (
		<div
			className={ `ff-std-block${ isSelected ? ' is-selected' : '' }${
				isLayout ? ' ff-std-block--layout' : ''
			}` }
			onClick={ onClick }
			data-block-id={ field.id }
		>
			<div className="ff-std-block__inner">
				{ ! isLayout && (
					<div className="ff-std-block__label-row">
						<input
							ref={ labelRef }
							className="ff-std-block__label"
							value={ field.label }
							onChange={ ( e ) =>
								onUpdate( { ...field, label: e.target.value } )
							}
							onClick={ ( e ) => e.stopPropagation() }
							placeholder={ __( 'Field label…', 'formspress' ) }
						/>
						{ field.required && (
							<span className="ff-std-block__required">*</span>
						) }
					</div>
				) }
				{ field.description && ! isLayout && (
					<p className="ff-std-block__description">
						{ field.description }
					</p>
				) }
				<div className="ff-std-block__preview">
					<FieldPreviewBlock field={ field } style={ formStyle } />
				</div>
			</div>
		</div>
	);
};

/* ── Row block (canvas) ──────────────────────────────────────────── */
/* Visual-only — same toolbar-extraction note as StandardFieldBlock. */

const RowBlock = ( {
	row,
	rowPath,
	selectedPath,
	onSelect,
	onUpdateRow,
	addField,
	updateField,
	deleteField,
	moveField,
	formStyle,
} ) => {
	const isRowSelected = pathEq( selectedPath, rowPath );

	const removeCol = ( colIdx ) => {
		if ( ( row.cols || [] ).length <= 1 ) return;
		const cols = ( row.cols || [] ).filter( ( _, i ) => i !== colIdx );
		onUpdateRow( { ...row, cols } );
	};

	const colCount = ( row.cols || [] ).length;

	return (
		<div
			className={ `ff-std-row-block${
				isRowSelected ? ' is-selected' : ''
			}` }
			onClick={ ( e ) => {
				e.stopPropagation();
				onSelect( rowPath );
			} }
			data-block-id={ row.id }
		>
			<div className="ff-std-row">
				{ ( row.cols || [] ).map( ( col, colIdx ) => (
					<div
						key={ col.id }
						className="ff-std-col"
						data-width={ col.width || '1/2' }
						onClick={ ( e ) => {
							e.stopPropagation();
							onSelect( rowPath );
						} }
					>
						<div className="ff-std-col__inner">
							<StandardBlockAppender
								onAdd={ ( type ) =>
									addField(
										type,
										[ rowPath[ 0 ], colIdx ],
										-1
									)
								}
								isAlwaysVisible={
									( col.fields || [] ).length === 0
								}
								excludeTypes={ [ 'row' ] }
							/>

							{ ( col.fields || [] ).map( ( cf, fi ) => {
								const childPath = [ rowPath[ 0 ], colIdx, fi ];
								return (
									<div key={ cf.id }>
										<StandardFieldBlock
											field={ cf }
											isSelected={ pathEq(
												selectedPath,
												childPath
											) }
											onClick={ ( e ) => {
												e.stopPropagation();
												onSelect( childPath );
											} }
											onUpdate={ ( updated ) =>
												updateField(
													childPath,
													updated
												)
											}
											formStyle={ formStyle }
										/>
										<StandardBlockAppender
											onAdd={ ( type ) =>
												addField(
													type,
													[ rowPath[ 0 ], colIdx ],
													fi
												)
											}
											excludeTypes={ [ 'row' ] }
										/>
									</div>
								);
							} ) }
						</div>

						{ isRowSelected && colCount > 1 && (
							<button
								type="button"
								className="ff-std-col__remove"
								onClick={ ( e ) => {
									e.stopPropagation();
									removeCol( colIdx );
								} }
								title={ __( 'Remove column', 'formspress' ) }
							>
								×
							</button>
						) }
					</div>
				) ) }
			</div>
		</div>
	);
};

/* ── Style inspector ─────────────────────────────────────────────── */

/* Field spacing presets — compact / comfortable / spacious. */
const FIELD_SPACING_PRESETS = { compact: 12, comfortable: 20, spacious: 32 };
const fieldSpacingToPreset = ( px ) => {
	if ( px <= 14 ) return 'compact';
	if ( px <= 24 ) return 'comfortable';
	return 'spacious';
};

/* Border-radius presets — square / soft / rounded / pill. */
const RADIUS_PRESETS = { square: 0, soft: 4, rounded: 8, pill: 24 };
const radiusToPreset = ( px ) => {
	if ( px <= 1 ) return 'square';
	if ( px <= 5 ) return 'soft';
	if ( px <= 16 ) return 'rounded';
	return 'pill';
};

/* Match an applied style object against the available theme variations. */
const matchActiveTheme = ( s ) => {
	for ( const v of THEME_PRESETS ) {
		if (
			( v.primary || '' ).toLowerCase() ===
				( s.primary_color || '' ).toLowerCase() &&
			( v.text || '' ).toLowerCase() ===
				( s.text_color || '' ).toLowerCase() &&
			( v.bg || '' ).toLowerCase() === ( s.bg_color || '' ).toLowerCase()
		) {
			return v.id;
		}
	}
	return null;
};

/* FormsPress-shipped style variations (styles/*.json). */
const FORM_STYLE_VARIATIONS = ( () => {
	const list = window.flowFormsData?.styleVariations || [];
	return Array.isArray( list ) ? list : [];
} )();

const StyleInspector = ( { style, onChange } ) => {
	const s = { ...DEFAULT_STYLE, ...style };
	const set = ( key ) => ( value ) => onChange( { ...s, [ key ]: value } );

	const source = s.source || 'custom';
	const setSource = ( v ) => onChange( { ...s, source: v } );

	const applyTheme = ( v ) => {
		const next = { ...s };
		if ( v.primary ) next.primary_color = v.primary;
		if ( v.text ) next.text_color = v.text;
		if ( v.bg ) next.bg_color = v.bg;
		if ( v.btnText ) next.btn_text_color = v.btnText;
		if ( v.fontFamily ) next.font_family = v.fontFamily;
		const radiusPx = parsePxValue( v.btnRadius );
		if ( radiusPx !== null ) next.btn_radius = radiusPx;
		/* If labels haven't been explicitly customized, follow text color. */
		if ( ! style?.label_color ) next.label_color = next.text_color;
		onChange( next );
	};

	const applyStyleVariation = ( v ) => {
		const next = { ...s, ...( v.form || {} ), style_variation: v.id };
		onChange( next );
	};

	const activeThemeId = matchActiveTheme( s );
	const activeVariationId = s.style_variation || '';

	return (
		<div className="ff-std-style-inspector">
			<PanelBody
				title={ __( 'Color source', 'formspress' ) }
				initialOpen={ true }
			>
				<VStack spacing={ 3 }>
					<ToggleGroupControl
						label={ __(
							'Where do colors come from?',
							'formspress'
						) }
						value={ source }
						isBlock
						onChange={ setSource }
						__nextHasNoMarginBottom
						__next40pxDefaultSize
					>
						<ToggleGroupControlOption
							value="custom"
							label={ __( 'Custom palette', 'formspress' ) }
						/>
						<ToggleGroupControlOption
							value="theme"
							label={ __( 'Inherit from theme', 'formspress' ) }
						/>
					</ToggleGroupControl>
					{ source === 'theme' && (
						<Text variant="muted" size={ 12 }>
							{ __(
								'Colors & fonts read live from the site theme — change the site Style Variation and this form follows.',
								'formspress'
							) }{ ' ' }
							{ __(
								'Bindings: Primary → --wp--preset--color--primary · Background → --wp--preset--color--base · Text → --wp--preset--color--contrast · Font → --wp--preset--font-family--body.',
								'formspress'
							) }
						</Text>
					) }
				</VStack>
			</PanelBody>

			{ FORM_STYLE_VARIATIONS.length > 0 && (
				<PanelBody
					title={ __( 'FormsPress style variations', 'formspress' ) }
					initialOpen={ false }
				>
					<VStack spacing={ 3 }>
						<Text variant="muted" size={ 12 }>
							{ __(
								'Apply a shipped variation as a starting point — you can still customize after.',
								'formspress'
							) }
						</Text>
						<div className="ff-std-theme-grid">
							{ FORM_STYLE_VARIATIONS.map( ( v ) => (
								<button
									key={ v.id }
									type="button"
									className={ `ff-std-theme-card${
										activeVariationId === v.id
											? ' is-active'
											: ''
									}` }
									onClick={ () => applyStyleVariation( v ) }
									title={ v.description || v.title }
								>
									<span className="ff-std-theme-card__chip">
										<span
											className="ff-std-theme-card__chip-bg"
											style={ {
												background:
													v.form?.bg_color ||
													'#ffffff',
											} }
										/>
										<span
											className="ff-std-theme-card__chip-text"
											style={ {
												background:
													v.form?.text_color ||
													'#1d2327',
											} }
										/>
										<span
											className="ff-std-theme-card__chip-primary"
											style={ {
												background:
													v.form?.primary_color ||
													'#2271b1',
											} }
										/>
									</span>
									<span className="ff-std-theme-card__label">
										{ v.title }
									</span>
								</button>
							) ) }
						</div>
					</VStack>
				</PanelBody>
			) }

			<PanelBody
				title={ __( 'Theme', 'formspress' ) }
				initialOpen={ source === 'custom' }
			>
				<VStack spacing={ 2 }>
					<Text variant="muted" size={ 12 }>
						{ __(
							'Apply a preset from your active theme. You can still customize each color below.',
							'formspress'
						) }
					</Text>
					<div className="ff-std-theme-grid">
						{ THEME_PRESETS.map( ( v ) => (
							<button
								key={ v.id }
								type="button"
								className={ `ff-std-theme-card${
									activeThemeId === v.id ? ' is-active' : ''
								}` }
								onClick={ () => applyTheme( v ) }
								title={ v.label }
							>
								<span className="ff-std-theme-card__chip">
									<span
										className="ff-std-theme-card__chip-bg"
										style={ {
											background: v.bg || '#ffffff',
										} }
									/>
									<span
										className="ff-std-theme-card__chip-text"
										style={ {
											background: v.text || '#1d2327',
										} }
									/>
									<span
										className="ff-std-theme-card__chip-primary"
										style={ {
											background: v.primary || '#2271b1',
										} }
									/>
								</span>
								<span className="ff-std-theme-card__label">
									{ v.label }
								</span>
							</button>
						) ) }
					</div>
				</VStack>
			</PanelBody>

			<PanelBody
				title={ __( 'Colors', 'formspress' ) }
				initialOpen={ true }
			>
				<VStack spacing={ 3 }>
					<ColorSwatchControl
						label={ __( 'Primary / Accent', 'formspress' ) }
						value={ s.primary_color }
						onChange={ set( 'primary_color' ) }
					/>
					<ColorSwatchControl
						label={ __( 'Button text', 'formspress' ) }
						value={ s.btn_text_color }
						onChange={ set( 'btn_text_color' ) }
					/>
					<ColorSwatchControl
						label={ __( 'Background', 'formspress' ) }
						value={ s.bg_color }
						onChange={ set( 'bg_color' ) }
					/>
					<ColorSwatchControl
						label={ __( 'Text', 'formspress' ) }
						value={ s.text_color }
						onChange={ set( 'text_color' ) }
					/>
					<ColorSwatchControl
						label={ __( 'Labels', 'formspress' ) }
						value={ s.label_color }
						onChange={ set( 'label_color' ) }
					/>
					<ColorSwatchControl
						label={ __( 'Borders', 'formspress' ) }
						value={ s.border_color }
						onChange={ set( 'border_color' ) }
					/>
				</VStack>
			</PanelBody>

			<PanelBody
				title={ __( 'Typography', 'formspress' ) }
				initialOpen={ false }
			>
				<VStack spacing={ 4 }>
					<FontSizePicker
						value={
							typeof s.font_size === 'number'
								? `${ s.font_size }px`
								: s.font_size
						}
						fontSizes={ FONT_SIZE_LIST }
						withSlider
						withReset
						onChange={ ( v ) => {
							if ( v === undefined || v === '' ) {
								set( 'font_size' )( 16 );
								return;
							}
							const px = parsePxValue( v );
							set( 'font_size' )( px ?? 16 );
						} }
						__nextHasNoMarginBottom
					/>
					<SelectControl
						label={ __( 'Font family', 'formspress' ) }
						value={ s.font_family }
						options={ FONT_FAMILY_OPTIONS }
						onChange={ set( 'font_family' ) }
						__nextHasNoMarginBottom
						__next40pxDefaultSize
					/>
					<SelectControl
						label={ __( 'Label weight', 'formspress' ) }
						value={ s.label_weight }
						options={ [
							{
								value: '400',
								label: __( 'Normal', 'formspress' ),
							},
							{
								value: '500',
								label: __( 'Medium', 'formspress' ),
							},
							{
								value: '600',
								label: __( 'Semi-bold', 'formspress' ),
							},
							{ value: '700', label: __( 'Bold', 'formspress' ) },
						] }
						onChange={ set( 'label_weight' ) }
						__nextHasNoMarginBottom
						__next40pxDefaultSize
					/>
				</VStack>
			</PanelBody>

			<PanelBody
				title={ __( 'Fields & Layout', 'formspress' ) }
				initialOpen={ false }
			>
				<VStack spacing={ 4 }>
					<ToggleGroupControl
						label={ __( 'Field spacing', 'formspress' ) }
						value={ fieldSpacingToPreset( s.field_spacing ) }
						isBlock
						onChange={ ( v ) =>
							set( 'field_spacing' )(
								FIELD_SPACING_PRESETS[ v ] ?? 20
							)
						}
						__nextHasNoMarginBottom
						__next40pxDefaultSize
					>
						<ToggleGroupControlOption
							value="compact"
							label={ __( 'Compact', 'formspress' ) }
						/>
						<ToggleGroupControlOption
							value="comfortable"
							label={ __( 'Comfy', 'formspress' ) }
						/>
						<ToggleGroupControlOption
							value="spacious"
							label={ __( 'Spacious', 'formspress' ) }
						/>
					</ToggleGroupControl>

					<ToggleGroupControl
						label={ __( 'Border style', 'formspress' ) }
						value={ s.border_style || 'solid' }
						isBlock
						onChange={ ( v ) => set( 'border_style' )( v ) }
						__nextHasNoMarginBottom
						__next40pxDefaultSize
					>
						<ToggleGroupControlOption
							value="none"
							label={ __( 'None', 'formspress' ) }
						/>
						<ToggleGroupControlOption
							value="solid"
							label={ __( 'Solid', 'formspress' ) }
						/>
						<ToggleGroupControlOption
							value="dashed"
							label={ __( 'Dashed', 'formspress' ) }
						/>
					</ToggleGroupControl>

					<ToggleGroupControl
						label={ __( 'Border radius', 'formspress' ) }
						value={ radiusToPreset( s.border_radius ) }
						isBlock
						onChange={ ( v ) =>
							set( 'border_radius' )( RADIUS_PRESETS[ v ] ?? 4 )
						}
						__nextHasNoMarginBottom
						__next40pxDefaultSize
					>
						<ToggleGroupControlOption
							value="square"
							label={ __( 'Square', 'formspress' ) }
						/>
						<ToggleGroupControlOption
							value="soft"
							label={ __( 'Soft', 'formspress' ) }
						/>
						<ToggleGroupControlOption
							value="rounded"
							label={ __( 'Rounded', 'formspress' ) }
						/>
						<ToggleGroupControlOption
							value="pill"
							label={ __( 'Pill', 'formspress' ) }
						/>
					</ToggleGroupControl>

					<PanelBody
						title={ __( 'Custom', 'formspress' ) }
						initialOpen={ false }
					>
						<VStack spacing={ 3 }>
							<RangeControl
								label={ __(
									'Border radius (px)',
									'formspress'
								) }
								value={ s.border_radius }
								onChange={ set( 'border_radius' ) }
								min={ 0 }
								max={ 40 }
								step={ 1 }
								__nextHasNoMarginBottom
							/>
							<RangeControl
								label={ __( 'Border width (px)', 'formspress' ) }
								value={ s.border_width }
								onChange={ set( 'border_width' ) }
								min={ 0 }
								max={ 4 }
								step={ 1 }
								__nextHasNoMarginBottom
							/>
							<RangeControl
								label={ __(
									'Field spacing (px)',
									'formspress'
								) }
								value={ s.field_spacing }
								onChange={ set( 'field_spacing' ) }
								min={ 8 }
								max={ 48 }
								step={ 2 }
								__nextHasNoMarginBottom
							/>
							<RangeControl
								label={ __(
									'Padding horizontal (px)',
									'formspress'
								) }
								value={ s.input_padding_x }
								onChange={ set( 'input_padding_x' ) }
								min={ 6 }
								max={ 32 }
								step={ 2 }
								__nextHasNoMarginBottom
							/>
							<RangeControl
								label={ __(
									'Padding vertical (px)',
									'formspress'
								) }
								value={ s.input_padding_y }
								onChange={ set( 'input_padding_y' ) }
								min={ 4 }
								max={ 24 }
								step={ 1 }
								__nextHasNoMarginBottom
							/>
						</VStack>
					</PanelBody>
				</VStack>
			</PanelBody>

			<PanelBody
				title={ __( 'Submit Button', 'formspress' ) }
				initialOpen={ false }
			>
				<VStack spacing={ 4 }>
					<ToggleGroupControl
						label={ __( 'Style', 'formspress' ) }
						value={ s.btn_style || 'solid' }
						isBlock
						onChange={ ( v ) => set( 'btn_style' )( v ) }
						__nextHasNoMarginBottom
						__next40pxDefaultSize
					>
						<ToggleGroupControlOption
							value="solid"
							label={ __( 'Solid', 'formspress' ) }
						/>
						<ToggleGroupControlOption
							value="outline"
							label={ __( 'Outline', 'formspress' ) }
						/>
						<ToggleGroupControlOption
							value="ghost"
							label={ __( 'Ghost', 'formspress' ) }
						/>
					</ToggleGroupControl>

					<ToggleGroupControl
						label={ __( 'Border radius', 'formspress' ) }
						value={ radiusToPreset( s.btn_radius ) }
						isBlock
						onChange={ ( v ) =>
							set( 'btn_radius' )( RADIUS_PRESETS[ v ] ?? 4 )
						}
						__nextHasNoMarginBottom
						__next40pxDefaultSize
					>
						<ToggleGroupControlOption
							value="square"
							label={ __( 'Square', 'formspress' ) }
						/>
						<ToggleGroupControlOption
							value="soft"
							label={ __( 'Soft', 'formspress' ) }
						/>
						<ToggleGroupControlOption
							value="rounded"
							label={ __( 'Rounded', 'formspress' ) }
						/>
						<ToggleGroupControlOption
							value="pill"
							label={ __( 'Pill', 'formspress' ) }
						/>
					</ToggleGroupControl>

					<SelectControl
						label={ __( 'Button width', 'formspress' ) }
						value={ s.btn_width }
						options={ [
							{ value: 'auto', label: __( 'Auto', 'formspress' ) },
							{
								value: 'full',
								label: __( 'Full width', 'formspress' ),
							},
						] }
						onChange={ set( 'btn_width' ) }
						__nextHasNoMarginBottom
						__next40pxDefaultSize
					/>

					<PanelBody
						title={ __( 'Custom', 'formspress' ) }
						initialOpen={ false }
					>
						<RangeControl
							label={ __( 'Border radius (px)', 'formspress' ) }
							value={ s.btn_radius }
							onChange={ set( 'btn_radius' ) }
							min={ 0 }
							max={ 40 }
							step={ 1 }
							__nextHasNoMarginBottom
						/>
					</PanelBody>
				</VStack>
			</PanelBody>
		</div>
	);
};

/* ── Field settings inspector (inline, no header) ────────────────── */

const FieldInspector = ( { field, onChange, allFields = [] } ) => {
	if ( ! field ) {
		return (
			<div className="ff-std-inspector-empty">
				<span className="dashicons dashicons-editor-help" />
				<p>
					{ __(
						'Select a field on the canvas to edit its settings.',
						'formspress'
					) }
				</p>
			</div>
		);
	}

	const set = ( key ) => ( value ) =>
		onChange( { ...field, [ key ]: value } );

	const setOption = ( i, val ) => {
		const opts = [ ...( field.options || [] ) ];
		opts[ i ] = val;
		onChange( { ...field, options: opts } );
	};

	/* Row block inspector */
	if ( field.type === 'row' ) {
		const cols = field.cols || [];
		const colCount = cols.length;
		const currentLayoutId =
			LAYOUT_PRESETS.find(
				( p ) =>
					p.widths.length === colCount &&
					p.widths.every( ( w, i ) => w === cols[ i ]?.width )
			)?.id || '';

		return (
			<div className="ff-std-field-inspector">
				<PanelBody
					title={ __( 'Layout', 'formspress' ) }
					initialOpen={ true }
				>
					<VStack spacing={ 4 }>
						<p
							style={ {
								margin: 0,
								fontSize: 12,
								color: '#757575',
							} }
						>
							{ __( 'Choose a column layout', 'formspress' ) }
						</p>
						<div className="ff-std-layout-grid">
							{ LAYOUT_PRESETS.map( ( p ) => (
								<button
									key={ p.id }
									type="button"
									className={ `ff-std-layout-preset${
										currentLayoutId === p.id
											? ' is-active'
											: ''
									}` }
									onClick={ () =>
										onChange(
											applyLayoutPreset( field, p.widths )
										)
									}
								>
									<div className="ff-std-layout-preset__viz">
										{ p.widths.map( ( w, i ) => {
											const flex =
												w === '1/2'
													? 2
													: w === '1/3'
													? 1
													: w === '2/3'
													? 2
													: w === '1/4'
													? 1
													: w === '3/4'
													? 3
													: 1;
											return (
												<span
													key={ i }
													style={ { flex } }
												/>
											);
										} ) }
									</div>
									<div className="ff-std-layout-preset__label">
										{ p.label }
									</div>
								</button>
							) ) }
						</div>
					</VStack>
				</PanelBody>
				<PanelBody
					title={ __( 'Columns', 'formspress' ) }
					initialOpen={ false }
				>
					<VStack spacing={ 3 }>
						{ cols.map( ( col, ci ) => (
							<HStack key={ col.id } spacing={ 2 } align="center">
								<FlexBlock>
									<SelectControl
										label={ sprintf(
											__( 'Col %d width', 'formspress' ),
											ci + 1
										) }
										value={ col.width }
										options={ [
											{ value: '1/4', label: '25%' },
											{ value: '1/3', label: '33%' },
											{ value: '1/2', label: '50%' },
											{ value: '2/3', label: '67%' },
											{ value: '3/4', label: '75%' },
											{ value: 'full', label: '100%' },
										] }
										onChange={ ( v ) => {
											const next = cols.map( ( c, i ) =>
												i === ci
													? { ...c, width: v }
													: c
											);
											onChange( {
												...field,
												cols: next,
											} );
										} }
										__nextHasNoMarginBottom
										__next40pxDefaultSize
									/>
								</FlexBlock>
								{ cols.length > 1 && (
									<Button
										isDestructive
										icon={ trash }
										size="small"
										onClick={ () =>
											onChange( {
												...field,
												cols: cols.filter(
													( _, i ) => i !== ci
												),
											} )
										}
										label={ __(
											'Remove column',
											'formspress'
										) }
									/>
								) }
							</HStack>
						) ) }
						<Button
							variant="secondary"
							size="small"
							disabled={ cols.length >= 6 }
							onClick={ () =>
								onChange( {
									...field,
									cols: [
										...cols,
										{
											id: generateColId(),
											width: '1/4',
											fields: [],
										},
									],
								} )
							}
						>
							{ __( '+ Add column', 'formspress' ) }
						</Button>
					</VStack>
				</PanelBody>
			</div>
		);
	}

	const showPlaceholder = [
		'text',
		'email',
		'phone',
		'number',
		'url',
		'textarea',
	].includes( field.type );
	const showOptions = [ 'select', 'radio', 'checkbox' ].includes(
		field.type
	);
	const showRequired = ! [ 'section', 'page_break', 'hidden' ].includes(
		field.type
	);

	return (
		<div className="ff-std-field-inspector">
			<PanelBody
				title={ __( 'Field', 'formspress' ) }
				initialOpen={ true }
			>
				<VStack spacing={ 4 }>
					{ field.type !== 'page_break' &&
						field.type !== 'hidden' && (
							<TextControl
								label={ __( 'Label', 'formspress' ) }
								value={ field.label || '' }
								onChange={ set( 'label' ) }
								__nextHasNoMarginBottom
								__next40pxDefaultSize
							/>
						) }
					{ field.type !== 'section' &&
						field.type !== 'page_break' && (
							<TextControl
								label={ __( 'Field ID', 'formspress' ) }
								value={ field.id || '' }
								onChange={ set( 'id' ) }
								help={ __(
									'Used as {field:id} in templates',
									'formspress'
								) }
								__nextHasNoMarginBottom
								__next40pxDefaultSize
							/>
						) }
					{ showPlaceholder && (
						<TextControl
							label={ __( 'Placeholder', 'formspress' ) }
							value={ field.placeholder || '' }
							onChange={ set( 'placeholder' ) }
							__nextHasNoMarginBottom
							__next40pxDefaultSize
						/>
					) }
					{ field.type !== 'section' &&
						field.type !== 'page_break' && (
							<TextareaControl
								label={ __( 'Description', 'formspress' ) }
								value={ field.description || '' }
								onChange={ set( 'description' ) }
								rows={ 2 }
								__nextHasNoMarginBottom
							/>
						) }
					{ showRequired && (
						<ToggleControl
							label={ __( 'Required', 'formspress' ) }
							checked={ !! field.required }
							onChange={ set( 'required' ) }
							__nextHasNoMarginBottom
						/>
					) }
					{ field.type === 'hidden' && (
						<TextControl
							label={ __( 'Value', 'formspress' ) }
							value={ field.default_value || '' }
							onChange={ set( 'default_value' ) }
							help="{user_email}, {user_id}, {site_url}"
							__nextHasNoMarginBottom
							__next40pxDefaultSize
						/>
					) }
					{ field.type === 'rating' && (
						<SelectControl
							label={ __( 'Max stars', 'formspress' ) }
							value={ field.max || 5 }
							options={ [ 3, 4, 5, 6, 7, 10 ].map( ( n ) => ( {
								value: n,
								label: String( n ),
							} ) ) }
							onChange={ ( v ) =>
								set( 'max' )( parseInt( v, 10 ) )
							}
							__nextHasNoMarginBottom
							__next40pxDefaultSize
						/>
					) }
					{ field.type === 'section' && (
						<TextareaControl
							label={ __( 'Section text', 'formspress' ) }
							value={ field.content || '' }
							onChange={ set( 'content' ) }
							rows={ 3 }
							__nextHasNoMarginBottom
						/>
					) }
				</VStack>
			</PanelBody>

			{ showOptions && (
				<PanelBody
					title={ __( 'Options', 'formspress' ) }
					initialOpen={ true }
				>
					{ ( field.options || [] ).map( ( opt, i ) => (
						<HStack spacing={ 2 } key={ i }>
							<FlexBlock>
								<TextControl
									value={ opt }
									onChange={ ( v ) => setOption( i, v ) }
									placeholder={ sprintf(
										__( 'Option %d', 'formspress' ),
										i + 1
									) }
									__nextHasNoMarginBottom
									__next40pxDefaultSize
								/>
							</FlexBlock>
							<Button
								variant="tertiary"
								isDestructive
								size="small"
								icon={ trash }
								onClick={ () => {
									const opts = ( field.options || [] ).filter(
										( _, idx ) => idx !== i
									);
									onChange( { ...field, options: opts } );
								} }
							/>
						</HStack>
					) ) }
					<Button
						variant="secondary"
						size="small"
						onClick={ () =>
							onChange( {
								...field,
								options: [ ...( field.options || [] ), '' ],
							} )
						}
					>
						{ __( '+ Add option', 'formspress' ) }
					</Button>
				</PanelBody>
			) }

			{ ! [ 'hidden', 'page_break' ].includes( field.type ) && (
				<ConditionsPanel
					field={ field }
					allFields={ allFields }
					onChange={ onChange }
					allowSkip={ false }
				/>
			) }

			{ ! [ 'section', 'page_break', 'row' ].includes( field.type ) && (
				<DataBindingPanel
					field={ field }
					allFields={ allFields }
					onChange={ onChange }
				/>
			) }
		</div>
	);
};

/* ── Data Binding panel ──────────────────────────────────────────────
 * Lets the field designer wire a submitted value into a CPT / post_meta
 * / user_meta / option after the entry is saved. This is the Block
 * Bindings API used BACKWARDS (form as data sink, not block as sink).
 */

const BINDING_TARGETS = [
	{ value: '', label: __( 'None (default)', 'formspress' ) },
	{ value: 'cpt', label: __( 'Create new post (CPT)', 'formspress' ) },
	{
		value: 'post_meta',
		label: __( 'Post meta (of CPT created in this form)', 'formspress' ),
	},
	{
		value: 'user_meta',
		label: __( 'User meta (existing user, matched by email)', 'formspress' ),
	},
	{ value: 'option', label: __( 'Site option', 'formspress' ) },
];

const POST_TYPE_OPTIONS = ( () => {
	const list = window.flowFormsData?.bindingTargets?.post_types || [];
	return [
		{ value: '', label: __( '— Pick a post type —', 'formspress' ) },
		...list.map( ( pt ) => ( {
			value: pt.slug,
			label: `${ pt.label } (${ pt.slug })`,
		} ) ),
	];
} )();

const DataBindingPanel = ( { field, allFields, onChange } ) => {
	const binding = field.binding || {};
	const target = binding.target || '';
	const src = binding.source || {};

	const setBinding = ( next ) => {
		if ( ! next || ! next.target ) {
			const { binding: _drop, ...rest } = field;
			onChange( rest );
			return;
		}
		onChange( { ...field, binding: next } );
	};

	const setTarget = ( newTarget ) => {
		if ( ! newTarget ) {
			setBinding( null );
			return;
		}
		setBinding( { target: newTarget, source: {} } );
	};

	const setSource = ( key, value ) => {
		setBinding( {
			target,
			source: { ...src, [ key ]: value },
		} );
	};

	/* Detect any other field already marked as the primary CPT to warn. */
	const otherPrimary = ( allFields || [] ).find(
		( f ) => f.id !== field.id && f.binding?.target === 'cpt'
	);

	return (
		<PanelBody
			title={ __( 'Data binding (advanced)', 'formspress' ) }
			initialOpen={ false }
		>
			<VStack spacing={ 4 }>
				<Text variant="muted" size={ 12 }>
					{ __(
						'Bind this submitted value to a WordPress data store. Runs after the entry is saved.',
						'formspress'
					) }
				</Text>

				<SelectControl
					label={ __( 'Bind submitted value to', 'formspress' ) }
					value={ target }
					options={ BINDING_TARGETS }
					onChange={ setTarget }
					__nextHasNoMarginBottom
					__next40pxDefaultSize
				/>

				{ target === 'cpt' && (
					<>
						{ otherPrimary && (
							<Text variant="muted" size={ 12 }>
								{ sprintf(
									__(
										'Note: only one field per form can create a CPT. "%s" is currently the primary — switching this field will replace it.',
										'formspress'
									),
									otherPrimary.label || otherPrimary.id
								) }
							</Text>
						) }
						<SelectControl
							label={ __( 'Post type', 'formspress' ) }
							value={ src.post_type || '' }
							options={ POST_TYPE_OPTIONS }
							onChange={ ( v ) => setSource( 'post_type', v ) }
							help={ __(
								'The post type must exist (register it in your theme/plugin, or enable the flowforms_auto_register_cpts filter).',
								'formspress'
							) }
							__nextHasNoMarginBottom
							__next40pxDefaultSize
						/>
						<TextControl
							label={ __(
								'Store own value in meta key (optional)',
								'formspress'
							) }
							value={ src.meta_key || '' }
							onChange={ ( v ) => setSource( 'meta_key', v ) }
							placeholder="e.g. lead_email"
							__nextHasNoMarginBottom
							__next40pxDefaultSize
						/>
					</>
				) }

				{ target === 'post_meta' && (
					<TextControl
						label={ __( 'Meta key', 'formspress' ) }
						value={ src.meta_key || '' }
						onChange={ ( v ) => setSource( 'meta_key', v ) }
						placeholder="e.g. company"
						help={ __(
							'Attached to the CPT created by the "Create new post" field in this form.',
							'formspress'
						) }
						__nextHasNoMarginBottom
						__next40pxDefaultSize
					/>
				) }

				{ target === 'user_meta' && (
					<TextControl
						label={ __( 'Meta key', 'formspress' ) }
						value={ src.meta_key || '' }
						onChange={ ( v ) => setSource( 'meta_key', v ) }
						placeholder="e.g. company"
						help={ __(
							'Use "_email" as the meta key to mark this field as the email anchor used to match the existing user.',
							'formspress'
						) }
						__nextHasNoMarginBottom
						__next40pxDefaultSize
					/>
				) }

				{ target === 'option' && (
					<TextControl
						label={ __( 'Option key', 'formspress' ) }
						value={ src.option_key || '' }
						onChange={ ( v ) => setSource( 'option_key', v ) }
						placeholder="e.g. last_signup_email"
						__nextHasNoMarginBottom
						__next40pxDefaultSize
					/>
				) }
			</VStack>
		</PanelBody>
	);
};

/* ── Sidebar inserter (Gutenberg-style left panel) ───────────────── */

const SidebarInserter = ( { onAdd } ) => {
	const [ search, setSearch ] = useState( '' );

	const filtered = FieldGroups.map( ( g ) => ( {
		...g,
		labelFR: FieldGroupsFR[ g.id ] || g.label,
		types: FIELD_TYPES.filter(
			( f ) =>
				f.group === g.id &&
				( ! search ||
					f.label.toLowerCase().includes( search.toLowerCase() ) )
		),
	} ) ).filter( ( g ) => g.types.length > 0 );

	const tabs = [
		{ name: 'blocks', title: __( 'Blocs', 'formspress' ) },
		{ name: 'patterns', title: __( 'Compositions', 'formspress' ) },
		{ name: 'media', title: __( 'Médias', 'formspress' ) },
	];

	return (
		<div className="ff-gb-sidebar ff-gb-sidebar--inserter">
			<TabPanel className="ff-gb-sidebar__tabs" tabs={ tabs }>
				{ ( tab ) => {
					if ( tab.name !== 'blocks' ) {
						return (
							<div className="ff-gb-sidebar__placeholder">
								<p>{ __( 'Coming soon', 'formspress' ) }</p>
							</div>
						);
					}
					return (
						<>
							<div className="ff-gb-sidebar__search">
								<SearchControl
									value={ search }
									onChange={ setSearch }
									placeholder={ __( 'Search', 'formspress' ) }
									__nextHasNoMarginBottom
								/>
							</div>
							<div className="ff-gb-sidebar__body">
								{ filtered.length === 0 && (
									<p className="ff-gb-sidebar__empty">
										{ __( 'No results.', 'formspress' ) }
									</p>
								) }
								{ filtered.map( ( group ) => (
									<div
										key={ group.id }
										className="ff-gb-inserter__group"
									>
										<p className="ff-gb-inserter__group-title">
											{ group.labelFR }
										</p>
										<div className="ff-gb-inserter__grid">
											{ group.types.map( ( ft ) => (
												<Button
													key={ ft.type }
													className="ff-gb-inserter__item"
													onClick={ () =>
														onAdd( ft.type )
													}
												>
													<span
														className={ `ff-gb-inserter__item-icon dashicons dashicons-${ ft.icon }` }
													/>
													<span className="ff-gb-inserter__item-label">
														{ ft.label }
													</span>
												</Button>
											) ) }
										</div>
									</div>
								) ) }
							</div>
						</>
					);
				} }
			</TabPanel>
		</div>
	);
};

/* ── Sidebar list view (Gutenberg-style left panel) ──────────────── */

const SidebarListView = ( props ) => {
	const tabs = [
		{ name: 'list', title: __( 'Vue en liste', 'formspress' ) },
		{ name: 'structure', title: __( 'Structure', 'formspress' ) },
	];
	return (
		<div className="ff-gb-sidebar ff-gb-sidebar--listview">
			<TabPanel className="ff-gb-sidebar__tabs" tabs={ tabs }>
				{ ( tab ) => {
					if ( tab.name === 'list' ) {
						return <FieldTreeView { ...props } />;
					}
					return (
						<div className="ff-gb-sidebar__placeholder ff-gb-sidebar__placeholder--code">
							<pre>
								{ JSON.stringify( props.fields, null, 2 ) }
							</pre>
						</div>
					);
				} }
			</TabPanel>
		</div>
	);
};

/* ── Form Builder Page ────────────────────────────────────────────── */

const FormBuilderPage = () => {
	const { id } = useParams();
	const navigate = useNavigate();

	const [ form, setForm ] = useState( null );
	const [ isSaving, setSaving ] = useState( false );
	const [ isLoading, setLoading ] = useState( true );
	const [ notice, setNotice ] = useState( null );
	const [ selectedPath, setSelectedPath ] = useState( null );
	const [ leftPanel, setLeftPanel ] = useState( null ); // 'inserter' | 'listview' | null
	const [ inspectorOpen, setInspectorOpen ] = useState( true );
	const [ inspectorTab, setInspectorTab ] = useState( 'form' ); // 'form' | 'block'
	const [ blockAnchor, setBlockAnchor ] = useState( null );
	const [ isSaveTplOpen, setSaveTplOpen ] = useState( false );

	const canvasRef = useRef( null );

	useEffect( () => {
		get( formEndpoint( id ) )
			.then( ( res ) => setForm( res.data ) )
			.catch( () => navigate( '/forms' ) )
			.finally( () => setLoading( false ) );
	}, [ id ] );

	/* Auto-switch inspector tab based on selection. */
	useEffect( () => {
		setInspectorTab( selectedPath ? 'block' : 'form' );
	}, [ selectedPath ] );

	/* Find DOM anchor for the floating block toolbar. */
	useEffect( () => {
		if ( ! selectedPath || ! canvasRef.current || ! form ) {
			setBlockAnchor( null );
			return;
		}
		const sel = getFieldAtPath( form.fields || [], selectedPath );
		if ( ! sel ) {
			setBlockAnchor( null );
			return;
		}
		const node = canvasRef.current.querySelector(
			`[data-block-id="${ sel.id }"]`
		);
		setBlockAnchor( node || null );
	}, [ selectedPath, form ] );

	const save = useCallback( async () => {
		setSaving( true );
		try {
			await put( formEndpoint( id ), {
				fields: form.fields,
				settings: form.settings,
				actions: form.actions,
				title: form.title,
				description: form.description,
				status: form.status,
			} );
			setNotice( {
				type: 'success',
				message: __( 'Form saved.', 'formspress' ),
			} );
			setTimeout( () => setNotice( null ), 3000 );
		} catch ( e ) {
			setNotice( {
				type: 'error',
				message: e.message || __( 'Failed to save.', 'formspress' ),
			} );
		} finally {
			setSaving( false );
		}
	}, [ form, id ] );

	const setFields = ( fields ) => setForm( ( f ) => ( { ...f, fields } ) );
	const setSettings = ( key, value ) =>
		setForm( ( f ) => ( {
			...f,
			settings: { ...( f.settings || {} ), [ key ]: value },
		} ) );
	const setStyle = ( styleObj ) =>
		setForm( ( f ) => ( {
			...f,
			settings: { ...( f.settings || {} ), style: styleObj },
		} ) );
	const setActions = ( actions ) => setForm( ( f ) => ( { ...f, actions } ) );

	/* parent: [] for top-level, [topIdx, colIdx] for inside a row column. afterIdx = -1 → prepend. */
	const addField = ( type, parent = [], afterIdx = -1 ) => {
		const newField = getFieldDefaults( type );
		const next = insertFieldAtParent(
			form.fields || [],
			parent,
			afterIdx,
			newField
		);
		setFields( next );
		const newPath =
			parent.length === 0
				? [ afterIdx + 1 ]
				: [ parent[ 0 ], parent[ 1 ], afterIdx + 1 ];
		setSelectedPath( newPath );
	};

	const updateField = ( path, updated ) => {
		setFields(
			updateFieldAtPath( form.fields || [], path, () => updated )
		);
	};

	const deleteField = ( path ) => {
		setFields( removeFieldAtPath( form.fields || [], path ) );
		setSelectedPath( null );
	};

	const moveField = ( path, delta ) => {
		setFields( moveFieldAtPath( form.fields || [], path, delta ) );
		const newPath = [ ...path ];
		newPath[ newPath.length - 1 ] += delta;
		setSelectedPath( newPath );
	};

	if ( isLoading )
		return (
			<div className="ff-page ff-page--loading">
				<Spinner />
			</div>
		);
	if ( ! form ) return null;

	const fields = form.fields || [];
	const settings = form.settings || {};
	const formStyle = { ...DEFAULT_STYLE, ...( settings.style || {} ) };
	const selectedField = selectedPath
		? getFieldAtPath( fields, selectedPath )
		: null;
	const selectedIsTopLevel = selectedPath && selectedPath.length === 1;
	const selectedDef = selectedField
		? FIELD_TYPES.find( ( f ) => f.type === selectedField.type )
		: null;

	/* Build breadcrumb segments from path. */
	const breadcrumbs = ( () => {
		const out = [
			{
				label: __( 'Form', 'formspress' ),
				onClick: () => setSelectedPath( null ),
			},
		];
		if ( ! selectedPath ) return out;
		const top = fields[ selectedPath[ 0 ] ];
		if ( ! top ) return out;
		if ( top.type === 'row' ) {
			out.push( {
				label: __( 'Row', 'formspress' ),
				onClick: () => setSelectedPath( [ selectedPath[ 0 ] ] ),
			} );
			if ( selectedPath.length === 3 ) {
				const child =
					top.cols?.[ selectedPath[ 1 ] ]?.fields?.[
						selectedPath[ 2 ]
					];
				if ( child ) {
					const def = FIELD_TYPES.find(
						( f ) => f.type === child.type
					);
					out.push( {
						label: def?.label || child.type,
						onClick: () => {},
					} );
				}
			}
		} else {
			const def = FIELD_TYPES.find( ( f ) => f.type === top.type );
			out.push( { label: def?.label || top.type, onClick: () => {} } );
		}
		return out;
	} )();

	/* Render the floating toolbar contents based on the selected block type. */
	const renderRowToolbar = ( row, path ) => {
		const isFirst = path[ 0 ] === 0;
		const isLast = path[ 0 ] === fields.length - 1;
		const cols = row.cols || [];
		const colCount = cols.length;
		const currentLayoutId =
			LAYOUT_PRESETS.find(
				( p ) =>
					p.widths.length === colCount &&
					p.widths.every( ( w, i ) => w === cols[ i ]?.width )
			)?.id || '';
		const setLayout = ( widths ) =>
			updateField( path, applyLayoutPreset( row, widths ) );
		const addCol = () => {
			const next = [
				...cols,
				{ id: generateColId(), width: '1/4', fields: [] },
			];
			updateField( path, { ...row, cols: next } );
		};
		return (
			<Toolbar label={ __( 'Row options', 'formspress' ) }>
				<ToolbarGroup>
					<ToolbarButton
						icon={
							<span className="dashicons dashicons-columns" />
						}
						label={ __( 'Columns', 'formspress' ) }
					>
						{ sprintf( __( '%d cols', 'formspress' ), colCount ) }
					</ToolbarButton>
				</ToolbarGroup>
				<ToolbarGroup>
					{ LAYOUT_PRESETS.slice( 0, 3 ).map( ( p ) => (
						<ToolbarButton
							key={ p.id }
							isActive={ currentLayoutId === p.id }
							onClick={ () => setLayout( p.widths ) }
							label={ p.label }
						>
							{ p.widths.length }
						</ToolbarButton>
					) ) }
				</ToolbarGroup>
				<ToolbarGroup>
					<ToolbarButton
						icon={ plus }
						onClick={ addCol }
						label={ __( 'Add column', 'formspress' ) }
						disabled={ colCount >= 6 }
					/>
				</ToolbarGroup>
				<ToolbarGroup>
					<ToolbarButton
						icon={ chevronUp }
						disabled={ isFirst }
						onClick={ () => moveField( path, -1 ) }
						label={ __( 'Move up', 'formspress' ) }
					/>
					<ToolbarButton
						icon={ chevronDown }
						disabled={ isLast }
						onClick={ () => moveField( path, 1 ) }
						label={ __( 'Move down', 'formspress' ) }
					/>
				</ToolbarGroup>
				<ToolbarGroup>
					<ToolbarButton
						isDestructive
						icon={ trash }
						onClick={ () => deleteField( path ) }
						label={ __( 'Delete row', 'formspress' ) }
					/>
				</ToolbarGroup>
			</Toolbar>
		);
	};

	const renderFieldToolbar = ( field, path ) => {
		const def = FIELD_TYPES.find( ( f ) => f.type === field.type );
		const isLayout = [ 'section', 'page_break' ].includes( field.type );
		const inRow = path.length === 3;
		let isFirst = false,
			isLast = false;
		if ( path.length === 1 ) {
			isFirst = path[ 0 ] === 0;
			isLast = path[ 0 ] === fields.length - 1;
		} else {
			const siblings =
				fields[ path[ 0 ] ]?.cols?.[ path[ 1 ] ]?.fields || [];
			isFirst = path[ 2 ] === 0;
			isLast = path[ 2 ] === siblings.length - 1;
		}
		return (
			<Toolbar label={ __( 'Block options', 'formspress' ) }>
				<ToolbarGroup>
					<ToolbarButton
						icon={
							<span
								className={ `dashicons dashicons-${
									def?.icon || 'admin-generic'
								}` }
							/>
						}
						label={ __( 'Block type', 'formspress' ) }
					>
						{ def?.label || field.type }
					</ToolbarButton>
				</ToolbarGroup>
				{ ! isLayout && ! inRow && (
					<ToolbarGroup>
						<ToolbarButton
							icon={ <WidthFullIcon /> }
							label={ __( 'Full width', 'formspress' ) }
							isActive={ ( field.width || 'full' ) === 'full' }
							onClick={ () =>
								updateField( path, { ...field, width: 'full' } )
							}
						/>
						<ToolbarButton
							icon={ <WidthHalfIcon /> }
							label={ __( 'Half width', 'formspress' ) }
							isActive={ field.width === '1/2' }
							onClick={ () =>
								updateField( path, { ...field, width: '1/2' } )
							}
						/>
						<ToolbarButton
							icon={ <WidthThirdIcon /> }
							label={ __( 'One third', 'formspress' ) }
							isActive={ field.width === '1/3' }
							onClick={ () =>
								updateField( path, { ...field, width: '1/3' } )
							}
						/>
					</ToolbarGroup>
				) }
				<ToolbarGroup>
					<ToolbarButton
						icon={ chevronUp }
						disabled={ isFirst }
						onClick={ () => moveField( path, -1 ) }
						label={ __( 'Move up', 'formspress' ) }
					/>
					<ToolbarButton
						icon={ chevronDown }
						disabled={ isLast }
						onClick={ () => moveField( path, 1 ) }
						label={ __( 'Move down', 'formspress' ) }
					/>
				</ToolbarGroup>
				<ToolbarGroup>
					<ToolbarButton
						isDestructive
						icon={ trash }
						onClick={ () => deleteField( path ) }
						label={ __( 'Delete', 'formspress' ) }
					/>
				</ToolbarGroup>
			</Toolbar>
		);
	};

	const leftSidebar =
		leftPanel === 'inserter' ? (
			<SidebarInserter
				onAdd={ ( type ) => addField( type, [], fields.length - 1 ) }
			/>
		) : (
			<SidebarListView
				fields={ fields }
				selectedPath={ selectedPath }
				onSelect={ ( path ) => setSelectedPath( path ) }
				onDelete={ deleteField }
			/>
		);

	const rightSidebar = (
		<div className="ff-std-inspector ff-gb-inspector">
			<TabPanel
				key={ inspectorTab }
				tabs={ [
					{ name: 'form', title: __( 'Form', 'formspress' ) },
					{ name: 'block', title: __( 'Bloc', 'formspress' ) },
				] }
				initialTabName={ inspectorTab }
				onSelect={ setInspectorTab }
			>
				{ ( { name } ) => {
					if ( name === 'form' ) {
						return (
							<div className="ff-std-settings-inspector ff-gb-form-inspector">
								<PanelBody
									title={ __( 'Form info', 'formspress' ) }
									initialOpen={ true }
								>
									<VStack spacing={ 4 }>
										<TextControl
											label={ __( 'Title', 'formspress' ) }
											value={ form.title || '' }
											onChange={ ( v ) =>
												setForm( ( f ) => ( {
													...f,
													title: v,
												} ) )
											}
											__nextHasNoMarginBottom
											__next40pxDefaultSize
										/>
										<TextareaControl
											label={ __(
												'Description',
												'formspress'
											) }
											value={ form.description || '' }
											onChange={ ( v ) =>
												setForm( ( f ) => ( {
													...f,
													description: v,
												} ) )
											}
											rows={ 2 }
											__nextHasNoMarginBottom
										/>
										<SelectControl
											label={ __(
												'Status',
												'formspress'
											) }
											value={ form.status }
											options={ [
												{
													value: 'active',
													label: 'Active',
												},
												{
													value: 'inactive',
													label: 'Inactive',
												},
												{
													value: 'draft',
													label: 'Draft',
												},
											] }
											onChange={ ( v ) =>
												setForm( ( f ) => ( {
													...f,
													status: v,
												} ) )
											}
											__nextHasNoMarginBottom
											__next40pxDefaultSize
										/>
									</VStack>
								</PanelBody>
								<PanelBody
									title={ __( 'Submission', 'formspress' ) }
									initialOpen={ false }
								>
									<VStack spacing={ 4 }>
										<TextControl
											label={ __(
												'Submit button label',
												'formspress'
											) }
											value={
												settings.submit_label || ''
											}
											onChange={ ( v ) =>
												setSettings( 'submit_label', v )
											}
											__nextHasNoMarginBottom
											__next40pxDefaultSize
										/>
										<SelectControl
											label={ __(
												'After submission',
												'formspress'
											) }
											value={
												settings.success_action ||
												'message'
											}
											options={ [
												{
													value: 'message',
													label: __(
														'Show message',
														'formspress'
													),
												},
												{
													value: 'redirect',
													label: __(
														'Redirect to URL',
														'formspress'
													),
												},
											] }
											onChange={ ( v ) =>
												setSettings(
													'success_action',
													v
												)
											}
											__nextHasNoMarginBottom
											__next40pxDefaultSize
										/>
										{ settings.success_action !==
											'redirect' && (
											<TextareaControl
												label={ __(
													'Success message',
													'formspress'
												) }
												value={
													settings.success_message ||
													''
												}
												onChange={ ( v ) =>
													setSettings(
														'success_message',
														v
													)
												}
												rows={ 2 }
												__nextHasNoMarginBottom
											/>
										) }
										{ settings.success_action ===
											'redirect' && (
											<TextControl
												label={ __(
													'Redirect URL',
													'formspress'
												) }
												value={
													settings.redirect_url || ''
												}
												onChange={ ( v ) =>
													setSettings(
														'redirect_url',
														v
													)
												}
												placeholder="https://…"
												__nextHasNoMarginBottom
												__next40pxDefaultSize
											/>
										) }
									</VStack>
								</PanelBody>
								<PanelBody
									title={ __( 'Anti-spam', 'formspress' ) }
									initialOpen={ false }
								>
									<VStack spacing={ 4 }>
										<ToggleControl
											label={ __(
												'Enable honeypot',
												'formspress'
											) }
											checked={ !! settings.honeypot }
											onChange={ ( v ) =>
												setSettings( 'honeypot', v )
											}
											help={ __(
												'Hidden field to catch bots.',
												'formspress'
											) }
											__nextHasNoMarginBottom
										/>
									</VStack>
								</PanelBody>
								<PanelBody
									title={ __( 'Style', 'formspress' ) }
									initialOpen={ false }
								>
									<StyleInspector
										style={ settings.style }
										onChange={ setStyle }
									/>
								</PanelBody>
								<PanelBody
									title={ __( 'Actions', 'formspress' ) }
									initialOpen={ false }
								>
									<ActionsPanel
										actions={ form.actions || [] }
										onChange={ setActions }
										form={ form }
									/>
								</PanelBody>
							</div>
						);
					}

					/* "Bloc" tab */
					if ( ! selectedField ) {
						return (
							<div className="ff-std-inspector-empty">
								<span className="dashicons dashicons-editor-help" />
								<p>
									{ __(
										'Select a block on the canvas to edit it.',
										'formspress'
									) }
								</p>
							</div>
						);
					}
					return (
						<div className="ff-gb-block-inspector">
							<div className="ff-gb-block-inspector__header">
								<div className="ff-gb-block-inspector__icon">
									<span
										className={ `dashicons dashicons-${
											selectedDef?.icon || 'admin-generic'
										}` }
									/>
								</div>
								<div className="ff-gb-block-inspector__meta">
									<div className="ff-gb-block-inspector__name">
										{ selectedField.type === 'row'
											? __( 'Row', 'formspress' )
											: selectedDef?.label ||
											  selectedField.type }
									</div>
									<div className="ff-gb-block-inspector__desc">
										{ selectedField.type === 'row'
											? __(
													'Multi-column layout.',
													'formspress'
											  )
											: selectedDef?.description ||
											  __(
													'Form input block.',
													'formspress'
											  ) }
									</div>
								</div>
							</div>
							<FieldInspector
								field={ selectedField }
								onChange={ ( updated ) =>
									updateField( selectedPath, updated )
								}
								allFields={ flattenFieldTree( fields ) }
							/>
						</div>
					);
				} }
			</TabPanel>
		</div>
	);

	return (
		<EditorSkeleton
			className="ff-std-builder"
			title={ form.title }
			titlePlaceholder={ __( 'Form title…', 'formspress' ) }
			onTitleChange={ ( v ) =>
				setForm( ( f ) => ( { ...f, title: v } ) )
			}
			onClose={ () => navigate( '/forms' ) }
			onSave={ save }
			isSaving={ isSaving }
			showLeftSidebar={ leftPanel !== null }
			onToggleLeftSidebar={ () =>
				setLeftPanel( leftPanel === 'listview' ? null : 'listview' )
			}
			leftSidebarLabel={ __( 'Toggle list view', 'formspress' ) }
			leftSidebar={ leftSidebar }
			showRightSidebar={ inspectorOpen }
			onToggleRightSidebar={ () => setInspectorOpen( ! inspectorOpen ) }
			rightSidebar={ rightSidebar }
			onTogglePreview={ () =>
				window.open( `/formspress/${ id }/`, '_blank' )
			}
			moreMenuControls={ [
				{
					title: sprintf(
						__( 'Entries (%d)', 'formspress' ),
						form.entries_count || 0
					),
					onClick: () => navigate( `/forms/${ id }/entries` ),
				},
				{
					title: __( 'Save as template…', 'formspress' ),
					onClick: () => setSaveTplOpen( true ),
				},
			] }
			notice={ notice }
			onDismissNotice={ () => setNotice( null ) }
			overlays={
				<>
					{ /* Bottom breadcrumb strip */ }
					<div className="ff-gb-breadcrumb">
						{ breadcrumbs.map( ( seg, i ) => (
							<span key={ i } className="ff-gb-breadcrumb__seg">
								{ i > 0 && (
									<span className="ff-gb-breadcrumb__sep">
										›
									</span>
								) }
								<button
									type="button"
									className="ff-gb-breadcrumb__btn"
									onClick={ seg.onClick }
								>
									{ seg.label }
								</button>
							</span>
						) ) }
					</div>

					{ /* Floating block toolbar (single Popover, anchored) */ }
					{ selectedField && blockAnchor && (
						<Popover
							anchor={ blockAnchor }
							placement="top-start"
							className="ff-gb-block-toolbar-popover"
							focusOnMount={ false }
						>
							<div onClick={ ( e ) => e.stopPropagation() }>
								{ selectedField.type === 'row'
									? renderRowToolbar(
											selectedField,
											selectedPath
									  )
									: renderFieldToolbar(
											selectedField,
											selectedPath
									  ) }
							</div>
						</Popover>
					) }

					{ isSaveTplOpen && (
						<SaveAsTemplateModal
							formId={ parseInt( id, 10 ) }
							defaultLabel={ form.title || '' }
							onClose={ () => setSaveTplOpen( false ) }
							onSaved={ () =>
								setNotice( {
									type: 'success',
									message: __(
										'Template saved.',
										'formspress'
									),
								} )
							}
						/>
					) }
				</>
			}
		>
			{ /* Center: canvas */ }
			<div className="ff-std-canvas ff-gb-canvas" ref={ canvasRef }>
				<div className="ff-std-canvas__inner">
					<div
						className="ff-std-canvas__form"
						style={ {
							background: formStyle.bg_color,
							color: formStyle.text_color,
							fontFamily: formStyle.font_family,
							fontSize: formStyle.font_size,
						} }
					>
						{ /* Form header preview */ }
						<div className="ff-std-canvas__form-header">
							<div
								className="ff-std-canvas__form-title"
								style={ { color: formStyle.text_color } }
							>
								{ form.title ||
									__( 'Form title', 'formspress' ) }
							</div>
							{ form.description && (
								<p
									className="ff-std-canvas__form-desc"
									style={ { color: formStyle.text_color } }
								>
									{ form.description }
								</p>
							) }
						</div>

						{ /* Field blocks + inline appenders */ }
						<div
							className="ff-std-canvas__fields"
							onClick={ () => setSelectedPath( null ) }
						>
							{ fields.length === 0 ? (
								<div
									className="ff-std-canvas__empty"
									onClick={ ( e ) => e.stopPropagation() }
								>
									<div
										className="ff-std-canvas__empty-icon"
										aria-hidden="true"
									>
										<span className="dashicons dashicons-feedback" />
									</div>
									<Heading
										level={ 3 }
										size={ 16 }
										weight={ 600 }
										className="ff-std-canvas__empty-title"
									>
										{ __(
											'Start building your form',
											'formspress'
										) }
									</Heading>
									<Text
										variant="muted"
										size={ 13 }
										className="ff-std-canvas__empty-desc"
									>
										{ __(
											'Add your first field to get started. You can rearrange and customize fields any time.',
											'formspress'
										) }
									</Text>
									<StandardBlockAppender
										onAdd={ ( type ) =>
											addField( type, [], -1 )
										}
										isAlwaysVisible
										variant="primary"
									/>
								</div>
							) : (
								<StandardBlockAppender
									onAdd={ ( type ) =>
										addField( type, [], -1 )
									}
									isAlwaysVisible
								/>
							) }
							{ fields.map( ( field, i ) => {
								const path = [ i ];
								if ( field.type === 'row' ) {
									return (
										<div
											key={ field.id }
											className="ff-std-field-wrap"
											data-width="full"
										>
											<div
												style={ {
													marginBottom:
														formStyle.field_spacing,
												} }
											>
												<RowBlock
													row={ field }
													rowPath={ path }
													selectedPath={
														selectedPath
													}
													onSelect={ ( p ) =>
														setSelectedPath( p )
													}
													onUpdateRow={ ( updated ) =>
														updateField(
															path,
															updated
														)
													}
													addField={ addField }
													updateField={ updateField }
													deleteField={ deleteField }
													moveField={ moveField }
													formStyle={ formStyle }
												/>
												<StandardBlockAppender
													onAdd={ ( type ) =>
														addField( type, [], i )
													}
												/>
											</div>
										</div>
									);
								}
								return (
									<div
										key={ field.id }
										className="ff-std-field-wrap"
										data-width={ field.width || 'full' }
									>
										<div
											style={ {
												marginBottom:
													formStyle.field_spacing,
											} }
										>
											<StandardFieldBlock
												field={ field }
												isSelected={ pathEq(
													selectedPath,
													path
												) }
												onClick={ ( e ) => {
													e.stopPropagation();
													setSelectedPath( path );
												} }
												onUpdate={ ( updated ) =>
													updateField( path, updated )
												}
												formStyle={ formStyle }
											/>
											<StandardBlockAppender
												onAdd={ ( type ) =>
													addField( type, [], i )
												}
											/>
										</div>
									</div>
								);
							} ) }
						</div>

						{ /* Submit button preview */ }
						<div className="ff-std-canvas__footer">
							{ ( () => {
								const btnStyle = formStyle.btn_style || 'solid';
								const baseColor =
									formStyle.primary_color || '#2271b1';
								const submitStyles = {
									borderRadius: formStyle.btn_radius,
									width:
										formStyle.btn_width === 'full'
											? '100%'
											: 'auto',
								};
								if ( btnStyle === 'outline' ) {
									submitStyles.background = 'transparent';
									submitStyles.color = baseColor;
									submitStyles.border = `2px solid ${ baseColor }`;
								} else if ( btnStyle === 'ghost' ) {
									submitStyles.background = 'transparent';
									submitStyles.color = baseColor;
									submitStyles.border = 'none';
								} else {
									submitStyles.background = baseColor;
									submitStyles.color =
										formStyle.btn_text_color;
									submitStyles.border = 'none';
								}
								return (
									<button
										className="ff-std-canvas__submit"
										disabled
										style={ submitStyles }
									>
										{ settings.submit_label ||
											__( 'Submit', 'formspress' ) }
									</button>
								);
							} )() }
						</div>
					</div>
				</div>
			</div>
		</EditorSkeleton>
	);
};

export default FormBuilderPage;
