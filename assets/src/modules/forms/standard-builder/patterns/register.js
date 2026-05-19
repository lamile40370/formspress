import { __ } from '@wordpress/i18n';

import contactForm from './contact-form';
import newsletter from './newsletter';
import rsvp from './rsvp';
import quoteRequest from './quote-request';
import feedback from './feedback';
import twoColumnContact from './two-column-contact';
import eventRegistration from './event-registration';
import coverHero from './cover-hero';

/**
 * FormsPress block-pattern category, surfaced to the block editor via
 * `settings.__experimentalBlockPatternCategories`.
 */
export const PATTERN_CATEGORY = {
	name: 'formspress',
	label: __( 'Forms', 'flowforms' ),
};

/**
 * Flat list of patterns ready to be passed via
 * `settings.__experimentalBlockPatterns` on `BlockEditorProvider`.
 *
 * That's the channel `__experimentalLibrary` reads from — calling
 * `registerBlockPattern` from `@wordpress/blocks` only populates the
 * global `core/blocks` store, which the in-editor Library does not
 * consume. Settings is the right place.
 */
export const PATTERNS = [
	[ 'formspress/contact-form', contactForm ],
	[ 'formspress/newsletter', newsletter ],
	[ 'formspress/cover-hero', coverHero ],
	[ 'formspress/rsvp', rsvp ],
	[ 'formspress/quote-request', quoteRequest ],
	[ 'formspress/feedback', feedback ],
	[ 'formspress/two-column-contact', twoColumnContact ],
	[ 'formspress/event-registration', eventRegistration ],
].map( ( [ name, args ] ) => ( {
	name,
	categories: [ 'formspress' ],
	// Tells the BlockPreview iframe what viewport size to scale from.
	// Without it, previews render at 0×0 and appear blank in the inserter
	// + Pattern Explorer modal.
	viewportWidth: 600,
	...args,
} ) );
