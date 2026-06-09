import { useState, useEffect, useMemo } from '@wordpress/element';
import {
	Button,
	TextControl,
	TextareaControl,
	ToggleControl,
	CheckboxControl,
	SelectControl,
	RadioControl,
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
	lock,
	external,
} from '@wordpress/icons';
import { get } from '../../../api/client';
import { ACTIONS } from '../../../api/endpoints';
import EmailDesigner from './EmailDesigner';

const UPGRADE_URL = 'https://example.com/formspress-pro';

const PRO_ACTION_TEASERS = [
	{
		id: 'redirect',
		label: __( 'Redirect to URL', 'formspress' ),
		description: __(
			'Send visitors to a custom URL after submission.',
			'formspress'
		),
	},
	{
		id: 'webhook',
		label: __( 'Send Webhook', 'formspress' ),
		description: __(
			'Send submissions to CRMs, automation tools, and custom endpoints.',
			'formspress'
		),
	},
	{
		id: 'stripe_payment',
		label: __( 'Stripe payment', 'formspress' ),
		description: __(
			'Collect payments with Stripe Checkout.',
			'formspress'
		),
	},
	{
		id: 'mailchimp',
		label: __( 'Email marketing integrations', 'formspress' ),
		description: __(
			'Add contacts to Mailchimp, Brevo, ConvertKit, ActiveCampaign, and more.',
			'formspress'
		),
	},
];

const matchesActionSearch = ( action, query ) => {
	if ( ! query ) {
		return true;
	}

	const text = `${ action.label || '' } ${ action.description || '' }`
		.toLowerCase()
		.trim();

	return text.includes( query );
};

const ProBadge = () => <span className="ff-actions-pro-badge">Pro</span>;

const ProActionsNotice = ( { compact = false } ) => (
	<div
		className={ `ff-actions-pro-notice${
			compact ? ' ff-actions-pro-notice--compact' : ''
		}` }
	>
		<Icon icon={ lock } size={ compact ? 16 : 20 } />
		<div>
			<strong>
				{ __( 'More actions are available in Pro', 'formspress' ) }
			</strong>
			<p>
				{ __(
					'Upgrade to add redirects, webhooks, payments, and marketing integrations to your submission workflow.',
					'formspress'
				) }
			</p>
		</div>
		<Button
			variant="secondary"
			size="compact"
			href={ UPGRADE_URL }
			target="_blank"
			rel="noreferrer"
			icon={ external }
		>
			{ __( 'Upgrade', 'formspress' ) }
		</Button>
	</div>
);

