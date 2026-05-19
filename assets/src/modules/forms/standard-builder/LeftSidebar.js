import { __experimentalLibrary as Library } from '@wordpress/block-editor';

/**
 * Left rail — native Gutenberg block library (Blocs / Compositions /
 * Médias tabs).
 */
const LeftSidebar = ( { onClose } ) => {
	return (
		<aside className="ff-gb-treeview ff-std-treeview">
			<div className="ff-std-treeview__library">
				<Library
					showInserterHelpPanel={ false }
					shouldFocusBlock={ false }
				/>
			</div>
		</aside>
	);
};

export default LeftSidebar;
