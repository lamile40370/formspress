import { useEffect, useState, useMemo } from '@wordpress/element';
import { Spinner } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { useNavigate } from 'react-router-dom';
import PageHeader from '../../components/PageHeader';
import Badge from '../../components/Badge';
import Toast from '../../components/Toast';
import { DataViews, filterSortAndPaginate } from '@wordpress/dataviews';
import { get, post } from '../../api/client';
import { TEMPLATES, templateCreate } from '../../api/endpoints';
import registerBlocks from './standard-builder/blocks/register';

registerBlocks();

const TYPE_LABELS = {
	standard: __( 'Standard', 'formspress' ),
	flow: __( 'Flow', 'formspress' ),
};
const TYPE_STYLES = {
	standard: { backgroundColor: '#e7f5ea', color: '#00a32a' },
	flow: { backgroundColor: '#f0f6ff', color: '#2271b1' },
};

const FIELD_TYPES = [
	'text',
	'email',
	'textarea',
	'number',
	'select',
	'radio',
	'checkbox',
];

const escapeHtml = ( value ) =>
	String( value ?? '' )
		.replaceAll( '&', '&amp;' )
		.replaceAll( '<', '&lt;' )
		.replaceAll( '>', '&gt;' )
		.replaceAll( '"', '&quot;' )
		.replaceAll( "'", '&#039;' );

const escapeAttr = escapeHtml;

const parseBlockAttrs = ( raw = '' ) => {
	const trimmed = raw.trim();
	if ( ! trimmed.startsWith( '{' ) ) return {};
	try {
		return JSON.parse( trimmed );
	} catch ( e ) {
		return {};
	}
};

const stripGutenbergComments = ( html = '' ) =>
	html.replace( /<!--\s*\/?wp:[\s\S]*?-->/g, '' );

const shuffleTemplates = ( templates = [] ) => {
	const shuffled = [ ...templates ];
	for ( let i = shuffled.length - 1; i > 0; i-- ) {
		const j = Math.floor( Math.random() * ( i + 1 ) );
		[ shuffled[ i ], shuffled[ j ] ] = [ shuffled[ j ], shuffled[ i ] ];
	}
	return shuffled;
};

const normalizePlaceholderImages = ( html = '' ) =>
	html.replace(
		/https:\/\/placehold\.co\/([^/"' )]+)\/([a-fA-F0-9]{3,8})\/([a-fA-F0-9]{3,8})(?:\/png)?(?:\?text=[^"' )]*)?/g,
		( match, size, bg ) =>
			`https://placehold.co/${ size }/${ bg }/${ bg }/png?text=%20`
	);

const controlStyle = ( attrs = {} ) => {
	const input = attrs.inputStyle || {};
	const border = input.border || {};
	const rules = [];
	if ( input.textColor ) {
		rules.push( `color:${ input.textColor }` );
		rules.push( `--ff-input-text-color:${ input.textColor }` );
	}
	if ( input.backgroundColor ) {
		rules.push( `background-color:${ input.backgroundColor }` );
	}
	if ( input.borderRadius ) rules.push( `border-radius:${ input.borderRadius }` );
	if ( input.paddingY || input.paddingX ) {
		rules.push(
			`padding:${ input.paddingY || '10px' } ${ input.paddingX || '14px' }`
		);
	}
	if ( input.fontSize ) rules.push( `font-size:${ input.fontSize }` );
	if ( input.lineHeight ) rules.push( `line-height:${ input.lineHeight }` );
	if ( border.color || border.width || border.style ) {
		rules.push(
			`border:${ border.width || '1px' } ${ border.style || 'solid' } ${
				border.color || '#d1d5db'
			}`
		);
	}
	return rules.length ? ` style="${ escapeAttr( rules.join( ';' ) ) }"` : '';
};

const fieldContentHtml = ( attrs, content = '' ) => {
	const fieldId = attrs.fieldId || attrs.label || 'field';
	const required = !! attrs.required;
	const inner = stripGutenbergComments( content ).trim();
	if ( inner ) {
		return `<div class="ff-form__field-content" id="ff-content-${ escapeAttr(
			fieldId
		) }">${ inner }${
			required ? '<span class="screen-reader-text">(required)</span>' : ''
		}</div>`;
	}
	return `${ attrs.label ? `<label for="ff-field-${ escapeAttr( fieldId ) }" class="ff-form__label">${ escapeHtml( attrs.label ) }${ required ? ' <span class="ff-form__required" aria-hidden="true">*</span><span class="screen-reader-text">(required)</span>' : '' }</label>` : '' }${
		attrs.help
			? `<p class="ff-form__description-text" id="ff-desc-${ escapeAttr(
					fieldId
			  ) }">${ escapeHtml( attrs.help ) }</p>`
			: ''
	}`;
};

const renderInputField = ( attrs, type, content ) => {
	const fieldId = attrs.fieldId || attrs.label || type;
	const required = !! attrs.required;
	return `<div class="ff-form__field${
		required ? ' is-required' : ''
	}" id="ff-field-wrap-${ escapeAttr(
		fieldId
	) }" data-field-id="${ escapeAttr( fieldId ) }">${ fieldContentHtml(
		attrs,
		content
	) }<input type="${ type }" name="${ escapeAttr(
		fieldId
	) }" id="ff-field-${ escapeAttr(
		fieldId
	) }" class="ff-form__input" value="${ escapeAttr(
		attrs.defaultValue || ''
	) }" placeholder="${ escapeAttr( attrs.placeholder || '' ) }"${
		required ? ' required aria-required="true"' : ''
	}${ controlStyle( attrs ) } /><div class="ff-form__field-error" id="ff-error-${ escapeAttr(
		fieldId
	) }" role="alert" aria-live="polite" aria-atomic="true"></div></div>`;
};