const FieldRenderer = ( {
	field,
	value,
	onChange,
	form,
	action,
	onActionChange,
} ) => {
	if ( ! isActionFieldVisible( field, action ) ) {
		return null;
	}

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
		case 'wp-page-token':
			return (
				<WordPressPageTokenField
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
		case 'key-value-repeater':
			return (
				<KeyValueRepeater
					field={ field }
					value={ current }
					onChange={ onChange }
				/>
			);
		case 'section':
			return <ActionSettingsSection field={ field } />;
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
		case 'send-to-routing':
			return (
				<SendToRoutingField
					field={ field }
					form={ form }
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
					checked={ !! current }
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

const ActionSettingsSection = ( { field } ) => (
	<div className="ff-actions-settings__subsection">
		<h4>{ field.label }</h4>
		{ field.description && <p>{ field.description }</p> }
	</div>
);

const isActionFieldVisible = ( field, action ) => {
	const dependency = field?.depends_on || field?.dependsOn;

	if ( ! dependency?.key ) {
		return true;
	}

	const current = action?.[ dependency.key ] ?? '';
	const expected = dependency.value ?? dependency.values;
	const expectedValues = Array.isArray( expected ) ? expected : [ expected ];

	return expectedValues.map( String ).includes( String( current ) );
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
		{ value: '0', label: __( '— None —', 'formspress' ) },
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
			label={ __( 'Load template', 'formspress' ) }
			value={ String( value || '0' ) }
			options={ options }
			onChange={ handleChange }
			help={ __(
				'Pre-fills body (and subject) from a saved Email Template.',
				'formspress'
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
						__( 'Select a field, for example %s', 'formspress' ),
						fieldDescriptor.placeholder
				  )
				: __( 'Select a field', 'formspress' ),
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

const EMAIL_ROUTING_OPERATORS = [
	{ value: 'is', label: __( 'is', 'formspress' ) },
	{ value: 'is_not', label: __( 'is not', 'formspress' ) },
	{ value: 'contains', label: __( 'contains', 'formspress' ) },
	{
		value: 'not_contains',
		label: __( 'does not contain', 'formspress' ),
	},
	{ value: 'is_empty', label: __( 'is empty', 'formspress' ) },
	{ value: 'not_empty', label: __( 'is not empty', 'formspress' ) },
];

const normalizeRoutingRows = ( value ) => {
	if ( ! Array.isArray( value ) ) {
		return [];
	}

	return value
		.filter( ( row ) => row && 'object' === typeof row )
		.map( ( row ) => ( {
			to: row.to || '',
			field: row.field || row.field_id || '',
			operator: row.operator || 'is',
			value: row.value || '',
		} ) );
};

const SendToRoutingField = ( { field, form, action, onActionChange } ) => {
	const mode = action?.to_mode || 'email';
	const routingRows = normalizeRoutingRows( action?.routing );
	const fieldOptions = getFormFieldOptions( form, {
		placeholder: __( 'email', 'formspress' ),
	} );

	const updateAction = ( updates ) => {
		onActionChange( {
			...action,
			...updates,
		} );
	};

	const updateRoute = ( index, key, nextValue ) => {
		const next = [ ...routingRows ];
		next[ index ] = { ...next[ index ], [ key ]: nextValue };
		updateAction( { routing: next } );
	};

	const addRoute = () => {
		updateAction( {
			routing: [
				...routingRows,
				{ to: '', field: '', operator: 'is', value: '' },
			],
		} );
	};

	const removeRoute = ( index ) => {
		updateAction( {
			routing: routingRows.filter(
				( _, itemIndex ) => itemIndex !== index
			),
		} );
	};

	const rows = routingRows.length
		? routingRows
		: [ { to: '', field: '', operator: 'is', value: '' } ];

	return (
		<div className="ff-send-to-routing">
			<RadioControl
				label={ field.label || __( 'Send to', 'formspress' ) }
				selected={ mode }
				options={ [
					{
						label: __( 'Enter email', 'formspress' ),
						value: 'email',
					},
					{
						label: __( 'Select a field', 'formspress' ),
						value: 'field',
					},
					{
						label: __( 'Configure routing', 'formspress' ),
						value: 'routing',
					},
				] }
				onChange={ ( nextMode ) =>
					updateAction( { to_mode: nextMode } )
				}
			/>

			{ mode === 'email' && (
				<TextControl
					label={ __( 'Email address', 'formspress' ) }
					help={ __(
						'Use commas for multiple recipients. Merge tags like {field:email} are supported.',
						'formspress'
					) }
					value={ action?.to || '' }
					onChange={ ( to ) => updateAction( { to } ) }
					placeholder="admin@example.com"
					__nextHasNoMarginBottom
					__next40pxDefaultSize
				/>
			) }

			{ mode === 'field' && (
				<SelectControl
					label={ __( 'Recipient field', 'formspress' ) }
					help={ __(
						'The selected field value must contain a valid email address.',
						'formspress'
					) }
					value={ action?.to_field || '' }
					options={ fieldOptions }
					onChange={ ( to_field ) => updateAction( { to_field } ) }
					__nextHasNoMarginBottom
					__next40pxDefaultSize
				/>
			) }

			{ mode === 'routing' && (
				<div className="ff-send-to-routing__routes">
					{ rows.map( ( route, index ) => (
						<div
							key={ index }
							className="ff-send-to-routing__route"
						>
							<TextControl
								label={ __( 'Send to', 'formspress' ) }
								value={ route.to }
								onChange={ ( nextValue ) =>
									updateRoute( index, 'to', nextValue )
								}
								placeholder="team@example.com"
								__nextHasNoMarginBottom
								__next40pxDefaultSize
							/>
							<SelectControl
								label={ __( 'If field', 'formspress' ) }
								value={ route.field }
								options={ fieldOptions }
								onChange={ ( nextValue ) =>
									updateRoute( index, 'field', nextValue )
								}
								__nextHasNoMarginBottom
								__next40pxDefaultSize
							/>
							<SelectControl
								label={ __( 'Condition', 'formspress' ) }
								value={ route.operator }
								options={ EMAIL_ROUTING_OPERATORS }
								onChange={ ( nextValue ) =>
									updateRoute(
										index,
										'operator',
										nextValue
									)
								}
								__nextHasNoMarginBottom
								__next40pxDefaultSize
							/>
							{ ! [ 'is_empty', 'not_empty' ].includes(
								route.operator
							) && (
								<TextControl
									label={ __( 'Value', 'formspress' ) }
									value={ route.value }
									onChange={ ( nextValue ) =>
										updateRoute(
											index,
											'value',
											nextValue
										)
									}
									placeholder={ __(
										'Enter value',
										'formspress'
									) }
									__nextHasNoMarginBottom
									__next40pxDefaultSize
								/>
							) }
							<Button
								icon={ closeSmall }
								label={ __( 'Remove route', 'formspress' ) }
								onClick={ () => removeRoute( index ) }
								variant="tertiary"
							/>
						</div>
					) ) }
					<Button
						variant="tertiary"
						size="compact"
						icon={ plus }
						className="ff-send-to-routing__add"
						onClick={ addRoute }
					>
						{ __( 'Add rule', 'formspress' ) }
					</Button>
				</div>
			) }
		</div>
	);
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
			__experimentalValidateInput={ ( token ) => idByToken.has( token ) }
			placeholder={
				field.placeholder || __( 'Type to search', 'formspress' )
			}
		/>
	);
};

const normalizePageValue = ( value ) =>
	'string' === typeof value ? value.trim() : '';

const getPageTokenLabel = ( page ) => {
	const title = String( page?.title || page?.url || '' );
	const path = String( page?.path || '' );

	return path ? `${ title } (${ path })` : title;
};

const WordPressPageTokenField = ( { field, value, onChange } ) => {
	const pages = Array.isArray( window.flowFormsData?.wpPages )
		? window.flowFormsData.wpPages
		: [];
	const labelByUrl = new Map(
		pages.map( ( page ) => [
			String( page.url ),
			getPageTokenLabel( page ),
		] )
	);
	const urlByLabel = new Map(
		pages.map( ( page ) => [
			getPageTokenLabel( page ),
			String( page.url ),
		] )
	);
	const selectedUrl = normalizePageValue( value );
	const selectedToken = selectedUrl
		? labelByUrl.get( selectedUrl ) || selectedUrl
		: '';

	const handleChange = ( tokens ) => {
		const token = tokens.length
			? String( tokens[ tokens.length - 1 ] )
			: '';

		if ( '' === token ) {
			onChange( '' );
			return;
		}

		onChange( urlByLabel.get( token ) || token );
	};

	return (
		<FormTokenField
			__next40pxDefaultSize
			__experimentalExpandOnFocus
			label={ field.label }
			help={ field.help || '' }
			value={ selectedToken ? [ selectedToken ] : [] }
			suggestions={ Array.from( urlByLabel.keys() ) }
			onChange={ handleChange }
			__experimentalValidateInput={ ( token ) => urlByLabel.has( token ) }
			maxLength={ 1 }
			placeholder={
				field.placeholder || __( 'Search pages', 'formspress' )
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
		placeholder: __( 'field_id', 'formspress' ),
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
									'formspress'
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
									'formspress'
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
								label={ __( 'Remove mapping', 'formspress' ) }
								onClick={ () => removeMapping( index ) }
								variant="tertiary"
							/>
						</div>
					) ) }
				</div>
				<Button
					variant="secondary"
					icon={ plus }
					onClick={ addMapping }
				>
					{ __( 'Add custom field mapping', 'formspress' ) }
				</Button>
			</div>
			{ field.help && (
				<p className="components-base-control__help">{ field.help }</p>
			) }
		</div>
	);
};

const normalizeKeyValueRows = ( value ) => {
	if ( Array.isArray( value ) ) {
		return value
			.filter( ( row ) => row && 'object' === typeof row )
			.map( ( row ) => ( {
				key: row.key || row.field_key || '',
				value: row.value || row.template || row.field_id || '',
			} ) );
	}

	if ( value && 'object' === typeof value ) {
		return Object.entries( value ).map( ( [ key, rowValue ] ) => ( {
			key,
			value: String( rowValue ?? '' ),
		} ) );
	}

	return [];
};

const KeyValueRepeater = ( { field, value, onChange } ) => {
	const rows = normalizeKeyValueRows( value );
	const keyLabel = field.keyLabel || __( 'Key', 'formspress' );
	const valueLabel = field.valueLabel || __( 'Value', 'formspress' );

	const updateRow = ( index, rowKey, nextValue ) => {
		const next = [ ...rows ];
		next[ index ] = { ...next[ index ], [ rowKey ]: nextValue };
		onChange( next );
	};

	const removeRow = ( index ) => {
		onChange( rows.filter( ( _, itemIndex ) => itemIndex !== index ) );
	};

	const addRow = () => {
		onChange( [ ...rows, { key: '', value: '' } ] );
	};

	return (
		<div className="ff-key-value-repeater">
			<div className="components-base-control__field">
				<span className="components-base-control__label">
					{ field.label }
				</span>
				<div className="ff-key-value-repeater__rows">
					{ rows.map( ( row, index ) => (
						<div
							key={ index }
							className="ff-key-value-repeater__row"
						>
							<TextControl
								label={ keyLabel }
								value={ row.key }
								onChange={ ( nextValue ) =>
									updateRow( index, 'key', nextValue )
								}
								placeholder={ field.keyPlaceholder || '' }
								__nextHasNoMarginBottom
								__next40pxDefaultSize
							/>
							<TextControl
								label={ valueLabel }
								value={ row.value }
								onChange={ ( nextValue ) =>
									updateRow( index, 'value', nextValue )
								}
								placeholder={ field.valuePlaceholder || '' }
								__nextHasNoMarginBottom
								__next40pxDefaultSize
							/>
							<Button
								icon={ closeSmall }
								label={ __( 'Remove row', 'formspress' ) }
								onClick={ () => removeRow( index ) }
								variant="tertiary"
							/>
						</div>
					) ) }
				</div>
				<Button variant="secondary" icon={ plus } onClick={ addRow }>
					{ field.addLabel || __( 'Add row', 'formspress' ) }
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
	lockedActions = [],
	form,
} ) => {
	const typeOptions = [
		{ value: '', label: __( '— Select action type —', 'formspress' ) },
		...availableActions.map( ( a ) => ( { value: a.id, label: a.label } ) ),
	];

	const set = ( key ) => ( value ) =>
		onChange( { ...action, [ key ]: value } );
	const currentDef = availableActions.find( ( a ) => a.id === action.type );
	const lockedDef = lockedActions.find( ( a ) => a.id === action.type );
	const label =
		currentDef?.label ||
		lockedDef?.label ||
		__( 'New action', 'formspress' );
	const description = currentDef?.description || '';
	const isLocked = !! lockedDef && ! currentDef;

	return (
		<PanelBody
			title={ `${ index + 1 }. ${ label }${
				! action.enabled ? ` — ${ __( 'Disabled', 'formspress' ) }` : ''
			}` }
			initialOpen={ true }
		>
			<div className="ff-actions-stack">
				<SelectControl
					label={ __( 'Action type', 'formspress' ) }
					value={ action.type || '' }
					options={ typeOptions }
					onChange={ set( 'type' ) }
					help={ description }
					disabled={ isLocked }
					__nextHasNoMarginBottom
					__next40pxDefaultSize
				/>

				{ isLocked && <ProActionsNotice compact /> }

				<ToggleControl
					label={ __( 'Enabled', 'formspress' ) }
					checked={ !! action.enabled }
					onChange={ set( 'enabled' ) }
					disabled={ isLocked }
					help={
						action.enabled
							? __( 'Runs on every submission.', 'formspress' )
							: __( 'Skipped on submissions.', 'formspress' )
					}
					__nextHasNoMarginBottom
				/>

				{ currentDef?.fields
					?.filter( ( field ) =>
						isActionFieldVisible( field, action )
					)
					.map( ( field ) => (
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
					label={ __( 'Action options', 'formspress' ) }
					controls={ [
						{
							title: __( 'Duplicate', 'formspress' ),
							icon: copy,
							onClick: onDuplicate,
						},
						{
							title: __( 'Remove action', 'formspress' ),
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
	lockedActions = [],
	onSelect,
	label = __( 'Add', 'formspress' ),
	variant = 'secondary',
} ) => {
	const [ search, setSearch ] = useState( '' );
	const filteredActions = useMemo( () => {
		const query = search.trim().toLowerCase();
		return availableActions.filter( ( action ) =>
			matchesActionSearch( action, query )
		);
	}, [ availableActions, search ] );
	const filteredLockedActions = useMemo( () => {
		const query = search.trim().toLowerCase();
		return lockedActions.filter( ( action ) =>
			matchesActionSearch( action, query )
		);
	}, [ lockedActions, search ] );
	const hasResults =
		filteredActions.length > 0 || filteredLockedActions.length > 0;

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
						placeholder={ __( 'Search actions', 'formspress' ) }
					/>
					<div className="ff-actions-inserter__results" role="list">
						{ hasResults ? (
							<>
								{ filteredActions.map( ( action ) => (
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
								) ) }
								{ filteredLockedActions.map( ( action ) => (
									<button
										key={ action.id }
										type="button"
										className="ff-actions-inserter__item ff-actions-inserter__item--locked"
										onClick={ () =>
											window.open(
												UPGRADE_URL,
												'_blank',
												'noopener,noreferrer'
											)
										}
									>
										<span className="ff-actions-inserter__locked-title">
											<span className="ff-actions-inserter__item-title">
												<Icon
													icon={ lock }
													size={ 16 }
												/>
												{ action.label }
											</span>
											<ProBadge />
										</span>
										{ action.description && (
											<span className="ff-actions-inserter__item-description">
												{ action.description }
											</span>
										) }
									</button>
								) ) }
							</>
						) : (
							<p className="ff-actions-inserter__empty">
								{ __(
									'No matching actions found.',
									'formspress'
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
	lockedActions,
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
	const selectedDef =
		availableActions.find(
			( action ) => action.id === selectedAction?.type
		) ||
		lockedActions.find( ( action ) => action.id === selectedAction?.type );
	const selectedIsLocked =
		!! selectedAction &&
		! availableActions.some(
			( action ) => action.id === selectedAction.type
		) &&
		lockedActions.some( ( action ) => action.id === selectedAction.type );
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
						<strong>{ __( 'Actions', 'formspress' ) }</strong>
						<ActionInserter
							availableActions={ availableActions }
							lockedActions={ lockedActions }
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
								'formspress'
							) }
						</p>
					</div>
				</aside>

				<section className="ff-actions-workspace__detail">
					<div className="ff-actions-workspace__detail-scroll">
						<div className="ff-actions-empty-panel">
							<Icon icon={ send } size={ 32 } />
							<p className="ff-actions-detail__eyebrow">
								{ __( 'Action configuration', 'formspress' ) }
							</p>
							<h2>
								{ __( 'No action selected', 'formspress' ) }
							</h2>
							<p>
								{ __(
									'Start with the free email notification action. More workflow actions are available in FormsPress Pro.',
									'formspress'
								) }
							</p>
							{ lockedActions.length > 0 && <ProActionsNotice /> }
							<div className="ff-actions-empty-panel__actions">
								<ActionInserter
									availableActions={ availableActions }
									lockedActions={ lockedActions }
									variant="primary"
									label={ __( 'Add action', 'formspress' ) }
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
					<strong>{ __( 'Actions', 'formspress' ) }</strong>
					<ActionInserter
						availableActions={ availableActions }
						lockedActions={ lockedActions }
						onSelect={ ( actionType ) => {
							addAction( actionType );
							setSelectedIndex( actions.length );
						} }
					/>
				</div>

				<div className="ff-actions-list" role="list">
					{ actions.map( ( action, index ) => {
						const actionDef =
							availableActions.find(
								( item ) => item.id === action.type
							) ||
							lockedActions.find(
								( item ) => item.id === action.type
							);
						const label =
							actionDef?.label ||
							__( 'New action', 'formspress' );
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
												? __( 'Enabled', 'formspress' )
												: __(
														'Disabled',
														'formspress'
												  ) }
										</span>
									</span>
								</button>
								<div className="ff-actions-list__menu">
									<DropdownMenu
										icon={ moreVertical }
										label={ __(
											'Action options',
											'formspress'
										) }
										controls={ [
											[
												{
													title: __(
														'Move up',
														'formspress'
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
														'formspress'
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
																'formspress'
														  )
														: __(
																'Enable',
																'formspress'
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
														'formspress'
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
														'formspress'
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
								{ __( 'Action configuration', 'formspress' ) }
							</p>
							<h2>
								{ selectedDef?.label ||
									__( 'New action', 'formspress' ) }
								{ selectedIsLocked && <ProBadge /> }
							</h2>
							{ selectedDef?.description && (
								<p className="ff-actions-detail__description">
									{ selectedDef.description }
								</p>
							) }
						</div>
						<div className="ff-actions-detail__header-actions">
							<CheckboxControl
								label={ __( 'Enabled', 'formspress' ) }
								checked={ selectedAction.enabled !== false }
								onChange={ set( 'enabled' ) }
								disabled={ selectedIsLocked }
								__nextHasNoMarginBottom
							/>
						</div>
					</div>

					<div className="ff-actions-settings">
						<section className="ff-actions-settings__section">
							<div className="ff-actions-settings__section-header">
								<h3>
									{ __( 'Action details', 'formspress' ) }
								</h3>
							</div>
							{ selectedIsLocked ? (
								<ProActionsNotice />
							) : selectedDef?.fields?.length ? (
								<div className="ff-actions-settings__fields">
									{ selectedDef.fields
										.filter( ( field ) =>
											isActionFieldVisible(
												field,
												selectedAction
											)
										)
										.map( ( field ) => (
											<div
												key={ field.key }
												className={ `ff-actions-settings__field ff-actions-settings__field--${ field.key }` }
											>
												<FieldRenderer
													field={ field }
													value={
														selectedAction[
															field.key
														]
													}
													onChange={ set(
														field.key
													) }
													form={ form }
													action={ selectedAction }
													onActionChange={
														setSelectedAction
													}
												/>
											</div>
										) ) }
								</div>
							) : (
								<Notice status="info" isDismissible={ false }>
									{ __(
										'Select an action type to configure its settings.',
										'formspress'
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
	const isProActive = !! window.flowFormsData?.pro?.active;

	useEffect( () => {
		get( ACTIONS )
			.then( ( res ) => setAvailable( res.data || [] ) )
			.catch( () => {} );
	}, [] );

	const addAction = ( actionType = 'email' ) => {
		onChange( [ ...actions, { type: actionType, enabled: true } ] );
	};
	const lockedActions = isProActive
		? []
		: PRO_ACTION_TEASERS.filter(
				( teaser ) =>
					! available.some( ( action ) => action.id === teaser.id )
		  );

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
		deleteCandidateDefinition?.label || __( 'this action', 'formspress' );
	const confirmDeleteDialog = (
		<ConfirmDialog
			isOpen={ deleteCandidateIndex !== null && !! deleteCandidateAction }
			onConfirm={ confirmDeleteAction }
			onCancel={ () => setDeleteCandidateIndex( null ) }
			confirmButtonText={ __( 'Remove', 'formspress' ) }
			cancelButtonText={ __( 'Cancel', 'formspress' ) }
			title={ __( 'Remove action?', 'formspress' ) }
		>
			{ sprintf(
				/* translators: %s: action label. */
				__(
					'Are you sure you want to remove “%s”? This action cannot be undone.',
					'formspress'
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
					lockedActions={ lockedActions }
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
						title={ __( 'Submission actions', 'formspress' ) }
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
									'Send an email notification after every submission. More action types are available in FormsPress Pro.',
									'formspress'
								) }
							</p>
							{ lockedActions.length > 0 && (
								<ProActionsNotice compact />
							) }
							<Button
								variant="secondary"
								icon={ plus }
								onClick={ addAction }
							>
								{ __( 'Add action', 'formspress' ) }
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
						lockedActions={ lockedActions }
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
							{ __( 'Add another action', 'formspress' ) }
						</Button>
					</div>
				) }
			</div>
			{ confirmDeleteDialog }
		</>
	);
};

export default ActionsPanel;
