import FieldEdit from '../shared/FieldEdit';
import FieldInspector from '../shared/FieldInspector';
import OptionsControl from '../shared/OptionsControl';
import { getInputControlStyle } from '../shared/input-style';

const Edit = ( props ) => {
	const { attributes, setAttributes, clientId } = props;
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
				showPlaceholder={ false }
				extras={ extras }
			/>
			<FieldEdit { ...props }>
				<div
					className="ff-form__control ff-form__control--choices"
					style={ {
						...getInputControlStyle( attributes ),
					} }
				>
					{ options.map( ( opt, index ) => (
						// eslint-disable-next-line jsx-a11y/label-has-associated-control
						<label
							key={ index }
							className="ff-form__control-choice"
						>
							<input
								type="radio"
								name={ `radio-${ clientId }` }
								disabled
							/>
							<span>{ opt.label || opt.value || '' }</span>
						</label>
					) ) }
				</div>
			</FieldEdit>
		</>
	);
};

export default Edit;
