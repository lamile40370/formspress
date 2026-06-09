import {
	TextControl,
	TextareaControl,
	ToggleControl,
	SelectControl,
	Button,
	__experimentalVStack as VStack,
	__experimentalHeading as Heading,
} from '@wordpress/components';
import { __, sprintf } from '@wordpress/i18n';
import { trash } from '@wordpress/icons';
import ValidatorsPanel from './ValidatorsPanel';

const FieldEditor = ( {
	field,
	onChange,
	onDelete,
	onMoveUp,
	onMoveDown,
	isFirst,
	isLast,
} ) => {
	if ( ! field ) return null;

	const set = ( key ) => ( value ) =>
		onChange( { ...field, [ key ]: value } );

	const setOption = ( index, value ) => {
		const options = [ ...( field.options || [] ) ];
		options[ index ] = value;
		onChange( { ...field, options } );
	};

	const addOption = () => {
		onChange( { ...field, options: [ ...( field.options || [] ), '' ] } );
	};

	const removeOption = ( index ) => {
		const options = ( field.options || [] ).filter(
			( _, i ) => i !== index
		);
		onChange( { ...field, options } );
	};

	const showOptions = [ 'select', 'radio', 'checkbox' ].includes(
		field.type
	);
	const showPlaceholder = [
		'text',
		'email',
		'phone',
		'number',
		'url',
		'textarea',
	].includes( field.type );
	const showRequired = ! [ 'section', 'page_break', 'hidden' ].includes(
		field.type
	);

	return (
		<div className="ff-field-editor">
			<div className="ff-field-editor__header">
				<Heading
					level={ 5 }
					style={ { margin: 0, textTransform: 'capitalize' } }
				>
					{ field.type.replace( '_', ' ' ) }{ ' ' }
					{ __( 'Field', 'formspress' ) }
				</Heading>
				<div className="ff-field-editor__actions">
					<Button
						variant="tertiary"
						size="small"
						onClick={ onMoveUp }
						disabled={ isFirst }
						label={ __( 'Move up', 'formspress' ) }
					>
						↑
					</Button>
					<Button
						variant="tertiary"
						size="small"
						onClick={ onMoveDown }
						disabled={ isLast }
						label={ __( 'Move down', 'formspress' ) }
					>
						↓
					</Button>
					<Button
						variant="tertiary"
						size="small"
						isDestructive
						onClick={ onDelete }
						icon={ trash }
						label={ __( 'Delete field', 'formspress' ) }
					/>
				</div>
			</div>

			<VStack spacing={ 3 } className="ff-field-editor__body">
				{ field.type !== 'page_break' && field.type !== 'hidden' && (
					<TextControl
						label={ __( 'Label', 'formspress' ) }
						value={ field.label || '' }
						onChange={ set( 'label' ) }
						__nextHasNoMarginBottom
						__next40pxDefaultSize
					/>
				) }

				{ field.type !== 'section' && field.type !== 'page_break' && (
					<TextControl
						label={ __( 'Field ID', 'formspress' ) }
						value={ field.id || '' }
						onChange={ set( 'id' ) }
						help={ __(
							'Used in email templates as {field:id}',
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

				{ field.type !== 'section' && field.type !== 'page_break' && (
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
						help={ __(
							'Supports {user_email}, {user_id}, {site_url}',
							'formspress'
						) }
						__nextHasNoMarginBottom
						__next40pxDefaultSize
					/>
				) }

				{ field.type === 'rating' && (
					<SelectControl
						label={ __( 'Max Stars', 'formspress' ) }
						value={ field.max || 5 }
						options={ [ 3, 4, 5, 6, 7, 10 ].map( ( n ) => ( {
							value: n,
							label: String( n ),
						} ) ) }
						onChange={ ( v ) => set( 'max' )( parseInt( v, 10 ) ) }
						__nextHasNoMarginBottom
						__next40pxDefaultSize
					/>
				) }

				{ showOptions && (
					<div className="ff-field-editor__options">
						<p style={ { fontWeight: 500, marginBottom: '8px' } }>
							{ __( 'Options', 'formspress' ) }
						</p>
						{ ( field.options || [] ).map( ( opt, i ) => (
							<div
								key={ i }
								className="ff-field-editor__option-row"
							>
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
								<Button
									variant="tertiary"
									isDestructive
									size="small"
									onClick={ () => removeOption( i ) }
									icon={ trash }
								/>
							</div>
						) ) }
						<Button
							variant="secondary"
							size="small"
							onClick={ addOption }
						>
							{ __( '+ Add Option', 'formspress' ) }
						</Button>
					</div>
				) }

				{ field.type === 'section' && (
					<TextareaControl
						label={ __( 'Content', 'formspress' ) }
						value={ field.content || '' }
						onChange={ set( 'content' ) }
						rows={ 3 }
						__nextHasNoMarginBottom
					/>
				) }
			</VStack>

			{ ! [ 'section', 'page_break', 'statement', 'row' ].includes(
				field.type
			) && (
				<ValidatorsPanel
					validators={ field.validators || [] }
					onChange={ set( 'validators' ) }
				/>
			) }
		</div>
	);
};

export default FieldEditor;
