import { __experimentalListView as ListView } from '@wordpress/block-editor';
import { Button } from '@wordpress/components';
import { closeSmall } from '@wordpress/icons';
import { __ } from '@wordpress/i18n';

/**
 * Left rail in "list view" mode — renders the native ListView component
 * which shows the block tree (same component the post editor uses for
 * its Document Overview drawer).
 */
const ListViewPanel = ( { onClose } ) => (
	<aside className="ff-gb-treeview ff-std-treeview ff-std-treeview--narrow">
		<div className="ff-std-treeview__head">
			<h2 className="ff-std-treeview__title">
				{ __( 'List view', 'formspress' ) }
			</h2>
			{ onClose && (
				<Button
					icon={ closeSmall }
					label={ __( 'Close list view', 'formspress' ) }
					onClick={ onClose }
				/>
			) }
		</div>
		<div className="ff-std-treeview__listview">
			<ListView />
		</div>
	</aside>
);

export default ListViewPanel;
