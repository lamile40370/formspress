/**
 * Frontend runtime for `formspress/form` — uses the WordPress Interactivity API.
 *
 * Loaded as a script module (`viewScriptModule` in block.json), so the
 * `@wordpress/interactivity` package is auto-resolved by WordPress core (no
 * webpack bundling of the store needed). Only the **standard** form goes
 * through this store; flow forms still use the imperative `assets/frontend/forms.js`.
 *
 * REST contract is unchanged: POST `${apiRoot}/forms/${formId}/submit` with
 * a flat JSON body { fieldId: value, _source_url }.
 */
import { store, getContext, getElement } from '@wordpress/interactivity';

const { state, actions } = store( 'formspress', {
	state: {
		get isSuccess() {
			return getContext().messageType === 'success';
		},
		get isError() {
			return getContext().messageType === 'error';
		},
	},
	actions: {
		*submit( event ) {
			event.preventDefault();

			const ctx = getContext();
			const form = event.target;

			if ( ctx.isSubmitting ) {
				return;
			}

			ctx.isSubmitting = true;
			ctx.message = '';
			ctx.messageType = '';
			ctx.errors = {};

			yield acquireSpamToken( form );

			/* Clear inline error nodes that the server rendered, and reset
			 * aria-invalid on every interactive control. */
			form
				.querySelectorAll( '.ff-form__field-error' )
				.forEach( ( n ) => ( n.textContent = '' ) );
			form
				.querySelectorAll( '[aria-invalid="true"]' )
				.forEach( ( n ) => n.setAttribute( 'aria-invalid', 'false' ) );

			/* Build flat payload — checkbox arrays collapse to a comma string,
			 * matching the legacy `forms.js` runtime + REST handler. */
			const data = {};
			const fd = new FormData( form );
			for ( const [ key, value ] of fd.entries() ) {
				if ( key.endsWith( '[]' ) ) {
					const k = key.slice( 0, -2 );
					data[ k ] = data[ k ] ? `${ data[ k ] }, ${ value }` : value;
				} else {
					data[ key ] = value;
				}
			}

			const apiRoot =
				state.apiRoot ||
				( window.ffData && window.ffData.apiRoot ) ||
				'/wp-json/flowforms/v1';
			const nonce =
				state.nonce || ( window.ffData && window.ffData.nonce ) || '';

			try {
				const res = yield fetch(
					`${ apiRoot }/forms/${ ctx.formId }/submit`,
					{
						method: 'POST',
						headers: {
							'Content-Type': 'application/json',
							'X-WP-Nonce': nonce,
						},
						body: JSON.stringify( data ),
					}
				);

				const result = yield res.json();

				if ( result.success ) {
					if ( result.action === 'redirect' && result.redirect ) {
						window.location.href = result.redirect;
						return;
					}
					ctx.message = result.message || '';
					ctx.messageType = 'success';
					form.reset();
				} else if ( result.errors ) {
					ctx.errors = result.errors;
					ctx.messageType = 'error';
					/* The server returned per-field errors keyed by field id;
					 * paint them into the existing error placeholders. */
					Object.keys( result.errors ).forEach( ( fieldId ) => {
						const node = form.querySelector(
							`#ff-error-${ fieldId }`
						);
						if ( node ) {
							node.textContent = result.errors[ fieldId ];
						}
						// Flip aria-invalid + focus first invalid field for a11y.
						const input = form.querySelector(
							`[name="${ fieldId }"], [name="${ fieldId }[]"]`
						);
						if ( input ) {
							input.setAttribute( 'aria-invalid', 'true' );
						}
					} );
					// Move focus to first invalid input — WCAG 3.3.1.
					const firstInvalid = form.querySelector(
						'[aria-invalid="true"]'
					);
					if ( firstInvalid && typeof firstInvalid.focus === 'function' ) {
						firstInvalid.focus();
					}
				} else {
					ctx.message = result.message || 'An error occurred.';
					ctx.messageType = 'error';
				}
			} catch ( err ) {
				ctx.message = 'A network error occurred. Please try again.';
				ctx.messageType = 'error';
			} finally {
				ctx.isSubmitting = false;
			}
		},

		/* Star-rating click + keyboard handler. Preserves the legacy DOM
		 * contract (`.is-active`) so existing CSS keeps working, while
		 * tracking aria-checked on each radio button. */
		rateStar( event ) {
			const { ref } = getElement();
			if ( ! ref ) return;
			const value = parseInt( ref.dataset.value, 10 );
			setRating( ref, value );
		},

		/* Keyboard handler (left/right/home/end + space/enter) for the
		 * rating buttons; wired in render.php's data-wp-on--keydown if
		 * desired, but most browsers already deliver Space/Enter as click. */
		rateStarKey( event ) {
			const key = event.key;
			if ( ! [ 'ArrowLeft', 'ArrowRight', 'Home', 'End' ].includes( key ) ) {
				return;
			}
			event.preventDefault();
			const { ref } = getElement();
			if ( ! ref ) return;
			const rating = ref.closest( '.ff-form__rating' );
			if ( ! rating ) return;
			const stars = Array.from(
				rating.querySelectorAll( '.ff-form__star' )
			);
			const current = parseInt( ref.dataset.value, 10 );
			let next = current;
			if ( key === 'ArrowRight' ) next = Math.min( stars.length, current + 1 );
			if ( key === 'ArrowLeft' ) next = Math.max( 1, current - 1 );
			if ( key === 'Home' ) next = 1;
			if ( key === 'End' ) next = stars.length;
			setRating( stars[ next - 1 ], next );
			stars[ next - 1 ].focus();
		},
	},
} );

