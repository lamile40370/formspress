/**
 * Tiny shim that grants this plugin access to Gutenberg's private APIs.
 *
 * Gutenberg gates components like `TabbedSidebar` behind a lock/unlock
 * system whose opt-in checks:
 *
 *   1. The caller's module name against a hard-coded allowlist
 *      (`CORE_MODULES_USING_PRIVATE_APIS`).
 *   2. A verbatim consent string. WordPress changed the wording
 *      between releases, so we try both forms.
 *
 * Newer `@wordpress/private-apis` exposes `allowCoreModule()` to add
 * names at runtime — but the version bundled with the live WordPress
 * install can be older, in which case that call silently no-ops and
 * the opt-in throws.
 *
 * Workaround: identify as a core module that's ALWAYS in the
 * allowlist (`@wordpress/edit-post`). The lock/unlock pair returned
 * uses a single shared WeakMap, so once we hold a valid pair we can
 * unlock any package's privateApis — whoever asked.
 *
 * Trade-off acknowledged inline by the plugin author. The components
 * unlocked this way (TabbedSidebar today) may break on any WordPress
 * release; we accept that for the native-look UX.
 */
import {
	__dangerousOptInToUnstableAPIsOnlyForCoreModules,
	allowCoreModule,
} from '@wordpress/private-apis';

// Names that have shipped in the allowlist across multiple WP versions
// — we try them in order so we keep working through Gutenberg refactors.
const KNOWN_ALLOWED_NAMES = [
	'@wordpress/edit-post',
	'@wordpress/edit-site',
	'@wordpress/editor',
	'@wordpress/block-editor',
];

// WordPress has used two consent strings across releases — try both.
const CONSENTS = [
	'I acknowledge private features are not for use in themes or plugins and doing so will break in the next version of WordPress.',
	'I know using unstable features means my plugin or theme will inevitably break on the next WordPress release.',
];

let cached = null;
let attempted = false;

/**
 * Returns `{ lock, unlock }` so callers can pry open any package's
 * `privateApis`. Returns `null` if every combination of allowed name
 * and consent string fails (e.g. on a very old WP).
 *
 * Callers should fall back to a public component when this returns
 * null — never throw to the user.
 */
export const getLockUnlock = () => {
	if ( attempted ) return cached;
	attempted = true;

	// First, try registering our own plugin name if the runtime
	// supports it (newer @wordpress/private-apis only).
	try {
		if ( 'function' === typeof allowCoreModule ) {
			allowCoreModule( '@wordpress/formspress' );
		}
	} catch ( e ) {
		// no-op
	}

	const candidates = [ '@wordpress/formspress', ...KNOWN_ALLOWED_NAMES ];
	for ( const name of candidates ) {
		for ( const consent of CONSENTS ) {
			try {
				cached = __dangerousOptInToUnstableAPIsOnlyForCoreModules(
					consent,
					name
				);
				return cached;
			} catch ( e ) {
				// Try the next combination silently — the final
				// failure surfaces via `cached === null`.
			}
		}
	}
	return cached; // null
};
