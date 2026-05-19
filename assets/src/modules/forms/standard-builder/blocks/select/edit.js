import { __ } from '@wordpress/i18n';
import FieldEdit from '../shared/FieldEdit';
import FieldInspector from '../shared/FieldInspector';
import OptionsControl from '../shared/OptionsControl';
import { getInputControlStyle } from '../shared/input-style';

const Edit = ( props ) => {
	const { attributes, setAttributes } = props;
	const { options = [] } = attributes;

	const extras = (
		<OptionsControl
			options={ options }
			onChange={ ( next ) => setAttributes( { options: next } ) }
		/>
	);

	return (
		<>
			<FieldInspector
				attributes={ attributes }
				setAttributes={ setAttributes }
				showDefault={ false }
				extras={ extras }
			/>
			<FieldEdit { ...props }>
				<select
					disabled
					className="ff-form__control ff-form__control--placeholder"
					style={ getInputControlStyle( attributes ) }
				>
					<option value="">
						{ attributes.placeholder ||
							__( 'Select an option', 'flowforms' ) }
					</option>
					{ options.map( ( opt, index ) => (
						<option key={ index } value={ opt.value || '' }>
							{ opt.label || opt.value || '' }
						</option>
					) ) }
				</select>
			</FieldEdit>
		</>
	);
};

export default Edit;
