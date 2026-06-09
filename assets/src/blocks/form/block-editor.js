/**
 * Editor script for `formspress/form` — block.json registers this file
 * as `editorScript`. `apiVersion: 3` means `useBlockProps` handles
 * wrapper attributes.
 *
 * Editor preview strategy
 * -----------------------
 * The form builder is Gutenberg-iso, so the embedding block shows the
 * EXACT same block tree as the form editor — locked.
 *
 * To get the tree visible in the host editor's List View (and not just
 * as an opaque iframe), we use `<InnerBlocks templateLock="all">` and
 * push the parsed blocks in via `replaceInnerBlocks()`. Because the
 * block is dynamic (`render` callback in PHP, `save: () => null`),
 * the inner blocks are NOT persisted to the host page's content — the
 * authoritative source stays the form ID, so re-opening the page
 * re-loads the inner blocks fresh from the form record.
 *
 * Same pattern Gutenberg's `core/block` (Reusable / Pattern) uses.
 *
 * Net effect:
 *   - List View shows the full block tree (root group → fields → submit).
 *   - Theme.json + block-editor styles apply natively (no iframe).
 *   - Everything is locked — `templateLock: 'all'` blocks adds, moves,
 *     and removes; users edit the form in the form builder, not here.
 *   - Save returns null, so the host page doesn't bloat with stale form
 *     markup; the form is always sourced from its `formId`.
 */
import { registerBlockType, parse } from '@wordpress/blocks';
import { useState, useEffect, useMemo, useRef } from '@wordpress/element';
import {
	useBlockProps,
	useInnerBlocksProps,
	InspectorControls,
	BlockControls,
	store as blockEditorStore,
} from '@wordpress/block-editor';
import { useDispatch, useSelect } from '@wordpress/data';
import {
	PanelBody,
	SelectControl,
	ToggleControl,
	Spinner,
	Placeholder,
	ToolbarGroup,
	ToolbarButton,
	Button,
	ExternalLink,
	__experimentalVStack as VStack,
} from '@wordpress/components';
import { pencil as editIcon } from '@wordpress/icons';
import { __ } from '@wordpress/i18n';
import apiFetch from '@wordpress/api-fetch';

import registerFormFieldBlocks from '../../modules/forms/standard-builder/blocks/register';

/* Block name kept in sync with blocks/form/block.json. */
const BLOCK_NAME = 'formspress/form';

/* ── One-shot registration ─────────────────────────────────────────
 * Register the standard-builder field blocks in the host post editor
 * so `parse()` resolves them and the inner BlockList can render their
 * `edit()` components. Idempotent — no-op if already registered. */
registerFormFieldBlocks();

/* ── Module-level form-list cache ─────────────────────────────────── */
let formsCache = null;
const subscribers = new Set();

function fetchForms() {
	if ( formsCache ) return Promise.resolve( formsCache );
	const ns =
		( window.flowFormsEditorData &&
			window.flowFormsEditorData.apiNamespace ) ||
		'flowforms/v1';
	return apiFetch( { path: `/${ ns }/forms?per_page=100` } )
		.then( ( res ) => {
			formsCache = res?.data || [];
			subscribers.forEach( ( fn ) => fn( formsCache ) );
			return formsCache;
		} )
		.catch( () => {
			formsCache = [];
			return formsCache;
		} );
}

function useForms() {
	const [ forms, setForms ] = useState( formsCache || [] );
	const [ isLoading, setLoading ] = useState( ! formsCache );

	useEffect( () => {
		let active = true;
		fetchForms().then( ( list ) => {
			if ( ! active ) return;
			setForms( list );
			setLoading( false );
		} );
		const cb = ( list ) => active && setForms( list );
		subscribers.add( cb );
		return () => {
			active = false;
			subscribers.delete( cb );
		};
	}, [] );

	return { forms, isLoading };
}

/* ── Per-form-detail cache ────────────────────────────────────────── */
const formDetailCache = new Map();

