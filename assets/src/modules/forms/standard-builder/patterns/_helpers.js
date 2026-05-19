/**
 * Shared block-markup helpers for the form patterns.
 *
 * Each pattern is a string of Gutenberg-serialised block markup. The
 * boring parts (the submit button + the styled field blocks) are the
 * same shape across patterns — we render them through these helpers
 * so the pattern files themselves stay focused on their distinctive
 * visual treatment (background colour, padding, typography).
 */

/**
 * A submit button — the inner `core/button` of a `formspress/field-submit`
 * wrapper. Pass `{ text, bg, fg }` for the colour scheme; defaults to
 * dark fill.
 *
 * Returns valid Gutenberg block-comment markup ready to be embedded
 * inside a `formspress/field-submit` block.
 */
export const submitButton = ( {
	text = 'Submit',
	bg = '#111827',
	fg = '#ffffff',
	full = false,
	justify = 'left',
	radius = '10px',
	paddingY = '15px',
	paddingX = '34px',
} = {} ) => {
	const attrs = {
		text,
		tagName: 'button',
		type: 'submit',
		lock: { remove: true, move: true },
		style: {
			spacing: {
				padding: {
					top: paddingY,
					right: paddingX,
					bottom: paddingY,
					left: paddingX,
				},
			},
			border: { radius },
			typography: { fontSize: '15px', fontWeight: '600' },
			color: { background: bg, text: fg },
		},
		...( full ? { width: 100 } : {} ),
	};
	const buttonsAttrs = {
		layout: { type: 'flex', justifyContent: justify },
		lock: { remove: true, move: true },
	};
	const inlineStyle = `border-radius:${ radius };color:${ fg };background-color:${ bg };padding-top:${ paddingY };padding-right:${ paddingX };padding-bottom:${ paddingY };padding-left:${ paddingX };font-size:15px;font-weight:600`;

	return `<!-- wp:formspress/field-submit -->
<!-- wp:buttons ${ JSON.stringify( buttonsAttrs ) } -->
<div class="wp-block-buttons is-content-justification-${ justify } is-layout-flex wp-container-core-buttons-is-layout">
<!-- wp:button ${ JSON.stringify( attrs ) } -->
<div class="wp-block-button${
		full ? ' has-custom-width wp-block-button__width-100' : ''
	}"><button class="wp-block-button__link has-text-color has-background wp-element-button" type="submit" style="${ inlineStyle }">${ text }</button></div>
<!-- /wp:button -->
</div>
<!-- /wp:buttons -->
<!-- /wp:formspress/field-submit -->`;
};

/**
 * Wrap any inner markup in a styled `core/group` — the "form card".
 * Pass `{ bg, fg, radius, padding, maxWidth, border }` to vary the
 * look between patterns. Defaults to a white card with subtle border.
 */
export const styledGroup = ( {
	inner,
	bg = '#ffffff',
	fg = null,
	radius = '12px',
	padding = '40px',
	maxWidth = '560px',
	border = '#e5e7eb',
	borderWidth = '1px',
	textAlign = null,
	className = '',
} ) => {
	const style = {
		spacing: {
			padding: {
				top: padding,
				right: padding,
				bottom: padding,
				left: padding,
			},
			blockGap: '18px',
		},
		border: border
			? { radius, width: borderWidth, color: border }
			: { radius },
		color: fg ? { background: bg, text: fg } : { background: bg },
	};
	const attrs = {
		tagName: 'div',
		layout: { type: 'constrained', contentSize: maxWidth },
		style,
		className: className || undefined,
	};

	const colorClasses = [
		fg ? 'has-text-color' : '',
		'has-background',
		border ? 'has-border-color' : '',
	]
		.filter( Boolean )
		.join( ' ' );

	const inlineStyleParts = [
		`border-radius:${ radius }`,
		border ? `border-color:${ border }` : '',
		border ? `border-width:${ borderWidth }` : '',
		fg ? `color:${ fg }` : '',
		`background-color:${ bg }`,
		`padding-top:${ padding }`,
		`padding-right:${ padding }`,
		`padding-bottom:${ padding }`,
		`padding-left:${ padding }`,
	]
		.filter( Boolean )
		.join( ';' );

	return `<!-- wp:group ${ JSON.stringify( attrs ) } -->
<div class="wp-block-group ${ colorClasses } ${ className }"${
		textAlign
			? ` style="text-align:${ textAlign };${ inlineStyleParts }"`
			: ` style="${ inlineStyleParts }"`
	}>
${ inner }
</div>
<!-- /wp:group -->`;
};

/**
 * Heading helper — typographic defaults for "form title" headings.
 */
