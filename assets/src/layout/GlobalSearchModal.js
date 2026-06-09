import { useState, useEffect, useCallback } from '@wordpress/element';
import {
	Modal,
	TextControl,
	__experimentalVStack as VStack,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';

const GlobalSearchModal = ( { isOpen, onClose, onNavigate } ) => {
	const [ search, setSearch ] = useState( '' );
	const navItems = window.flowFormsData?.navItems || [];

	useEffect( () => {
		if ( ! isOpen ) {
			setSearch( '' );
		}
	}, [ isOpen ] );

	const filtered = navItems.filter( ( item ) =>
		item.label.toLowerCase().includes( search.toLowerCase() )
	);

	if ( ! isOpen ) {
		return null;
	}

	return (
		<Modal
			title={ __( 'Search', 'formspress' ) }
			onRequestClose={ onClose }
			size="medium"
		>
			<VStack spacing={ 3 }>
				<TextControl
					placeholder={ __( 'Search pages…', 'formspress' ) }
					value={ search }
					onChange={ setSearch }
					autoFocus
					__nextHasNoMarginBottom
					__next40pxDefaultSize
				/>
				<div className="ff-search-results">
					{ filtered.map( ( item ) => (
						<button
							key={ item.path }
							className="ff-search-result-item"
							onClick={ () => {
								onNavigate( item.path );
								onClose();
							} }
						>
							<span
								className={ `dashicons dashicons-${ item.icon }` }
							/>
							<span>{ item.label }</span>
						</button>
					) ) }
					{ filtered.length === 0 && (
						<p
							style={ {
								color: '#757575',
								textAlign: 'center',
								padding: '16px',
							} }
						>
							{ __( 'No results found.', 'formspress' ) }
						</p>
					) }
				</div>
			</VStack>
		</Modal>
	);
};

export default GlobalSearchModal;
