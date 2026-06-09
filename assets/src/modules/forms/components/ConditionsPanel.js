/* eslint-disable @wordpress/no-unsafe-wp-apis */
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
	equals: __( 'is', 'formspress' ),
	not_equals: __( 'is not', 'formspress' ),
	contains: __( 'contains', 'formspress' ),
	not_contains: __( 'does not contain', 'formspress' ),
	is_empty: __( 'is empty', 'formspress' ),
	is_not_empty: __( 'is not empty', 'formspress' ),
	is_truthy: __( 'is true', 'formspress' ),
	is_falsy: __( 'is false', 'formspress' ),
	greater_than: __( 'is greater than', 'formspress' ),
	less_than: __( 'is less than', 'formspress' ),
};

const NO_VALUE_OPS = [ 'is_empty', 'is_not_empty', 'is_truthy', 'is_falsy' ];

/**
 * Returns field candidates that can drive this field's display. The current
 * field is excluded to avoid self-referential rules.
 *
 * @param {Array}  allFields Flat list of all fields in the form.
 * @param {string} currentId Field ID we are configuring conditions for.
 */
const getCandidateSources = ( allFields, currentId ) => {
	const out = [];
	for ( const f of allFields ) {
		if ( ! f || ! f.id ) {
			continue;
		}
		if ( [ 'section', 'page_break', 'row', 'hidden' ].includes( f.type ) ) {
			continue;
		}
		if ( currentId && f.id === currentId ) {
			continue;
		}
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
	displayMode = 'panel',
} ) => {
	const isModal = 'modal' === displayMode;
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
			if ( candidates.length === 0 ) {
				update( {
					action: allowSkip ? 'skip' : 'show',
					logic: 'all',
					rules: [],
				} );
				return;
			}
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
		if ( candidates.length === 0 ) {
			return;
		}
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
		{ value: 'show', label: __( 'Show this field when…', 'formspress' ) },
		{ value: 'hide', label: __( 'Hide this field when…', 'formspress' ) },
		...( allowSkip
			? [
					{
						value: 'skip',
						label: __( 'Skip this step when…', 'formspress' ),
					},
			  ]
			: [] ),
	];

	const body = (
		<VStack
			spacing={ isModal ? 5 : 4 }
			className={ isModal ? 'ff-conditions-modal-content' : undefined }
		>
			<div
				className={
					isModal ? 'ff-conditions-modal-content__toggle' : undefined
				}
			>
				<ToggleControl
					label={ __( 'Enable conditional display', 'formspress' ) }
					help={
						isModal
							? __(
									'Control whether this field appears based on answers from another field in this form.',
									'formspress'
							  )
							: undefined
					}
					checked={ enabled }
					onChange={ toggle }
					__nextHasNoMarginBottom
				/>
			</div>

			{ enabled && (
				<>
					{ candidates.length === 0 && (
						<p
							className={
								isModal
									? 'ff-conditions-modal-content__warning'
									: undefined
							}
							style={
								isModal
									? undefined
									: {
											fontSize: 12,
											color: '#cc1818',
											margin: 0,
									  }
							}
						>
							{ __(
								'Add another field to this form to reference it in a condition.',
								'formspress'
							) }
						</p>
					) }

					<div
						className={
							isModal
								? 'ff-conditions-modal-content__settings'
								: undefined
						}
					>
						<SelectControl
							label={ __( 'Action', 'formspress' ) }
							value={ conditions.action || 'show' }
							options={ actionOptions }
							onChange={ setKey( 'action' ) }
							__nextHasNoMarginBottom
							__next40pxDefaultSize
						/>

						<SelectControl
							label={ __( 'Logic', 'formspress' ) }
							value={ conditions.logic || 'all' }
							options={ [
								{
									value: 'all',
									label: __(
										'Match all rules (AND)',
										'formspress'
									),
								},
								{
									value: 'any',
									label: __(
										'Match any rule (OR)',
										'formspress'
									),
								},
							] }
							onChange={ setKey( 'logic' ) }
							__nextHasNoMarginBottom
							__next40pxDefaultSize
						/>
					</div>

					<VStack spacing={ 3 }>
						{ candidates.length > 0 &&
							( conditions.rules || [] ).map( ( rule, i ) => {
								const sourceField =
									candidates.find(
										( c ) => c.id === rule.field
									) || candidates[ 0 ];
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
											( o ) => {
												if ( 'string' === typeof o ) {
													return {
														value: o,
														label: o,
													};
												}

												const value =
													o?.value ?? o?.label ?? '';
												return {
													value,
													label: o?.label || value,
												};
											}
									  )
									: null;

								return (
									<div
										key={ i }
										className={
											isModal
												? 'ff-conditions-modal-content__rule'
												: undefined
										}
										style={
											isModal
												? undefined
												: {
														border: '1px solid #e0e0e0',
														borderRadius: 4,
														padding: 8,
												  }
										}
									>
										<HStack spacing={ 2 } align="flex-end">
											<FlexBlock>
												<SelectControl
													label={ sprintf(
														/* translators: %d: condition rule number. */
														__(
															'Rule %d — Field',
															'formspress'
														),
														i + 1
													) }
													value={ rule.field || '' }
													options={ [
														{
															value: '',
															label: __(
																'Select a field',
																'formspress'
															),
														},
														...candidates.map(
															( c ) => ( {
																value: c.id,
																label:
																	c.label ||
																	c.id,
															} )
														),
													] }
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
													'formspress'
												) }
											/>
										</HStack>
										<SelectControl
											label={ __(
												'Operator',
												'formspress'
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
														'formspress'
													) }
													value={ rule.value || '' }
													options={ [
														{
															value: '',
															label: __(
																'— Select —',
																'formspress'
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
														'formspress'
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
							{ __( 'Add rule', 'formspress' ) }
						</Button>
					</VStack>
				</>
			) }
		</VStack>
	);

	if ( isModal ) {
		return body;
	}

	return (
		<PanelBody
			title={ title || __( 'Conditional logic', 'formspress' ) }
			initialOpen={ false }
		>
			{ body }
		</PanelBody>
	);
};

export default ConditionsPanel;