const renderTextareaField = ( attrs, content ) => {
	const fieldId = attrs.fieldId || attrs.label || 'textarea';
	const required = !! attrs.required;
	return `<div class="ff-form__field${
		required ? ' is-required' : ''
	}" id="ff-field-wrap-${ escapeAttr(
		fieldId
	) }" data-field-id="${ escapeAttr( fieldId ) }">${ fieldContentHtml(
		attrs,
		content
	) }<textarea name="${ escapeAttr( fieldId ) }" id="ff-field-${ escapeAttr(
		fieldId
	) }" class="ff-form__textarea" rows="${ Number(
		attrs.rows || 4
	) }" placeholder="${ escapeAttr( attrs.placeholder || '' ) }"${
		required ? ' required aria-required="true"' : ''
	}${ controlStyle( attrs ) }>${ escapeHtml(
		attrs.defaultValue || ''
	) }</textarea><div class="ff-form__field-error" id="ff-error-${ escapeAttr(
		fieldId
	) }" role="alert" aria-live="polite" aria-atomic="true"></div></div>`;
};

const renderSelectField = ( attrs, content ) => {
	const fieldId = attrs.fieldId || attrs.label || 'select';
	const required = !! attrs.required;
	const selected = attrs.defaultValue || '';
	const options = Array.isArray( attrs.options ) ? attrs.options : [];
	const optionsHtml = [
		'<option value="">Select...</option>',
		...options.map( ( option ) => {
			const value = option?.value ?? option?.label ?? '';
			const label = option?.label ?? value;
			return `<option value="${ escapeAttr( value ) }"${
				value === selected ? ' selected' : ''
			}>${ escapeHtml( label ) }</option>`;
		} ),
	].join( '' );
	return `<div class="ff-form__field${
		required ? ' is-required' : ''
	}" id="ff-field-wrap-${ escapeAttr(
		fieldId
	) }" data-field-id="${ escapeAttr( fieldId ) }">${ fieldContentHtml(
		attrs,
		content
	) }<select name="${ escapeAttr( fieldId ) }" id="ff-field-${ escapeAttr(
		fieldId
	) }" class="ff-form__select"${
		required ? ' required aria-required="true"' : ''
	}${ controlStyle( attrs ) }>${ optionsHtml }</select><div class="ff-form__field-error" id="ff-error-${ escapeAttr(
		fieldId
	) }" role="alert" aria-live="polite" aria-atomic="true"></div></div>`;
};