function setRating( ref, value ) {
	const rating = ref.closest( '.ff-form__rating' );
	if ( ! rating ) return;
	const hidden = rating.querySelector( '.ff-rating-value' );
	if ( hidden ) hidden.value = String( value );
	rating.querySelectorAll( '.ff-form__star' ).forEach( ( s ) => {
		const v = parseInt( s.dataset.value, 10 );
		s.classList.toggle( 'is-active', v <= value );
		s.setAttribute( 'aria-checked', v === value ? 'true' : 'false' );
		s.setAttribute( 'tabindex', v === value ? '0' : '-1' );
	} );
}

function acquireSpamToken( form ) {
	const provider = form.dataset.spamProvider;
	const siteKey = form.dataset.spamSiteKey || '';
	const tokenField = form.dataset.spamTokenField || '_ff_spam_token';
	const hidden = form.querySelector( `input[name="${ tokenField }"]` );

	if ( ! provider || ! siteKey ) {
		return Promise.resolve();
	}

	if (
		provider === 'recaptcha_v3' &&
		window.grecaptcha &&
		typeof window.grecaptcha.execute === 'function'
	) {
		return new Promise( ( resolve ) => {
			try {
				window.grecaptcha.ready( () => {
					window.grecaptcha
						.execute( siteKey, { action: 'submit' } )
						.then( ( token ) => {
							if ( hidden ) {
								hidden.value = token;
							}
							resolve();
						} )
						.catch( () => resolve() );
				} );
			} catch ( err ) {
				resolve();
			}
		} );
	}

	if ( provider === 'turnstile' ) {
		const cf = form.querySelector( 'input[name="cf-turnstile-response"]' );
		if ( cf && hidden ) {
			hidden.value = cf.value || '';
		}
		return Promise.resolve();
	}

	if ( provider === 'hcaptcha' ) {
		const hc = form.querySelector(
			'textarea[name="h-captcha-response"], input[name="h-captcha-response"]'
		);
		if ( hc && hidden ) {
			hidden.value = hc.value || '';
		}
		return Promise.resolve();
	}

	return Promise.resolve();
}
