import { useState, useEffect } from '@wordpress/element';
import { useLocation, useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import MobileHeader from './MobileHeader';
import GlobalSearchModal from './GlobalSearchModal';

const AdminLayout = ( { children } ) => {
	const location = useLocation();
	const navigate = useNavigate();
	const [ sidebarOpen, setSidebarOpen ] = useState( false );
	const [ isSearchOpen, setIsSearchOpen ] = useState( false );

	const navItems = window.flowFormsData?.navItems || [];

	useEffect( () => {
		setSidebarOpen( false );
	}, [ location.pathname ] );

	useEffect( () => {
		document.body.style.overflow = sidebarOpen ? 'hidden' : '';
		return () => {
			document.body.style.overflow = '';
		};
	}, [ sidebarOpen ] );

	useEffect( () => {
		const onKeyDown = ( e ) => {
			if ( ( e.metaKey || e.ctrlKey ) && e.key.toLowerCase() === 'k' ) {
				const tag = e.target?.tagName?.toLowerCase();
				if (
					e.target?.isContentEditable ||
					[ 'input', 'textarea', 'select' ].includes( tag )
				)
					return;
				e.preventDefault();
				setSidebarOpen( false );
				setIsSearchOpen( true );
			}
		};
		window.addEventListener( 'keydown', onKeyDown );
		return () => window.removeEventListener( 'keydown', onKeyDown );
	}, [] );

	const handleNavigate = ( path ) => {
		navigate( path );
		setSidebarOpen( false );
		setIsSearchOpen( false );
	};

	return (
		<div className="ff-admin ff-admin--fse">
			<Sidebar
				navItems={ navItems }
				currentPath={ location.pathname }
				onNavigate={ handleNavigate }
				isOpen={ sidebarOpen }
				onOpenSearch={ () => {
					setSidebarOpen( false );
					setIsSearchOpen( true );
				} }
				onClose={ () => setSidebarOpen( false ) }
			/>

			{ sidebarOpen && (
				<div
					className="ff-sidebar-overlay"
					onClick={ () => setSidebarOpen( false ) }
					role="presentation"
				/>
			) }

			<MobileHeader onOpen={ () => setSidebarOpen( true ) } />

			<main className="ff-main">
				<div className="ff-content">{ children }</div>
			</main>

			<GlobalSearchModal
				isOpen={ isSearchOpen }
				onClose={ () => setIsSearchOpen( false ) }
				onNavigate={ handleNavigate }
			/>
		</div>
	);
};

export default AdminLayout;
