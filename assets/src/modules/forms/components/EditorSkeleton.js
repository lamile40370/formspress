import { useState } from '@wordpress/element';
import {
	Button,
	DropdownMenu,
	Icon,
	Notice,
	Snackbar,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import {
	undo as undoIcon,
	redo as redoIcon,
	listView,
	desktop as desktopIcon,
	tablet as tabletIcon,
	mobile as mobileIcon,
	external as externalIcon,
	/* `shortcode` (the `[…]` brackets glyph) reads as "embed code"
	 * — much more semantically correct than `share` for the modal
	 * that surfaces the shortcode + block comment + direct URL. */
	shortcode as embedIcon,
	sidebar as sidebarIcon,
	moreVertical,
	check as checkIcon,
} from '@wordpress/icons';
import Logo from '../../../components/Logo';

const PREVIEW_VIEWPORTS = [
	{ id: 'desktop', icon: desktopIcon, label: __( 'Desktop', 'flowforms' ) },
	{ id: 'tablet', icon: tabletIcon, label: __( 'Tablet', 'flowforms' ) },
	{ id: 'mobile', icon: mobileIcon, label: __( 'Mobile', 'flowforms' ) },
];

/* ── Title pill (Gutenberg post-title control) ──────────────────────── */

const TitlePill = ( { value, onChange, placeholder } ) => {
	const [ focused, setFocused ] = useState( false );
	return (
		<div className={ `ff-gb-title-pill${ focused ? ' is-focused' : '' }` }>
			<input
				type="text"
				className="ff-gb-title-pill__input"
				value={ value || '' }
				onChange={ ( e ) => onChange( e.target.value ) }
				onFocus={ () => setFocused( true ) }
				onBlur={ () => setFocused( false ) }
				placeholder={ placeholder }
			/>
			<span className="ff-gb-title-pill__sep" aria-hidden="true" />
			<span className="ff-gb-title-pill__hint" aria-hidden="true">
				⌘K
			</span>
		</div>
	);
};

/* ── EditorSkeleton ─────────────────────────────────────────────────── */
/* Shared editor shell used by both the Flow and Standard form builders.
   Provides the topbar (logo, undo/redo, list-view, title pill, preview,
   share, inspector toggle, save, more menu), the body grid with slots
   for left / center (children) / right sidebars, editor notices,
   snackbars, and an `overlays` slot for full-screen modals / panels. */

const noop = () => {};

const EditorSkeleton = ( {
	/* Required */
	title,
	onTitleChange,
	onClose,
	onSave,
	isSaving = false,
	saveDisabled = false,
	saveLabel, // Primary action label, e.g. "Publish" / "Update"
	saveShortcut = null,
	onSaveDraft = null, // Optional tertiary "Save draft" — Gutenberg-style
	saveDraftShortcut = null,
	isDraftSaving = false,
	isDirty = false, // Drives the "Saved" / "Modifications…" indicator

	/* Title pill */
	titlePlaceholder = __( 'Untitled form', 'flowforms' ),

	/* History */
	canUndo = false,
	canRedo = false,
	onUndo = noop,
	onRedo = noop,

	/* Left sidebar */
	showLeftSidebar = false,
	onToggleLeftSidebar = null,
	leftSidebarLabel = __( 'List view', 'flowforms' ),
	leftSidebarIcon = listView,
	leftSidebar = null,
	/* Optional extra toolbar items rendered after the left-sidebar
	 * toggle (e.g. a second toggle for List View vs Library). */
	topbarLeftExtras = null,
	topbarRightExtras = null,

	/* Right sidebar */
	showRightSidebar = true,
	onToggleRightSidebar = null,
	rightSidebar = null,

	/* Preview */
	onTogglePreview = null,
	previewTooltip = __( 'Preview', 'flowforms' ),
	previewViewport = null,
	onPreviewViewportChange = null,

	/* Share */
	onToggleShare = null,
	isShareActive = false,
	shareTooltip = __( 'Share', 'flowforms' ),

	/* More menu */
	moreMenuControls = null,

	/* Notices */
	notice = null,
	onDismissNotice = noop,

	/* Extra class for the root */
	className = '',

	/* Overlays (preview modal, share panel, save-as-template modal, …) */
	overlays = null,

	/* Children = the canvas (middle slot) */
	children,
} ) => {
	const rootClass = `ff-page ff-gb-builder${
		className ? ` ${ className }` : ''
	}`;
	const isSnackbarNotice = notice && 'success' === notice.type;
	const isEditorNotice = notice && ! isSnackbarNotice;
	const currentViewport =
		PREVIEW_VIEWPORTS.find(
			( viewport ) => viewport.id === previewViewport
		) || PREVIEW_VIEWPORTS[ 0 ];
	const previewControls = onPreviewViewportChange
		? [
				PREVIEW_VIEWPORTS.map( ( viewport ) => ( {
					title: viewport.label,
					icon: viewport.icon,
					role: 'menuitemradio',
					isActive: viewport.id === currentViewport.id,
					onClick: () => onPreviewViewportChange( viewport.id ),
				} ) ),
				...( onTogglePreview
					? [
							[
								{
									title: __(
										'Preview in new tab',
										'flowforms'
									),
									icon: externalIcon,
									onClick: onTogglePreview,
								},
							],
					  ]
					: [] ),
		  ]
		: null;

	return (
		<div className={ rootClass }>
			{ /* ── Topbar ──────────────────────────────────────────── */ }
			<div className="ff-gb-builder__topbar">
				<div className="ff-gb-builder__topbar-left">
					<button
						type="button"
						className="ff-gb-topbar__logo"
						onClick={ onClose }
						aria-label={ __( 'Back to forms', 'flowforms' ) }
					>
						<Logo size={ 36 } />
					</button>
					<Button
						icon={ undoIcon }
						label={ __( 'Undo', 'flowforms' ) }
						disabled={ ! canUndo }
						onClick={ onUndo }
					/>
					<Button
						icon={ redoIcon }
						label={ __( 'Redo', 'flowforms' ) }
						disabled={ ! canRedo }
						onClick={ onRedo }
					/>
					{ onToggleLeftSidebar && (
						<Button
							icon={ leftSidebarIcon }
							label={ leftSidebarLabel }
							isPressed={ showLeftSidebar }
							onClick={ onToggleLeftSidebar }
						/>
					) }
					{ topbarLeftExtras }
				</div>

				<div className="ff-gb-builder__topbar-center">
					<TitlePill
						value={ title }
						onChange={ onTitleChange }
						placeholder={ titlePlaceholder }
					/>
				</div>

				<div className="ff-gb-builder__topbar-right">
					{ /* Saved indicator — mirrors the native post-editor
					     header. Hidden mid-save (the busy button carries
					     the state) and when there's an unsaved diff. */ }
					{ ! isDirty && ! isSaving && ! isDraftSaving && (
						<span className="ff-gb-topbar__saved">
							<Icon icon={ checkIcon } size={ 16 } />
							<span>{ __( 'Saved', 'flowforms' ) }</span>
						</span>
					) }

					{ /* "Save draft" — tertiary, only when the parent
					     opted in (typical on screens with a real
					     draft → publish flow). Matches the native
					     "Enregistrer le brouillon" affordance. */ }
					{ onSaveDraft && (
						<Button
							variant="tertiary"
							onClick={ onSaveDraft }
							isBusy={ isDraftSaving }
							disabled={ isDraftSaving || isSaving || ! isDirty }
							shortcut={ saveDraftShortcut }
						>
							{ __( 'Save draft', 'flowforms' ) }
						</Button>
					) }

					{ topbarRightExtras }

					{ onPreviewViewportChange && (
						<DropdownMenu
							icon={ currentViewport.icon }
							label={ __( 'Preview viewport', 'flowforms' ) }
							controls={ previewControls }
							toggleProps={ {
								isPressed: 'desktop' !== currentViewport.id,
							} }
						/>
					) }
					{ onTogglePreview && ! onPreviewViewportChange && (
						<Button
							icon={ desktopIcon }
							label={ previewTooltip }
							onClick={ onTogglePreview }
						/>
					) }
					{ onToggleShare && (
						<Button
							icon={ embedIcon }
							label={ shareTooltip }
							isPressed={ isShareActive }
							onClick={ onToggleShare }
						/>
					) }
					{ onToggleRightSidebar && (
						<Button
							icon={ sidebarIcon }
							label={ __( 'Toggle settings', 'flowforms' ) }
							isPressed={ showRightSidebar }
							onClick={ onToggleRightSidebar }
						/>
					) }
					{ onSave && (
						<Button
							variant="primary"
							onClick={ onSave }
							isBusy={ isSaving }
							disabled={ isSaving || saveDisabled }
							shortcut={ saveShortcut }
						>
							{ saveLabel || __( 'Save', 'flowforms' ) }
						</Button>
					) }
					{ moreMenuControls && moreMenuControls.length > 0 && (
						<DropdownMenu
							icon={ moreVertical }
							label={ __( 'Options', 'flowforms' ) }
							controls={ moreMenuControls }
						/>
					) }
				</div>
			</div>

			{ /* ── Snackbar: success feedback, matching Gutenberg toasts ─ */ }
			{ isSnackbarNotice && (
				<div
					className={ `ff-gb-snackbar-wrap ff-gb-snackbar-wrap--${ notice.type }` }
				>
					<Snackbar onRemove={ onDismissNotice }>
						{ notice.message }
					</Snackbar>
				</div>
			) }

			{ /* ── Body (left + canvas + right) ────────────────────── */ }
			<div className="ff-gb-builder__body">
				{ showLeftSidebar && leftSidebar }
				<div className="ff-gb-builder__content">
					{ /* Blocking notices live above the canvas, like the native editor. */ }
					{ isEditorNotice && (
						<div className="ff-gb-notice-area">
							<Notice
								status={ notice.type || 'info' }
								isDismissible
								onRemove={ onDismissNotice }
							>
								{ notice.message }
							</Notice>
						</div>
					) }
					{ children }
				</div>
				{ showRightSidebar && rightSidebar }
			</div>

			{ /* ── Overlays (preview modal, share panel, …) ───────── */ }
			{ overlays }
		</div>
	);
};

export default EditorSkeleton;
