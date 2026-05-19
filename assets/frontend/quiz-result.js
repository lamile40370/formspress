/* FlowForms — quiz result-screen renderer
 *
 * Hooks form submit responses and, when the backend returns a
 * `result_screen` payload (quiz mode), swaps the standard success message
 * for a quiz-result card showing title, message, and (optionally) a
 * score badge.
 *
 * Listens on the `flowforms:submit-success` custom event dispatched by
 * `forms.js` after a successful submission. Falls back to a one-time
 * mutation observer if forms.js does not dispatch (older builds).
 */
( function () {
	'use strict';

	function renderResultCard( form, result ) {
		var screen = result.result_screen;
		if ( ! screen ) return false;

		var box = form.querySelector( '.ff-form__messages' );
		if ( ! box ) {
			box = document.createElement( 'div' );
			box.className = 'ff-form__messages';
			form.appendChild( box );
		}

		var card = document.createElement( 'div' );
		card.className = 'ff-form__quiz-result';
		card.setAttribute( 'role', 'status' );

		var msg = ( screen.message || '' )
			.replace( /\{score\}/g,     String( result.score     != null ? result.score     : '' ) )
			.replace( /\{max_score\}/g, String( result.max_score != null ? result.max_score : '' ) );

		card.innerHTML = ''
			+ '<div class="ff-form__quiz-result__title">' + esc( screen.title || '' ) + '</div>'
			+ '<div class="ff-form__quiz-result__msg">'   + esc( msg ) + '</div>'
			+ ( result.score != null
				? '<div class="ff-form__quiz-result__score" aria-label="score">'
					+ '<span class="ff-form__quiz-result__score-num">' + esc( String( result.score ) ) + '</span>'
					+ '<span class="ff-form__quiz-result__score-sep"> / </span>'
					+ '<span class="ff-form__quiz-result__score-max">' + esc( String( result.max_score != null ? result.max_score : '' ) ) + '</span>'
					+ '</div>'
				: ''
			);

		box.innerHTML = '';
		box.appendChild( card );
		return true;
	}

	function esc( s ) {
		return String( s )
			.replace( /&/g, '&amp;' )
			.replace( /</g, '&lt;' )
			.replace( />/g, '&gt;' )
			.replace( /"/g, '&quot;' );
	}

	document.addEventListener( 'flowforms:submit-success', function ( e ) {
		var form   = e.target;
		var result = e.detail || {};
		if ( ! result.result_screen ) return;
		if ( ! ( form instanceof HTMLFormElement ) ) return;
		renderResultCard( form, result );
	} );

	window.FlowFormsQuizResult = { render: renderResultCard };
} )();