const renderChoiceField = ( attrs, type, content ) => {
	const fieldId = attrs.fieldId || attrs.label || type;
	const required = !! attrs.required;
	const options = Array.isArray( attrs.options ) ? attrs.options : [];
	const name = 'checkbox' === type ? `${ fieldId }[]` : fieldId;
	const choices = options
		.map( ( option, index ) => {
			const value = option?.value ?? option?.label ?? '';
			const label = option?.label ?? value;
			const id = `ff-field-${ fieldId }-${ index }`;
			return `<label class="ff-form__choice" for="${ escapeAttr(
				id
			) }"><input type="${ type }" id="${ escapeAttr(
				id
			) }" name="${ escapeAttr( name ) }" value="${ escapeAttr(
				value
			) }" ${
				required && 'radio' === type && 0 === index
					? 'required aria-required="true"'
					: ''
			}/><span>${ escapeHtml( label ) }</span></label>`;
		} )
		.join( '' );
	return `<div class="ff-form__field${
		required ? ' is-required' : ''
	}" id="ff-field-wrap-${ escapeAttr(
		fieldId
	) }" data-field-id="${ escapeAttr( fieldId ) }">${ fieldContentHtml(
		attrs,
		content
	) }<fieldset class="ff-form__fieldset"><legend class="screen-reader-text">${ escapeHtml(
		attrs.label || ''
	) }</legend><div class="ff-form__choices"${ controlStyle(
		attrs
	) }>${ choices }</div><div class="ff-form__field-error" id="ff-error-${ escapeAttr(
		fieldId
	) }" role="alert" aria-live="polite" aria-atomic="true"></div></fieldset></div>`;
};

const renderFieldBlock = ( type, attrs, content = '' ) => {
	if ( 'textarea' === type ) return renderTextareaField( attrs, content );
	if ( 'number' === type ) return renderInputField( attrs, 'number', content );
	if ( 'email' === type ) return renderInputField( attrs, 'email', content );
	if ( 'select' === type ) return renderSelectField( attrs, content );
	if ( 'radio' === type || 'checkbox' === type ) {
		return renderChoiceField( attrs, type, content );
	}
	return renderInputField( attrs, 'text', content );
};

const renderSubmitBlock = ( content = '' ) => {
	const buttonHtml =
		stripGutenbergComments( content ).trim() ||
		'<div class="wp-block-button"><button class="wp-block-button__link wp-element-button" type="submit">Submit</button></div>';
	const withSubmitClass = buttonHtml.replace(
		/<(button|a)\b([^>]*)>/gi,
		( match, tag, attrs ) => {
			let nextAttrs = attrs;
			if ( /\bclass="/i.test( nextAttrs ) ) {
				nextAttrs = nextAttrs.replace(
					/\bclass="([^"]*)"/i,
					( classMatch, classes ) =>
						`class="${ escapeAttr( `${ classes } ff-form__submit` ) }"`
				);
			} else {
				nextAttrs += ' class="ff-form__submit"';
			}
			if ( 'button' === tag.toLowerCase() ) {
				nextAttrs = /\btype="/i.test( nextAttrs )
					? nextAttrs.replace( /\btype="[^"]*"/i, 'type="submit"' )
					: `${ nextAttrs } type="submit"`;
			}
			return `<${ tag }${ nextAttrs }>`;
		}
	);
	return `<div class="ff-form__pagination"><div class="ff-form__footer">${ withSubmitClass }</div></div>`;
};

const renderTemplateMarkup = ( markup = '' ) => {
	let html = normalizePlaceholderImages( markup );
	for ( const type of FIELD_TYPES ) {
		const paired = new RegExp(
			`<!--\\s*wp:formspress/field-${ type }\\s*([^>]*)-->([\\s\\S]*?)<!--\\s*/wp:formspress/field-${ type }\\s*-->`,
			'g'
		);
		const selfClosing = new RegExp(
			`<!--\\s*wp:formspress/field-${ type }\\s*([^>]*)/-->`,
			'g'
		);
		html = html.replace( paired, ( match, rawAttrs, content ) =>
			renderFieldBlock( type, parseBlockAttrs( rawAttrs ), content )
		);
		html = html.replace( selfClosing, ( match, rawAttrs ) =>
			renderFieldBlock( type, parseBlockAttrs( rawAttrs ), '' )
		);
	}
	html = html.replace(
		/<!--\s*wp:formspress\/field-submit\s*([^>]*)-->([\s\S]*?)<!--\s*\/wp:formspress\/field-submit\s*-->/g,
		( match, rawAttrs, content ) => renderSubmitBlock( content )
	);
	html = html.replace(
		/<!--\s*wp:formspress\/field-submit\s*([^>]*)\/-->/g,
		() => renderSubmitBlock()
	);
	return stripGutenbergComments( html ).trim();
};

const normalizeFieldOptions = ( options = [] ) =>
	( Array.isArray( options ) ? options : [] ).map( ( option ) => {
		if ( option && 'object' === typeof option ) {
			return {
				label: option.label ?? option.value ?? '',
				value: option.value ?? option.label ?? '',
			};
		}
		return { label: option, value: option };
	} );

