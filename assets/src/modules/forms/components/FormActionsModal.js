import { Button, Modal } from '@wordpress/components';
import { __, sprintf } from '@wordpress/i18n';

import ActionsPanel from './ActionsPanel';

const FormActionsModal = ( {
	actions,
	onChange,
	form,
	onClose,
	onDone,
	isSaving = false,
} ) => {
	const enabledCount = ( actions || [] ).filter(
		( action ) => action.enabled !== false
	).length;

	return (
		<Modal
			title={ __( 'Form actions', 'flowforms' ) }
			onRequestClose={ onClose }
			size="fill"
			className="ff-form-actions-modal"
		>
			<div className="ff-form-actions-modal__shell">
				<div className="ff-form-actions-modal__summary">
					<div>
						<strong>
							{ __( 'Submission workflow', 'flowforms' ) }
						</strong>
						<p>
							{ __(
								'Configure the actions that run after a successful submission.',
								'flowforms'
							) }
						</p>
					</div>
					<div className="ff-form-actions-modal__stats">
						<div className="ff-form-actions-modal__stat">
							<strong>{ ( actions || [] ).length }</strong>
							<span>{ __( 'Total', 'flowforms' ) }</span>
						</div>
						<div className="ff-form-actions-modal__stat">
							<strong>{ enabledCount }</strong>
							<span>{ __( 'Enabled', 'flowforms' ) }</span>
						</div>
					</div>
				</div>

				<ActionsPanel
					variant="workspace"
					actions={ actions || [] }
					onChange={ onChange }
					form={ form }
				/>

				<footer className="ff-form-actions-modal__footer">
					<p>
						{ sprintf(
							/* translators: %s: form title. */
							__( 'Actions are saved with "%s".', 'flowforms' ),
							form?.title || __( 'Untitled form', 'flowforms' )
						) }
					</p>
					<Button
						variant="primary"
						onClick={ onDone || onClose }
						isBusy={ isSaving }
						disabled={ isSaving }
					>
						{ __( 'Done', 'flowforms' ) }
					</Button>
				</footer>
			</div>
		</Modal>
	);
};

export default FormActionsModal;