export const heading = ( {
	text,
	level = 2,
	size = '26px',
	weight = '700',
	align = null,
	color = null,
	marginBottom = '4px',
} ) => {
	const style = {
		typography: { fontSize: size, fontWeight: weight, lineHeight: '1.2' },
		spacing: { margin: { bottom: marginBottom } },
	};
	if ( color ) style.color = { text: color };

	const attrs = { level, style };
	if ( align ) attrs.textAlign = align;

	const cls = [
		'wp-block-heading',
		align ? `has-text-align-${ align }` : '',
		color ? 'has-text-color' : '',
	]
		.filter( Boolean )
		.join( ' ' );

	const inline = [
		`font-size:${ size }`,
		`font-weight:${ weight }`,
		`line-height:1.2`,
		`margin-bottom:${ marginBottom }`,
		color ? `color:${ color }` : '',
	]
		.filter( Boolean )
		.join( ';' );

	return `<!-- wp:heading ${ JSON.stringify( attrs ) } -->
<h${ level } class="${ cls }" style="${ inline }">${ text }</h${ level }>
<!-- /wp:heading -->`;
};

/**
 * Description paragraph — muted text under a heading.
 */
export const description = ( {
	text,
	color = '#6b7280',
	size = '14px',
	align = null,
	marginBottom = '16px',
} ) => {
	const style = {
		typography: { fontSize: size, lineHeight: '1.6' },
		spacing: { margin: { bottom: marginBottom } },
		color: { text: color },
	};
	const attrs = { style };
	if ( align ) attrs.align = align;

	const cls = [ align ? `has-text-align-${ align }` : '', 'has-text-color' ]
		.filter( Boolean )
		.join( ' ' );

	const inline = [
		`color:${ color }`,
		`font-size:${ size }`,
		`line-height:1.6`,
		`margin-bottom:${ marginBottom }`,
	].join( ';' );

	return `<!-- wp:paragraph ${ JSON.stringify( attrs ) } -->
<p class="${ cls }" style="${ inline }">${ text }</p>
<!-- /wp:paragraph -->`;
};

const escapeHtml = ( value = '' ) =>
	String( value ).replace(
		/[&<>"']/g,
		( match ) =>
			( {
				'&': '&amp;',
				'<': '&lt;',
				'>': '&gt;',
				'"': '&quot;',
				"'": '&#039;',
			} )[ match ]
	);

/**
 * Field block builders — thin wrappers that emit the right comment
 * markup for each `formspress/field-*` block. The field label and help
 * copy are native inner paragraph blocks so they can use Gutenberg
 * typography, colours, alignment, styles, and transforms.
 */
const fieldInnerContent = ( a = {} ) => {
	const blocks = [];

	if ( a.label ) {
		blocks.push( `<!-- wp:paragraph {"className":"ff-field-label"} -->
<p class="ff-field-label">${ escapeHtml( a.label ) }</p>
<!-- /wp:paragraph -->` );
	}

	if ( a.help ) {
		blocks.push( `<!-- wp:paragraph {"className":"ff-field-help","fontSize":"small"} -->
<p class="ff-field-help has-small-font-size">${ escapeHtml( a.help ) }</p>
<!-- /wp:paragraph -->` );
	}

	return blocks.join( '\n' );
};

const fieldBlock = ( name, a = {} ) => {
	const attrs = {
		...a,
		inputStyle: {
			backgroundColor: '#ffffff',
			textColor: '#111827',
			borderRadius: '10px',
			paddingY: '12px',
			paddingX: '14px',
			fontSize: '15px',
			lineHeight: '1.45',
			border: {
				color: '#d1d5db',
				style: 'solid',
				width: '1px',
			},
			...( a.inputStyle || {} ),
		},
	};
	const inner = fieldInnerContent( a );

	if ( ! inner ) {
		return `<!-- wp:${ name } ${ JSON.stringify( attrs ) } /-->`;
	}

	return `<!-- wp:${ name } ${ JSON.stringify( attrs ) } -->
${ inner }
<!-- /wp:${ name } -->`;
};

export const fieldText = ( a ) => fieldBlock( 'formspress/field-text', a );
export const fieldEmail = ( a ) => fieldBlock( 'formspress/field-email', a );
export const fieldTextarea = ( a ) =>
	fieldBlock( 'formspress/field-textarea', a );
export const fieldNumber = ( a ) => fieldBlock( 'formspress/field-number', a );
export const fieldSelect = ( a ) => fieldBlock( 'formspress/field-select', a );
export const fieldRadio = ( a ) => fieldBlock( 'formspress/field-radio', a );
export const fieldCheckbox = ( a ) =>
	fieldBlock( 'formspress/field-checkbox', a );
