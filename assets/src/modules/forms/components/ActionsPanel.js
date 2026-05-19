import { useState, useEffect, useMemo } from '@wordpress/element';
import {
	Button,
	TextControl,
	TextareaControl,
	ToggleControl,
	CheckboxControl,
	SelectControl,
	FormTokenField,
	PanelBody,
	Dropdown,
	DropdownMenu,
	Icon,
	Notice,
	SearchControl,
	// eslint-disable-next-line @wordpress/no-unsafe-wp-apis
	__experimentalConfirmDialog as ConfirmDialog,
} from '@wordpress/components';
import { __, sprintf } from '@wordpress/i18n';
import {
	trash,
	plus,
	copy,
	moreVertical,
	send,
	check,
	unseen,
	dragHandle,
	arrowUp,
	arrowDown,
	closeSmall,
} from '@wordpress/icons';
import { get } from '../../../api/client';
import { ACTIONS } from '../../../api/endpoints';
import EmailDesigner from './EmailDesigner';

const FieldRenderer = ( {
	field,
	value,
	onChange,
	form,
	action,
	onActionChange,
} ) => {
	const fieldType = normalizeFieldType( field );
	const fallback = field.default ?? ( 'toggle' === fieldType ? false : '' );
	const current = value ?? fallback;

	const common = {
		label: field.label,
		help: field.help,
		placeholder: field.placeholder,
		value: current,
		onChange,
		__nextHasNoMarginBottom: true,
		__next40pxDefaultSize: true,
	};

	switch ( fieldType ) {
		case 'field-select':
			return (
				<SelectControl
					{ ...common }
					options={ getFormFieldOptions( form, field ) }
				/>
			);
		case 'multi-select':
			return (
				<TokenSelectField
					field={ field }
					value={ current }
					onChange={ onChange }
				/>
			);
		case 'field-mapping-repeater':
			return (
				<FieldMappingRepeater
					field={ field }
					value={ current }
					onChange={ onChange }
					form={ form }
				/>
			);
		case 'email-designer':
			return (
				<EmailDesigner
					value={ current }
					onChange={ onChange }
					form={ form }
				/>
			);
		case 'email-template-picker':
			return (
				<EmailTemplatePicker
					value={ current }
					onChange={ onChange }
					action={ action }
					onActionChange={ onActionChange }
				/>
			);
		case 'textarea':
			return <TextareaControl { ...common } rows={ field.rows ?? 4 } />;
		case 'select':
			return (
				<SelectControl { ...common } options={ field.options ?? [] } />
			);
		case 'toggle':
			return (
				<ToggleControl
					label={ field.label }
					help={ field.help }
					checked={ !! value }
					onChange={ onChange }
					__nextHasNoMarginBottom
				/>
			);
		case 'password':
			return <TextControl { ...common } type="password" />;
		case 'url':
			return <TextControl { ...common } type="url" />;
		case 'number':
			return (
				<TextControl
					{ ...common }
					type="number"
					min={ field.min }
					max={ field.max }
				/>
			);
		case 'text':
		default:
			return <TextControl { ...common } />;
	}
};

const normalizeFieldType = ( field ) => {
	const type = field?.type || 'text';

	if (
		'custom_fields' === field?.key &&
		[
			'text',
			'textarea',
			'field_mapping_repeater',
			'field-mapping-repeater',
			'mapping-repeater',
			'repeater',
		].includes( type )
	) {
		return 'field-mapping-repeater';
	}

	return type;
};

