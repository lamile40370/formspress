/**
 * FormsPress — frontend analytics tracker.
 *
 * Wires up view/start/step/submit/abandon events on every `.ff-form` instance.
 * Designed to be included before forms.js so the global `window.ffAnalytics`
 * object is available when initStandardForm / initFlowForm run.
 *
 * Privacy: no IP collected client-side, no PII transmitted, session_id is a
 * random per-tab token stored in sessionStorage.
 */
( function () {
	'use strict';

	var API_ROOT = ( window.ffData && window.ffData.apiRoot ) || '/wp-json/flowforms/v1';

	/* ── Session id (sticky per browser tab) ─────────────────────── */
	function getSessionId() {
		var key = 'ff_session_id';
		try {
			var v = window.sessionStorage.getItem( key );
			if ( v ) return v;
			v = 'ff-' + Math.random().toString( 36 ).slice( 2 ) + Date.now().toString( 36 );
			window.sessionStorage.setItem( key, v );
			return v;
		} catch ( e ) {
			/* sessionStorage blocked (private mode, etc.) — random per pageload. */
			return 'ff-' + Math.random().toString( 36 ).slice( 2 );
		}
	}

	/* ── Variant id from cookie ──────────────────────────────────── */
	function getVariantId( formId ) {
		try {
			var match = document.cookie.match( new RegExp( '(?:^|; )ff_variant_' + formId + '=([^;]*)' ) );
			return match ? decodeURIComponent( match[1] ) : null;
		} catch ( e ) { return null; }
	}

	/* ── Network send: fetch (default) or sendBeacon (abandon) ───── */
	function send( payload, useBeacon ) {
		var url = API_ROOT + '/analytics/track';
		try {
			if ( useBeacon && navigator.sendBeacon ) {
				var blob = new Blob( [ JSON.stringify( payload ) ], { type: 'application/json' } );
				navigator.sendBeacon( url, blob );
				return;
			}
			fetch( url, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify( payload ),
				keepalive: true,
				credentials: 'omit',
			} ).catch( function () {} );
		} catch ( e ) { /* swallow */ }
	}

	/**
	 * Public API: window.ffAnalytics.track('event', { form_id, step_index })
	 * The form-bound tracker (mountFormTracker) returns a `track()` closure
	 * pre-bound to a single form for convenience.
	 */
	function track( event, extras ) {
		var p = extras || {};
		send( {
			form_id:    p.form_id || 0,
			event:      event,
			step_index: ( typeof p.step_index === 'number' ) ? p.step_index : null,
			variant_id: p.variant_id || null,
			session_id: getSessionId(),
			referrer:   document.referrer || null,
		}, !! p.useBeacon );
	}

	/**
	 * Attach lifecycle listeners to a form element. Returns a `track(event, extras)`
	 * closure that the form-specific runtime can call (e.g. on showStep / submit).
	 *
	 * `getStep` is a function returning the current step index (or null).
	 */
	function mountFormTracker( formEl, getStep ) {
		var formId    = parseInt( formEl.dataset.formId, 10 );
		var variantId = getVariantId( formId ) || formEl.dataset.variantId || null;
		var started   = false;
		var submitted = false;

		function boundTrack( event, extras ) {
			extras = extras || {};
			extras.form_id    = formId;
			extras.variant_id = variantId;
			track( event, extras );
		}

		/* `start` — first focus on any input within the form. */
		function onFirstInteract() {
			if ( started ) return;
			started = true;
			boundTrack( 'start' );
			formEl.removeEventListener( 'focusin', onFirstInteract );
			formEl.removeEventListener( 'input',   onFirstInteract );
		}
		formEl.addEventListener( 'focusin', onFirstInteract );
		formEl.addEventListener( 'input',   onFirstInteract );

		/* `abandon` — on page unload if form started but not submitted, and at
		 * least one visible input has a value. Uses sendBeacon. */
		function onBeforeUnload() {
			if ( ! started || submitted ) return;
			if ( ! hasAnyValue( formEl ) ) return;
			var step = ( typeof getStep === 'function' ) ? getStep() : null;
			boundTrack( 'abandon', { step_index: step, useBeacon: true } );
		}
		window.addEventListener( 'beforeunload', onBeforeUnload );
		window.addEventListener( 'pagehide',     onBeforeUnload );

		/* Expose a helper that flips `submitted` so abandon won't fire. */
		boundTrack._markSubmitted = function () { submitted = true; };
		boundTrack.formId    = formId;
		boundTrack.variantId = variantId;

		return boundTrack;
	}

	function hasAnyValue( formEl ) {
		var inputs = formEl.querySelectorAll( 'input, textarea, select' );
		for ( var i = 0; i < inputs.length; i++ ) {
			var el = inputs[ i ];
			if ( el.name && el.name.charAt( 0 ) === '_' ) continue;
			if ( el.type === 'hidden' ) continue;
			if ( el.type === 'checkbox' || el.type === 'radio' ) {
				if ( el.checked ) return true;
			} else if ( ( el.value || '' ).trim() !== '' ) {
				return true;
			}
		}
		return false;
	}

	window.ffAnalytics = {
		track: track,
		mountFormTracker: mountFormTracker,
		getSessionId: getSessionId,
		getVariantId: getVariantId,
	};
} )();