const previewFieldType = ( field = {} ) => {
	if ( FIELD_TYPES.includes( field.type ) ) return field.type;
	if ( 'yes_no' === field.type ) return 'radio';
	if ( 'rating' === field.type || 'nps' === field.type ) return 'radio';
	if ( 'phone' === field.type ) return 'text';
	return 'text';
};

const previewFieldAttrs = ( field = {} ) => {
	let options = normalizeFieldOptions( field.options );
	if ( 'yes_no' === field.type ) {
		options = [
			{ label: field.yes_label || __( 'Yes', 'formspress' ), value: 'yes' },
			{ label: field.no_label || __( 'No', 'formspress' ), value: 'no' },
		];
	}
	if ( 'rating' === field.type ) {
		const max = Number( field.max || 5 );
		options = Array.from( { length: max }, ( _, index ) => ( {
			label: String( index + 1 ),
			value: String( index + 1 ),
		} ) );
	}
	if ( 'nps' === field.type ) {
		options = Array.from( { length: 11 }, ( _, index ) => ( {
			label: String( index ),
			value: String( index ),
		} ) );
	}
	return {
		fieldId: field.id || field.fieldId || field.label || 'field',
		label: field.label || __( 'Your answer', 'formspress' ),
		required: !! field.required,
		options,
		rows: field.rows || 4,
		placeholder: field.placeholder || '',
	};
};

const renderFallbackField = ( field ) => {
	if ( ! field ) return '';
	return renderFieldBlock(
		previewFieldType( field ),
		previewFieldAttrs( field ),
		''
	);
};

const renderFallbackPreview = ( item = {} ) => {
	const fields = Array.isArray( item.fields ) ? item.fields : [];
	const title =
		item.settings?.welcome_title ||
		item.title ||
		item.label ||
		__( 'Template', 'formspress' );
	const description =
		item.settings?.welcome_description || item.description || '';

	if ( 'flow' === item.type ) {
		const currentField = fields[ 0 ];
		return `<section class="ff-flow-template-preview"><div class="ff-flow-template-preview__progress"><span></span><span></span><span></span></div><h2>${ escapeHtml(
			title
		) }</h2>${
			description ? `<p>${ escapeHtml( description ) }</p>` : ''
		}<div class="ff-flow-template-preview__question">${ renderFallbackField(
			currentField
		) }</div><button class="ff-form__submit" type="button">${ escapeHtml(
			item.settings?.start_label || __( 'Start', 'formspress' )
		) }</button></section>`;
	}

	return `<section class="ff-schema-template-preview"><h2>${ escapeHtml(
		title
	) }</h2>${
		description ? `<p>${ escapeHtml( description ) }</p>` : ''
	}${ fields.slice( 0, 5 ).map( renderFallbackField ).join( '' ) }</section>`;
};