// Quick-load dropdown that pulls the picked template's body into the action body.
const EmailTemplatePicker = ( { value, onChange, action, onActionChange } ) => {
	const [ templates, setTemplates ] = useState( [] );

	useEffect( () => {
		get( '/email-templates' )
			.then( ( res ) => setTemplates( res.data || [] ) )
			.catch( () => setTemplates( [] ) );
	}, [] );

	const options = [
		{ value: '0', label: __( '— None —', 'flowforms' ) },
		...templates.map( ( t ) => ( {
			value: String( t.id ),
			label: t.name,
		} ) ),
	];

	const handleChange = ( v ) => {
		onChange( parseInt( v, 10 ) );
		const tpl = templates.find( ( t ) => String( t.id ) === v );
		if ( tpl && onActionChange ) {
			// Merge template into the action atomically — set body and subject
			// only if the user hasn't already customised them.
			const updates = { ...action, template_id: parseInt( v, 10 ) };
			if ( ! action.body || action.body.trim() === '' ) {
				updates.body = tpl.body || '';
			}
			if (
				( ! action.subject || action.subject.trim() === '' ) &&
				tpl.subject
			) {
				updates.subject = tpl.subject;
			}
			onActionChange( updates );
		}
	};

	return (
		<SelectControl
			__nextHasNoMarginBottom
			__next40pxDefaultSize
			label={ __( 'Load template', 'flowforms' ) }
			value={ String( value || '0' ) }
			options={ options }
			onChange={ handleChange }
			help={ __(
				'Pre-fills body (and subject) from a saved Email Template.',
				'flowforms'
			) }
		/>
	);
};

const flattenFormFields = ( form ) => {
	const fields = Array.isArray( form?.fields )
		? form.fields
		: Array.isArray( form?.fields_schema )
		? form.fields_schema
		: [];
	const out = [];
	const walk = ( list ) => {
		for ( const field of list || [] ) {
			if ( field?.type === 'row' ) {
				for ( const col of field.cols || [] ) {
					walk( col.fields || [] );
				}
				continue;
			}
			out.push( field );
		}
	};
	walk( fields );
	return out;
};

const getFormFieldOptions = ( form, fieldDescriptor ) => {
	const allowedTypes = fieldDescriptor.allowedTypes || [];
	const fields = flattenFormFields( form ).filter( ( field ) => {
		const id = field?.id || field?.fieldId || '';
		if ( ! id || field?.type === 'submit' ) {
			return false;
		}
		return (
			allowedTypes.length === 0 || allowedTypes.includes( field?.type )
		);
	} );

	return [
		{
			value: '',
			label: fieldDescriptor.placeholder
				? sprintf(
						/* translators: %s: field placeholder. */
						__( 'Select a field, for example %s', 'flowforms' ),
						fieldDescriptor.placeholder
				  )
				: __( 'Select a field', 'flowforms' ),
		},
		...fields.map( ( field ) => {
			const id = field.id || field.fieldId || '';
			const label = field.label || field.title || id;
			return {
				value: id,
				label: `${ label } (${ id })`,
			};
		} ),
	];
};

const normalizeMultiValue = ( value ) => {
	if ( Array.isArray( value ) ) {
		return value.map( String ).filter( Boolean );
	}
	if ( 'string' === typeof value ) {
		return value
			.split( ',' )
			.map( ( item ) => item.trim() )
			.filter( Boolean );
	}
	return [];
};

const TokenSelectField = ( { field, value, onChange } ) => {
	const selected = normalizeMultiValue( value );
	const options = field.options || [];
	const tokenById = new Map(
		options.map( ( option ) => [
			String( option.value ),
			String( option.label || option.value ),
		] )
	);
	const idByToken = new Map(
		options.map( ( option ) => [
			String( option.label || option.value ),
			String( option.value ),
		] )
	);
	const suggestions = options.map( ( option ) =>
		String( option.label || option.value )
	);
	const selectedTokens = selected
		.map( ( id ) => tokenById.get( id ) )
		.filter( Boolean );

	const handleChange = ( tokens ) => {
		const nextIds = tokens
			.map( ( token ) =>
				idByToken.get(
					'string' === typeof token ? token : String( token.value )
				)
			)
			.filter( Boolean );

		onChange( Array.from( new Set( nextIds ) ) );
	};

	return (
		<FormTokenField
			__next40pxDefaultSize
			__experimentalExpandOnFocus
			label={ field.label }
			help={ field.help || '' }
			value={ selectedTokens }
			suggestions={ suggestions }
			onChange={ handleChange }
			__experimentalValidateInput={ ( token ) =>
				idByToken.has( token )
			}
			placeholder={
				field.placeholder || __( 'Type to search', 'flowforms' )
			}
		/>
	);
};

