import {
	useState,
	useEffect,
	useCallback,
	useRef,
	useMemo,
} from '@wordpress/element';
import { useParams, useNavigate } from 'react-router-dom';
import { Button, KeyboardShortcuts, Spinner } from '@wordpress/components';
import { ShortcutProvider } from '@wordpress/keyboard-shortcuts';
import {
	BlockEditorProvider,
	BlockList,
	BlockTools,
	WritingFlow,
	ObserveTyping,
	BlockBreadcrumb,
	BlockEditorKeyboardShortcuts,
	__unstableEditorStyles as EditorStyles,
	store as blockEditorStore,
} from '@wordpress/block-editor';
import { useDispatch, useSelect } from '@wordpress/data';
import { parse, serialize, createBlock } from '@wordpress/blocks';
import {
	uploadMedia,
	MediaUpload as WPMediaUpload,
} from '@wordpress/media-utils';
import { addFilter } from '@wordpress/hooks';
import { __ } from '@wordpress/i18n';
import { displayShortcut, shortcutAriaLabel } from '@wordpress/keycodes';
import {
	listView as listViewIcon,
	plus as plusIcon,
	send as sendIcon,
} from '@wordpress/icons';

import EditorSkeleton from '../components/EditorSkeleton';
import PageHeader from '../../../components/PageHeader';
import { get, put } from '../../../api/client';
import { form as formEndpoint } from '../../../api/endpoints';

import registerBlocks from './blocks/register';
import { PATTERNS, PATTERN_CATEGORY } from './patterns/register';
import LeftSidebar from './LeftSidebar';
import ListViewPanel from './ListViewPanel';
import RightInspector from './RightInspector';
import EmbedShareModal from '../components/EmbedShareModal';
import FormActionsModal from '../components/FormActionsModal';

import './styles.scss';

/* ── One-shot registration ──────────────────────────────────────────── */
registerBlocks();

addFilter(
	'editor.MediaUpload',
	'formspress/standard-builder-media-upload',
	() => WPMediaUpload
);

const isEditorInteractiveTarget = ( target ) => {
	if ( ! ( target instanceof Element ) ) {
		return false;
	}

	return !! target.closest(
		[
			'a',
			'button',
			'input',
			'select',
			'textarea',
			'[contenteditable="true"]',
			'[role="button"]',
			'[role="menuitem"]',
			'[aria-haspopup="true"]',
			'.components-popover',
			'.components-modal__frame',
			'.block-editor-block-toolbar',
			'.block-editor-block-contextual-toolbar',
			'.block-editor-inserter__popover',
			'.block-editor-rich-text__editable',
		].join( ',' )
	);
};

const CanvasSelectionBoundary = ( { children, className, style } ) => {
	const selectedClientId = useSelect(
		( select ) => select( blockEditorStore ).getSelectedBlockClientId(),
		[]
	);
	const { clearSelectedBlock } = useDispatch( blockEditorStore );

	const handlePointerDownCapture = useCallback(
		( event ) => {
			if (
				! selectedClientId ||
				event.defaultPrevented ||
				event.button !== 0
			) {
				return;
			}

			const target = event.target;
			if ( isEditorInteractiveTarget( target ) ) {
				return;
			}

			const clickedBlock =
				target instanceof Element
					? target.closest( '[data-block]' )
					: null;
			const clickedClientId =
				clickedBlock?.getAttribute( 'data-block' ) || '';

			// Clicking another block should let Gutenberg move the selection
			// normally. Clicking the canvas background, or the non-editable
			// whitespace of the currently selected block, clears it.
			if ( clickedClientId && clickedClientId !== selectedClientId ) {
				return;
			}

			clearSelectedBlock();
			window.getSelection()?.removeAllRanges();
			if (
				document.activeElement instanceof HTMLElement &&
				document.activeElement.closest( '.editor-styles-wrapper' )
			) {
				document.activeElement.blur();
			}
		},
		[ clearSelectedBlock, selectedClientId ]
	);

	return (
		<div
			className={ className }
			style={ style }
			onPointerDownCapture={ handlePointerDownCapture }
		>
			{ children }
		</div>
	);
};

/* ── Legacy schema → block tree (one-time on first load) ────────────── */

const LEGACY_TYPE_MAP = {
	text: 'formspress/field-text',
	email: 'formspress/field-email',
	textarea: 'formspress/field-textarea',
	select: 'formspress/field-select',
	radio: 'formspress/field-radio',
	checkbox: 'formspress/field-checkbox',
	number: 'formspress/field-number',
};