const templatePreviewStyles = `
	*{box-sizing:border-box}
	html,body{margin:0;min-height:100%;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Oxygen-Sans,Ubuntu,Cantarell,"Helvetica Neue",sans-serif;color:#111827;background:#f8fafc}
	body{overflow:hidden}
	:root{--ff-preview-scale:.76}
	.ff-template-preview-doc{width:calc(100% / var(--ff-preview-scale));min-width:720px;padding:16px;transform:scale(var(--ff-preview-scale));transform-origin:top left}
	.ff-form{--ff-color-primary:#2271b1;--ff-color-text:#111827;--ff-color-bg:#fff;--ff-color-border:#d1d5db;--ff-font-size:16px;--ff-font-family:inherit;--ff-border-radius:8px;--ff-spacing:16px;color:var(--ff-color-text);font-family:var(--ff-font-family);font-size:var(--ff-font-size);max-width:980px;margin:0 auto}
	.wp-block-group{position:relative}
	.wp-block-group>*:first-child,.wp-block-column>*:first-child{margin-top:0}
	.wp-block-group>*:last-child,.wp-block-column>*:last-child{margin-bottom:0}
	.wp-block-columns{display:flex;gap:28px;align-items:stretch}
	.wp-block-column{flex:1;min-width:0}
	.wp-block-cover{position:relative;display:flex;align-items:center;justify-content:center;overflow:hidden;color:#fff}
	.wp-block-cover__image-background{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}
	.wp-block-cover__background{position:absolute;inset:0}
	.wp-block-cover__inner-container{position:relative;z-index:1;width:100%;max-width:inherit}
	.wp-block-image{margin:0 0 18px}
	.wp-block-image img{display:block;width:100%;height:auto}
	.wp-block-heading{margin-top:0}
	.has-text-align-center{text-align:center}
	.wp-block-button{display:inline-block}
	.wp-block-button.has-custom-width{display:block}
	.wp-block-button__width-100 .wp-block-button__link{width:100%}
	.wp-block-button__link{border:0;cursor:default;display:inline-flex;align-items:center;justify-content:center;text-decoration:none}
	.ff-form__field{margin-bottom:1em}
	.ff-form__label{display:block;font-size:.875em;font-weight:600;margin-bottom:.4em}
	.ff-form__required{color:#d63638;margin-left:2px;font-weight:700}
	.ff-form__field-content{margin-bottom:.4em}
	.ff-form__field-content>*{margin-bottom:.35em;margin-top:0}
	.ff-form__field-content>:last-child{margin-bottom:0}
	.ff-form__field-content .ff-field-label{font-size:.875em;font-weight:700;line-height:1.25}
	.ff-form__field-content .ff-field-help{font-size:.8em;line-height:1.45;opacity:.72}
	.ff-form__field.is-required .ff-field-label:after{color:#d63638;content:" *";font-weight:700}
	.ff-form__description-text{color:#606060;font-size:.8em;margin-bottom:.4em}
	.ff-form__input,.ff-form__select,.ff-form__textarea{background-color:var(--ff-color-bg);border:1px solid var(--ff-color-border);border-radius:var(--ff-border-radius);box-sizing:border-box;color:var(--ff-color-text);display:block;font-family:var(--ff-font-family);font-size:var(--ff-font-size);max-width:100%;padding:10px 14px;width:100%}
	.ff-form__textarea{min-height:112px;resize:none}
	.ff-form__choices{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px 12px}
	.ff-form__choice{align-items:center;display:flex;font-weight:400;gap:8px}
	.ff-form__fieldset{border:0;margin:0;padding:0}
	.ff-form__footer{align-items:center;display:flex;gap:12px;margin-top:1.25em}
	.ff-form__footer .wp-block-buttons{width:100%}
	.ff-form__submit{background-color:var(--ff-color-primary);border:none;border-radius:var(--ff-border-radius);color:#fff;font-family:var(--ff-font-family);font-size:var(--ff-font-size);font-weight:600;padding:12px 28px}
	.ff-form__field-error,.ff-form__honeypot,.screen-reader-text{display:none!important}
	.ff-flow-template-preview,.ff-schema-template-preview{min-height:100%;border:1px solid #dbe3ea;border-radius:22px;background:#fff;padding:42px;box-shadow:0 18px 60px rgba(15,23,42,.08)}
	.ff-flow-template-preview{display:flex;min-height:560px;flex-direction:column;justify-content:center;background:#111827;color:#f8fafc}
	.ff-flow-template-preview h2,.ff-schema-template-preview h2{margin:0 0 10px;font-size:34px;line-height:1.1}
	.ff-flow-template-preview p,.ff-schema-template-preview p{margin:0 0 24px;color:inherit;opacity:.72;font-size:15px;line-height:1.55}
	.ff-flow-template-preview__progress{display:flex;gap:8px;margin-bottom:28px}
	.ff-flow-template-preview__progress span{display:block;height:6px;flex:1;border-radius:999px;background:rgba(255,255,255,.22)}
	.ff-flow-template-preview__progress span:first-child{background:#38bdf8}
	.ff-flow-template-preview__question{margin-bottom:18px}
	.ff-flow-template-preview .ff-form__choice span{color:#f8fafc}
	.ff-flow-template-preview .ff-form__choices{grid-template-columns:repeat(3,minmax(0,1fr))}
	.ff-flow-template-preview .ff-form__submit{background:#38bdf8;color:#082f49}
	@media(max-width:520px){:root{--ff-preview-scale:.62}.ff-template-preview-doc{min-width:640px;padding:12px}.wp-block-columns{gap:18px}}
`;