const normalizeMappings = ( value ) => {
	if ( Array.isArray( value ) ) {
		return value
			.filter( ( mapping ) => mapping && 'object' === typeof mapping )
			.map( ( mapping ) => ( {
				field_key: mapping.field_key || '',
				field_id: mapping.field_id || '',
			} ) );
	}

	if ( 'string' === typeof value ) {
		return value
			.split( /\r\n|\r|\n/ )
			.map( ( line ) => line.trim() )
			.map( ( line ) => {
				const [ fieldKey, fieldId = '' ] = line.includes( '=' )
					? line.split( '=' ).map( ( item ) => item.trim() )
					: [ line, '' ];
				return {
					field_key: fieldKey || '',
					field_id: fieldId || '',
				};
			} )
			.filter( ( mapping ) => mapping.field_key || mapping.field_id );
	}

	return [];
};

const FieldMappingRepeater = ( { field, value, onChange, form } ) => {
	const mappings = normalizeMappings( value );
	const fieldOptions = getFormFieldOptions( form, {
		placeholder: __( 'field_id', 'flowforms' ),
	} );

	const updateMapping = ( index, key, nextValue ) => {
		const next = [ ...mappings ];
		next[ index ] = { ...next[ index ], [ key ]: nextValue };
		onChange( next );
	};

	const removeMapping = ( index ) => {
		onChange( mappings.filter( ( _, itemIndex ) => itemIndex !== index ) );
	};

	const addMapping = () => {
		onChange( [ ...mappings, { field_key: '', field_id: '' } ] );
	};

	return (
		<div className="ff-field-mapping-repeater">
			<div className="components-base-control__field">
				<span className="components-base-control__label">
					{ field.label }
				</span>
				<div className="ff-field-mapping-repeater__rows">
					{ mappings.map( ( mapping, index ) => (
						<div
							key={ index }
							className="ff-field-mapping-repeater__row"
						>
							<TextControl
								label={ __(
									'MailerPress custom field key',
									'flowforms'
								) }
								value={ mapping.field_key }
								onChange={ ( nextValue ) =>
									updateMapping(
										index,
										'field_key',
										nextValue
									)
								}
								placeholder="birthday"
								__nextHasNoMarginBottom
								__next40pxDefaultSize
							/>
							<SelectControl
								label={ __(
									'Value from FormsPress field',
									'flowforms'
								) }
								value={ mapping.field_id }
								options={ fieldOptions }
								onChange={ ( nextValue ) =>
									updateMapping(
										index,
										'field_id',
										nextValue
									)
								}
								__nextHasNoMarginBottom
								__next40pxDefaultSize
							/>
							<Button
								icon={ closeSmall }
								label={ __( 'Remove mapping', 'flowforms' ) }
								onClick={ () => removeMapping( index ) }
								variant="tertiary"
							/>
						</div>
					) ) }
				</div>
				<Button variant="secondary" icon={ plus } onClick={ addMapping }>
					{ __( 'Add custom field mapping', 'flowforms' ) }
				</Button>
			</div>
			{ field.help && (
				<p className="components-base-control__help">{ field.help }</p>
			) }
		</div>
	);
};

const ActionConfig = ( {
	action,
	index,
	onChange,
	onDelete,
	onDuplicate,
	availableActions,
	form,
} ) => {
	const typeOptions = [
		{ value: '', label: __( '— Select action type —', 'flowforms' ) },
		...availableActions.map( ( a ) => ( { value: a.id, label: a.label } ) ),
	];

	const set = ( key ) => ( value ) =>
		onChange( { ...action, [ key ]: value } );
	const currentDef = availableActions.find( ( a ) => a.id === action.type );
	const label = currentDef?.label || __( 'New action', 'flowforms' );
	const description = currentDef?.description || '';

	return (
		<PanelBody
			title={ `${ index + 1 }. ${ label }${
				! action.enabled ? ` — ${ __( 'Disabled', 'flowforms' ) }` : ''
			}` }
			initialOpen={ true }
		>
			<div className="ff-actions-stack">
				<SelectControl
					label={ __( 'Action type', 'flowforms' ) }
					value={ action.type || '' }
					options={ typeOptions }
					onChange={ set( 'type' ) }
					help={ description }
					__nextHasNoMarginBottom
					__next40pxDefaultSize
				/>

				<ToggleControl
					label={ __( 'Enabled', 'flowforms' ) }
					checked={ !! action.enabled }
					onChange={ set( 'enabled' ) }
					help={
						action.enabled
							? __( 'Runs on every submission.', 'flowforms' )
							: __( 'Skipped on submissions.', 'flowforms' )
					}
					__nextHasNoMarginBottom
				/>

				{ currentDef?.fields?.map( ( field ) => (
					<FieldRenderer
						key={ field.key }
						field={ field }
						value={ action[ field.key ] }
						onChange={ set( field.key ) }
						form={ form }
						action={ action }
						onActionChange={ onChange }
					/>
				) ) }

				<DropdownMenu
					icon={ moreVertical }
					label={ __( 'Action options', 'flowforms' ) }
					controls={ [
						{
							title: __( 'Duplicate', 'flowforms' ),
							icon: copy,
							onClick: onDuplicate,
						},
						{
							title: __( 'Remove action', 'flowforms' ),
							icon: trash,
							onClick: onDelete,
						},
					] }
					toggleProps={ { variant: 'tertiary' } }
				/>
			</div>
		</PanelBody>
	);
};

