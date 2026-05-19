import { useState } from '@wordpress/element';
import {
	Modal,
	Button,
	TextControl,
	TextareaControl,
	SelectControl,
	__experimentalVStack as VStack,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import Toast from '../../components/Toast';
import { post } from '../../api/client';
import { TEMPLATES } from '../../api/endpoints';
import { ICON_OPTIONS } from './icons';

const CATEGORY_OPTIONS = [
	{ value: 'contact', label: __( 'Contact', 'flowforms' ) },
	{ value: 'lead-gen', label: __( 'Lead generation', 'flowforms' ) },
	{ value: 'survey', label: __( 'Survey', 'flowforms' ) },
	{ value: 'feedback', label: __( 'Feedback', 'flowforms' ) },
	{ value: 'event', label: __( 'Event', 'flowforms' ) },
	{ value: 'other', label: __( 'Other', 'flowforms' ) },
];

const SaveAsTemplateModal = ( {
	formId,
	defaultLabel = '',
	onClose,
	onSaved,
} ) => {
	const [ label, setLabel ] = useState( defaultLabel );
	const [ description, setDescription ] = useState( '' );
	const [ category, setCategory ] = useState( 'other' );
	const [ icon, setIcon ] = useState( 'cog' );
	const [ isSaving, setSaving ] = useState( false );
	const [ error, setError ] = useState( null );

	const handleSave = async () => {
		if ( ! label.trim() ) return;
		setSaving( true );
		try {
			const res = await post( TEMPLATES, {
				form_id: formId,
				label: label.trim(),
				description: description.trim(),
				category,
				icon,
			} );
			onSaved?.( res.data );
			onClose();
		} catch ( e ) {
			setError(
				e.message || __( 'Failed to save template.', 'flowforms' )
			);
		} finally {
			setSaving( false );
		}
	};

	return (
		<Modal
			title={ __( 'Save as template', 'flowforms' ) }
			onRequestClose={ onClose }
			size="medium"
		>
			<VStack spacing={ 4 }>
				<Toast
					notice={ error ? { type: 'error', message: error } : null }
					onRemove={ () => setError( null ) }
				/>
				<TextControl
					label={ __( 'Label', 'flowforms' ) }
					value={ label }
					onChange={ setLabel }
					placeholder={ __( 'e.g. Contact form', 'flowforms' ) }
					__nextHasNoMarginBottom
					__next40pxDefaultSize
				/>
				<TextareaControl
					label={ __( 'Description', 'flowforms' ) }
					value={ description }
					onChange={ setDescription }
					rows={ 3 }
					__nextHasNoMarginBottom
				/>
				<SelectControl
					label={ __( 'Category', 'flowforms' ) }
					value={ category }
					options={ CATEGORY_OPTIONS }
					onChange={ setCategory }
					__nextHasNoMarginBottom
					__next40pxDefaultSize
				/>
				<SelectControl
					label={ __( 'Icon', 'flowforms' ) }
					value={ icon }
					options={ ICON_OPTIONS }
					onChange={ setIcon }
					__nextHasNoMarginBottom
					__next40pxDefaultSize
				/>
				<div
					style={ {
						display: 'flex',
						gap: '8px',
						justifyContent: 'flex-end',
					} }
				>
					<Button variant="tertiary" onClick={ onClose }>
						{ __( 'Cancel', 'flowforms' ) }
					</Button>
					<Button
						variant="primary"
						onClick={ handleSave }
						isBusy={ isSaving }
						disabled={ isSaving || ! label.trim() }
					>
						{ __( 'Save template', 'flowforms' ) }
					</Button>
				</div>
			</VStack>
		</Modal>
	);
};

export default SaveAsTemplateModal;
