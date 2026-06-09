import {
	Button,
	TextControl,
	TextareaControl,
	ToggleControl,
	SelectControl,
	PanelBody,
	__experimentalVStack as VStack,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { plus, trash } from '@wordpress/icons';

/**
 * Auto-renders a schema descriptor coming from PHP
 * (same shape as ActionsPanel.js FieldRenderer).
 */
const FieldRenderer = ( { field, value, onChange } ) => {
	const fallback = field.default ?? ( 'toggle' === field.type ? false : '' );
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

	switch ( field.type ) {
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
					onChange={ ( v ) =>
						onChange( v === '' ? '' : Number( v ) )
					}
				/>
			);
		case 'text':
		default:
			return <TextControl { ...common } />;
	}
};

const ValidatorsPanel = ( { validators = [], onChange } ) => {
	const available = window.flowFormsData?.validators || [];

	const updateAt = ( index, next ) => {
		const arr = [ ...validators ];
		arr[ index ] = next;
		onChange( arr );
	};

	const addValidator = () => {
		const first = available[ 0 ];
		if ( ! first ) {
			return;
		}
		onChange( [ ...validators, { id: first.id, config: {} } ] );
	};

	const removeAt = ( index ) => {
		onChange( validators.filter( ( _, i ) => i !== index ) );
	};

	return (
		<PanelBody
			title={ __( 'Validation', 'formspress' ) }
			initialOpen={ false }
		>
			<VStack spacing={ 4 }>
				{ validators.length === 0 && (
					<p style={ { margin: 0, color: '#757575', fontSize: 13 } }>
						{ __(
							'Add validators to enforce input rules (min length, regex pattern, …).',
							'formspress'
						) }
					</p>
				) }

				{ validators.map( ( v, i ) => {
					const def = available.find( ( a ) => a.id === v.id );
					const settings = def?.settings || [];
					return (
						<div
							key={ i }
							className="ff-validators-panel__row"
							style={ {
								border: '1px solid #ddd',
								padding: 12,
								borderRadius: 4,
							} }
						>
							<VStack spacing={ 3 }>
								<SelectControl
									label={ __( 'Rule', 'formspress' ) }
									value={ v.id }
									options={ available.map( ( a ) => ( {
										value: a.id,
										label: a.label,
									} ) ) }
									onChange={ ( id ) =>
										updateAt( i, { id, config: {} } )
									}
									__nextHasNoMarginBottom
									__next40pxDefaultSize
								/>
								{ settings.map( ( s ) => (
									<FieldRenderer
										key={ s.key }
										field={ s }
										value={ v.config?.[ s.key ] }
										onChange={ ( val ) =>
											updateAt( i, {
												...v,
												config: {
													...( v.config || {} ),
													[ s.key ]: val,
												},
											} )
										}
									/>
								) ) }
								<Button
									variant="tertiary"
									isDestructive
									icon={ trash }
									onClick={ () => removeAt( i ) }
								>
									{ __( 'Remove rule', 'formspress' ) }
								</Button>
							</VStack>
						</div>
					);
				} ) }

				{ available.length > 0 && (
					<Button
						variant="secondary"
						icon={ plus }
						onClick={ addValidator }
					>
						{ __( 'Add validation rule', 'formspress' ) }
					</Button>
				) }
			</VStack>
		</PanelBody>
	);
};

export default ValidatorsPanel;