function useFormDetail( formId ) {
	const [ detail, setDetail ] = useState(
		() => formDetailCache.get( formId ) || null
	);
	const [ loading, setLoading ] = useState(
		!! formId && ! formDetailCache.has( formId )
	);

	useEffect( () => {
		if ( ! formId ) {
			setDetail( null );
			setLoading( false );
			return;
		}
		if ( formDetailCache.has( formId ) ) {
			setDetail( formDetailCache.get( formId ) );
			setLoading( false );
			return;
		}
		let active = true;
		setLoading( true );
		const ns =
			( window.flowFormsEditorData &&
				window.flowFormsEditorData.apiNamespace ) ||
			'flowforms/v1';
		apiFetch( { path: `/${ ns }/forms/${ formId }` } )
			.then( ( res ) => {
				if ( ! active ) return;
				const data = res?.data || null;
				if ( data ) formDetailCache.set( formId, data );
				setDetail( data );
			} )
			.catch( () => active && setDetail( null ) )
			.finally( () => active && setLoading( false ) );
		return () => {
			active = false;
		};
	}, [ formId ] );

	return { detail, loading };
}

/**
 * Build a direct admin URL to the form builder for a given form ID.
 *
 * The form builder is a SPA mounted on `admin.php?page=flowforms` and
 * uses hash-based routing — so `…#/forms/{id}/edit` lands the user on
 * the builder screen for that form.
 *
 * `adminUrl` (e.g. `https://site.test/wp-admin/`) is exposed via
 * `wp_localize_script` in Assets.php → `flowFormsEditorData.adminUrl`.
 */
function getFormEditUrl( formId ) {
	if ( ! formId ) return '';
	const adminUrl =
		( window.flowFormsEditorData && window.flowFormsEditorData.adminUrl ) ||
		'/wp-admin/';
	return `${ adminUrl }admin.php?page=flowforms#/forms/${ formId }/edit`;
}

