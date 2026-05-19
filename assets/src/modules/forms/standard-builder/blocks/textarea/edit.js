import { RangeControl } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import FieldEdit from '../shared/FieldEdit';
import FieldInspector from '../shared/FieldInspector';
import { getInputControlStyle } from '../shared/input-style';

const Edit = ( props ) => {
	const { attributes, setAttributes } = props;
	const { rows = 4 } = attributes;

	const extras = (
		<RangeControl
			label={ __( 'Rows', 'flowforms' ) }
			value={ rows }
			min={ 2 }
			max={ 20 }
			onChange={ ( v ) => setAttributes( { rows: v } ) }
			__nextHasNoMarginBottom
			__next40pxDefaultSize
		/>
	);

	return (
		<>
			<FieldInspector
				attributes={ attributes }
				setAttributes={ setAttributes }
				extras={ extras }
			/>
			<FieldEdit { ...props }>
				<textarea
					rows={ rows }
					placeholder={ attributes.placeholder || '' }
					defaultValue={ attributes.defaultValue || '' }
					disabled
					className="ff-form__control"
					style={ getInputControlStyle( attributes, {
						resize: 'vertical',
					} ) }
				/>
			</FieldEdit>
		</>
	);
};

export default Edit;