const legacyToBlocks = ( fields ) => {
	if ( ! Array.isArray( fields ) ) return [];
	const out = [];
	const walk = ( list ) => {
		for ( const f of list || [] ) {
			if ( f?.type === 'row' ) {
				for ( const col of f.cols || [] ) walk( col.fields );
				continue;
			}
			const blockName = LEGACY_TYPE_MAP[ f?.type ];
			if ( ! blockName ) continue;
			const attrs = {
				fieldId: f.id || '',
				label: f.label || '',
				required: !! f.required,
				help: f.help || f.description || '',
				placeholder: f.placeholder || '',
				defaultValue: f.defaultValue || f.default || '',
			};
			if ( f.type === 'textarea' && f.rows )
				attrs.rows = Number( f.rows );
			if ( f.type === 'number' ) {
				if ( '' !== f.min && null != f.min )
					attrs.min = Number( f.min );
				if ( '' !== f.max && null != f.max )
					attrs.max = Number( f.max );
				if ( '' !== f.step && null != f.step )
					attrs.step = Number( f.step );
			}
			if ( Array.isArray( f.options ) && f.options.length ) {
				attrs.options = f.options.map( ( o ) =>
					'string' === typeof o
						? { label: o, value: o }
						: {
								label: o.label || '',
								value: o.value || o.label || '',
						  }
				);
			}
			out.push( createBlock( blockName, attrs ) );
		}
	};
	walk( fields );
	return out;
};

const BLOCK_FIELD_TYPES = Object.fromEntries(
	Object.entries( LEGACY_TYPE_MAP ).map( ( [ type, blockName ] ) => [
		blockName,
		type,
	] )
);

const textFromHtml = ( value = '' ) =>
	String( value )
		.replace( /<[^>]*>/g, '' )
		.replace( /&nbsp;/g, ' ' )
		.trim();

const getBlockFieldLabel = ( block ) => {
	if ( block?.attributes?.label ) {
		return block.attributes.label;
	}

	const labelBlock = ( block?.innerBlocks || [] ).find(
		( inner ) =>
			inner?.attributes?.className?.split( /\s+/ ).includes(
				'ff-field-label'
			)
	);

	return textFromHtml( labelBlock?.attributes?.content || '' );
};

const blocksToActionFields = ( blocks ) => {
	const fields = [];
	const walk = ( list ) => {
		for ( const block of list || [] ) {
			const type = BLOCK_FIELD_TYPES[ block?.name ];
			const fieldId = block?.attributes?.fieldId || '';
			if ( type && fieldId ) {
				fields.push( {
					id: fieldId,
					fieldId,
					type,
					label: getBlockFieldLabel( block ) || fieldId,
				} );
			}
			walk( block?.innerBlocks || [] );
		}
	};
	walk( blocks );
	return fields;
};

const blockTreeHas = ( list, predicate ) =>
	( list || [] ).some(
		( block ) =>
			predicate( block ) ||
			blockTreeHas( block.innerBlocks || [], predicate )
	);

const hasSubmitBlock = ( list ) =>
	blockTreeHas(
		list,
		( block ) => block?.name === 'formspress/field-submit'
	);

const validateBeforeSave = ( list ) => {
	if ( ! hasSubmitBlock( list ) ) {
		return __(
			'Add a Submit button block before saving this form.',
			'flowforms'
		);
	}

	return '';
};

const unwrapGeneratedRootGroup = ( inner ) => {
	if ( inner.length !== 1 ) {
		return inner;
	}

	const root = inner[ 0 ];
	if (
		root?.name === 'core/group' &&
		root.attributes?.lock?.move === true &&
		Array.isArray( root.innerBlocks )
	) {
		return root.innerBlocks;
	}

	return inner;
};

const loadBlocksFromForm = ( form ) => {
	let inner;
	if ( form?.is_markup && 'string' === typeof form.fields_markup ) {
		inner = parse( form.fields_markup ).filter( ( b ) => b && b.name );
	} else {
		inner = legacyToBlocks(
			Array.isArray( form?.fields )
				? form.fields
				: form?.fields_schema || []
		);
	}
	return unwrapGeneratedRootGroup( inner );
};

/* ── BlockEditorProvider settings sourced from theme.json ───────────── */

/**
 * Convert a numeric/preset spacing value into a valid CSS length.
 * Accepts `12`, `"12"`, `"1rem"`, `"var(--wp--preset--spacing--20)"` …
 */
