import {
	Button,
	Spinner,
	__experimentalVStack as VStack,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import PageHeader from '../../components/PageHeader';
import Toast from '../../components/Toast';

/**
 * Common chrome for every settings sub-screen — title, save button,
 * toast slot, loading spinner. Sub-pages just render their cards as
 * children.
 */
const SettingsShell = ( {
	title,
	description,
	settings,
	isSaving,
	notice,
	setNotice,
	onSave,
	children,
} ) => {
	if ( null === settings ) {
		return (
			<div className="ff-page ff-page--loading">
				<Spinner />
			</div>
		);
	}

	return (
		<PageHeader
			title={ title }
			description={ description }
			hideBack
			right={
				<Button
					variant="primary"
					onClick={ () => onSave() }
					isBusy={ isSaving }
					disabled={ isSaving }
				>
					{ __( 'Save changes', 'formspress' ) }
				</Button>
			}
		>
			<div className="ff-page__body">
				<VStack spacing={ 4 }>
					<Toast
						notice={ notice }
						onRemove={ () => setNotice( null ) }
					/>
					{ children }
				</VStack>
			</div>
		</PageHeader>
	);
};

export default SettingsShell;
