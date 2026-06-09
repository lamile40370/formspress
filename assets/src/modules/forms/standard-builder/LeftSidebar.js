import { __experimentalLibrary as Library } from '@wordpress/block-editor';
import { useEffect, useRef } from '@wordpress/element';

/**
 * Left rail — native Gutenberg block library scoped to standard forms.
 */
const LeftSidebar = ( { onClose } ) => {
	const libraryRef = useRef( null );

	useEffect( () => {
		const root = libraryRef.current;
		if ( ! root ) {
			return undefined;
		}

		const selectBlocksTab = () => {
			const tabs = root.querySelectorAll(
				'.block-editor-tabbed-sidebar__tab'
			);
			const blocksTab = tabs[ 0 ];

			if (
				blocksTab &&
				'true' !== blocksTab.getAttribute( 'aria-selected' )
			) {
				blocksTab.click();
			}
		};

		selectBlocksTab();

		const observer = new MutationObserver( selectBlocksTab );
		observer.observe( root, { childList: true, subtree: true } );

		return () => observer.disconnect();
	}, [] );

	return (
		<aside className="ff-gb-treeview ff-std-treeview">
			<div ref={ libraryRef } className="ff-std-treeview__library">
				<Library
					showInserterHelpPanel={ false }
					shouldFocusBlock={ false }
					__experimentalInitialTab="blocks"
					onClose={ onClose }
				/>
			</div>
		</aside>
	);
};

export default LeftSidebar;