const cssLength = ( v ) => {
	if ( null == v || '' === v ) return '';
	if ( 'number' === typeof v ) return `${ v }px`;
	if ( /^[\d.]+$/.test( String( v ) ) ) return `${ v }px`;
	return String( v );
};

/**
 * Build the inline `style` object that maps `form.settings.style.*` →
 * CSS variables on the `.editor-styles-wrapper`. The companion CSS rules
 * (see styles.scss) then style every field block preview from those
 * variables, so tweaking the inspector live-updates the canvas without
 * touching block attributes.
 *
 * Variable names mirror those output by `FormRenderer::build_standard_style`
 * on the PHP side, so the editor preview and the public renderer stay
 * in sync.
 */
const buildFormStyleVars = ( style ) => {
	const out = {};
	if ( ! style ) return out;
	if ( null != style.input_padding_x )
		out[ '--ff-input-px' ] = cssLength( style.input_padding_x );
	if ( null != style.input_padding_y )
		out[ '--ff-input-py' ] = cssLength( style.input_padding_y );
	if ( null != style.field_spacing )
		out[ '--ff-field-spacing' ] = cssLength( style.field_spacing );
	if ( null != style.border_radius )
		out[ '--ff-border-radius' ] = cssLength( style.border_radius );
	if ( null != style.font_size )
		out[ '--ff-font-size' ] = cssLength( style.font_size );
	if ( style.label_color ) out[ '--ff-label-color' ] = style.label_color;
	if ( style.border_color ) out[ '--ff-color-border' ] = style.border_color;
	if ( style.primary_color ) out[ '--ff-primary' ] = style.primary_color;
	if ( style.btn_text_color ) out[ '--ff-btn-text' ] = style.btn_text_color;
	return out;
};

/**
 * Adapter that bridges BlockEditor's `mediaUpload` setting to the
 * `uploadMedia` helper from `@wordpress/media-utils`. BlockEditor passes
 * `{ filesList, onError, onFileChange, allowedTypes, maxUploadFileSize }`;
 * `uploadMedia` expects the same shape.
 */
const mediaUpload = ( { onError, ...rest } ) => {
	uploadMedia( {
		...rest,
		wpAllowedMimeTypes: window.flowFormsData?.allowedMimeTypes || null,
		onError: ( { message } ) => onError?.( message ),
	} );
};

/**
 * Look up a variation's precompiled CSS in `flowFormsData.fseThemeVariations`
 * by slug. Falls back to an empty string if the slug isn't known.
 */
const getVariationCss = ( slug ) => {
	if ( ! slug ) return '';
	const list = window.flowFormsData?.fseThemeVariations || [];
	const found = list.find( ( v ) => v.slug === slug );
	return found?.css || '';
};

