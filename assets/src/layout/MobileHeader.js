import { Button } from '@wordpress/components';
import { menu } from '@wordpress/icons';
import { __ } from '@wordpress/i18n';
import Logo from '../components/Logo';

const MobileHeader = ( { onOpen } ) => (
	<header className="ff-mobile-header">
		<div className="ff-mobile-header__brand">
			<Logo size={ 28 } />
			<span>{ __( 'FormsPress', 'formspress' ) }</span>
		</div>
		<Button
			icon={ menu }
			label={ __( 'Open menu', 'formspress' ) }
			onClick={ onOpen }
			size="compact"
		/>
	</header>
);

export default MobileHeader;
