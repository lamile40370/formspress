/**
 * Shared FormsPress logo. Single source of truth — change the file at
 * `assets/images/logo.svg` and it propagates everywhere (admin sidebar,
 * mobile header, editor topbar, etc.).
 *
 * Served as a static plugin asset via `window.flowFormsData.pluginUrl`.
 */
const pluginUrl = window.flowFormsData?.pluginUrl || '';
const LOGO_SRC = `${ pluginUrl }assets/images/logo.svg`;

const Logo = ( { size = 32, className = '', alt = 'FormsPress' } ) => (
	<img
		src={ LOGO_SRC }
		width={ size }
		height={ size }
		alt={ alt }
		className={ className }
		style={ { display: 'block' } }
	/>
);

export default Logo;
