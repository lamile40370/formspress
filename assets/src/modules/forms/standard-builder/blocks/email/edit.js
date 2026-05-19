import FieldEdit from '../shared/FieldEdit';
import FieldInspector from '../shared/FieldInspector';
import { getInputControlStyle } from '../shared/input-style';

const Edit = ( props ) => {
	const { attributes } = props;

	return (
		<>
			<FieldInspector
				attributes={ attributes }
				setAttributes={ props.setAttributes }
			/>
			<FieldEdit { ...props }>
				<input
					type="email"
					placeholder={ attributes.placeholder || '' }
					defaultValue={ attributes.defaultValue || '' }
					disabled
					className="ff-form__control"
					style={ getInputControlStyle( attributes ) }
				/>
			</FieldEdit>
		</>
	);
};

export default Edit;
