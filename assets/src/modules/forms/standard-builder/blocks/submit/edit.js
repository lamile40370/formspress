import { useEffect } from '@wordpress/element';
import { useSelect, useDispatch } from '@wordpress/data';
import {
	useBlockProps,
	useInnerBlocksProps,
	store as blockEditorStore,
} from '@wordpress/block-editor';
import { createBlock } from '@wordpress/blocks';
import { __ } from '@wordpress/i18n';

/**
 * The submit block is a thin semantic wrapper around a single native
 * `core/button`. The inner button owns ALL styling (color, typography,
 * border, shadow, padding, hover state…) and inherits theme.json tokens
 * automatically.
 *
 * Clicking the wrapper transparently re-selects the inner button so
 * the user always lands on the native button inspector — no extra clicks
 * to drill into the right level.
 *
 * The inner button is locked to a single button (no add / remove / move)
 * via `templateLock: 'all'`. FormRenderer reads it at render time and
 * emits `<button type="submit">…</button>` with the saved styling.
 */
const SUBMIT_TEMPLATE = [
	[
		'core/buttons',
		{
			layout: { type: 'flex', justifyContent: 'left' },
			lock: { remove: true, move: true },
		},
		[
			[
				'core/button',
				{
					text: __( 'Submit', 'formspress' ),
					tagName: 'button',
					type: 'submit',
					lock: { remove: true, move: true },
				},
			],
		],
	],
];

const Edit = ( { clientId, isSelected } ) => {
	const blockProps = useBlockProps( {
		className: 'formspress-submit-wrapper',
	} );

	const innerBlocksProps = useInnerBlocksProps( blockProps, {
		template: SUBMIT_TEMPLATE,
		templateLock: 'all',
		allowedBlocks: [ 'core/buttons' ],
		renderAppender: false,
	} );

	const { firstChild, firstChildId } = useSelect(
		( select ) => {
			const editor = select( blockEditorStore );
			const childId = editor.getBlockOrder( clientId )[ 0 ] || '';
			return {
				firstChildId: childId,
				firstChild: childId ? editor.getBlock( childId ) : null,
			};
		},
		[ clientId ]
	);

	const { replaceInnerBlocks, selectBlock } = useDispatch( blockEditorStore );

	// Older FormsPress submit blocks stored `core/button` directly. Wrap
	// it in native `core/buttons` so Gutenberg exposes justification
	// controls (left / center / right) without losing the existing button
	// styling.
	useEffect( () => {
		if ( firstChild?.name !== 'core/button' ) {
			return;
		}

		const migratedButton = createBlock(
			'core/button',
			firstChild.attributes || {},
			firstChild.innerBlocks || []
		);
		const buttons = createBlock(
			'core/buttons',
			{
				layout: { type: 'flex', justifyContent: 'left' },
				lock: { remove: true, move: true },
			},
			[ migratedButton ]
		);

		replaceInnerBlocks( clientId, [ buttons ], false );
	}, [ clientId, firstChild, replaceInnerBlocks ] );

	// Forward selection from the semantic submit wrapper to the native
	// Buttons container. That is where Gutenberg exposes the justification
	// toolbar; selecting the inner Button still exposes visual styling.
	useEffect( () => {
		if ( isSelected && firstChildId ) {
			selectBlock( firstChildId );
		}
	}, [ isSelected, firstChildId, selectBlock ] );

	return <div { ...innerBlocksProps } />;
};

export default Edit;
