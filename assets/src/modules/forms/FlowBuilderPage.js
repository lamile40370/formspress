import { useState, useEffect, useCallback, useRef } from '@wordpress/element';
import {
	Button,
	Spinner,
	TextControl,
	TextareaControl,
	ToggleControl,
	SelectControl,
	ColorPicker,
	Dropdown,
	DropdownMenu,
	PanelBody,
	TabPanel,
	SearchControl,
	Flex,
	FlexItem,
	FlexBlock,
	__experimentalText as Text,
	__experimentalHeading as Heading,
	__experimentalVStack as VStack,
	__experimentalHStack as HStack,
} from '@wordpress/components';
import { MediaUpload } from '@wordpress/media-utils';
import { __, sprintf } from '@wordpress/i18n';
import { useParams, useNavigate } from 'react-router-dom';
import {
	trash,
	plus,
	chevronUp,
	chevronDown,
	arrowLeft,
	close,
	desktop,
	tablet,
	mobile,
	copy,
	external,
	moreVertical,
} from '@wordpress/icons';
import { get, put } from '../../api/client';
import { form as formEndpoint } from '../../api/endpoints';
import { FIELD_TYPES } from './components/FieldPicker';
import ActionsPanel from './components/ActionsPanel';
import ConditionsPanel from './components/ConditionsPanel';
import EditorSkeleton from './components/EditorSkeleton';
import SaveAsTemplateModal from './SaveAsTemplateModal';

/* ── Constants ────────────────────────────────────────────────────── */

const generateId = () => 'step_' + Math.random().toString( 36 ).slice( 2, 8 );

const STEP_TYPES = FIELD_TYPES.filter(
	( f ) => ! [ 'section', 'page_break', 'hidden', 'file' ].includes( f.type )
);

const STEP_GROUPS = [
	{
		label: __( 'Text', 'flowforms' ),
		types: [ 'text', 'textarea', 'email', 'phone', 'number', 'url' ],
	},
	{
		label: __( 'Choice', 'flowforms' ),
		types: [ 'radio', 'checkbox', 'select', 'yes_no' ],
	},
	{
		label: __( 'Scale', 'flowforms' ),
		types: [ 'rating', 'opinion_scale', 'nps' ],
	},
	{
		label: __( 'Other', 'flowforms' ),
		types: [ 'date', 'time', 'statement' ],
	},
];

const TYPE_ICONS = {
	text: 'editor-paragraph',
	textarea: 'editor-quote',
	email: 'email-alt',
	phone: 'phone',
	number: 'calculator',
	url: 'admin-links',
	radio: 'marker',
	checkbox: 'yes-alt',
	select: 'menu',
	yes_no: 'yes',
	statement: 'format-quote',
	rating: 'star-filled',
	opinion_scale: 'editor-ol',
	nps: 'chart-bar',
	date: 'calendar',
	time: 'clock',
};

const FALLBACK_PRESETS = [
	{
		id: 'default',
		label: __( 'Classic', 'flowforms' ),
		bg: '#ffffff',
		text: '#1d2327',
		primary: '#2271b1',
		btnText: '#ffffff',
	},
	{
		id: 'dark',
		label: __( 'Dark', 'flowforms' ),
		bg: '#1a1a1a',
		text: '#f0f0f0',
		primary: '#6bb6ff',
		btnText: '#1a1a1a',
	},
];

/* Theme presets sourced from the active FSE theme's theme.json (incl. style variations).
   Falls back to a tiny built-in palette if the theme exposes none. */
const THEME_PRESETS = ( () => {
	const variations = Array.isArray( window.flowFormsData?.themeVariations )
		? window.flowFormsData.themeVariations
		: [];
	return variations.length > 0 ? variations : FALLBACK_PRESETS;
} )();

const getDefaultTheme = () => THEME_PRESETS[ 0 ];

const CANVAS_WELCOME = '__welcome__';
const CANVAS_END = '__end__';

const getStepDefaults = ( type ) => ( {
	id: generateId(),
	type,
	label: STEP_TYPES.find( ( f ) => f.type === type )?.label || type,
	required: type !== 'statement',
	description: '',
	...( [ 'select', 'radio', 'checkbox' ].includes( type ) && {
		options: [ 'Option 1', 'Option 2' ],
	} ),
	...( type === 'yes_no' && {
		yes_label: __( 'Yes', 'flowforms' ),
		no_label: __( 'No', 'flowforms' ),
	} ),
	...( type === 'opinion_scale' && {
		scale_max: 10,
		scale_min_label: '',
		scale_max_label: '',
	} ),
	...( type === 'nps' && {
		nps_min_label: __( 'Not at all likely', 'flowforms' ),
		nps_max_label: __( 'Extremely likely', 'flowforms' ),
	} ),
} );

/* ── Question TreeView (left panel) ──────────────────────────────── */

const TreeItem = ( {
	label,
	iconClass,
	isSelected,
	isScreen,
	onClick,
	onDelete,
	onMoveUp,
	onMoveDown,
} ) => {
	const menuControls = [];
	if ( onMoveUp )
		menuControls.push( {
			title: __( 'Move up', 'flowforms' ),
			icon: chevronUp,
			onClick: onMoveUp,
		} );
	if ( onMoveDown )
		menuControls.push( {
			title: __( 'Move down', 'flowforms' ),
			icon: chevronDown,
			onClick: onMoveDown,
		} );
	if ( onDelete )
		menuControls.push( {
			title: __( 'Delete', 'flowforms' ),
			icon: trash,
			onClick: onDelete,
		} );

	return (
		<div
			className={ `ff-gb-tree-item${ isSelected ? ' is-selected' : '' }${
				isScreen ? ' is-screen' : ''
			}` }
			onClick={ onClick }
		>
			<span
				className={ `ff-gb-tree-item__icon dashicons ${ iconClass }` }
			/>
			<Text
				className="ff-gb-tree-item__label"
				truncate
				style={ { color: 'inherit' } }
			>
				{ label }
			</Text>
			{ menuControls.length > 0 && (
				<span
					className="ff-gb-tree-item__menu"
					onClick={ ( e ) => e.stopPropagation() }
				>
					<DropdownMenu
						icon={ moreVertical }
						label={ __( 'Options', 'flowforms' ) }
						controls={ menuControls }
						toggleProps={ { size: 'small' } }
					/>
				</span>
			) }
		</div>
	);
};

