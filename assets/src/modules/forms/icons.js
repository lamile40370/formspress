import {
	envelope,
	link,
	redo,
	brush,
	chartBar,
	cog,
	payment,
	megaphone,
	institution,
	plugins,
} from '@wordpress/icons';

/**
 * String-to-icon map shared by Actions, Templates, and any other
 * registry that returns icon names as plain strings from PHP.
 *
 * Limitation: @wordpress/icons exports are not addressable by string
 * at runtime, so adding a new icon means adding it to this map.
 *
 * Note: 'email' is the public name; it maps to the @wordpress/icons
 * `envelope` icon (there is no `email` export).
 */
export const ICON_MAP = {
	email: envelope,
	link,
	redo,
	brush,
	chartBar,
	cog,
	payment,
	megaphone,
	institution,
	plugins,
};

export const ICON_OPTIONS = [
	{ value: 'email', label: 'Email' },
	{ value: 'cog', label: 'Cog' },
	{ value: 'chartBar', label: 'Chart' },
	{ value: 'brush', label: 'Brush' },
	{ value: 'link', label: 'Link' },
	{ value: 'redo', label: 'Redo' },
];

export const resolveIcon = ( name ) => ICON_MAP[ name ] || null;