const ActionInserter = ( {
	availableActions,
	onSelect,
	label = __( 'Add', 'flowforms' ),
	variant = 'secondary',
} ) => {
	const [ search, setSearch ] = useState( '' );
	const filteredActions = useMemo( () => {
		const query = search.trim().toLowerCase();
		if ( ! query ) {
			return availableActions;
		}
		return availableActions.filter( ( action ) => {
			const text = `${ action.label || '' } ${
				action.description || ''
			}`.toLowerCase();
			return text.includes( query );
		} );
	}, [ availableActions, search ] );

	return (
		<Dropdown
			className="ff-actions-inserter"
			popoverProps={ {
				placement: 'bottom-start',
				className: 'ff-actions-inserter__popover',
			} }
			renderToggle={ ( { isOpen, onToggle } ) => (
				<Button
					variant={ variant }
					size="compact"
					icon={ plus }
					onClick={ onToggle }
					aria-expanded={ isOpen }
				>
					{ label }
				</Button>
			) }
			renderContent={ ( { onClose } ) => (
				<div className="ff-actions-inserter__content">
					<SearchControl
						__nextHasNoMarginBottom
						value={ search }
						onChange={ setSearch }
						placeholder={ __( 'Search actions', 'flowforms' ) }
					/>
					<div className="ff-actions-inserter__results" role="list">
						{ filteredActions.length ? (
							filteredActions.map( ( action ) => (
								<button
									key={ action.id }
									type="button"
									className="ff-actions-inserter__item"
									onClick={ () => {
										onSelect( action.id );
										setSearch( '' );
										onClose();
									} }
								>
									<span className="ff-actions-inserter__item-title">
										{ action.label }
									</span>
									{ action.description && (
										<span className="ff-actions-inserter__item-description">
											{ action.description }
										</span>
									) }
								</button>
							) )
						) : (
							<p className="ff-actions-inserter__empty">
								{ __(
									'No matching actions found.',
									'flowforms'
								) }
							</p>
						) }
					</div>
				</div>
			) }
		/>
	);
};

