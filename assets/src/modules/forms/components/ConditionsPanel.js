import {
	Button,
	PanelBody,
	SelectControl,
	TextControl,
	ToggleControl,
	__experimentalVStack as VStack,
	__experimentalHStack as HStack,
	FlexBlock,
} from '@wordpress/components';
import { __, sprintf } from '@wordpress/i18n';
import { trash, plus } from '@wordpress/icons';

/**
 * Operators available to a source field, keyed by the source field's `type`.
 * Choice fields (radio/select/yes_no) get equality ops; number/rating/scale
 * get numeric ops; text-like fields get text ops; etc.
 */
const OPERATORS_BY_TYPE = {
	text: [
		'equals',
		'not_equals',
		'contains',
		'not_contains',
		'is_empty',
		'is_not_empty',
	],
	email: [
		'equals',
		'not_equals',
		'contains',
		'not_contains',
		'is_empty',
		'is_not_empty',
	],
	url: [
		'equals',
		'not_equals',
		'contains',
		'not_contains',
		'is_empty',
		'is_not_empty',
	],
	phone: [
		'equals',
		'not_equals',
		'contains',
		'not_contains',
		'is_empty',
		'is_not_empty',
	],
	textarea: [ 'contains', 'not_contains', 'is_empty', 'is_not_empty' ],
	number: [
		'equals',
		'not_equals',
		'greater_than',
		'less_than',
		'is_empty',
		'is_not_empty',
	],
	rating: [ 'equals', 'not_equals', 'greater_than', 'less_than' ],
	opinion_scale: [ 'equals', 'not_equals', 'greater_than', 'less_than' ],
	nps: [ 'equals', 'not_equals', 'greater_than', 'less_than' ],
	select: [ 'equals', 'not_equals', 'is_empty', 'is_not_empty' ],
	radio: [ 'equals', 'not_equals', 'is_empty', 'is_not_empty' ],
	checkbox: [ 'contains', 'not_contains', 'is_empty', 'is_not_empty' ],
	yes_no: [ 'equals', 'not_equals', 'is_truthy', 'is_falsy' ],
	date: [ 'equals', 'not_equals', 'is_empty', 'is_not_empty' ],
	time: [ 'equals', 'not_equals', 'is_empty', 'is_not_empty' ],
};

const OPERATOR_LABELS = {
	equals: __( 'is', 'flowforms' ),
	not_equals: __( 'is not', 'flowforms' ),
	contains: __( 'contains', 'flowforms' ),
	not_contains: __( 'does not contain', 'flowforms' ),
	is_empty: __( 'is empty', 'flowforms' ),
	is_not_empty: __( 'is not empty', 'flowforms' ),
	is_truthy: __( 'is true', 'flowforms' ),
	is_falsy: __( 'is false', 'flowforms' ),
	greater_than: __( 'is greater than', 'flowforms' ),
	less_than: __( 'is less than', 'flowforms' ),
};

const NO_VALUE_OPS = [ 'is_empty', 'is_not_empty', 'is_truthy', 'is_falsy' ];

/**
 * Returns sibling field candidates that come BEFORE the current field — we
 * disallow forward references so the runtime is always deterministic.
 *
 * @param {Array}  allFields  Flat list of all fields in the form.
 * @param {string} currentId  Field ID we are configuring conditions for.
 */
const getCandidateSources = ( allFields, currentId ) => {
	const out = [];
	for ( const f of allFields ) {
		if ( ! f || ! f.id ) continue;
		if ( f.id === currentId ) break;
		if ( [ 'section', 'page_break', 'row', 'hidden' ].includes( f.type ) )
			continue;
		out.push( f );
	}
	return out;
};

