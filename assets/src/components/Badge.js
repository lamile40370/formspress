/**
 * Tiny status pill — `@wordpress/components` doesn't expose its internal
 * Badge component in v30.x, so we keep our own. Same visual contract as
 * the inline Badge already used in FormsListPage.js.
 *
 * Usage:
 *   <Badge>Active</Badge>
 *   <Badge intent="success">Saved</Badge>
 *   <Badge intent="error">Failed</Badge>
 */

const INTENT_STYLES = {
	default: { backgroundColor: '#f0f0f0', color: '#50575e' },
	success: { backgroundColor: '#e7f5ea', color: '#00a32a' },
	warning: { backgroundColor: '#fcf8e3', color: '#8a6d3b' },
	error: { backgroundColor: '#fdebeb', color: '#d63638' },
	info: { backgroundColor: '#f0f6ff', color: '#2271b1' },
};

const BASE_STYLE = {
	display: 'inline-block',
	padding: '2px 8px',
	borderRadius: '2px',
	fontSize: '12px',
	lineHeight: 1.4,
	whiteSpace: 'nowrap',
	fontWeight: 500,
};

const Badge = ( { intent = 'default', style, children } ) => (
	<span
		style={ {
			...BASE_STYLE,
			...( INTENT_STYLES[ intent ] || INTENT_STYLES.default ),
			...( style || {} ),
		} }
	>
		{ children }
	</span>
);

export default Badge;
