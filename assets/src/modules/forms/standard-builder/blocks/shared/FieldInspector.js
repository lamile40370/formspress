import { InspectorControls } from '@wordpress/block-editor';
import {
	PanelBody,
	TextControl,
	ToggleControl,
	TextareaControl,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import InputStyleInspector from './input-style';

const FieldInspector = ( {
	attributes,
	setAttributes,
	showPlaceholder = true,
	showDefault = true,
	extras = null,
} ) => {
	const { label, fieldId, required, placeholder, defaultValue, help } =
		attributes;

	return (
		<>
			<InspectorControls>
				<PanelBody
					title={ __( 'Field settings', 'flowforms' ) }
					initialOpen
				>
					<TextControl
						label={ __( 'Entry label', 'flowforms' ) }
						help={ __(
							'Used in submissions and as a fallback when the field has no inner label blocks.',
							'flowforms'
						) }
						value={ label || '' }
						onChange={ ( v ) => setAttributes( { label: v } ) }
						__nextHasNoMarginBottom
						__next40pxDefaultSize
					/>
					<TextControl
						label={ __( 'Name', 'flowforms' ) }
						help={ __( 'Identifier used in entries', 'flowforms' ) }
						value={ fieldId || '' }
						onChange={ ( v ) => setAttributes( { fieldId: v } ) }
						__nextHasNoMarginBottom
						__next40pxDefaultSize
					/>
					<ToggleControl
						label={ __( 'Required', 'flowforms' ) }
						checked={ !! required }
						onChange={ ( v ) => setAttributes( { required: v } ) }
						__nextHasNoMarginBottom
					/>
					{ showPlaceholder && (
						<TextControl
							label={ __( 'Placeholder', 'flowforms' ) }
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
							label={ __( 'Default value', 'flowforms' ) }
							value={ defaultValue || '' }
							onChange={ ( v ) =>
								setAttributes( { defaultValue: v } )
							}
							__nextHasNoMarginBottom
							__next40pxDefaultSize
						/>
					) }
					<TextareaControl
						label={ __( 'Fallback help text', 'flowforms' ) }
						value={ help || '' }
						onChange={ ( v ) => setAttributes( { help: v } ) }
						__nextHasNoMarginBottom
					/>
					{ extras }
				</PanelBody>
			</InspectorControls>
			<InputStyleInspector
				attributes={ attributes }
				setAttributes={ setAttributes }
			/>
		</>
	);
};

export default FieldInspector;