const ConditionsPanel = ( {
	field,
	allFields,
	onChange,
	allowSkip = false,
	title,
} ) => {
	const conditions = field.conditions || null;
	const enabled = !! (
		conditions &&
		conditions.rules &&
		conditions.rules.length > 0
	);

	const candidates = getCandidateSources( allFields, field.id );

	const update = ( next ) => onChange( { ...field, conditions: next } );

	const toggle = ( on ) => {
		if ( on ) {
			update( {
				action: allowSkip ? 'skip' : 'show',
				logic: 'all',
				rules: [
					{
						field: candidates[ 0 ]?.id || '',
						op: 'equals',
						value: '',
					},
				],
			} );
		} else {
			const { conditions: _, ...rest } = field;
			onChange( rest );
		}
	};

	const setKey = ( key ) => ( value ) =>
		update( { ...( conditions || {} ), [ key ]: value } );

	const updateRule = ( i, patch ) => {
		const rules = ( conditions?.rules || [] ).map( ( r, idx ) =>
			idx === i ? { ...r, ...patch } : r
		);
		update( { ...( conditions || {} ), rules } );
	};

	const addRule = () => {
		const rules = [
			...( conditions?.rules || [] ),
			{ field: candidates[ 0 ]?.id || '', op: 'equals', value: '' },
		];
		update( { ...( conditions || {} ), rules } );
	};

	const removeRule = ( i ) => {
		const rules = ( conditions?.rules || [] ).filter(
			( _, idx ) => idx !== i
		);
		if ( rules.length === 0 ) {
			toggle( false );
			return;
		}
		update( { ...( conditions || {} ), rules } );
	};

	const actionOptions = [
		{ value: 'show', label: __( 'Show this field when…', 'flowforms' ) },
		{ value: 'hide', label: __( 'Hide this field when…', 'flowforms' ) },
		...( allowSkip
			? [
					{
						value: 'skip',
						label: __( 'Skip this step when…', 'flowforms' ),
					},
			  ]
			: [] ),
	];

	return (
		<PanelBody
			title={ title || __( 'Conditional logic', 'flowforms' ) }
			initialOpen={ false }
		>
			<VStack spacing={ 4 }>
				<ToggleControl
					label={ __( 'Enable conditional logic', 'flowforms' ) }
					checked={ enabled }
					onChange={ toggle }
					__nextHasNoMarginBottom
				/>

				{ enabled && (
					<>
						{ candidates.length === 0 && (
							<p
								style={ {
									fontSize: 12,
									color: '#cc1818',
									margin: 0,
								} }
							>
								{ __(
									'Add a field before this one to reference in a condition.',
									'flowforms'
								) }
							</p>
						) }

						<SelectControl
							label={ __( 'Action', 'flowforms' ) }
							value={ conditions.action || 'show' }
							options={ actionOptions }
							onChange={ setKey( 'action' ) }
							__nextHasNoMarginBottom
							__next40pxDefaultSize
						/>

						<SelectControl
							label={ __( 'Logic', 'flowforms' ) }
							value={ conditions.logic || 'all' }
							options={ [
								{
									value: 'all',
									label: __(
										'Match all rules (AND)',
										'flowforms'
									),
								},
								{
									value: 'any',
									label: __(
										'Match any rule (OR)',
										'flowforms'
									),
								},
							] }
							onChange={ setKey( 'logic' ) }
							__nextHasNoMarginBottom
							__next40pxDefaultSize
						/>

						<VStack spacing={ 3 }>
							{ ( conditions.rules || [] ).map( ( rule, i ) => {
								const sourceField = candidates.find(
									( c ) => c.id === rule.field
								);
								const ops =
									OPERATORS_BY_TYPE[ sourceField?.type ] ||
									OPERATORS_BY_TYPE.text;
								const opOptions = ops.map( ( op ) => ( {
									value: op,
									label: OPERATOR_LABELS[ op ] || op,
								} ) );
								const showValue = ! NO_VALUE_OPS.includes(
									rule.op
								);
								const isChoice = [
									'select',
									'radio',
									'checkbox',
								].includes( sourceField?.type );
								const valueOptions = isChoice
									? ( sourceField.options || [] ).map(
											( o ) => ( { value: o, label: o } )
									  )
									: null;

								return (
									<div
										key={ i }
										style={ {
											border: '1px solid #e0e0e0',
											borderRadius: 4,
											padding: 8,
										} }
									>
										<HStack spacing={ 2 } align="flex-end">
											<FlexBlock>
												<SelectControl
													label={ sprintf(
														__(
															'Rule %d — Field',
															'flowforms'
														),
														i + 1
													) }
													value={ rule.field || '' }
													options={ candidates.map(
														( c ) => ( {
															value: c.id,
															label:
																c.label || c.id,
														} )
													) }
													onChange={ ( v ) =>
														updateRule( i, {
															field: v,
														} )
													}
													__nextHasNoMarginBottom
													__next40pxDefaultSize
												/>
											</FlexBlock>
											<Button
												isDestructive
												size="small"
												icon={ trash }
												onClick={ () =>
													removeRule( i )
												}
												label={ __(
													'Remove rule',
													'flowforms'
												) }
											/>
										</HStack>
										<SelectControl
											label={ __(
												'Operator',
												'flowforms'
											) }
											value={ rule.op || 'equals' }
											options={ opOptions }
											onChange={ ( v ) =>
												updateRule( i, { op: v } )
											}
											__nextHasNoMarginBottom
											__next40pxDefaultSize
										/>
										{ showValue &&
											( valueOptions ? (
												<SelectControl
													label={ __(
														'Value',
														'flowforms'
													) }
													value={ rule.value || '' }
													options={ [
														{
															value: '',
															label: __(
																'— Select —',
																'flowforms'
															),
														},
														...valueOptions,
													] }
													onChange={ ( v ) =>
														updateRule( i, {
															value: v,
														} )
													}
													__nextHasNoMarginBottom
													__next40pxDefaultSize
												/>
											) : (
												<TextControl
													label={ __(
														'Value',
														'flowforms'
													) }
													value={ rule.value ?? '' }
													onChange={ ( v ) =>
														updateRule( i, {
															value: v,
														} )
													}
													__nextHasNoMarginBottom
													__next40pxDefaultSize
												/>
											) ) }
									</div>
								);
							} ) }
							<Button
								variant="secondary"
								icon={ plus }
								onClick={ addRule }
								disabled={ candidates.length === 0 }
								__next40pxDefaultSize
							>
								{ __( 'Add rule', 'flowforms' ) }
							</Button>
						</VStack>
					</>
				) }
			</VStack>
		</PanelBody>
	);
};

export default ConditionsPanel;