function Edit( { attributes, setAttributes, clientId } ) {
	const { formId, displayTitle, displayDescription } = attributes;
	const blockProps = useBlockProps( { className: 'ff-form-block' } );
	const { forms, isLoading } = useForms();
	const { detail, loading: detailLoading } = useFormDetail( formId );

	const editUrl = getFormEditUrl( formId );

	const { replaceInnerBlocks } = useDispatch( blockEditorStore );
	const { __unstableMarkNextChangeAsNotPersistent } =
		useDispatch( blockEditorStore );

	/* Track which form-id is currently hydrated into the inner block
	 * tree so we don't rehydrate on every render (would wipe focus,
	 * trigger phantom dirty-state). */
	const hydratedFormId = useRef( null );

	const formOptions = useMemo(
		() => [
			{ value: 0, label: __( '— Choose a form —', 'formspress' ) },
			...forms
				.filter( ( f ) => f.type !== 'flow' )
				.map( ( f ) => ( { value: f.id, label: f.title } ) ),
		],
		[ forms ]
	);

	/**
	 * Hydrate the inner block tree from the form's saved markup.
	 *
	 * We mark the change as "not persistent" so it doesn't dirty the
	 * post or push an undo step — the inner blocks are derived state,
	 * not user input.
	 */
	useEffect( () => {
		if ( ! formId || ! detail ) return;
		if ( hydratedFormId.current === formId ) return;
		if ( ! detail.is_markup || ! detail.fields_markup ) {
			// Legacy schema-only form — flush any leftover inner
			// blocks so we cleanly show the placeholder fallback.
			if (
				typeof __unstableMarkNextChangeAsNotPersistent === 'function'
			) {
				__unstableMarkNextChangeAsNotPersistent();
			}
			replaceInnerBlocks( clientId, [] );
			hydratedFormId.current = formId;
			return;
		}
		const parsed = parse( detail.fields_markup ).filter(
			( b ) => b && b.name
		);
		if ( typeof __unstableMarkNextChangeAsNotPersistent === 'function' ) {
			__unstableMarkNextChangeAsNotPersistent();
		}
		replaceInnerBlocks( clientId, parsed );
		hydratedFormId.current = formId;
	}, [
		formId,
		detail,
		clientId,
		replaceInnerBlocks,
		__unstableMarkNextChangeAsNotPersistent,
	] );

	/* Inner-block props: lock the entire subtree (no add / move /
	 * remove / edit), no appender. The tree is treated as a live
	 * read-only mirror of the form. */
	const innerBlocksProps = useInnerBlocksProps( blockProps, {
		templateLock: 'all',
		renderAppender: false,
	} );

	const hasInner = useSelect(
		( select ) =>
			select( blockEditorStore ).getBlockOrder( clientId ).length > 0,
		[ clientId ]
	);

	return (
		<>
			{ /* Block toolbar — surfaces the "Edit form" shortcut next
			   to the standard transform/move handles so a user can jump
			   to the form builder in one click. Opens in a new tab so
			   the host page's draft state is preserved. */ }
			{ !! formId && (
				<BlockControls>
					<ToolbarGroup>
						<ToolbarButton
							icon={ editIcon }
							label={ __( 'Edit form', 'formspress' ) }
							href={ editUrl }
							target="_blank"
							rel="noopener noreferrer"
						/>
					</ToolbarGroup>
				</BlockControls>
			) }

			<InspectorControls>
				<PanelBody title={ __( 'Form', 'formspress' ) }>
					<VStack spacing={ 3 }>
						{ isLoading ? (
							<Spinner />
						) : (
							<SelectControl
								label={ __( 'Choose a form…', 'formspress' ) }
								value={ formId }
								options={ formOptions }
								onChange={ ( v ) => {
									// New form selected — drop the hydration
									// marker so the effect re-runs.
									hydratedFormId.current = null;
									setAttributes( {
										formId: parseInt( v, 10 ) || 0,
									} );
								} }
								__nextHasNoMarginBottom
								__next40pxDefaultSize
							/>
						) }

						{ /* Direct link to the form builder. Two pieces:
						     a prominent secondary button (primary action
						     here), plus a small `ExternalLink` underneath
						     that doubles as the disclosure for "where am
						     I being taken" — same affordance as the
						     core/template-part block's "Edit" UX. */ }
						{ !! formId && (
							<VStack spacing={ 2 }>
								<Button
									variant="secondary"
									__next40pxDefaultSize
									icon={ editIcon }
									href={ editUrl }
									target="_blank"
									rel="noopener noreferrer"
								>
									{ __(
										'Edit form in builder',
										'formspress'
									) }
								</Button>
								<ExternalLink href={ editUrl }>
									{ __( 'Opens in a new tab', 'formspress' ) }
								</ExternalLink>
							</VStack>
						) }

						<ToggleControl
							label={ __( 'Display title', 'formspress' ) }
							checked={ !! displayTitle }
							onChange={ ( v ) =>
								setAttributes( { displayTitle: v } )
							}
							__nextHasNoMarginBottom
						/>
						<ToggleControl
							label={ __( 'Display description', 'formspress' ) }
							checked={ !! displayDescription }
							onChange={ ( v ) =>
								setAttributes( { displayDescription: v } )
							}
							__nextHasNoMarginBottom
						/>
					</VStack>
				</PanelBody>
			</InspectorControls>

			{ ! formId ? (
				<div { ...blockProps }>
					<Placeholder
						icon="feedback"
						label={ __( 'FormsPress Form', 'formspress' ) }
						instructions={ __(
							'Choose a form in the block sidebar.',
							'formspress'
						) }
					/>
				</div>
			) : detailLoading && ! hasInner ? (
				<div { ...blockProps }>
					<Placeholder
						icon="feedback"
						label={ __( 'Loading form…', 'formspress' ) }
					>
						<Spinner />
					</Placeholder>
				</div>
			) : detail && ! detail.is_markup ? (
				/* Legacy schema-only form — no markup to parse. */
				<div { ...blockProps }>
					<Placeholder
						icon="feedback"
						label={
							detail?.title ||
							__( 'FormsPress Form', 'formspress' )
						}
						instructions={ __(
							'This form was saved with the legacy builder — open it in the form editor and save again to enable the live block tree.',
							'formspress'
						) }
					/>
				</div>
			) : (
				/* Live block tree (locked) — visible in the host
				 * editor's List View, edited only through the form
				 * builder. Not persisted to the page because the
				 * block's `save()` returns null (dynamic render). */
				<div { ...innerBlocksProps } />
			) }
		</>
	);
}

registerBlockType( BLOCK_NAME, {
	edit: Edit,
	save: () => null,
} );
