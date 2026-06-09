import { useState, useCallback } from '@wordpress/element';
import {
	Button,
	Modal,
	__experimentalVStack as VStack,
	__experimentalText as Text,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';

const useConfirmDialog = () => {
	const [ state, setState ] = useState( null );

	const confirm = useCallback(
		( {
			message,
			confirmButtonText = __( 'Confirm', 'formspress' ),
			cancelButtonText = __( 'Cancel', 'formspress' ),
		} ) =>
			new Promise( ( resolve ) => {
				setState( {
					message,
					confirmButtonText,
					cancelButtonText,
					resolve,
				} );
			} ),
		[]
	);

	const handleConfirm = () => {
		state?.resolve( true );
		setState( null );
	};

	const handleCancel = () => {
		state?.resolve( false );
		setState( null );
	};

	const confirmDialog = state ? (
		<Modal
			title={ __( 'Confirm', 'formspress' ) }
			onRequestClose={ handleCancel }
			size="small"
		>
			<VStack spacing={ 4 }>
				<Text>{ state.message }</Text>
				<div
					style={ {
						display: 'flex',
						gap: '8px',
						justifyContent: 'flex-end',
					} }
				>
					<Button variant="tertiary" onClick={ handleCancel }>
						{ state.cancelButtonText }
					</Button>
					<Button
						variant="primary"
						isDestructive
						onClick={ handleConfirm }
					>
						{ state.confirmButtonText }
					</Button>
				</div>
			</VStack>
		</Modal>
	) : null;

	return { confirm, confirmDialog };
};

export default useConfirmDialog;