const QuestionInserterContent = ( { onAdd, onClose } ) => {
	const [ query, setQuery ] = useState( '' );
	const q = query.trim().toLowerCase();

	/* Flatten all matching items when searching; keep groups otherwise. */
	const groupedItems = STEP_GROUPS.map( ( group ) => ( {
		label: group.label,
		items: group.types
			.map( ( type ) => STEP_TYPES.find( ( s ) => s.type === type ) )
			.filter(
				( d ) => d && ( ! q || d.label.toLowerCase().includes( q ) )
			),
	} ) ).filter( ( g ) => g.items.length > 0 );

	const totalMatches = groupedItems.reduce(
		( n, g ) => n + g.items.length,
		0
	);

	const renderItem = ( def ) => (
		<button
			key={ def.type }
			type="button"
			className="ff-gb-inserter__item"
			onClick={ () => {
				onAdd( def.type );
				onClose();
			} }
		>
			<span className="ff-gb-inserter__item-icon-wrap">
				<span
					className={ `dashicons dashicons-${
						TYPE_ICONS[ def.type ] || 'editor-paragraph'
					}` }
				/>
			</span>
			<Text className="ff-gb-inserter__item-label" size={ 11 }>
				{ def.label }
			</Text>
		</button>
	);

	return (
		<div className="ff-gb-inserter">
			<div className="ff-gb-inserter__search">
				<SearchControl
					__nextHasNoMarginBottom
					value={ query }
					onChange={ setQuery }
					placeholder={ __( 'Search', 'flowforms' ) }
				/>
			</div>
			<div className="ff-gb-inserter__body">
				{ totalMatches === 0 && (
					<Text
						className="ff-gb-inserter__empty"
						variant="muted"
						size={ 13 }
					>
						{ __( 'No results.', 'flowforms' ) }
					</Text>
				) }
				{ groupedItems.map( ( group ) => (
					<div key={ group.label } className="ff-gb-inserter__group">
						<Text
							className="ff-gb-inserter__group-label"
							variant="muted"
							size={ 11 }
							weight={ 500 }
						>
							{ group.label }
						</Text>
						<div className="ff-gb-inserter__grid">
							{ group.items.map( renderItem ) }
						</div>
					</div>
				) ) }
			</div>
		</div>
	);
};

const QuestionInserter = ( {
	onAdd,
	compact = false,
	label,
	popoverPlacement = 'bottom-start',
} ) => (
	<Dropdown
		className={
			compact ? 'ff-gb-canvas-fab__wrap' : 'ff-gb-treeview__add-wrap'
		}
		contentClassName="ff-gb-inserter-popover"
		popoverProps={ { placement: popoverPlacement, offset: 12 } }
		renderToggle={ ( { isOpen, onToggle } ) =>
			compact ? (
				<Button
					variant="primary"
					icon={ plus }
					onClick={ onToggle }
					aria-expanded={ isOpen }
					label={ label || __( 'Add question', 'flowforms' ) }
					className="ff-gb-canvas-fab__btn"
				/>
			) : (
				<Button
					variant="primary"
					icon={ plus }
					onClick={ onToggle }
					aria-expanded={ isOpen }
					className="ff-gb-treeview__add-btn"
				>
					{ label || __( 'Add question', 'flowforms' ) }
				</Button>
			)
		}
		renderContent={ ( { onClose } ) => (
			<QuestionInserterContent onAdd={ onAdd } onClose={ onClose } />
		) }
	/>
);

const QuestionTreeView = ( {
	fields,
	settings,
	selectedKey,
	onSelect,
	onDelete,
	onMove,
	onAdd,
} ) => (
	<div className="ff-gb-treeview">
		<div className="ff-gb-treeview__header">
			<Heading level={ 2 } size={ 13 } weight={ 600 }>
				{ __( 'Questions', 'flowforms' ) }
			</Heading>
			<Text className="ff-gb-treeview__count" variant="muted" size={ 13 }>
				{ fields.length }
			</Text>
		</div>
		<div className="ff-gb-treeview__list">
			<TreeItem
				label={ settings.welcome_title || __( 'Welcome', 'flowforms' ) }
				iconClass="dashicons-welcome-view-site"
				isScreen
				isSelected={ selectedKey === CANVAS_WELCOME }
				onClick={ () => onSelect( CANVAS_WELCOME ) }
			/>

			{ fields.map( ( field, i ) => (
				<TreeItem
					key={ field.id }
					label={ field.label || field.type }
					iconClass={ `dashicons-${
						TYPE_ICONS[ field.type ] || 'editor-paragraph'
					}` }
					isSelected={ selectedKey === field.id }
					onClick={ () => onSelect( field.id ) }
					onDelete={ () => onDelete( i ) }
					onMoveUp={
						i > 0 && onMove ? () => onMove( i, i - 1 ) : null
					}
					onMoveDown={
						i < fields.length - 1 && onMove
							? () => onMove( i, i + 1 )
							: null
					}
				/>
			) ) }

			{ fields.length === 0 && (
				<Text
					className="ff-gb-treeview__empty"
					variant="muted"
					size={ 12 }
				>
					{ __( 'No questions yet.', 'flowforms' ) }
				</Text>
			) }

			<TreeItem
				label={ settings.end_title || __( 'Thank you!', 'flowforms' ) }
				iconClass="dashicons-yes-alt"
				isScreen
				isSelected={ selectedKey === CANVAS_END }
				onClick={ () => onSelect( CANVAS_END ) }
			/>
		</div>
	</div>
);

/* ── Inspector: Question settings ────────────────────────────────── */