const buildEditorSettings = ( variationSlug = '' ) => {
	const d = window.flowFormsData || {};
	// When a variation is picked, swap the canvas stylesheet for that
	// variation's precompiled CSS (computed server-side by
	// `Assets::compile_variation_css()`). Otherwise fall back to the
	// active theme's global stylesheet.
	const baseCss =
		getVariationCss( variationSlug ) || d.themeGlobalStyles || '';
	// Concatenated `inline_style` from every PHP-registered block
	// style variation (`register_block_style()`). The native post
	// editor enqueues these via `wp-block-library-theme`; our admin
	// page doesn't go through that path, so we inject the CSS into
	// the canvas alongside the theme stylesheet. Without this, the
	// Inspector's Styles picker shows the variations but clicking
	// one doesn't visually change anything.
	const variationsCss = d.blockStyleVariationsCss || '';
	return {
		// Lock down what's available so the editor stays form-oriented.
		// Add-ons can extend via the `flowforms_form_editor_allowed_blocks`
		// PHP filter or by overriding this client-side.
		allowedBlockTypes: [
			'formspress/field-text',
			'formspress/field-email',
			'formspress/field-textarea',
			'formspress/field-number',
			'formspress/field-select',
			'formspress/field-radio',
			'formspress/field-checkbox',
			'formspress/field-submit',
			'core/paragraph',
			'core/heading',
			'core/list',
			'core/list-item',
			'core/separator',
			'core/spacer',
			'core/image',
			'core/columns',
			'core/column',
			'core/group',
			/* Cover lets users wrap fields in a hero with background
			 * image / overlay — useful for landing-page-style forms.
			 * Both blocks (cover + its inner image) need to be on the
			 * allowlist for the inserter to surface Cover; image is
			 * already listed above. */
			'core/cover',
			/* Media & Text — common pattern for split-layout forms
			 * (image on one side, fields on the other). */
			'core/media-text',
			'core/buttons',
			'core/button',
			'core/quote',
			'core/html',
		],
		// Theme tokens — populated server-side from the active FSE theme's
		// theme.json (root + variations). Pre-existing helpers in Assets.php.
		colors: d.themePalette || [],
		fontSizes: d.themeFontSizes || [],
		fontFamilies: d.themeFontFamilies || [],
		// Full theme.json — same shape the post editor receives via
		// `wp_get_global_settings()`. Drives the palette/typography/spacing
		// pickers, the alignment options, gradient palette, custom unit
		// preferences, every layout-aware block.
		__experimentalFeatures: d.themeGlobalSettings || {},
		// Theme.json STYLES tree — carries `styles.blocks.<name>.variations`
		// which is what powers the Block Inspector's "Styles" picker for
		// paragraphs / headings / buttons / images. Without this setting,
		// blocks with theme-registered style variations show NO style
		// picker, even though the same theme renders them in the post
		// editor. Same key the native editor reads from.
		__experimentalStyles: d.themeGlobalStylesJson || {},
		// Stylesheet built from `wp_get_global_stylesheet()` — covers
		// variables / styles / presets. Injected into the canvas by the
		// `<EditorStyles>` component (see below). `__unstableType: 'theme'`
		// tells the block editor this is the active theme's global CSS so
		// blocks inherit its tokens automatically.
		styles: [
			baseCss ? { css: baseCss, __unstableType: 'theme' } : null,
			variationsCss
				? { css: variationsCss, __unstableType: 'theme' }
				: null,
		].filter( Boolean ),
		// Block patterns + their category.
		__experimentalBlockPatterns: PATTERNS,
		__experimentalBlockPatternCategories: [ PATTERN_CATEGORY ],
		// Media upload + library. Without `mediaUpload` the native blocks
		// (Image, Group background image, etc.) silently no-op when you
		// click "Add image" because BlockEditor has no callback to handle
		// the upload. `wp_enqueue_media()` PHP-side (Assets.php) makes
		// `wp.media()` available so the picker modal can open.
		mediaUpload,
		__experimentalCanUserUseUnfilteredHTML: false,
		// Block-editor capability flags
		hasFixedToolbar: false,
		focusMode: false,
		alignWide: true,
		disableCustomColors: false,
		disableCustomFontSizes: false,
		// Keep the editor root unlocked. Blank forms should behave like
		// native Gutenberg: no implicit wrapper/group is injected.
	};
};

/* ── Component ──────────────────────────────────────────────────────── */