const buildPreviewDocument = ( item ) => {
	const body = item?.block_markup
		? renderTemplateMarkup( item.block_markup )
		: renderFallbackPreview( item );
	return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>${ templatePreviewStyles }</style></head><body><main class="ff-template-preview-doc"><form class="ff-form ff-form--standard">${ body }</form></main></body></html>`;
};

export const TemplatePreview = ( { item } ) => (
	<div className="formspress-template-preview">
		<iframe
			title={ item?.title || item?.label || __( 'Template preview', 'formspress' ) }
			srcDoc={ buildPreviewDocument( item ) }
			loading="lazy"
		/>
	</div>
);

const DEFAULT_VIEW = {
	type: 'grid',
	page: 1,
	perPage: 12,
	search: '',
	filters: [],
	titleField: 'title',
	mediaField: 'preview',
	descriptionField: 'description',
	fields: [ 'type' ],
	layout: {
		previewSize: 280,
	},
};

const FormTemplatesPage = () => {
	const navigate = useNavigate();
	const [ list, setList ] = useState( null );
	const [ error, setError ] = useState( null );
	const [ creating, setCreating ] = useState( null );
	const [ view, setView ] = useState( DEFAULT_VIEW );

	useEffect( () => {
		registerBlocks();
	}, [] );

	useEffect( () => {
		get( TEMPLATES )
			.then( ( res ) => {
				const raw = res?.data;
				const merged = Array.isArray( raw )
					? raw
					: raw && 'object' === typeof raw
					? [
							...( Array.isArray( raw.built_in )
								? raw.built_in
								: [] ),
							...( Array.isArray( raw.user ) ? raw.user : [] ),
					  ]
					: [];
				// Normalise — DataViews wants `title` not `label`.
				setList(
					shuffleTemplates( merged ).map( ( t ) => ( {
						...t,
						title: t.label || t.title || t.id,
					} ) )
				);
			} )
			.catch( () =>
				setError( __( 'Could not load templates.', 'formspress' ) )
			);
	}, [] );

	const onUse = async ( id ) => {
		setCreating( id );
		try {
			const res = await post( templateCreate( id ) );
			if ( res?.data?.id ) {
				navigate( `/forms/${ res.data.id }/edit` );
			}
		} catch ( e ) {
			setError(
				e.message ||
					__(
						'Could not create the form from this template.',
						'formspress'
					)
			);
		} finally {
			setCreating( null );
		}
	};

	const fields = useMemo(
		() => [
			{
				id: 'title',
				label: __( 'Name', 'formspress' ),
				enableGlobalSearch: true,
				enableSorting: true,
			},
			{
				id: 'description',
				label: __( 'Description', 'formspress' ),
				enableGlobalSearch: true,
			},
			{
				id: 'type',
				label: __( 'Type', 'formspress' ),
				filterBy: { operators: [ 'isAny' ] },
				elements: Object.entries( TYPE_LABELS ).map(
					( [ value, label ] ) => ( { value, label } )
				),
				render: ( { item } ) => (
					<Badge intent={ 'flow' === item.type ? 'info' : 'success' }>
						{ TYPE_LABELS[ item.type ] || item.type }
					</Badge>
				),
			},
			{
				id: 'preview',
				label: __( 'Preview', 'formspress' ),
				render: ( { item } ) => <TemplatePreview item={ item } />,
			},
		],
		[]
		);

	const { data: shownTemplates, paginationInfo } = useMemo(
		() => filterSortAndPaginate( list || [], view, fields ),
		[ list, view, fields ]
	);

	const actions = useMemo(
		() => [
			{
				id: 'use',
				label: __( 'Use template', 'formspress' ),
				isPrimary: true,
				callback: ( items ) => {
					const t = items?.[ 0 ];
					if ( t ) onUse( t.id );
				},
			},
		],
		[ onUse ]
	);

	if ( null === list && ! error ) {
		return (
			<div className="ff-page ff-page--loading">
				<Spinner />
			</div>
		);
	}

	return (
		<PageHeader
			className="ff-page ff-page--dataviews"
			title={ __( 'Templates', 'formspress' ) }
			description={ __(
				'Start from a curated form template — multi-step quizzes, contact, surveys, RSVP and more.',
				'formspress'
			) }
		>
			<div className="ff-page__body">
				<Toast
					notice={ error ? { type: 'error', message: error } : null }
					onRemove={ () => setError( null ) }
				/>
				<div className="ff-dataviews-container">
						<DataViews
							data={ shownTemplates }
						fields={ fields }
						view={ view }
						onChangeView={ setView }
						actions={ actions }
						defaultLayouts={ {
							grid: {},
							table: {},
						} }
						paginationInfo={ paginationInfo }
						getItemId={ ( item ) => item.id }
						onClickItem={ ( item ) => onUse( item.id ) }
						isLoading={ !! creating }
					/>
				</div>
			</div>
		</PageHeader>
	);
};

export default FormTemplatesPage;