const QuestionSettings = ( {
	step,
	onChange,
	onDelete,
	onMoveUp,
	onMoveDown,
	isFirst,
	isLast,
	allFields = [],
} ) => {
	if ( ! step ) {
		return (
			<div className="ff-gb-inspector__empty">
				<Text variant="muted" size={ 13 }>
					{ __( 'Select a question to edit it.', 'flowforms' ) }
				</Text>
			</div>
		);
	}

	const set = ( key ) => ( value ) => onChange( { ...step, [ key ]: value } );

	const setOption = ( index, value ) => {
		const options = [ ...( step.options || [] ) ];
		options[ index ] = value;
		onChange( { ...step, options } );
	};

	const addOption = () =>
		onChange( { ...step, options: [ ...( step.options || [] ), '' ] } );
	const removeOption = ( i ) =>
		onChange( {
			...step,
			options: ( step.options || [] ).filter( ( _, idx ) => idx !== i ),
		} );

	const showOptions = [ 'select', 'radio', 'checkbox' ].includes( step.type );
	const showPlaceholder = [
		'text',
		'email',
		'phone',
		'number',
		'url',
		'textarea',
	].includes( step.type );
	const isStatement = step.type === 'statement';

	const typeDef = STEP_TYPES.find( ( f ) => f.type === step.type );

	return (
		<div className="ff-gb-inspector__panels">
			<div className="ff-gb-inspector__block-header">
				<span
					className={ `ff-gb-inspector__block-icon dashicons dashicons-${
						TYPE_ICONS[ step.type ] || 'editor-paragraph'
					}` }
				/>
				<Text
					className="ff-gb-inspector__block-name"
					weight={ 600 }
					size={ 13 }
				>
					{ typeDef?.label || step.type }
				</Text>
				<Button
					size="small"
					icon={ chevronUp }
					disabled={ isFirst }
					onClick={ onMoveUp }
					label={ __( 'Move up', 'flowforms' ) }
				/>
				<Button
					size="small"
					icon={ chevronDown }
					disabled={ isLast }
					onClick={ onMoveDown }
					label={ __( 'Move down', 'flowforms' ) }
				/>
				<Button
					size="small"
					isDestructive
					icon={ trash }
					onClick={ onDelete }
					label={ __( 'Delete', 'flowforms' ) }
				/>
			</div>

			<PanelBody
				title={ __( 'Content', 'flowforms' ) }
				initialOpen={ true }
			>
				<VStack spacing={ 4 }>
					<TextControl
						label={
							isStatement
								? __( 'Title', 'flowforms' )
								: __( 'Question', 'flowforms' )
						}
						value={ step.label || '' }
						onChange={ set( 'label' ) }
						__nextHasNoMarginBottom
						__next40pxDefaultSize
					/>
					<TextareaControl
						label={ __( 'Description', 'flowforms' ) }
						value={ step.description || '' }
						onChange={ set( 'description' ) }
						rows={ 2 }
						__nextHasNoMarginBottom
					/>
					{ showPlaceholder && (
						<TextControl
							label={ __( 'Placeholder', 'flowforms' ) }
							value={ step.placeholder || '' }
							onChange={ set( 'placeholder' ) }
							__nextHasNoMarginBottom
							__next40pxDefaultSize
						/>
					) }
					{ step.type === 'yes_no' && (
						<>
							<TextControl
								label={ __( '"Yes" label', 'flowforms' ) }
								value={ step.yes_label || '' }
								onChange={ set( 'yes_label' ) }
								placeholder={ __( 'Yes', 'flowforms' ) }
								__nextHasNoMarginBottom
								__next40pxDefaultSize
							/>
							<TextControl
								label={ __( '"No" label', 'flowforms' ) }
								value={ step.no_label || '' }
								onChange={ set( 'no_label' ) }
								placeholder={ __( 'No', 'flowforms' ) }
								__nextHasNoMarginBottom
								__next40pxDefaultSize
							/>
						</>
					) }
					{ step.type === 'opinion_scale' && (
						<>
							<TextControl
								label={ __( 'Min label', 'flowforms' ) }
								value={ step.scale_min_label || '' }
								onChange={ set( 'scale_min_label' ) }
								placeholder={ __( 'Disagree', 'flowforms' ) }
								__nextHasNoMarginBottom
								__next40pxDefaultSize
							/>
							<TextControl
								label={ __( 'Max label', 'flowforms' ) }
								value={ step.scale_max_label || '' }
								onChange={ set( 'scale_max_label' ) }
								placeholder={ __( 'Agree', 'flowforms' ) }
								__nextHasNoMarginBottom
								__next40pxDefaultSize
							/>
						</>
					) }
					{ step.type === 'nps' && (
						<>
							<TextControl
								label={ __( 'Min label (0)', 'flowforms' ) }
								value={ step.nps_min_label || '' }
								onChange={ set( 'nps_min_label' ) }
								placeholder={ __(
									'Not at all likely',
									'flowforms'
								) }
								__nextHasNoMarginBottom
								__next40pxDefaultSize
							/>
							<TextControl
								label={ __( 'Max label (10)', 'flowforms' ) }
								value={ step.nps_max_label || '' }
								onChange={ set( 'nps_max_label' ) }
								placeholder={ __(
									'Extremely likely',
									'flowforms'
								) }
								__nextHasNoMarginBottom
								__next40pxDefaultSize
							/>
						</>
					) }
				</VStack>
			</PanelBody>

			<PanelBody
				title={ __( 'Settings', 'flowforms' ) }
				initialOpen={ true }
			>
				<VStack spacing={ 4 }>
					{ ! isStatement && (
						<ToggleControl
							label={ __( 'Required', 'flowforms' ) }
							checked={ !! step.required }
							onChange={ set( 'required' ) }
							__nextHasNoMarginBottom
						/>
					) }
					{ step.type === 'rating' && (
						<SelectControl
							label={ __( 'Max Stars', 'flowforms' ) }
							value={ step.max || 5 }
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
					{ step.type === 'opinion_scale' && (
						<SelectControl
							label={ __( 'Scale', 'flowforms' ) }
							value={ step.scale_max || 10 }
							options={ [ 5, 7, 10 ].map( ( n ) => ( {
								value: n,
								label: `1 – ${ n }`,
							} ) ) }
							onChange={ ( v ) =>
								set( 'scale_max' )( parseInt( v, 10 ) )
							}
							__nextHasNoMarginBottom
							__next40pxDefaultSize
						/>
					) }
				</VStack>
			</PanelBody>

			{ showOptions && (
				<PanelBody
					title={ __( 'Options', 'flowforms' ) }
					initialOpen={ true }
				>
					<VStack spacing={ 2 }>
						{ ( step.options || [] ).map( ( opt, i ) => (
							<HStack key={ i } spacing={ 2 }>
								<FlexBlock>
									<TextControl
										value={ opt }
										onChange={ ( v ) => setOption( i, v ) }
										placeholder={ sprintf(
											__( 'Option %d', 'flowforms' ),
											i + 1
										) }
										__nextHasNoMarginBottom
										__next40pxDefaultSize
									/>
								</FlexBlock>
								<Button
									size="small"
									isDestructive
									icon={ trash }
									onClick={ () => removeOption( i ) }
									label={ __( 'Remove', 'flowforms' ) }
								/>
							</HStack>
						) ) }
						<Button
							variant="secondary"
							icon={ plus }
							onClick={ addOption }
							__next40pxDefaultSize
						>
							{ __( 'Add option', 'flowforms' ) }
						</Button>
					</VStack>
				</PanelBody>
			) }

			<ConditionsPanel
				field={ step }
				allFields={ allFields }
				onChange={ onChange }
				allowSkip={ true }
			/>
		</div>
	);
};

/* ── Inspector: Screen settings ──────────────────────────────────── */

const ScreenSettings = ( { settings, onChange } ) => {
	const set = ( key ) => ( value ) =>
		onChange( { ...settings, [ key ]: value } );
	return (
		<div className="ff-gb-inspector__panels">
			<PanelBody
				title={ __( 'Welcome Screen', 'flowforms' ) }
				initialOpen={ true }
			>
				<VStack spacing={ 4 }>
					<TextControl
						label={ __( 'Title', 'flowforms' ) }
						value={ settings.welcome_title || '' }
						onChange={ set( 'welcome_title' ) }
						__nextHasNoMarginBottom
						__next40pxDefaultSize
					/>
					<TextareaControl
						label={ __( 'Description', 'flowforms' ) }
						value={ settings.welcome_description || '' }
						onChange={ set( 'welcome_description' ) }
						rows={ 2 }
						__nextHasNoMarginBottom
					/>
					<TextControl
						label={ __( 'Start button label', 'flowforms' ) }
						value={ settings.start_label || '' }
						placeholder={ __( 'Start', 'flowforms' ) }
						onChange={ set( 'start_label' ) }
						__nextHasNoMarginBottom
						__next40pxDefaultSize
					/>
					<SelectControl
						label={ __( 'Layout', 'flowforms' ) }
						value={ settings.welcome_layout || 'center' }
						options={ [
							{
								label: __( 'Centered', 'flowforms' ),
								value: 'center',
							},
							{
								label: __( 'Left aligned', 'flowforms' ),
								value: 'left',
							},
							{
								label: __( 'Image left', 'flowforms' ),
								value: 'image-left',
							},
						] }
						onChange={ set( 'welcome_layout' ) }
						help={
							settings.welcome_layout === 'image-left' &&
							! settings.welcome_image
								? __(
										'Select an image below to enable the split layout.',
										'flowforms'
								  )
								: undefined
						}
						__nextHasNoMarginBottom
						__next40pxDefaultSize
					/>
					<div>
						<label
							className="components-base-control__label"
							style={ {
								display: 'block',
								marginBottom: 8,
								fontSize: 11,
								fontWeight: 500,
								textTransform: 'uppercase',
							} }
						>
							{ __( 'Welcome image', 'flowforms' ) }
						</label>
						<MediaUpload
							onSelect={ ( m ) =>
								onChange( {
									...settings,
									welcome_image: m.url,
									welcome_image_id: m.id,
									welcome_image_alt: m.alt || '',
								} )
							}
							allowedTypes={ [ 'image' ] }
							value={ settings.welcome_image_id }
							render={ ( { open } ) => (
								<VStack spacing={ 2 }>
									{ settings.welcome_image && (
										<img
											src={ settings.welcome_image }
											alt=""
											style={ {
												width: '100%',
												maxHeight: 140,
												objectFit: 'cover',
												borderRadius: 4,
											} }
										/>
									) }
									<HStack spacing={ 2 }>
										<Button
											variant="secondary"
											onClick={ open }
										>
											{ settings.welcome_image
												? __(
														'Replace image',
														'flowforms'
												  )
												: __(
														'Select image',
														'flowforms'
												  ) }
										</Button>
										{ settings.welcome_image && (
											<Button
												variant="tertiary"
												isDestructive
												onClick={ () =>
													onChange( {
														...settings,
														welcome_image: '',
														welcome_image_id: 0,
														welcome_image_alt: '',
													} )
												}
											>
												{ __( 'Remove', 'flowforms' ) }
											</Button>
										) }
									</HStack>
								</VStack>
							) }
						/>
					</div>
				</VStack>
			</PanelBody>
			<PanelBody
				title={ __( 'Welcome Screen Background', 'flowforms' ) }
				initialOpen={ false }
			>
				<ColorSwatch
					color={
						settings.welcome_bg_color ||
						settings.theme?.bg ||
						'#ffffff'
					}
					label={ __( 'Background color', 'flowforms' ) }
					onChange={ set( 'welcome_bg_color' ) }
				/>
			</PanelBody>
			<PanelBody
				title={ __( 'End Screen', 'flowforms' ) }
				initialOpen={ true }
			>
				<VStack spacing={ 4 }>
					<TextControl
						label={ __( 'Title', 'flowforms' ) }
						value={ settings.end_title || '' }
						placeholder={ __( 'Thank you!', 'flowforms' ) }
						onChange={ set( 'end_title' ) }
						__nextHasNoMarginBottom
						__next40pxDefaultSize
					/>
					<TextareaControl
						label={ __( 'Message', 'flowforms' ) }
						value={ settings.success_message || '' }
						onChange={ set( 'success_message' ) }
						rows={ 2 }
						__nextHasNoMarginBottom
					/>
				</VStack>
			</PanelBody>
			<PanelBody
				title={ __( 'Navigation', 'flowforms' ) }
				initialOpen={ true }
			>
				<VStack spacing={ 4 }>
					<TextControl
						label={ __( '"Next" button', 'flowforms' ) }
						value={ settings.next_label || '' }
						placeholder="Next →"
						onChange={ set( 'next_label' ) }
						__nextHasNoMarginBottom
						__next40pxDefaultSize
					/>
					<TextControl
						label={ __( '"Submit" button', 'flowforms' ) }
						value={ settings.submit_label || '' }
						placeholder={ __( 'Submit', 'flowforms' ) }
						onChange={ set( 'submit_label' ) }
						__nextHasNoMarginBottom
						__next40pxDefaultSize
					/>
				</VStack>
			</PanelBody>
		</div>
	);
};

/* ── Inspector: Design / theme ───────────────────────────────────── */

const ColorSwatch = ( { color, label, onChange } ) => (
	<Flex align="center" justify="space-between">
		<FlexItem>
			<Text className="ff-gb-inspector__color-label" size={ 13 }>
				{ label }
			</Text>
		</FlexItem>
		<FlexItem>
			<Flex align="center" gap={ 2 }>
				<FlexItem>
					<Dropdown
						renderToggle={ ( { isOpen, onToggle } ) => (
							<button
								type="button"
								className="ff-gb-color-btn"
								onClick={ onToggle }
								aria-expanded={ isOpen }
								style={ { background: color } }
								aria-label={ label }
							/>
						) }
						renderContent={ () => (
							<ColorPicker
								color={ color }
								onChange={ onChange }
								enableAlpha={ false }
								copyFormat="hex"
							/>
						) }
					/>
				</FlexItem>
				<FlexItem>
					<span className="ff-gb-inspector__color-hex">
						{ color }
					</span>
				</FlexItem>
			</Flex>
		</FlexItem>
	</Flex>
);

const DesignSettings = ( { settings, onChange } ) => {
	const theme = settings.theme || getDefaultTheme();
	const set = ( key ) => ( value ) =>
		onChange( { ...settings, [ key ]: value } );
	const setColor = ( key ) => ( value ) =>
		onChange( {
			...settings,
			theme: { ...theme, [ key ]: value, id: 'custom' },
		} );
	return (
		<div className="ff-gb-inspector__panels">
			<PanelBody
				title={ __( 'Animation', 'flowforms' ) }
				initialOpen={ true }
			>
				<VStack spacing={ 4 }>
					<SelectControl
						label={ __( 'Question entrance', 'flowforms' ) }
						value={ settings.animation || 'slide-up' }
						options={ [
							{
								label: __( 'Slide up', 'flowforms' ),
								value: 'slide-up',
							},
							{
								label: __( 'Fade in', 'flowforms' ),
								value: 'fade-in',
							},
							{
								label: __( 'Scale up', 'flowforms' ),
								value: 'scale-up',
							},
							{ label: __( 'None', 'flowforms' ), value: 'none' },
						] }
						onChange={ set( 'animation' ) }
						__nextHasNoMarginBottom
						__next40pxDefaultSize
					/>
				</VStack>
			</PanelBody>
			<PanelBody
				title={ __( 'Theme', 'flowforms' ) }
				initialOpen={ true }
			>
				<div className="ff-gb-theme-grid">
					{ THEME_PRESETS.map( ( preset ) => (
						<button
							key={ preset.id }
							className={ `ff-gb-theme-swatch${
								theme.id === preset.id ? ' is-active' : ''
							}` }
							style={ {
								background: preset.bg,
								outline: `2px solid ${
									theme.id === preset.id
										? preset.primary
										: 'transparent'
								}`,
							} }
							onClick={ () =>
								onChange( { ...settings, theme: preset } )
							}
							title={ preset.label }
						>
							<span
								style={ {
									color: preset.text,
									fontSize: '11px',
									fontWeight: 600,
								} }
							>
								Aa
							</span>
							<span
								style={ {
									color: preset.primary,
									fontSize: '8px',
								} }
							>
								●
							</span>
						</button>
					) ) }
				</div>
				{ theme.id === 'custom' && (
					<p className="ff-gb-theme-label">
						{ __( 'Custom', 'flowforms' ) }
					</p>
				) }
				{ theme.id !== 'custom' && (
					<p className="ff-gb-theme-label">
						{
							THEME_PRESETS.find( ( p ) => p.id === theme.id )
								?.label
						}
					</p>
				) }
			</PanelBody>
			<PanelBody
				title={ __( 'Colors', 'flowforms' ) }
				initialOpen={ true }
			>
				<VStack spacing={ 3 }>
					<ColorSwatch
						color={ theme.bg }
						label={ __( 'Background', 'flowforms' ) }
						onChange={ setColor( 'bg' ) }
					/>
					<ColorSwatch
						color={ theme.text }
						label={ __( 'Text', 'flowforms' ) }
						onChange={ setColor( 'text' ) }
					/>
					<ColorSwatch
						color={ theme.primary }
						label={ __( 'Accent', 'flowforms' ) }
						onChange={ setColor( 'primary' ) }
					/>
					<ColorSwatch
						color={ theme.btnText }
						label={ __( 'Button text', 'flowforms' ) }
						onChange={ setColor( 'btnText' ) }
					/>
				</VStack>
			</PanelBody>
		</div>
	);
};

/* ── Preview modal (device-responsive) ───────────────────────────── */

const VIEWPORTS = [
	{
		id: 'desktop',
		icon: desktop,
		label: __( 'Desktop', 'flowforms' ),
		width: null,
	},
	{
		id: 'tablet',
		icon: tablet,
		label: __( 'Tablet', 'flowforms' ),
		width: 768,
	},
	{
		id: 'mobile',
		icon: mobile,
		label: __( 'Mobile', 'flowforms' ),
		width: 390,
	},
];

const FlowPreview = ( { form, onClose } ) => {
	const [ viewport, setViewport ] = useState( 'desktop' );
	const [ step, setStep ] = useState( -1 );
	const [ answers, setAnswers ] = useState( {} );
	const [ value, setValue ] = useState( '' );
	const [ animKey, setAnimKey ] = useState( 0 );
	const [ error, setError ] = useState( '' );
	const inputRef = useRef( null );

	const settings = form.settings || {};
	const fields = ( form.fields || [] ).filter(
		( f ) => ! [ 'section', 'page_break', 'hidden' ].includes( f.type )
	);
	const theme = settings.theme || getDefaultTheme();
	const animation = settings.animation || 'slide-up';
	const welcomeLayout = settings.welcome_layout || 'center';
	const welcomeBg = settings.welcome_bg_color || theme.bg;
	const cssVars = {
		'--ff-bg': theme.bg,
		'--ff-text': theme.text,
		'--ff-primary': theme.primary,
		'--ff-btn-text': theme.btnText,
	};

	const viewportWidth = VIEWPORTS.find( ( v ) => v.id === viewport )?.width;
	const frameStyle = {
		...cssVars,
		...( viewportWidth ? { width: viewportWidth } : {} ),
	};

	useEffect( () => {
		const handleKey = ( e ) => {
			if ( e.key === 'Escape' ) onClose();
			if ( e.key === 'Enter' && step >= 0 && step < fields.length )
				advance();
		};
		document.addEventListener( 'keydown', handleKey );
		return () => document.removeEventListener( 'keydown', handleKey );
	}, [ step, value ] );

	useEffect( () => {
		setValue( '' );
		setError( '' );
		setAnimKey( ( k ) => k + 1 );
		if ( inputRef.current ) inputRef.current.focus();
	}, [ step ] );

	const validateField = ( field, val ) => {
		const v =
			typeof val === 'string' ? val.trim() : String( val ?? '' ).trim();
		if ( field.required && ! v )
			return __( 'This field is required.', 'flowforms' );
		if ( ! v ) return '';
		if (
			field.type === 'email' &&
			! /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test( v )
		)
			return __( 'Please enter a valid email address.', 'flowforms' );
		if ( field.type === 'url' ) {
			try {
				new URL( v );
			} catch {
				return __(
					'Please enter a valid URL (e.g. https://example.com).',
					'flowforms'
				);
			}
		}
		if ( field.type === 'number' && ( isNaN( Number( v ) ) || v === '' ) )
			return __( 'Please enter a valid number.', 'flowforms' );
		if ( field.type === 'phone' && ! /^[\d\s+\-().]{6,}$/.test( v ) )
			return __( 'Please enter a valid phone number.', 'flowforms' );
		return '';
	};

	const change = ( newVal ) => {
		setValue( newVal );
		setError( '' );
	};

	const advance = () => {
		if ( step >= 0 && step < fields.length ) {
			const field = fields[ step ];
			const err = validateField( field, value );
			if ( err ) {
				setError( err );
				return;
			}
			setAnswers( ( a ) => ( { ...a, [ field.id ]: value } ) );
		}
		setError( '' );
		setStep( ( s ) => s + 1 );
	};

	const progress =
		step < 0
			? 0
			: step >= fields.length
			? 100
			: Math.round( ( step / fields.length ) * 100 );
	const currentField = fields[ step ];

	const renderField = ( field ) => (
		<>
			{ [ 'text', 'email', 'phone', 'number', 'url' ].includes(
				field.type
			) && (
				<input
					ref={ inputRef }
					type={ field.type }
					className={ `ff-preview-input${
						error ? ' is-invalid' : ''
					}` }
					placeholder={
						field.placeholder ||
						__( 'Type your answer…', 'flowforms' )
					}
					value={ value }
					onChange={ ( e ) => change( e.target.value ) }
					onKeyDown={ ( e ) => {
						if ( e.key === 'Enter' ) advance();
					} }
				/>
			) }
			{ field.type === 'textarea' && (
				<textarea
					ref={ inputRef }
					className={ `ff-preview-input ff-preview-input--textarea${
						error ? ' is-invalid' : ''
					}` }
					placeholder={ field.placeholder }
					value={ value }
					onChange={ ( e ) => change( e.target.value ) }
					rows={ 4 }
				/>
			) }
			{ field.type === 'select' && (
				<select
					className={ `ff-preview-input${
						error ? ' is-invalid' : ''
					}` }
					value={ value }
					onChange={ ( e ) => change( e.target.value ) }
				>
					<option value="">
						{ __( 'Select an option…', 'flowforms' ) }
					</option>
					{ ( field.options || [] ).map( ( o, i ) => (
						<option key={ i } value={ o }>
							{ o }
						</option>
					) ) }
				</select>
			) }
			{ ( field.type === 'radio' || field.type === 'checkbox' ) && (
				<div
					className={ `ff-preview-choices${
						error ? ' is-invalid' : ''
					}` }
				>
					{ ( field.options || [] ).map( ( o, i ) => {
						const vals =
							field.type === 'checkbox'
								? value
									? value.split( ', ' )
									: []
								: [];
						const checked =
							field.type === 'radio'
								? value === o
								: vals.includes( o );
						const toggle = () => {
							if ( field.type === 'radio' ) {
								change( o );
								return;
							}
							change(
								( checked
									? vals.filter( ( v ) => v !== o )
									: [ ...vals, o ]
								).join( ', ' )
							);
						};
						return (
							<label
								key={ i }
								className={ `ff-preview-choice${
									checked ? ' is-selected' : ''
								}` }
								style={
									checked
										? { borderColor: theme.primary }
										: {}
								}
								onClick={ toggle }
							>
								<span
									className="ff-preview-choice__letter"
									style={
										checked
											? {
													background: theme.primary,
													color: theme.btnText,
											  }
											: {}
									}
								>
									{ String.fromCharCode( 65 + i ) }
								</span>
								{ o }
							</label>
						);
					} ) }
				</div>
			) }
			{ field.type === 'rating' && (
				<div
					className={ `ff-preview-rating${
						error ? ' is-invalid' : ''
					}` }
				>
					{ Array.from( { length: field.max || 5 } ).map(
						( _, i ) => (
							<span
								key={ i }
								className={ `ff-preview-star${
									parseInt( value ) > i ? ' is-active' : ''
								}` }
								style={
									parseInt( value ) > i
										? { color: theme.primary }
										: {}
								}
								onClick={ () => change( String( i + 1 ) ) }
							>
								★
							</span>
						)
					) }
				</div>
			) }
			{ ( field.type === 'date' || field.type === 'time' ) && (
				<input
					type={ field.type }
					className={ `ff-preview-input${
						error ? ' is-invalid' : ''
					}` }
					value={ value }
					onChange={ ( e ) => change( e.target.value ) }
				/>
			) }
		</>
	);

	return (
		<div className="ff-preview-modal">
			{ /* ── Header bar ── */ }
			<div className="ff-preview-modal__header">
				<div className="ff-preview-modal__devices">
					{ VIEWPORTS.map( ( v ) => (
						<Button
							key={ v.id }
							icon={ v.icon }
							label={ v.label }
							isPressed={ viewport === v.id }
							onClick={ () => setViewport( v.id ) }
							size="compact"
						/>
					) ) }
				</div>
				<span className="ff-preview-modal__title">
					{ __( 'PREVIEW', 'flowforms' ) }
				</span>
				<div className="ff-preview-modal__actions">
					<Button
						icon={ close }
						label={ __( 'Close', 'flowforms' ) }
						onClick={ onClose }
						size="compact"
					/>
				</div>
			</div>

			{ /* ── Stage ── */ }
			<div className="ff-preview-modal__stage">
				<div className="ff-preview-modal__frame" style={ frameStyle }>
					{ /* Progress */ }
					<div className="ff-preview-modal__progress">
						<div
							className="ff-preview-modal__progress-bar"
							style={ {
								width: progress + '%',
								background: theme.primary,
							} }
						/>
					</div>

					{ /* Content */ }
					<div className="ff-preview-modal__content">
						{ step === -1 &&
							( welcomeLayout === 'image-left' &&
							settings.welcome_image ? (
								<div
									key="welcome"
									className={ `ff-preview-screen ff-preview-screen--image-left ff-anim--${ animation }` }
									style={ { background: welcomeBg } }
								>
									<div
										className="ff-preview-screen__image"
										style={ {
											backgroundImage: `url(${ settings.welcome_image })`,
										} }
										role={
											settings.welcome_image_alt
												? 'img'
												: undefined
										}
										aria-label={
											settings.welcome_image_alt ||
											undefined
										}
									/>
									<div className="ff-preview-screen__panel">
										<h1
											className="ff-preview-screen__title"
											style={ { color: theme.text } }
										>
											{ settings.welcome_title ||
												form.title }
										</h1>
										{ settings.welcome_description && (
											<p
												className="ff-preview-screen__desc"
												style={ { color: theme.text } }
											>
												{ settings.welcome_description }
											</p>
										) }
										<button
											className="ff-preview-btn"
											onClick={ advance }
											style={ {
												background: theme.primary,
												color: theme.btnText,
											} }
										>
											{ settings.start_label ||
												__( 'Start', 'flowforms' ) }
										</button>
									</div>
								</div>
							) : (
								<div
									key="welcome"
									className={ `ff-preview-screen ff-preview-screen--${ welcomeLayout } ff-anim--${ animation }` }
									style={ { background: welcomeBg } }
								>
									<h1
										className="ff-preview-screen__title"
										style={ { color: theme.text } }
									>
										{ settings.welcome_title || form.title }
									</h1>
									{ settings.welcome_description && (
										<p
											className="ff-preview-screen__desc"
											style={ { color: theme.text } }
										>
											{ settings.welcome_description }
										</p>
									) }
									<button
										className="ff-preview-btn"
										onClick={ advance }
										style={ {
											background: theme.primary,
											color: theme.btnText,
										} }
									>
										{ settings.start_label ||
											__( 'Start', 'flowforms' ) }
									</button>
								</div>
							) ) }

						{ step >= 0 && step < fields.length && currentField && (
							<div
								key={ `q-${ animKey }` }
								className={ `ff-preview-question ff-anim--${ animation }` }
							>
								<div
									className="ff-preview-question__num"
									style={ { color: theme.primary } }
								>
									{ step + 1 } <span>→</span>
								</div>
								<h2
									className="ff-preview-question__label"
									style={ { color: theme.text } }
								>
									{ currentField.label }
									{ currentField.required && (
										<span
											style={ {
												color: '#d63638',
												marginLeft: '4px',
											} }
										>
											*
										</span>
									) }
								</h2>
								{ currentField.description && (
									<p
										className="ff-preview-question__desc"
										style={ { color: theme.text } }
									>
										{ currentField.description }
									</p>
								) }
								<div className="ff-preview-question__field">
									{ renderField( currentField ) }
								</div>
								{ error && (
									<div
										className="ff-preview-error"
										role="alert"
									>
										<span className="ff-preview-error__icon">
											⚠
										</span>
										{ error }
									</div>
								) }
								<div className="ff-preview-question__footer">
									<button
										className="ff-preview-btn"
										onClick={ advance }
										style={ {
											background: theme.primary,
											color: theme.btnText,
										} }
									>
										{ step === fields.length - 1
											? settings.submit_label ||
											  __( 'Submit', 'flowforms' )
											: settings.next_label ||
											  __( 'OK', 'flowforms' ) }
										<span className="ff-preview-btn__hint">
											{ __(
												'press Enter ↵',
												'flowforms'
											) }
										</span>
									</button>
									{ step > 0 && (
										<button
											className="ff-preview-back"
											onClick={ () =>
												setStep( ( s ) => s - 1 )
											}
											style={ { color: theme.text } }
										>
											{ __( '↑ Back', 'flowforms' ) }
										</button>
									) }
								</div>
							</div>
						) }

						{ step >= fields.length && (
							<div
								key="end"
								className={ `ff-preview-screen ff-anim--${ animation }` }
							>
								<div
									className="ff-preview-screen__checkmark"
									style={ { color: theme.primary } }
								>
									✓
								</div>
								<h1
									className="ff-preview-screen__title"
									style={ { color: theme.text } }
								>
									{ settings.end_title ||
										__( 'Thank you!', 'flowforms' ) }
								</h1>
								{ settings.success_message && (
									<p
										className="ff-preview-screen__desc"
										style={ { color: theme.text } }
									>
										{ settings.success_message }
									</p>
								) }
								<button
									className="ff-preview-btn ff-preview-btn--ghost"
									onClick={ onClose }
									style={ {
										borderColor: theme.primary,
										color: theme.primary,
									} }
								>
									{ __( 'Close preview', 'flowforms' ) }
								</button>
							</div>
						) }
					</div>
				</div>
			</div>
		</div>
	);
};

/* ── Share Panel ──────────────────────────────────────────────────── */

const CopyButton = ( { text } ) => {
	const [ copied, setCopied ] = useState( false );

	const handleCopy = () => {
		navigator.clipboard.writeText( text ).then( () => {
			setCopied( true );
			setTimeout( () => setCopied( false ), 2000 );
		} );
	};

	return (
		<Button
			icon={ copy }
			variant="secondary"
			onClick={ handleCopy }
			className={ `ff-share__copy-btn${ copied ? ' is-copied' : '' }` }
		>
			{ copied
				? __( 'Copied!', 'flowforms' )
				: __( 'Copy', 'flowforms' ) }
		</Button>
	);
};

const SharePanel = ( { form, id } ) => {
	const siteUrl = ( window.flowFormsData?.siteUrl || '' ).replace(
		/\/$/,
		''
	);
	const directUrl = `${ siteUrl }/formspress/${ id }/`;
	const shortcode = `[formspress id="${ id }"]`;
	const formType = form.type || 'standard';
	const blockName =
		formType === 'flow' ? 'formspress/flow-form' : 'formspress/form';
	const blockLabel =
		formType === 'flow'
			? __( 'FormsPress Flow', 'flowforms' )
			: __( 'FormsPress Form', 'flowforms' );

	return (
		<div className="ff-share-panel">
			<div className="ff-share-panel__inner">
				<h2 className="ff-share-panel__title">
					{ __( 'Share your form', 'flowforms' ) }
				</h2>
				<p className="ff-share-panel__subtitle">
					{ __(
						'Choose how you want to share or embed this form.',
						'flowforms'
					) }
				</p>

				{ /* Direct link */ }
				<div className="ff-share-section">
					<div className="ff-share-section__head">
						<h3 className="ff-share-section__title">
							{ __( 'Direct link', 'flowforms' ) }
						</h3>
						<p className="ff-share-section__desc">
							{ __(
								'Share this URL so anyone can fill in your form directly.',
								'flowforms'
							) }
						</p>
					</div>
					<div className="ff-share-section__body">
						<label className="ff-share__label">
							{ __( 'Form URL', 'flowforms' ) }
						</label>
						<div className="ff-share__row">
							<div className="ff-share__url-field">
								<span className="ff-share__url-text">
									{ directUrl }
								</span>
							</div>
							<CopyButton text={ directUrl } />
							<Button
								icon={ external }
								variant="secondary"
								href={ directUrl }
								target="_blank"
								rel="noopener noreferrer"
								className="ff-share__open-btn"
							>
								{ __( 'Open', 'flowforms' ) }
							</Button>
						</div>
					</div>
				</div>

				<div className="ff-share-divider" />

				{ /* Shortcode */ }
				<div className="ff-share-section">
					<div className="ff-share-section__head">
						<h3 className="ff-share-section__title">
							{ __( 'Shortcode', 'flowforms' ) }
						</h3>
						<p className="ff-share-section__desc">
							{ __(
								'Paste this shortcode into any WordPress page or post to embed the form.',
								'flowforms'
							) }
						</p>
					</div>
					<div className="ff-share-section__body">
						<label className="ff-share__label">
							{ __( 'Shortcode', 'flowforms' ) }
						</label>
						<div className="ff-share__row">
							<div className="ff-share__url-field ff-share__url-field--mono">
								<span className="ff-share__url-text">
									{ shortcode }
								</span>
							</div>
							<CopyButton text={ shortcode } />
						</div>
					</div>
				</div>

				<div className="ff-share-divider" />

				{ /* Gutenberg block */ }
				<div className="ff-share-section">
					<div className="ff-share-section__head">
						<h3 className="ff-share-section__title">
							{ __( 'Gutenberg block', 'flowforms' ) }
						</h3>
						<p className="ff-share-section__desc">
							{ sprintf(
								/* translators: %s block label */
								__(
									'The %s block is available in the WordPress block editor — no shortcode needed.',
									'flowforms'
								),
								blockLabel
							) }
						</p>
					</div>
					<div className="ff-share-section__body">
						<ol className="ff-share__steps">
							<li className="ff-share__step">
								<span className="ff-share__step-num">1</span>
								<span>
									{ __(
										'Open the page or post where you want to embed the form in the ',
										'flowforms'
									) }
									<strong>
										{ __( 'Block Editor', 'flowforms' ) }
									</strong>
									.
								</span>
							</li>
							<li className="ff-share__step">
								<span className="ff-share__step-num">2</span>
								<span>
									{ sprintf(
										__(
											'Click the %s inserter and search for ',
											'flowforms'
										),
										'+'
									) }
									<strong>{ blockLabel }</strong>
									{ __(
										', then select the block.',
										'flowforms'
									) }
								</span>
							</li>
							<li className="ff-share__step">
								<span className="ff-share__step-num">3</span>
								<span>
									{ sprintf(
										__(
											'In the block sidebar, select form #%d from the dropdown.',
											'flowforms'
										),
										parseInt( id, 10 )
									) }
								</span>
							</li>
						</ol>
						<div className="ff-share__block-name">
							<span className="ff-share__block-icon">
								<span className="dashicons dashicons-layout" />
							</span>
							<code>{ blockName }</code>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
};

/* ── Main component ───────────────────────────────────────────────── */

const INSPECTOR_TABS = [
	{ name: 'form', title: __( 'Form', 'flowforms' ) },
	{ name: 'block', title: __( 'Block', 'flowforms' ) },
];

const FlowBuilderPage = () => {
	const { id } = useParams();
	const navigate = useNavigate();

	const [ form, setForm ] = useState( null );
	const [ isLoading, setLoading ] = useState( true );
	const [ isSaving, setSaving ] = useState( false );
	const [ notice, setNotice ] = useState( null );
	const [ selectedKey, setSelectedKey ] = useState( CANVAS_WELCOME );
	const [ inspectorTab, setInspectorTab ] = useState( 'form' );
	const [ isPreview, setPreview ] = useState( false );
	const [ viewMode, setViewMode ] = useState( 'builder' );
	const [ showTree, setShowTree ] = useState( true );
	const [ showInspector, setShowInspector ] = useState( true );
	const [ isSaveTplOpen, setSaveTplOpen ] = useState( false );

	const iframeRef = useRef( null );
	const previewSrc = useRef(
		`${
			window.flowFormsData?.pluginUrl || ''
		}assets/frontend/preview.html?t=${ Date.now() }`
	).current;
	const iframeReady = useRef( false );
	const debounceRef = useRef( null );

	useEffect( () => {
		get( formEndpoint( id ) )
			.then( ( res ) => setForm( res.data ) )
			.catch( () => navigate( '/forms' ) )
			.finally( () => setLoading( false ) );
	}, [ id ] );

	/* Listen for the iframe's "ready" handshake */
	useEffect( () => {
		const handleMessage = ( e ) => {
			if ( ! e.data || e.data.type !== 'flowforms:ready' ) return;
			iframeReady.current = true;
			postPreviewUpdate();
		};
		window.addEventListener( 'message', handleMessage );
		return () => window.removeEventListener( 'message', handleMessage );
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [] );

	const postPreviewUpdate = useCallback( () => {
		if ( ! iframeReady.current ) return;
		if ( ! iframeRef.current || ! iframeRef.current.contentWindow ) return;
		if ( ! form ) return;

		let currentStep = 'welcome';
		if ( selectedKey === CANVAS_END ) {
			currentStep = 'end';
		} else if ( selectedKey !== CANVAS_WELCOME ) {
			const visible = ( form.fields || [] ).filter(
				( f ) =>
					! [ 'section', 'page_break', 'hidden' ].includes( f.type )
			);
			const idx = visible.findIndex( ( f ) => f.id === selectedKey );
			if ( idx >= 0 ) currentStep = idx;
		}

		iframeRef.current.contentWindow.postMessage(
			{
				type: 'flowforms:update',
				payload: {
					fields: form.fields || [],
					settings: form.settings || {},
					title: form.title || '',
					currentStep,
				},
			},
			'*'
		);
	}, [ form, selectedKey ] );

	/* Debounced preview update on every form / selection change */
	useEffect( () => {
		if ( debounceRef.current ) clearTimeout( debounceRef.current );
		debounceRef.current = setTimeout( () => {
			postPreviewUpdate();
		}, 200 );
		return () => {
			if ( debounceRef.current ) clearTimeout( debounceRef.current );
		};
	}, [
		form?.fields,
		form?.settings,
		form?.title,
		selectedKey,
		postPreviewUpdate,
	] );

	const save = useCallback( async () => {
		setSaving( true );
		try {
			await put( formEndpoint( id ), {
				fields: form.fields,
				settings: form.settings,
				actions: form.actions,
				title: form.title,
			} );
			setNotice( {
				type: 'success',
				message: __( 'Form saved.', 'flowforms' ),
			} );
			setTimeout( () => setNotice( null ), 3000 );
		} catch ( e ) {
			setNotice( {
				type: 'error',
				message: e.message || __( 'Failed to save.', 'flowforms' ),
			} );
		} finally {
			setSaving( false );
		}
	}, [ form, id ] );

	if ( isLoading )
		return (
			<div className="ff-page ff-page--loading">
				<Spinner />
			</div>
		);
	if ( ! form ) return null;

	const fields = form.fields || [];
	const settings = form.settings || {};

	const selectedIdx = fields.findIndex( ( f ) => f.id === selectedKey );
	const selectedStep = selectedIdx >= 0 ? fields[ selectedIdx ] : null;

	const addStep = ( type, afterIndex = null ) => {
		const step = getStepDefaults( type );
		const nextFields = [ ...fields ];
		if ( afterIndex !== null ) {
			nextFields.splice( afterIndex + 1, 0, step );
		} else {
			nextFields.push( step );
		}
		setForm( ( f ) => ( { ...f, fields: nextFields } ) );
		setSelectedKey( step.id );
		setInspectorTab( 'block' );
	};

	const updateStep = ( index, updated ) => {
		const f = [ ...fields ];
		f[ index ] = updated;
		setForm( ( fm ) => ( { ...fm, fields: f } ) );
	};

	const deleteStep = ( index ) => {
		const f = fields.filter( ( _, i ) => i !== index );
		const nextKey = f[ index ]?.id || f[ index - 1 ]?.id || CANVAS_WELCOME;
		setForm( ( fm ) => ( { ...fm, fields: f } ) );
		setSelectedKey( nextKey );
	};

	const moveStep = ( from, to ) => {
		const f = [ ...fields ];
		[ f[ from ], f[ to ] ] = [ f[ to ], f[ from ] ];
		setForm( ( fm ) => ( { ...fm, fields: f } ) );
		setSelectedKey( f[ to ].id );
	};

	const setSetting = ( next ) =>
		setForm( ( f ) => ( { ...f, settings: next } ) );

	const leftSidebar = (
		<QuestionTreeView
			fields={ fields }
			settings={ settings }
			selectedKey={ selectedKey }
			onSelect={ ( key ) => {
				setSelectedKey( key );
				setInspectorTab(
					key === CANVAS_WELCOME || key === CANVAS_END
						? 'form'
						: 'block'
				);
			} }
			onDelete={ deleteStep }
			onMove={ moveStep }
			onAdd={ ( type ) => addStep( type ) }
		/>
	);

	const rightSidebar = (
		<div className="ff-gb-inspector">
			<TabPanel
				key={ inspectorTab }
				className="ff-gb-inspector__tabpanel"
				tabs={ INSPECTOR_TABS }
				initialTabName={ inspectorTab }
				onSelect={ setInspectorTab }
			>
				{ ( { name } ) => {
					if ( name === 'form' ) {
						/* ScreenSettings / DesignSettings / ActionsPanel each render their
						   own PanelBody groups; stack them flat so users get one scrollable
						   list of collapsibles (Gutenberg Post inspector pattern). */
						return (
							<>
								<ScreenSettings
									settings={ settings }
									onChange={ setSetting }
								/>
								<DesignSettings
									settings={ settings }
									onChange={ setSetting }
								/>
								<ActionsPanel
									actions={ form.actions || [] }
									onChange={ ( a ) =>
										setForm( ( f ) => ( {
											...f,
											actions: a,
										} ) )
									}
									form={ form }
								/>
							</>
						);
					}

					/* "Block" tab — settings for the selected question. */
					if ( ! selectedStep ) {
						return (
							<div className="ff-gb-inspector__empty">
								<Text variant="muted" size={ 13 }>
									{ __(
										'Select a question on the left to edit it.',
										'flowforms'
									) }
								</Text>
							</div>
						);
					}

					return (
						<QuestionSettings
							step={ selectedStep }
							onChange={ ( updated ) =>
								updateStep( selectedIdx, updated )
							}
							onDelete={ () => deleteStep( selectedIdx ) }
							onMoveUp={ () =>
								selectedIdx > 0 &&
								moveStep( selectedIdx, selectedIdx - 1 )
							}
							onMoveDown={ () =>
								selectedIdx < fields.length - 1 &&
								moveStep( selectedIdx, selectedIdx + 1 )
							}
							isFirst={ selectedIdx <= 0 }
							isLast={ selectedIdx >= fields.length - 1 }
							allFields={ fields }
						/>
					);
				} }
			</TabPanel>
		</div>
	);

	return (
		<EditorSkeleton
			title={ form.title }
			titlePlaceholder={ __( 'Untitled form', 'flowforms' ) }
			onTitleChange={ ( v ) =>
				setForm( ( f ) => ( { ...f, title: v } ) )
			}
			onClose={ () => navigate( '/forms' ) }
			onSave={ viewMode === 'builder' ? save : null }
			isSaving={ isSaving }
			showLeftSidebar={ showTree && viewMode !== 'share' }
			onToggleLeftSidebar={ () => setShowTree( ( v ) => ! v ) }
			leftSidebar={ leftSidebar }
			showRightSidebar={ showInspector && viewMode !== 'share' }
			onToggleRightSidebar={ () => setShowInspector( ( v ) => ! v ) }
			rightSidebar={ rightSidebar }
			onTogglePreview={
				viewMode === 'builder' ? () => setPreview( true ) : null
			}
			onToggleShare={ () =>
				setViewMode( viewMode === 'share' ? 'builder' : 'share' )
			}
			isShareActive={ viewMode === 'share' }
			moreMenuControls={ [
				{
					title: sprintf(
						__( 'Entries (%d)', 'flowforms' ),
						form.entries_count || 0
					),
					onClick: () => navigate( `/forms/${ id }/entries` ),
				},
				{
					title: __( 'Save as template…', 'flowforms' ),
					onClick: () => setSaveTplOpen( true ),
				},
				{
					title: __( 'Back to forms list', 'flowforms' ),
					icon: arrowLeft,
					onClick: () => navigate( '/forms' ),
				},
			] }
			notice={ notice }
			onDismissNotice={ () => setNotice( null ) }
			overlays={
				<>
					{ isPreview && (
						<FlowPreview
							form={ form }
							onClose={ () => setPreview( false ) }
						/>
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
										'flowforms'
									),
								} )
							}
						/>
					) }
				</>
			}
		>
			{ viewMode === 'share' ? (
				<SharePanel form={ form } id={ id } />
			) : (
				<div className="ff-gb-canvas">
					<iframe
						ref={ iframeRef }
						src={ previewSrc }
						title={ __( 'Form preview', 'flowforms' ) }
						className="ff-gb-canvas-iframe"
					/>
					<div className="ff-gb-canvas-fab">
						<QuestionInserter
							compact
							popoverPlacement="top"
							label={
								selectedKey === CANVAS_WELCOME
									? __( 'Add as first question', 'flowforms' )
									: selectedKey === CANVAS_END
									? __(
											'Add question at the end',
											'flowforms'
									  )
									: __(
											'Add question after this one',
											'flowforms'
									  )
							}
							onAdd={ ( type ) => {
								if ( selectedKey === CANVAS_WELCOME ) {
									addStep( type, -1 );
								} else if ( selectedKey === CANVAS_END ) {
									addStep( type );
								} else if ( selectedIdx >= 0 ) {
									addStep( type, selectedIdx );
								} else {
									addStep( type );
								}
							} }
						/>
					</div>
				</div>
			) }
		</EditorSkeleton>
	);
};

export default FlowBuilderPage;
