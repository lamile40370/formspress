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
			title={ __( 'Form actions', 'formspress' ) }
			onRequestClose={ onClose }
			size="fill"
			className="ff-form-actions-modal"
		>
			<div className="ff-form-actions-modal__shell">
				<div className="ff-form-actions-modal__summary">
					<div>
						<strong>
							{ __( 'Submission workflow', 'formspress' ) }
						</strong>
						<p>
							{ __(
								'Configure the actions that run after a successful submission.',
								'formspress'
							) }
						</p>
					</div>
					<div className="ff-form-actions-modal__stats">
						<div className="ff-form-actions-modal__stat">
							<strong>{ ( actions || [] ).length }</strong>
							<span>{ __( 'Total', 'formspress' ) }</span>
						</div>
						<div className="ff-form-actions-modal__stat">
							<strong>{ enabledCount }</strong>
							<span>{ __( 'Enabled', 'formspress' ) }</span>
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
							__( 'Actions are saved with "%s".', 'formspress' ),
							form?.title || __( 'Untitled form', 'formspress' )
						) }
					</p>
					<Button
						variant="primary"
						onClick={ onDone || onClose }
						isBusy={ isSaving }
						disabled={ isSaving }
					>
						{ __( 'Done', 'formspress' ) }
					</Button>
				</footer>
			</div>
		</Modal>
	);
};

export default FormActionsModal;
