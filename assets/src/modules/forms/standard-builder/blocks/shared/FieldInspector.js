import {
	InspectorControls,
	store as blockEditorStore,
} from '@wordpress/block-editor';
import { useSelect } from '@wordpress/data';
import {
	Button,
	Notice,
	PanelBody,
	TextControl,
	ToggleControl,
	TextareaControl,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import InputStyleInspector from './input-style';
import ConditionsPanel from '../../../components/ConditionsPanel';
import {
	collectStandardFields,
	getBlockFieldType,
	getProPricingUrl,
} from './conditional-display';

const FieldInspector = ( {
	attributes,
	setAttributes,
	showPlaceholder = true,
	showDefault = true,
	extras = null,
} ) => {
	const { label, fieldId, required, placeholder, defaultValue, help } =
		attributes;
	const isPro = !! window.flowFormsData?.features?.conditionalLogic;
	const { allFields, selectedType } = useSelect( ( select ) => {
		const editor = select( blockEditorStore );
		const selectedBlock = editor.getSelectedBlock();

		return {
			allFields: collectStandardFields( editor.getBlocks() ),
			selectedType: getBlockFieldType( selectedBlock?.name ),
		};
	}, [] );

	const currentField = {
		id: fieldId || '',
		type: selectedType,
		label: label || fieldId || '',
		options: attributes.options || [],
		conditions: attributes.conditions,
	};

	const updateConditionsField = ( nextField ) => {
		setAttributes( { conditions: nextField.conditions } );
	};

	return (
		<>
			<InspectorControls>
				<PanelBody
					title={ __( 'Field settings', 'formspress' ) }
					initialOpen
				>
					<TextControl
						label={ __( 'Entry label', 'formspress' ) }
						help={ __(
							'Used in submissions and as a fallback when the field has no inner label blocks.',
							'formspress'
						) }
						value={ label || '' }
						onChange={ ( v ) => setAttributes( { label: v } ) }
						__nextHasNoMarginBottom
						__next40pxDefaultSize
					/>
					<TextControl
						label={ __( 'Name', 'formspress' ) }
						help={ __(
							'Identifier used in entries',
							'formspress'
						) }
						value={ fieldId || '' }
						onChange={ ( v ) => setAttributes( { fieldId: v } ) }
						__nextHasNoMarginBottom
						__next40pxDefaultSize
					/>
					<ToggleControl
						label={ __( 'Required', 'formspress' ) }
						checked={ !! required }
						onChange={ ( v ) => setAttributes( { required: v } ) }
						__nextHasNoMarginBottom
					/>
					{ showPlaceholder && (
						<TextControl
							label={ __( 'Placeholder', 'formspress' ) }
							value={ placeholder || '' }
							onChange={ ( v ) =>
								setAttributes( { placeholder: v } )
							}
							__nextHasNoMarginBottom
							__next40pxDefaultSize
						/>
					) }
					{ showDefault && (
						<TextControl
							label={ __( 'Default value', 'formspress' ) }
							value={ defaultValue || '' }
							onChange={ ( v ) =>
								setAttributes( { defaultValue: v } )
							}
							__nextHasNoMarginBottom
							__next40pxDefaultSize
						/>
					) }
					<TextareaControl
						label={ __( 'Fallback help text', 'formspress' ) }
						value={ help || '' }
						onChange={ ( v ) => setAttributes( { help: v } ) }
						__nextHasNoMarginBottom
					/>
					{ extras }
				</PanelBody>
				{ isPro ? (
					<ConditionsPanel
						field={ currentField }
						allFields={ allFields }
						onChange={ updateConditionsField }
						title={ __( 'Conditional display', 'formspress' ) }
					/>
				) : (
					<PanelBody
						title={ __( 'Conditional display', 'formspress' ) }
						initialOpen={ false }
					>
						<Notice status="info" isDismissible={ false }>
							{ __(
								'Show or hide this field based on previous answers. Available in FormsPress Pro.',
								'formspress'
							) }{ ' ' }
							<Button
								variant="link"
								href={ getProPricingUrl() }
								target="_blank"
								rel="noreferrer"
							>
								{ __( 'View Pro pricing', 'formspress' ) }
							</Button>
						</Notice>
					</PanelBody>
				) }
			</InspectorControls>
			<InputStyleInspector
				attributes={ attributes }
				setAttributes={ setAttributes }
			/>
		</>
	);
};

export default FieldInspector;
