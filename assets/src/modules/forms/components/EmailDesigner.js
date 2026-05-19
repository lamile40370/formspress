import {
	useState,
	useEffect,
	useRef,
	useMemo,
	useCallback,
	useId,
} from '@wordpress/element';
import {
	Button,
	SelectControl,
	TextControl,
	Card,
	CardBody,
	Modal,
	Notice,
	__experimentalToggleGroupControl as ToggleGroupControl,
	__experimentalToggleGroupControlOption as ToggleGroupControlOption,
	__experimentalVStack as VStack,
	__experimentalHStack as HStack,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { get, post } from '../../../api/client';

const TEMPLATES_ENDPOINT = '/email-templates';

/**
 * Returns the merge tags available for a given form: form-level, site-level,
 * and one tag per field (both {field:id} and {label:id}).
 */
const useMergeTags = ( form ) =>
	useMemo( () => {
		const tags = [
			{ value: '{form_title}', label: __( 'Form title', 'flowforms' ) },
			{ value: '{entry_id}', label: __( 'Entry ID', 'flowforms' ) },
			{ value: '{entry_date}', label: __( 'Entry date', 'flowforms' ) },
			{ value: '{site_name}', label: __( 'Site name', 'flowforms' ) },
			{ value: '{site_url}', label: __( 'Site URL', 'flowforms' ) },
		];

		const collect = ( arr ) => {
			arr.forEach( ( f ) => {
				if ( f.fields ) {
					collect( f.fields );
					return;
				}
				if ( f.columns ) {
					f.columns.forEach( ( c ) => collect( c.fields || [] ) );
					return;
				}
				if ( f.id ) {
					tags.push( {
						value: `{field:${ f.id }}`,
						label: `${ f.label || f.id } (value)`,
					} );
					tags.push( {
						value: `{label:${ f.id }}`,
						label: `${ f.label || f.id } (label)`,
					} );
				}
			} );
		};

		collect( form?.fields || [] );
		return tags;
	}, [ form ] );

/**
 * Substitute merge tags + `[entry_table]` placeholder with sample content
 * so the preview reflects what subscribers will see.
 */
const renderPreview = ( body, mergeTags, form ) => {
	let html = body || '';

	const sampleTable =
		`<table style="border-collapse:collapse;width:100%">` +
		( form?.fields || [] )
			.filter( ( f ) => f.id )
			.map(
				( f ) =>
					`<tr><td style="padding:8px;border:1px solid #ddd;font-weight:bold;width:30%">${
						f.label || f.id
					}</td>` +
					`<td style="padding:8px;border:1px solid #ddd">${ __(
						'Sample value',
						'flowforms'
					) }</td></tr>`
			)
			.join( '' ) +
		`</table>`;

	html = html.split( '[entry_table]' ).join( sampleTable );
	mergeTags.forEach( ( t ) => {
		html = html.split( t.value ).join( t.label );
	} );
	return html;
};

/**
 * Thin React wrapper around WordPress's TinyMCE editor (the same one
 * powering the classic post editor). Mounts on a stable `id`, listens
 * for content changes via TinyMCE's own event bus, and syncs external
 * value resets (e.g. "Load template") back into the editor via
 * `setContent()`.
 *
 * We rely on the global `wp.editor` (enqueued by `wp_enqueue_editor()`
 * server-side, see `Assets.php`). On older WP installs where this is
 * missing, we degrade to a plain textarea + Notice — never crash.
 */
const TinyMceEditor = ( { id, value, onChange } ) => {
	const valueRef = useRef( value );
	valueRef.current = value;
	const isReady = useRef( false );

	useEffect( () => {
		if ( ! window.wp?.editor || ! window.tinymce ) return undefined;

		// Initialise. WordPress hands us a full-feature toolbar by
		// default — formats, headings, bold/italic/underline,
		// strikethrough, alignment, lists, link picker, undo/redo.
		window.wp.editor.initialize( id, {
			tinymce: {
				wpautop: true,
				toolbar1:
					'formatselect,bold,italic,underline,strikethrough,bullist,numlist,blockquote,alignleft,aligncenter,alignright,link,unlink,undo,redo',
				toolbar2: '',
				plugins: 'lists link paste wordpress wpautoresize',
				menubar: false,
				branding: false,
				statusbar: false,
				min_height: 280,
				autoresize_min_height: 280,
				setup: ( editor ) => {
					editor.on( 'init', () => {
						isReady.current = true;
						// Push initial value in case TinyMCE missed it.
						editor.setContent( valueRef.current || '' );
					} );
					const flush = () => {
						const next = editor.getContent();
						if ( next !== valueRef.current ) {
							onChange( next );
						}
					};
					editor.on( 'change keyup input undo redo', flush );
				},
			},
			// We expose our own Visual/HTML toggle above, so suppress
			// TinyMCE's built-in Visuel/Code tabs to avoid two parallel
			// switches doing the same thing.
			quicktags: false,
			mediaButtons: false,
		} );

		return () => {
			isReady.current = false;
			try {
				window.wp.editor.remove( id );
			} catch ( e ) {
				// Already unmounted — ignore.
			}
		};
		// `id` is stable per mount; `onChange` is stable from the parent
		// (useCallback). We deliberately don't depend on `value` here —
		// that's handled by the next effect.
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [ id ] );

	// External value changes (e.g. "Load template", "Reset to default")
	// — push into TinyMCE if the editor instance isn't the source.
	useEffect( () => {
		const ed = window.tinymce?.get( id );
		if ( ! ed || ! isReady.current ) return;
		if ( ed.getContent() !== ( value || '' ) ) {
			ed.setContent( value || '' );
		}
	}, [ id, value ] );

	/**
	 * Insert arbitrary HTML at the caret — used by the merge-tag picker
	 * and the "Insert entry table" button. Exposed via a ref-less
	 * window helper because the toolbar lives outside this component.
	 */
	useEffect( () => {
		window.__ffInsertAtCursor = ( html ) => {
			const ed = window.tinymce?.get( id );
			if ( ed ) {
				ed.focus();
				ed.execCommand( 'mceInsertContent', false, html );
			}
		};
		return () => {
			delete window.__ffInsertAtCursor;
		};
	}, [ id ] );

	if ( ! window.wp?.editor ) {
		return (
			<>
				<Notice status="warning" isDismissible={ false }>
					{ __(
						'Your WordPress install does not expose the TinyMCE editor. Falling back to a plain textarea — upgrade WordPress to get the rich editor.',
						'flowforms'
					) }
				</Notice>
				<textarea
					id={ id }
					value={ value || '' }
					onChange={ ( e ) => onChange( e.target.value ) }
					style={ {
						width: '100%',
						minHeight: 280,
						padding: 12,
						fontFamily: 'ui-monospace, monospace',
						fontSize: 13,
					} }
				/>
			</>
		);
	}

	return (
		<textarea
			id={ id }
			defaultValue={ value || '' }
			style={ { width: '100%' } }
		/>
	);
};

const EmailDesigner = ( {
	value,
	onChange,
	form,
	/**
	 * Whether to render the template-management affordances:
	 *   - "Load template…" dropdown in the toolbar
	 *   - "Save current body as template" footer row
	 *
	 * Defaults to `true` for the primary use case (designing the body
	 * of a form's "Send email" action). Pass `false` from screens that
	 * ARE already editing a template top-level (e.g. the standalone
	 * Email Template editor) — otherwise the inline actions duplicate
	 * the page's header Save button and risk silently overwriting the
	 * current template with another, or creating a duplicate of it.
	 */
	showTemplateActions = true,
} ) => {
	const reactId = useId();
	const editorId = useMemo(
		() => `ff-email-${ reactId.replace( /[^a-zA-Z0-9_-]/g, '' ) }`,
		[ reactId ]
	);

	const [ mode, setMode ] = useState( 'visual' );
	const [ templates, setTemplates ] = useState( [] );
	const [ saveAsName, setSaveAsName ] = useState( '' );
	const [ savingTemplate, setSavingTemplate ] = useState( false );
	const [ previewOpen, setPreviewOpen ] = useState( false );

	const mergeTags = useMergeTags( form );

	useEffect( () => {
		get( TEMPLATES_ENDPOINT )
			.then( ( res ) => setTemplates( res.data || [] ) )
			.catch( () => setTemplates( [] ) );
	}, [] );

	const stableOnChange = useCallback( ( v ) => onChange( v ), [ onChange ] );

	const insertAtCursor = ( html ) => {
		if ( 'visual' === mode && window.__ffInsertAtCursor ) {
			window.__ffInsertAtCursor( html );
		} else {
			onChange( ( value || '' ) + html );
		}
	};

	const insertEntryTable = () => insertAtCursor( '[entry_table]' );

	const resetDefault = () => {
		const def = `<p>${ __(
			'You have a new submission for',
			'flowforms'
		) } {form_title}.</p>[entry_table]`;
		onChange( def );
	};

	const loadTemplate = ( idStr ) => {
		const id = parseInt( idStr, 10 );
		if ( ! id ) return;
		const tpl = templates.find( ( t ) => Number( t.id ) === id );
		if ( tpl ) onChange( tpl.body || '' );
	};

	const saveAsTemplate = async () => {
		if ( ! saveAsName.trim() ) return;
		setSavingTemplate( true );
		try {
			const res = await post( TEMPLATES_ENDPOINT, {
				name: saveAsName.trim(),
				subject: '',
				body: value || '',
			} );
			if ( res?.data ) {
				setTemplates( ( t ) => [ ...t, res.data ] );
				setSaveAsName( '' );
			}
		} catch ( e ) {
			// non-blocking
		} finally {
			setSavingTemplate( false );
		}
	};

	const previewHtml = useMemo(
		() => renderPreview( value, mergeTags, form ),
		[ value, mergeTags, form ]
	);

	return (
		<Card>
			<CardBody>
				<VStack spacing={ 3 }>
					{ /* ── Single toolbar row ──────────────────────────
					     Everything except the editor surface lives here
					     so the controls read as one cohesive strip
					     instead of scattered groups across multiple
					     rows. `alignment: center` keeps tall controls
					     (SelectControl) and short ones (Buttons) on the
					     same baseline; the flex-grow spacer pushes the
					     trailing actions (Load template, Preview) to
					     the right. */ }
					<HStack
						alignment="center"
						wrap
						spacing={ 2 }
						className="ff-email-designer__toolbar"
					>
						<ToggleGroupControl
							__nextHasNoMarginBottom
							__next40pxDefaultSize
							value={ mode }
							onChange={ setMode }
							isBlock={ false }
							label=""
							hideLabelFromVision
						>
							<ToggleGroupControlOption
								value="visual"
								label={ __( 'Visual', 'flowforms' ) }
							/>
							<ToggleGroupControlOption
								value="html"
								label={ __( 'HTML', 'flowforms' ) }
							/>
						</ToggleGroupControl>

						<span
							className="ff-email-designer__sep"
							aria-hidden="true"
						/>

						<SelectControl
							__nextHasNoMarginBottom
							__next40pxDefaultSize
							value=""
							options={ [
								{
									value: '',
									label: __(
										'Insert variable…',
										'flowforms'
									),
								},
								...mergeTags.map( ( t ) => ( {
									value: t.value,
									label: t.label,
								} ) ),
							] }
							onChange={ ( v ) => v && insertAtCursor( v ) }
							style={ { minWidth: 200 } }
						/>
						<Button
							variant="secondary"
							onClick={ insertEntryTable }
						>
							{ __( 'Insert entry table', 'flowforms' ) }
						</Button>
						<Button variant="tertiary" onClick={ resetDefault }>
							{ __( 'Reset to default', 'flowforms' ) }
						</Button>

						{ /* Flex-grow spacer — pushes trailing controls right. */ }
						<div style={ { flex: 1 } } aria-hidden="true" />

						{ showTemplateActions && templates.length > 0 && (
							<SelectControl
								__nextHasNoMarginBottom
								__next40pxDefaultSize
								value=""
								options={ [
									{
										value: '',
										label: __(
											'Load template…',
											'flowforms'
										),
									},
									...templates.map( ( t ) => ( {
										value: String( t.id ),
										label: t.name,
									} ) ),
								] }
								onChange={ loadTemplate }
								style={ { minWidth: 160 } }
							/>
						) }
						<Button
							variant="secondary"
							onClick={ () => setPreviewOpen( true ) }
						>
							{ __( 'Preview', 'flowforms' ) }
						</Button>
					</HStack>

					{ /* ── Editor ──────────────────────────────────────── */ }
					<div className="ff-email-designer__editor">
						{ 'visual' === mode ? (
							<TinyMceEditor
								id={ editorId }
								value={ value }
								onChange={ stableOnChange }
							/>
						) : (
							<textarea
								value={ value || '' }
								onChange={ ( e ) => onChange( e.target.value ) }
								style={ {
									width: '100%',
									minHeight: 320,
									padding: 12,
									fontFamily:
										'ui-monospace, SFMono-Regular, monospace',
									fontSize: 13,
									border: '1px solid #ddd',
									borderRadius: 4,
								} }
							/>
						) }
					</div>

					{ /* ── Save as template ──────────────────────────────
					     Hidden when the parent screen is itself a template
					     editor (the page header's Save button is then the
					     single source of truth — see prop docs above). */ }
					{ showTemplateActions && (
						<HStack spacing={ 2 }>
							<div style={ { flex: 1 } }>
								<TextControl
									__nextHasNoMarginBottom
									__next40pxDefaultSize
									placeholder={ __(
										'Save current body as a reusable template…',
										'flowforms'
									) }
									value={ saveAsName }
									onChange={ setSaveAsName }
								/>
							</div>
							<Button
								variant="secondary"
								onClick={ saveAsTemplate }
								isBusy={ savingTemplate }
								disabled={
									! saveAsName.trim() || savingTemplate
								}
							>
								{ __( 'Save as template', 'flowforms' ) }
							</Button>
						</HStack>
					) }
				</VStack>
			</CardBody>

			{ previewOpen && (
				<Modal
					title={ __( 'Email preview', 'flowforms' ) }
					onRequestClose={ () => setPreviewOpen( false ) }
					size="medium"
				>
					<div
						style={ {
							maxWidth: 600,
							margin: '0 auto',
							padding: 24,
							background: '#fff',
							border: '1px solid #e5e7eb',
							borderRadius: 8,
						} }
						// eslint-disable-next-line react/no-danger
						dangerouslySetInnerHTML={ { __html: previewHtml } }
					/>
				</Modal>
			) }
		</Card>
	);
};

export default EmailDesigner;