const ActionWorkspace = ( {
	actions,
	form,
	availableActions,
	addAction,
	updateAction,
	deleteAction,
	duplicateAction,
	reorderAction,
} ) => {
	const [ selectedIndex, setSelectedIndex ] = useState( 0 );
	const [ draggedIndex, setDraggedIndex ] = useState( null );

	useEffect( () => {
		if ( actions.length === 0 ) {
			setSelectedIndex( 0 );
			return;
		}
		setSelectedIndex( ( current ) =>
			Math.min( Math.max( current, 0 ), actions.length - 1 )
		);
	}, [ actions.length ] );

	const safeSelectedIndex = actions.length
		? Math.min( Math.max( selectedIndex, 0 ), actions.length - 1 )
		: 0;
	const selectedAction = actions[ safeSelectedIndex ];
	const selectedDef = availableActions.find(
		( action ) => action.id === selectedAction?.type
	);
	const setSelectedAction = ( updated ) => {
		updateAction( safeSelectedIndex, updated );
	};
	const set = ( key ) => ( value ) =>
		setSelectedAction( { ...selectedAction, [ key ]: value } );
	const moveSelectedAction = ( fromIndex, toIndex ) => {
		if (
			toIndex < 0 ||
			toIndex >= actions.length ||
			fromIndex === toIndex
		) {
			return;
		}
		reorderAction( fromIndex, toIndex );
		setSelectedIndex( toIndex );
	};

	if ( actions.length === 0 ) {
		return (
			<div className="ff-actions-workspace ff-actions-workspace--empty-state">
				<aside className="ff-actions-workspace__list">
					<div className="ff-actions-workspace__list-header">
						<strong>{ __( 'Actions', 'flowforms' ) }</strong>
						<ActionInserter
							availableActions={ availableActions }
							onSelect={ ( actionType ) => {
								addAction( actionType );
								setSelectedIndex( 0 );
							} }
						/>
					</div>
					<div className="ff-actions-list ff-actions-list--empty">
						<p>
							{ __(
								'No submission actions configured.',
								'flowforms'
							) }
						</p>
					</div>
				</aside>

				<section className="ff-actions-workspace__detail">
					<div className="ff-actions-workspace__detail-scroll">
						<div className="ff-actions-empty-panel">
							<Icon icon={ send } size={ 32 } />
							<p className="ff-actions-detail__eyebrow">
								{ __( 'Action configuration', 'flowforms' ) }
							</p>
							<h2>{ __( 'No action selected', 'flowforms' ) }</h2>
							<p>
								{ __(
									'Choose an action to run after a successful submission, such as sending an email notification, redirecting the visitor, or calling a webhook.',
									'flowforms'
								) }
							</p>
							<div className="ff-actions-empty-panel__actions">
								<ActionInserter
									availableActions={ availableActions }
									variant="primary"
									label={ __( 'Add action', 'flowforms' ) }
									onSelect={ ( actionType ) => {
										addAction( actionType );
										setSelectedIndex( 0 );
									} }
								/>
							</div>
						</div>
					</div>
				</section>
			</div>
		);
	}

	return (
		<div className="ff-actions-workspace">
			<aside className="ff-actions-workspace__list">
				<div className="ff-actions-workspace__list-header">
					<strong>{ __( 'Actions', 'flowforms' ) }</strong>
					<ActionInserter
						availableActions={ availableActions }
						onSelect={ ( actionType ) => {
							addAction( actionType );
							setSelectedIndex( actions.length );
						} }
					/>
				</div>

				<div className="ff-actions-list" role="list">
					{ actions.map( ( action, index ) => {
						const actionDef = availableActions.find(
							( item ) => item.id === action.type
						);
						const label =
							actionDef?.label || __( 'New action', 'flowforms' );
						const isSelected = index === safeSelectedIndex;
						const isEnabled = action.enabled !== false;

						return (
							<div
								key={ index }
								className={ `ff-actions-list__item${
									isSelected ? ' is-selected' : ''
								}${
									draggedIndex === index ? ' is-dragging' : ''
								}` }
								aria-current={ isSelected ? 'true' : undefined }
								draggable
								role="listitem"
								onDragStart={ ( event ) => {
									setDraggedIndex( index );
									event.dataTransfer.effectAllowed = 'move';
									event.dataTransfer.setData(
										'text/plain',
										String( index )
									);
								} }
								onDragOver={ ( event ) => {
									event.preventDefault();
									event.dataTransfer.dropEffect = 'move';
								} }
								onDrop={ ( event ) => {
									event.preventDefault();
									const fromIndex = Number(
										event.dataTransfer.getData(
											'text/plain'
										)
									);
									if ( Number.isInteger( fromIndex ) ) {
										moveSelectedAction( fromIndex, index );
									}
									setDraggedIndex( null );
								} }
								onDragEnd={ () => setDraggedIndex( null ) }
							>
								<span
									className="ff-actions-list__drag"
									aria-hidden="true"
								>
									<Icon icon={ dragHandle } size={ 18 } />
								</span>
								<button
									type="button"
									className="ff-actions-list__select"
									onClick={ () => setSelectedIndex( index ) }
								>
									<span className="ff-actions-list__icon">
										<Icon
											icon={ isEnabled ? check : unseen }
											size={ 18 }
										/>
									</span>
									<span className="ff-actions-list__content">
										<span className="ff-actions-list__title">
											{ label }
										</span>
										<span className="ff-actions-list__meta">
											{ isEnabled
												? __( 'Enabled', 'flowforms' )
												: __(
														'Disabled',
														'flowforms'
												  ) }
										</span>
									</span>
								</button>
								<div className="ff-actions-list__menu">
									<DropdownMenu
										icon={ moreVertical }
										label={ __(
											'Action options',
											'flowforms'
										) }
										controls={ [
											[
												{
													title: __(
														'Move up',
														'flowforms'
													),
													icon: arrowUp,
													isDisabled: index === 0,
													onClick: () =>
														moveSelectedAction(
															index,
															index - 1
														),
												},
												{
													title: __(
														'Move down',
														'flowforms'
													),
													icon: arrowDown,
													isDisabled:
														index ===
														actions.length - 1,
													onClick: () =>
														moveSelectedAction(
															index,
															index + 1
														),
												},
											],
											[
												{
													title: isEnabled
														? __(
																'Disable',
																'flowforms'
														  )
														: __(
																'Enable',
																'flowforms'
														  ),
													icon: isEnabled
														? unseen
														: check,
													onClick: () => {
														updateAction( index, {
															...action,
															enabled:
																! isEnabled,
														} );
														setSelectedIndex(
															index
														);
													},
												},
											],
											[
												{
													title: __(
														'Duplicate',
														'flowforms'
													),
													icon: copy,
													onClick: () => {
														duplicateAction(
															index
														);
														setSelectedIndex(
															index + 1
														);
													},
												},
												{
													title: __(
														'Remove',
														'flowforms'
													),
													icon: trash,
													onClick: () => {
														setSelectedIndex(
															index
														);
														deleteAction( index );
													},
												},
											],
										] }
										toggleProps={ {
											variant: 'tertiary',
											size: 'compact',
										} }
									/>
								</div>
							</div>
						);
					} ) }
				</div>
			</aside>

			<section className="ff-actions-workspace__detail">
				<div className="ff-actions-workspace__detail-scroll">
					<div className="ff-actions-detail__header">
						<div>
							<p className="ff-actions-detail__eyebrow">
								{ __( 'Action configuration', 'flowforms' ) }
							</p>
							<h2>
								{ selectedDef?.label ||
									__( 'New action', 'flowforms' ) }
							</h2>
							{ selectedDef?.description && (
								<p className="ff-actions-detail__description">
									{ selectedDef.description }
								</p>
							) }
						</div>
						<div className="ff-actions-detail__header-actions">
							<CheckboxControl
								label={ __( 'Enabled', 'flowforms' ) }
								checked={ selectedAction.enabled !== false }
								onChange={ set( 'enabled' ) }
								__nextHasNoMarginBottom
							/>
						</div>
					</div>

					<div className="ff-actions-settings">
						<section className="ff-actions-settings__section">
							<div className="ff-actions-settings__section-header">
								<h3>{ __( 'Action details', 'flowforms' ) }</h3>
							</div>
							{ selectedDef?.fields?.length ? (
								<div className="ff-actions-settings__fields">
									{ selectedDef.fields.map( ( field ) => (
										<FieldRenderer
											key={ field.key }
											field={ field }
											value={
												selectedAction[ field.key ]
											}
											onChange={ set( field.key ) }
											form={ form }
											action={ selectedAction }
											onActionChange={ setSelectedAction }
										/>
									) ) }
								</div>
							) : (
								<Notice status="info" isDismissible={ false }>
									{ __(
										'Select an action type to configure its settings.',
										'flowforms'
									) }
								</Notice>
							) }
						</section>
					</div>
				</div>
			</section>
		</div>
	);
};

