/* FlowForms — calculation runtime
 *
 * Companion to `calc-evaluator.js`. Finds every `.ff-form__calc[data-formula]`
 * inside a form, recomputes it on every input/change, and writes the result
 * into the visible div + the hidden `<input data-formula-result>` so the
 * value is submitted with the rest of the form.
 *
 * Safe to load standalone — does nothing if no `.ff-form__calc` is found.
 */
( function () {
	'use strict';

	function collectValues( form ) {
		var data = {};
		var fd   = new FormData( form );
		fd.forEach( function ( value, key ) {
			if ( key.charAt( 0 ) === '_' ) return;
			if ( key.indexOf( '[]' ) === key.length - 2 ) {
				var k = key.slice( 0, -2 );
				data[ k ] = data[ k ] ? data[ k ] + ', ' + value : value;
			} else if ( data[ key ] !== undefined ) {
				data[ key ] = data[ key ] + ', ' + value;
			} else {
				data[ key ] = value;
			}
		} );
		return data;
	}

	function recompute( form ) {
		if ( ! window.FlowFormsCalc ) return;
		var calcs = form.querySelectorAll( '.ff-form__calc[data-formula]' );
		if ( ! calcs.length ) return;
		var values = collectValues( form );
		calcs.forEach( function ( el ) {
			var formula  = el.getAttribute( 'data-formula' )  || '';
			var format   = el.getAttribute( 'data-format' )   || 'number';
			var decimals = parseInt( el.getAttribute( 'data-decimals' ) || '2', 10 );
			var currency = el.getAttribute( 'data-currency' ) || 'EUR';
			var raw      = window.FlowFormsCalc.evaluate( formula, values );
			var formatted = window.FlowFormsCalc.format( raw, format, decimals, currency );
			el.textContent = formatted;
			/* Write the raw numeric value to the hidden input — the server
			 * recomputes anyway so we send it as a plain number, not the
			 * locale-formatted string. */
			var fieldId = el.getAttribute( 'data-field-id' );
			var hidden  = fieldId ? form.querySelector( 'input[name="' + fieldId + '"][data-formula-result]' ) : null;
			if ( ! hidden ) hidden = el.parentNode && el.parentNode.querySelector( 'input[data-formula-result]' );
			if ( hidden ) hidden.value = String( raw );
		} );
	}

	function init( form ) {
		if ( form.__ffCalcAttached ) return;
		form.__ffCalcAttached = true;
		recompute( form );
		form.addEventListener( 'input',  function () { recompute( form ); } );
		form.addEventListener( 'change', function () { recompute( form ); } );
	}

	function bootstrap() {
		document.querySelectorAll( '.ff-form--standard, .ff-form' ).forEach( init );
	}

	if ( document.readyState === 'loading' ) {
		document.addEventListener( 'DOMContentLoaded', bootstrap );
	} else {
		bootstrap();
	}

	window.FlowFormsCalcRuntime = { init: init, recompute: recompute };
} )();
