import { useEffect, useRef, useMemo } from '@wordpress/element';
import { TabPanel } from '@wordpress/components';
import {
	BlockInspector,
	store as blockEditorStore,
	privateApis as blockEditorPrivateApis,
} from '@wordpress/block-editor';
import { useSelect } from '@wordpress/data';
import { __ } from '@wordpress/i18n';

import { getLockUnlock } from '../../../lib/wp-private';
import FormSettings from './FormSettings';
import StyleVariationsBrowser from './StyleVariationsBrowser';

/**
 * Right inspector — uses Gutenberg's native `TabbedSidebar` (private
 * API of `@wordpress/block-editor`) so the tab bar is pixel-identical
 * to the post-editor sidebar. We fall back to the public `TabPanel`
 * when the private opt-in fails (very old WordPress versions); both
 * paths use the same controlled `activeTab` state.
 *
 * Behaviour:
 * - `selectedTab` is fully controlled by the parent.
 * - When the user selects a block in the canvas, we flip to "Block"
 *   so the inspector reflects what they just clicked.
 * - `onClose` collapses the inspector via the parent's right-sidebar
 *   toggle.
 */
const TABS = [
	{ name: 'form', title: __( 'Form', 'flowforms' ) },
	{ name: 'block', title: __( 'Block', 'flowforms' ) },
	{ name: 'theme', title: __( 'Theme', 'flowforms' ) },
];

// Attempt the private-API unlock once, at module load.
const lockUnlock = getLockUnlock();
let NativeTabbedSidebar = null;
if ( lockUnlock ) {
	try {
		NativeTabbedSidebar =
			lockUnlock.unlock( blockEditorPrivateApis ).TabbedSidebar || null;
	} catch ( e ) {
		NativeTabbedSidebar = null;
	}
}

const RightInspector = ( {
	activeTab,
	onTabChange,
	onClose,
	form,
	onFormChange,
} ) => {
	// Watch canvas selection — auto-flip to "Block" so the inspector
	// reflects what the user just clicked, mirroring the post editor.
	const selectedBlockClientId = useSelect(
		( select ) => select( blockEditorStore ).getSelectedBlockClientId(),
		[]
	);
	const prevSelected = useRef( null );
	useEffect( () => {
		if (
			selectedBlockClientId &&
			selectedBlockClientId !== prevSelected.current
		) {
			onTabChange( 'block' );
		}
		prevSelected.current = selectedBlockClientId;
	}, [ selectedBlockClientId, onTabChange ] );

	const panelFor = ( name ) => {
		if ( 'form' === name ) {
			return <FormSettings form={ form } onChange={ onFormChange } />;
		}
		if ( 'theme' === name ) {
			return (
				<div style={ { padding: 16 } }>
					<StyleVariationsBrowser
						value={ form?.style_variation || '' }
						onChange={ ( v ) =>
							onFormChange( { ...form, style_variation: v } )
						}
					/>
				</div>
			);
		}
		return <BlockInspector />;
	};

	const tabs = useMemo(
		() => TABS.map( ( t ) => ( { ...t, panel: panelFor( t.name ) } ) ),
		// eslint-disable-next-line react-hooks/exhaustive-deps
		[ form ]
	);

	// Native path — pixel-identical to the post editor sidebar.
	if ( NativeTabbedSidebar ) {
		return (
			<aside className="ff-gb-inspector">
				<NativeTabbedSidebar
					tabs={ tabs }
					selectedTab={ activeTab }
					onSelect={ onTabChange }
					onClose={ onClose || ( () => {} ) }
					closeButtonLabel={ __( 'Close settings', 'flowforms' ) }
				/>
			</aside>
		);
	}

	// Public-API fallback — same visuals via `<TabPanel>` (uncontrolled,
	// so we force a remount with `key` when `activeTab` changes
	// externally).
	return (
		<aside className="ff-gb-inspector">
			<TabPanel
				className="ff-gb-inspector__tabs"
				key={ activeTab }
				initialTabName={ activeTab }
				onSelect={ onTabChange }
				tabs={ TABS }
			>
				{ ( tab ) => panelFor( tab.name ) }
			</TabPanel>
		</aside>
	);
};

export default RightInspector;