const StandardBuilder = () => {
	const { id } = useParams();
	const navigate = useNavigate();

	const [ form, setForm ] = useState( null );
	const [ blocks, setBlocks ] = useState( [] );
	const [ actions, setActions ] = useState( [] );
	const [ loading, setLoading ] = useState( true );
	const [ saving, setSaving ] = useState( false );
	const [ draftSaving, setDraftSaving ] = useState( false );
	const [ notice, setNotice ] = useState( null );
	const [ isDirty, setIsDirty ] = useState( false );
	const [ canUndo, setCanUndo ] = useState( false );
	const [ canRedo, setCanRedo ] = useState( false );

	// Left rail has two mutually-exclusive modes: 'library' (native block
	// inserter) or 'listview' (block tree). `null` = collapsed.
	const [ leftMode, setLeftMode ] = useState( 'library' );
	const [ showRight, setShowRight ] = useState( true );
	const [ rightTab, setRightTab ] = useState( 'form' );
	const [ shareOpen, setShareOpen ] = useState( false );
	const [ actionsOpen, setActionsOpen ] = useState( false );
	const [ previewViewport, setPreviewViewport ] = useState( 'desktop' );
	const showLeft = !! leftMode;
	const toggleMode = ( mode ) =>
		setLeftMode( ( prev ) => ( prev === mode ? null : mode ) );

	const hydrated = useRef( false );
	const currentBlocks = useRef( [] );
	const lastPersistentBlocks = useRef( [] );
	const pendingInputSnapshot = useRef( false );
	const undoStack = useRef( [] );
	const redoStack = useRef( [] );
	const hasBlockSelection = useSelect( ( select ) => {
		const editor = select( blockEditorStore );
		return editor.hasSelectedBlock() || editor.hasMultiSelection();
	}, [] );
	const selectedBlockClientId = useSelect(
		( select ) =>
			select( blockEditorStore ).getSelectedBlockClientId() || '',
		[]
	);
	const { clearSelectedBlock } = useDispatch( blockEditorStore );

	const syncHistoryState = useCallback( () => {
		setCanUndo( undoStack.current.length > 0 );
		setCanRedo( redoStack.current.length > 0 );
	}, [] );

	const resetHistory = useCallback(
		( nextBlocks ) => {
			currentBlocks.current = nextBlocks;
			lastPersistentBlocks.current = nextBlocks;
			pendingInputSnapshot.current = false;
			undoStack.current = [];
			redoStack.current = [];
			syncHistoryState();
		},
		[ syncHistoryState ]
	);

	const blocksEqual = ( a, b ) => serialize( a ) === serialize( b );

	useEffect( () => {
		if ( selectedBlockClientId ) {
			setLeftMode( 'listview' );
		}
	}, [ selectedBlockClientId ] );

	useEffect( () => {
		let cancelled = false;
		setLoading( true );
		hydrated.current = false;
		get( formEndpoint( id ) )
			.then( ( res ) => {
				if ( cancelled ) return;
				const data = res?.data || res || {};
				const initialBlocks = loadBlocksFromForm( data );
				setForm( data );
				setBlocks( initialBlocks );
				resetHistory( initialBlocks );
				setActions( Array.isArray( data.actions ) ? data.actions : [] );
				setLoading( false );
				setTimeout( () => {
					hydrated.current = true;
				}, 0 );
			} )
			.catch( () => {
				if ( ! cancelled ) setLoading( false );
			} );
		return () => {
			cancelled = true;
		};
	}, [ id, resetHistory ] );

	const handleBlocksInput = useCallback(
		( next ) => {
			currentBlocks.current = next;
			setBlocks( next );
			if ( hydrated.current ) {
				if (
					! pendingInputSnapshot.current &&
					! blocksEqual( next, lastPersistentBlocks.current )
				) {
					undoStack.current.push( lastPersistentBlocks.current );
					redoStack.current = [];
					pendingInputSnapshot.current = true;
					syncHistoryState();
				}
				setIsDirty( true );
			}
		},
		[ syncHistoryState ]
	);

	const pushPersistentHistory = useCallback(
		( next ) => {
			if ( blocksEqual( next, lastPersistentBlocks.current ) ) {
				pendingInputSnapshot.current = false;
				return false;
			}

			if ( ! pendingInputSnapshot.current ) {
				undoStack.current.push( lastPersistentBlocks.current );
				redoStack.current = [];
			}

			pendingInputSnapshot.current = false;
			lastPersistentBlocks.current = next;
			syncHistoryState();
			return true;
		},
		[ syncHistoryState ]
	);

	const handleBlocksChange = useCallback(
		( next ) => {
			currentBlocks.current = next;
			setBlocks( next );

			if ( hydrated.current && pushPersistentHistory( next ) ) {
				setIsDirty( true );
			}
		},
		[ pushPersistentHistory ]
	);

	const handleUndo = useCallback( () => {
		const previous = undoStack.current.pop();
		if ( ! previous ) return;

		redoStack.current.push( currentBlocks.current );
		pendingInputSnapshot.current = false;
		currentBlocks.current = previous;
		lastPersistentBlocks.current = previous;
		setBlocks( previous );
		setIsDirty( true );
		syncHistoryState();
	}, [ syncHistoryState ] );

	const handleRedo = useCallback( () => {
		const next = redoStack.current.pop();
		if ( ! next ) return;

		undoStack.current.push( currentBlocks.current );
		pendingInputSnapshot.current = false;
		currentBlocks.current = next;
		lastPersistentBlocks.current = next;
		setBlocks( next );
		setIsDirty( true );
		syncHistoryState();
	}, [ syncHistoryState ] );

	const handleFormChange = useCallback( ( next ) => {
		setForm( next );
		if ( hydrated.current ) setIsDirty( true );
	}, [] );

	const handleTitleChange = useCallback( ( title ) => {
		setForm( ( prev ) => ( { ...( prev || {} ), title } ) );
		if ( hydrated.current ) setIsDirty( true );
	}, [] );

	const handleActionsChange = useCallback( ( next ) => {
		setActions( next );
		if ( hydrated.current ) setIsDirty( true );
	}, [] );

	/**
	 * Shared save implementation. The two top-level actions ("Save
	 * draft" and "Publish/Update") just call this with a different
	 * target status:
	 *
	 *   - `draft`  → form is hidden from the front end, used while
	 *                composing. Same status the WP post-editor uses
	 *                under "Save draft".
	 *   - `active` → form is published / accepting submissions.
	 *
	 * `targetStatus = null` means "keep whatever the form currently
	 * has" — used by autosave hooks if we add one later. Today only
	 * the two explicit buttons call save, so the status is always
	 * provided.
	 */
	const performSave = useCallback(
		async ( targetStatus ) => {
			if ( ! form ) return false;
			const blocksToSave = unwrapGeneratedRootGroup(
				currentBlocks.current
			);
			const validationMessage = validateBeforeSave( blocksToSave );
			if ( validationMessage ) {
				setNotice( { type: 'error', message: validationMessage } );
				return false;
			}

			const isDraft = 'draft' === targetStatus;
			( isDraft ? setDraftSaving : setSaving )( true );
			try {
				const markup = serialize( blocksToSave );
				const nextStatus = targetStatus || form.status || 'active';
				await put( formEndpoint( id ), {
					title: form.title || '',
					status: nextStatus,
					description: form.description || '',
					settings: form.settings || {},
					style_variation: form.style_variation || '',
					fields: markup,
					fields_markup: true,
					actions,
				} );
				if ( blocksToSave !== currentBlocks.current ) {
					currentBlocks.current = blocksToSave;
					setBlocks( blocksToSave );
					resetHistory( blocksToSave );
				}
				setForm( ( prev ) =>
					prev ? { ...prev, status: nextStatus } : prev
				);
				setIsDirty( false );
				setNotice( {
					type: 'success',
					message: isDraft
						? __( 'Draft saved.', 'flowforms' )
						: 'active' === form.status
						? __( 'Form updated.', 'flowforms' )
						: __( 'Form published.', 'flowforms' ),
				} );
				return true;
			} catch ( e ) {
				setNotice( {
					type: 'error',
					message: e?.message || __( 'Save failed.', 'flowforms' ),
				} );
				return false;
			} finally {
				( isDraft ? setDraftSaving : setSaving )( false );
			}
		},
		[ form, id, actions, resetHistory ]
	);

	const handleSaveDraft = useCallback(
		() => performSave( 'draft' ),
		[ performSave ]
	);
	const handlePublish = useCallback(
		() => performSave( 'active' ),
		[ performSave ]
	);
	const handleActionsDone = useCallback( async () => {
		const saved = await performSave( null );
		if ( saved ) {
			setActionsOpen( false );
		}
	}, [ performSave ] );
	const handlePreviewInNewTab = useCallback( () => {
		window.open( `/formspress/${ id }/`, '_blank', 'noopener,noreferrer' );
	}, [ id ] );

	const handleUndoShortcut = useCallback(
		( event ) => {
			if ( ! canUndo ) return;
			event.preventDefault();
			handleUndo();
		},
		[ canUndo, handleUndo ]
	);

	const handleRedoShortcut = useCallback(
		( event ) => {
			if ( ! canRedo ) return;
			event.preventDefault();
			handleRedo();
		},
		[ canRedo, handleRedo ]
	);

	const handleSaveShortcut = useCallback(
		( event ) => {
			event.preventDefault();

			if ( saving || draftSaving || ! isDirty ) {
				return;
			}

			if ( 'active' === form?.status ) {
				handlePublish();
				return;
			}

			handleSaveDraft();
		},
		[
			draftSaving,
			form?.status,
			handlePublish,
			handleSaveDraft,
			isDirty,
			saving,
		]
	);

	const handlePublishShortcut = useCallback(
		( event ) => {
			event.preventDefault();

			if ( saving || draftSaving || ! isDirty ) {
				return;
			}

			handlePublish();
		},
		[ draftSaving, handlePublish, isDirty, saving ]
	);

	const handleClearSelectionShortcut = useCallback(
		( event ) => {
			if ( ! hasBlockSelection ) {
				return;
			}

			event.preventDefault();
			clearSelectedBlock();

			if ( document.activeElement instanceof HTMLElement ) {
				document.activeElement.blur();
			}

			window.getSelection()?.removeAllRanges();
		},
		[ clearSelectedBlock, hasBlockSelection ]
	);

	const keyboardShortcuts = useMemo(
		() => ( {
			'mod+z': handleUndoShortcut,
			'mod+shift+z': handleRedoShortcut,
			'mod+y': handleRedoShortcut,
			'mod+s': handleSaveShortcut,
			'mod+shift+s': handlePublishShortcut,
			esc: handleClearSelectionShortcut,
		} ),
		[
			handleClearSelectionShortcut,
			handlePublishShortcut,
			handleRedoShortcut,
			handleSaveShortcut,
			handleUndoShortcut,
		]
	);

	const saveDraftShortcut = useMemo(
		() => ( {
			display: displayShortcut.primary( 's' ),
			ariaLabel: shortcutAriaLabel.primary( 's' ),
		} ),
		[]
	);

	const saveShortcut = useMemo(
		() =>
			'active' === form?.status
				? {
						display: displayShortcut.primary( 's' ),
						ariaLabel: shortcutAriaLabel.primary( 's' ),
				  }
				: {
						display: displayShortcut.primaryShift( 's' ),
						ariaLabel: shortcutAriaLabel.primaryShift( 's' ),
				  },
		[ form?.status ]
	);

	// Re-derives the settings (and the active stylesheet) whenever the
	// user picks a new theme variation, so the canvas updates live.
	const editorSettings = useMemo(
		() => buildEditorSettings( form?.style_variation || '' ),
		[ form?.style_variation ]
	);

	const actionForm = useMemo(
		() =>
			form
				? {
						...form,
						fields: blocksToActionFields( blocks ),
				  }
				: form,
		[ form, blocks ]
	);

	if ( loading ) {
		return (
			<div className="ff-page ff-page--loading">
				<Spinner />
			</div>
		);
	}
	if ( ! form ) {
		return (
			<PageHeader title={ __( 'Form not found', 'flowforms' ) }>
				<div className="ff-page__body">
					<p>{ __( 'Form not found.', 'flowforms' ) }</p>
				</div>
			</PageHeader>
		);
	}

	return (
		<ShortcutProvider>
			{ /* No nested <SlotFillProvider> — App.js already provides one
				 at the root, and nesting creates a separate slot context
				 that breaks WP's inline inserter / dropdown popovers. */ }
			<BlockEditorProvider
				value={ blocks }
				onChange={ handleBlocksChange }
				onInput={ handleBlocksInput }
				settings={ editorSettings }
			>
				<KeyboardShortcuts shortcuts={ keyboardShortcuts } bindGlobal />
				<EditorSkeleton
					className="ff-std-builder"
					title={ form.title }
					onTitleChange={ handleTitleChange }
					onClose={ () => navigate( '/forms' ) }
					/* Primary action: "Publish" for drafts, "Update"
					 * once published — matches the native WP post
					 * editor language. Tertiary "Save draft" surfaces
					 * only while the form is still a draft. */
					onSave={ handlePublish }
					isSaving={ saving }
					saveLabel={
						'active' === form.status
							? __( 'Update', 'flowforms' )
							: __( 'Publish', 'flowforms' )
					}
					saveDisabled={ 'active' === form.status && ! isDirty }
					saveShortcut={ saveShortcut }
					onSaveDraft={
						'active' === form.status ? null : handleSaveDraft
					}
					saveDraftShortcut={ saveDraftShortcut }
					isDraftSaving={ draftSaving }
					isDirty={ isDirty }
					canUndo={ canUndo }
					canRedo={ canRedo }
					onUndo={ handleUndo }
					onRedo={ handleRedo }
					titlePlaceholder={ __( 'Untitled form', 'flowforms' ) }
					/* We render BOTH left toggles ourselves via
						   `topbarLeftExtras` so each button reflects its own
						   mode (library or listview). EditorSkeleton's
						   default toggle is silenced. */
					showLeftSidebar={ showLeft }
					onToggleLeftSidebar={ null }
					leftSidebar={
						'listview' === leftMode ? (
							<ListViewPanel
								onClose={ () => setLeftMode( null ) }
							/>
						) : (
							<LeftSidebar
								onClose={ () => setLeftMode( null ) }
							/>
						)
					}
					topbarLeftExtras={
						<>
							<Button
								icon={ plusIcon }
								label={ __( 'Block library', 'flowforms' ) }
								isPressed={ 'library' === leftMode }
								onClick={ () => toggleMode( 'library' ) }
							/>
							<Button
								icon={ listViewIcon }
								label={ __( 'List view', 'flowforms' ) }
								isPressed={ 'listview' === leftMode }
								onClick={ () => toggleMode( 'listview' ) }
							/>
						</>
					}
					showRightSidebar={ showRight }
					onToggleRightSidebar={ () => setShowRight( ( v ) => ! v ) }
					topbarRightExtras={
						<Button
							icon={ sendIcon }
							isPressed={ actionsOpen || actions.length > 0 }
							className="ff-gb-topbar__actions-button"
							label={
								actions.length
									? `${ __(
											'Form actions',
											'flowforms'
									  ) } (${ actions.length })`
									: __( 'Form actions', 'flowforms' )
							}
							onClick={ () => setActionsOpen( true ) }
						>
							{ __( 'Actions', 'flowforms' ) }
							{ actions.length > 0 && (
								<span className="ff-gb-topbar__actions-badge">
									{ actions.length }
								</span>
							) }
						</Button>
					}
					previewViewport={ previewViewport }
					onPreviewViewportChange={ setPreviewViewport }
					onTogglePreview={ handlePreviewInNewTab }
					previewTooltip={ __( 'Preview in new tab', 'flowforms' ) }
					rightSidebar={
						<RightInspector
							activeTab={ rightTab }
							onTabChange={ setRightTab }
							onClose={ () => setShowRight( false ) }
							form={ form }
							onFormChange={ handleFormChange }
						/>
					}
					/* Share / Embed — surfaces the shortcode, the
					 * Gutenberg block comment, and the direct URL
					 * so users can drop the form into ANY context
					 * (Gutenberg, classic editor, page builders). */
					onToggleShare={ () => setShareOpen( ( v ) => ! v ) }
					isShareActive={ shareOpen }
					shareTooltip={ __( 'Embed / share', 'flowforms' ) }
					overlays={
						<>
							{ shareOpen && (
								<EmbedShareModal
									form={ form }
									onClose={ () => setShareOpen( false ) }
								/>
							) }
							{ actionsOpen && (
								<FormActionsModal
									form={ actionForm }
									actions={ actions }
									onChange={ handleActionsChange }
									onDone={ handleActionsDone }
									isSaving={ saving || draftSaving }
									onClose={ () => setActionsOpen( false ) }
								/>
							) }
						</>
					}
					notice={ notice }
					onDismissNotice={ () => setNotice( null ) }
				>
					<div
						className={ `ff-std-canvas ff-std-canvas--${ previewViewport }` }
					>
						{ /* Injects the FSE theme.json stylesheet (palette
								 variables, presets, typography, spacing, layout)
								 into the canvas, SCOPED to `.editor-styles-wrapper`
								 so the variation only restyles the form preview
								 — not the sidebars / inspector / library / chrome.
								 Without `scope`, `:root` and `body` rules from the
								 theme would leak into the whole admin UI. */ }
						<EditorStyles
							styles={ editorSettings.styles }
							scope=".editor-styles-wrapper"
						/>
						{ /* Scrollable area — the canvas root stays
								 `overflow: hidden` so the breadcrumb strip
								 below is pinned at the bottom regardless of
								 how long the form is. */ }
						<div className="ff-std-canvas__scroll">
							<BlockTools>
								{ /* Registers Cmd+Z/Y, slash command, Cmd+A,
										 Enter to break, arrow nav between blocks
										 — without this the canvas is mostly inert. */ }
								<BlockEditorKeyboardShortcuts.Register />
								<WritingFlow>
									<ObserveTyping>
										<CanvasSelectionBoundary
											className="editor-styles-wrapper"
											style={ buildFormStyleVars(
												form?.settings?.style
											) }
										>
											<BlockList />
										</CanvasSelectionBoundary>
									</ObserveTyping>
								</WritingFlow>
							</BlockTools>
						</div>
						<div className="ff-std-canvas__breadcrumb">
							<BlockBreadcrumb
								rootLabelText={ __( 'Form', 'flowforms' ) }
							/>
						</div>
					</div>
				</EditorSkeleton>
			</BlockEditorProvider>
			{ /* No `<Popover.Slot>` — `@wordpress/components`'s
				     `<Popover>` creates a body-level fallback container
				     (`.components-popover__fallback-container`, z-index
				     1000000) on its own, which is what every core editor
				     (`edit-post`, `editor`) relies on. A custom
				     Popover.Slot here would have to live as a React
				     ancestor of every Popover usage; placing one as a
				     sibling silently prevented the inline block
				     inserter's Dropdown popover from rendering. */ }
		</ShortcutProvider>
	);
};

export default StandardBuilder;