const ActionsPanel = ( { actions, onChange, form, variant = 'sidebar' } ) => {
	const [ available, setAvailable ] = useState( [] );
	const [ deleteCandidateIndex, setDeleteCandidateIndex ] = useState( null );

	useEffect( () => {
		get( ACTIONS )
			.then( ( res ) => setAvailable( res.data || [] ) )
			.catch( () => {} );
	}, [] );

	const addAction = ( actionType = 'email' ) => {
		onChange( [ ...actions, { type: actionType, enabled: true } ] );
	};

	const updateAction = ( index, updated ) => {
		const next = [ ...actions ];
		next[ index ] = updated;
		onChange( next );
	};

	const requestDeleteAction = ( index ) => {
		setDeleteCandidateIndex( index );
	};

	const confirmDeleteAction = () => {
		if (
			deleteCandidateIndex === null ||
			! actions[ deleteCandidateIndex ]
		) {
			setDeleteCandidateIndex( null );
			return;
		}

		onChange( actions.filter( ( _, i ) => i !== deleteCandidateIndex ) );
		setDeleteCandidateIndex( null );
	};

	const duplicateAction = ( index ) => {
		const copyEntry = { ...actions[ index ] };
		onChange( [
			...actions.slice( 0, index + 1 ),
			copyEntry,
			...actions.slice( index + 1 ),
		] );
	};

	const reorderAction = ( fromIndex, toIndex ) => {
		if (
			fromIndex < 0 ||
			toIndex < 0 ||
			fromIndex >= actions.length ||
			toIndex >= actions.length ||
			fromIndex === toIndex
		) {
			return;
		}

		const next = [ ...actions ];
		const [ movedAction ] = next.splice( fromIndex, 1 );
		next.splice( toIndex, 0, movedAction );
		onChange( next );
	};

	const deleteCandidateAction =
		deleteCandidateIndex === null ? null : actions[ deleteCandidateIndex ];
	const deleteCandidateDefinition = available.find(
		( action ) => action.id === deleteCandidateAction?.type
	);
	const deleteCandidateLabel =
		deleteCandidateDefinition?.label || __( 'this action', 'flowforms' );
	const confirmDeleteDialog = (
		<ConfirmDialog
			isOpen={ deleteCandidateIndex !== null && !! deleteCandidateAction }
			onConfirm={ confirmDeleteAction }
			onCancel={ () => setDeleteCandidateIndex( null ) }
			confirmButtonText={ __( 'Remove', 'flowforms' ) }
			cancelButtonText={ __( 'Cancel', 'flowforms' ) }
			title={ __( 'Remove action?', 'flowforms' ) }
		>
			{ sprintf(
				/* translators: %s: action label. */
				__(
					'Are you sure you want to remove “%s”? This action cannot be undone.',
					'flowforms'
				),
				deleteCandidateLabel
			) }
		</ConfirmDialog>
	);

	if ( 'workspace' === variant ) {
		return (
			<>
				<ActionWorkspace
					actions={ actions }
					form={ form }
					availableActions={ available }
					addAction={ addAction }
					updateAction={ updateAction }
					deleteAction={ requestDeleteAction }
					duplicateAction={ duplicateAction }
					reorderAction={ reorderAction }
				/>
				{ confirmDeleteDialog }
			</>
		);
	}

	return (
		<>
			<div className="ff-gb-actions">
				{ actions.length === 0 && (
					<PanelBody
						title={ __( 'Submission actions', 'flowforms' ) }
						initialOpen={ true }
					>
						<div className="ff-actions-stack">
							<p
								style={ {
									margin: 0,
									color: '#757575',
									fontSize: 13,
									lineHeight: 1.5,
								} }
							>
								{ __(
									'Send an email, call a webhook, or redirect when a form is submitted.',
									'flowforms'
								) }
							</p>
							<Button
								variant="secondary"
								icon={ plus }
								onClick={ addAction }
							>
								{ __( 'Add action', 'flowforms' ) }
							</Button>
						</div>
					</PanelBody>
				) }

				{ actions.map( ( action, i ) => (
					<ActionConfig
						key={ i }
						action={ action }
						index={ i }
						availableActions={ available }
						form={ form }
						onChange={ ( updated ) => updateAction( i, updated ) }
						onDelete={ () => requestDeleteAction( i ) }
						onDuplicate={ () => duplicateAction( i ) }
					/>
				) ) }

				{ actions.length > 0 && (
					<div className="ff-gb-actions__footer">
						<Button
							variant="secondary"
							icon={ plus }
							onClick={ addAction }
						>
							{ __( 'Add another action', 'flowforms' ) }
						</Button>
					</div>
				) }
			</div>
			{ confirmDeleteDialog }
		</>
	);
};

export default ActionsPanel;
