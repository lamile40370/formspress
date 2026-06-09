import { TextControl } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import FieldEdit from '../shared/FieldEdit';
import FieldInspector from '../shared/FieldInspector';
import { getInputControlStyle } from '../shared/input-style';

const parseNum = ( v ) => {
	if ( v === '' || v === undefined || v === null ) {
		return undefined;
	}
	const n = Number( v );
	return Number.isNaN( n ) ? undefined : n;
};

const Edit = ( props ) => {
	const { attributes, setAttributes } = props;
	const { min, max, step } = attributes;

	const extras = (
		<>
			<TextControl
				label={ __( 'Min', 'formspress' ) }
				type="number"
				value={ min ?? '' }
				onChange={ ( v ) => setAttributes( { min: parseNum( v ) } ) }
				__nextHasNoMarginBottom
				__next40pxDefaultSize
			/>
			<TextControl
				label={ __( 'Max', 'formspress' ) }
				type="number"
				value={ max ?? '' }
				onChange={ ( v ) => setAttributes( { max: parseNum( v ) } ) }
				__nextHasNoMarginBottom
				__next40pxDefaultSize
			/>
			<TextControl
				label={ __( 'Step', 'formspress' ) }
				type="number"
				value={ step ?? '' }
				onChange={ ( v ) => setAttributes( { step: parseNum( v ) } ) }
				__nextHasNoMarginBottom
				__next40pxDefaultSize
			/>
		</>
	);

	return (
		<>
			<FieldInspector
				attributes={ attributes }
				setAttributes={ setAttributes }
				extras={ extras }
			/>
			<FieldEdit { ...props }>
				<input
					type="number"
					placeholder={ attributes.placeholder || '' }
					defaultValue={ attributes.defaultValue || '' }
					min={ min ?? undefined }
					max={ max ?? undefined }
					step={ step ?? undefined }
					disabled
					className="ff-form__control"
					style={ getInputControlStyle( attributes ) }
				/>
			</FieldEdit>
		</>
	);
};

export default Edit;
