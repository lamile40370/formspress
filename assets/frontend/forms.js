/* FlowForms — frontend form handler */
( function () {
	'use strict';

	var API_ROOT = ( window.ffData && window.ffData.apiRoot ) || '/wp-json/flowforms/v1';
	var NONCE    = ( window.ffData && window.ffData.nonce )   || '';

	/* ── STANDARD FORMS ─────────────────────────────────────────── */

	document.querySelectorAll( '.ff-form--standard' ).forEach( function ( form ) {
		initStandardForm( form );
	} );

	/* ── ANTI-SPAM ─────────────────────────────────────────────────
	 * Acquire a token from the active provider before submission.
	 * Provider is identified by `data-spam-provider` on the form element. */
	function acquireSpamToken( form ) {
		var provider = form.dataset.spamProvider;
		var siteKey  = form.dataset.spamSiteKey  || '';
		var tokenFld = form.dataset.spamTokenField || '_ff_spam_token';
		var hidden   = form.querySelector( 'input[name="' + tokenFld + '"]' );

		if ( ! provider || ! siteKey ) {
			return Promise.resolve();
		}

		if ( provider === 'recaptcha_v3' && window.grecaptcha && typeof window.grecaptcha.execute === 'function' ) {
			return new Promise( function ( resolve ) {
				try {
					window.grecaptcha.ready( function () {
						window.grecaptcha.execute( siteKey, { action: 'submit' } ).then( function ( token ) {
							if ( hidden ) hidden.value = token;
							resolve();
						} ).catch( function () { resolve(); } );
					} );
				} catch ( e ) { resolve(); }
			} );
		}

		if ( provider === 'turnstile' ) {
			/* Turnstile auto-fills its own input named cf-turnstile-response; mirror into our hidden field. */
			var cf = form.querySelector( 'input[name="cf-turnstile-response"]' );
			if ( cf && hidden ) hidden.value = cf.value || '';
			return Promise.resolve();
		}

		if ( provider === 'hcaptcha' ) {
			var hc = form.querySelector( 'textarea[name="h-captcha-response"], input[name="h-captcha-response"]' );
			if ( hc && hidden ) hidden.value = hc.value || '';
			return Promise.resolve();
		}

		return Promise.resolve();
	}

	/* Expose Turnstile / hCaptcha global callbacks that copy the token into our hidden input. */
	window.ffTurnstileCallback = function ( token ) {
		document.querySelectorAll( '.ff-form .ff-spam-token[data-provider="turnstile"]' ).forEach( function ( i ) { i.value = token; } );
	};
	window.ffHcaptchaCallback = function ( token ) {
		document.querySelectorAll( '.ff-form .ff-spam-token[data-provider="hcaptcha"]' ).forEach( function ( i ) { i.value = token; } );
	};

	function initStandardForm( form ) {
		var formId    = form.dataset.formId;
		var submitBtn = form.querySelector( '.ff-form__submit' );
		var prevBtn   = form.querySelector( '.ff-form__prev' );
		var nextBtn   = form.querySelector( '.ff-form__next' );
		var progress  = form.querySelector( '.ff-form__progress-bar' );
		var pages     = Array.prototype.slice.call( form.querySelectorAll( '.ff-form__page' ) );
		var schema    = safeJSON( form.dataset.fieldsSchema, [] );
		var settings  = safeJSON( form.dataset.formSettings, {} );
		var currentPageInput = form.querySelector( 'input[name="_ff_current_page"]' );
		var totalPages = pages.length || 1;
		var currentPage = 0;
		var usesInteractivitySubmit = form.dataset.ffInteractivitySubmit === '1';

		setupRatingFields( form );
		setupSelectPlaceholders( form );

		/* ── Conditional logic: re-evaluate every visible field's `data-conditions` */
		function evaluateConditions() {
			var values = collectValues( form );
			form.querySelectorAll( '[data-conditions]' ).forEach( function ( el ) {
				var cond = safeJSON( el.dataset.conditions, null );
				if ( ! cond ) return;
				var visible = ConditionEval.evaluate( cond, values );
				if ( visible ) {
					el.removeAttribute( 'hidden' );
					el.style.display = '';
					el.setAttribute( 'aria-hidden', 'false' );
				} else {
					el.setAttribute( 'hidden', '' );
					el.style.display = 'none';
					el.setAttribute( 'aria-hidden', 'true' );
				}
			} );
		}

		form.addEventListener( 'input',  evaluateConditions );
		form.addEventListener( 'change', evaluateConditions );
		evaluateConditions();

		/* ── Pagination — only active when totalPages > 1 ───────────── */
		function showPage( idx ) {
			currentPage = Math.max( 0, Math.min( idx, totalPages - 1 ) );
			pages.forEach( function ( p, i ) {
				if ( i === currentPage ) {
					p.removeAttribute( 'hidden' );
				} else {
					p.setAttribute( 'hidden', '' );
				}
			} );
			if ( currentPageInput ) currentPageInput.value = String( currentPage );
			if ( prevBtn ) prevBtn.toggleAttribute( 'hidden', currentPage === 0 );
			if ( nextBtn ) nextBtn.toggleAttribute( 'hidden', currentPage >= totalPages - 1 );
			if ( submitBtn ) submitBtn.toggleAttribute( 'hidden', currentPage < totalPages - 1 );
			if ( progress ) {
				var pct = Math.round( ( ( currentPage + 1 ) / totalPages ) * 100 );
				progress.style.width = pct + '%';
			}
			try { form.scrollIntoView( { behavior: 'smooth', block: 'start' } ); } catch ( e ) {}
		}

		function validateCurrentPage() {
			var pageEl = pages[ currentPage ];
			if ( ! pageEl ) return true;
			var ok = true;
			clearErrors( pageEl );
			pageEl.querySelectorAll( '[data-field-id]' ).forEach( function ( wrap ) {
				if ( wrap.hasAttribute( 'hidden' ) ) return;
				var fieldId = wrap.dataset.fieldId;
				var input   = wrap.querySelector( '[name="' + fieldId + '"], [name="' + fieldId + '[]"]' );
				if ( ! input ) return;
				var required = !! input.required || input.hasAttribute( 'required' );
				var value    = collectValues( form )[ fieldId ];
				var empty    = value === '' || value == null || ( Array.isArray( value ) && value.length === 0 );
				if ( required && empty ) {
					ok = false;
					var errEl = wrap.querySelector( '.ff-form__field-error' );
					if ( errEl ) errEl.textContent = 'This field is required.';
				}
			} );
			return ok;
		}

		if ( nextBtn ) {
			nextBtn.addEventListener( 'click', function () {
				if ( ! validateCurrentPage() ) return;
				/* Skip pages whose fields are all hidden via conditions. */
				var next = currentPage + 1;
				while ( next < totalPages - 1 && isPageEmpty( pages[ next ] ) ) next++;
				showPage( next );
			} );
		}
		if ( prevBtn ) {
			prevBtn.addEventListener( 'click', function () {
				var prev = currentPage - 1;
				while ( prev > 0 && isPageEmpty( pages[ prev ] ) ) prev--;
				showPage( Math.max( 0, prev ) );
			} );
		}

		if ( totalPages > 1 ) showPage( 0 );

		/* ── Save-and-resume ──────────────────────────────────────── */
		var resumeToken = null;
		if ( settings.enable_save_resume ) {
			mountSaveResumeUI( form, settings, function () { return collectValues( form ); }, function () { return currentPage; }, function ( t ) { resumeToken = t; } );
			maybeRestoreFromUrl( form, formId, schema, function ( draft ) {
				resumeToken = draft.token;
				populateValues( form, draft.data || {} );
				if ( totalPages > 1 && draft.current_step != null ) {
					showPage( parseInt( draft.current_step, 10 ) || 0 );
				}
				evaluateConditions();
			} );
		}

		/* ── Submission ───────────────────────────────────────────── */
		if ( ! usesInteractivitySubmit ) {
			form.addEventListener( 'submit', function ( e ) {
				e.preventDefault();
				clearErrors( form );

				if ( totalPages > 1 && ! validateCurrentPage() ) return;

				var data = collectValues( form );
				/* Strip any field hidden by conditions. */
				form.querySelectorAll( '[data-conditions][hidden] [data-field-id], [data-conditions][hidden][data-field-id]' ).forEach( function ( wrap ) {
					var fid = wrap.dataset && wrap.dataset.fieldId;
					if ( fid ) delete data[ fid ];
				} );

				if ( submitBtn ) {
					submitBtn.disabled    = true;
					submitBtn.textContent = '…';
				}

				acquireSpamToken( form ).then( function () {
					/* Re-collect after spam token is filled. */
					data = collectValues( form );
					return fetch( API_ROOT + '/forms/' + formId + '/submit', {
						method: 'POST',
						headers: { 'Content-Type': 'application/json', 'X-WP-Nonce': NONCE },
						body: JSON.stringify( data ),
					} );
				} )
				.then( function ( res ) { return res.json(); } )
				.then( function ( result ) {
					if ( submitBtn ) {
						submitBtn.disabled    = false;
						submitBtn.textContent = submitBtn.getAttribute( 'data-original-label' ) || 'Submit';
					}

					if ( result.success ) {
						if ( result.action === 'redirect' && result.redirect ) {
							window.location.href = result.redirect;
						} else {
							showMessage( form, result.message, 'success' );
							form.reset();
						}
					} else if ( result.errors ) {
						showFieldErrors( form, result.errors );
					} else {
						showMessage( form, result.message || 'An error occurred.', 'error' );
					}
				} )
				.catch( function () {
					if ( submitBtn ) submitBtn.disabled = false;
					showMessage( form, 'A network error occurred. Please try again.', 'error' );
				} );
			} );
		}

		if ( submitBtn ) submitBtn.setAttribute( 'data-original-label', submitBtn.textContent );

		function isPageEmpty( pageEl ) {
			if ( ! pageEl ) return true;
			var visible = pageEl.querySelectorAll( '[data-field-id]:not([hidden])' );
			return visible.length === 0;
		}
	}

	function setupSelectPlaceholders( form ) {
		form.querySelectorAll( '.ff-form__select' ).forEach( function ( select ) {
			function syncPlaceholderState() {
				select.classList.toggle( 'is-placeholder', ! select.value );
			}

			syncPlaceholderState();
			select.addEventListener( 'change', syncPlaceholderState );
		} );
	}

	/* Collect all form values into a flat { id: value } object. Handles
	 * multi-checkbox via [] suffix and joins them into a comma string for
	 * compat with the existing PHP storage layer. */
	function collectValues( form ) {
		var data = {};
		var fd   = new FormData( form );
		fd.forEach( function ( value, key ) {
			if ( key.charAt( 0 ) === '_' ) return; /* skip internal fields */
			if ( key.endsWith( '[]' ) ) {
				var k = key.slice( 0, -2 );
				data[ k ] = data[ k ] ? data[ k ] + ', ' + value : value;
			} else {
				data[ key ] = value;
			}
		} );
		return data;
	}

	function populateValues( form, data ) {
		Object.keys( data || {} ).forEach( function ( key ) {
			var val = data[ key ];
			var inputs = form.querySelectorAll( '[name="' + key + '"], [name="' + key + '[]"]' );
			inputs.forEach( function ( input ) {
				if ( input.type === 'checkbox' || input.type === 'radio' ) {
					var vals = String( val ).split( ',' ).map( function ( s ) { return s.trim(); } );
					input.checked = vals.indexOf( input.value ) > -1;
				} else {
					input.value = val;
				}
			} );
		} );
	}

	/* ── Save & resume UI ─────────────────────────────────────────── */

	function mountSaveResumeUI( form, settings, getValues, getStep, setToken ) {
		var pagination = form.querySelector( '.ff-form__pagination' );
		var anchor     = pagination || form;

		var link = document.createElement( 'button' );
		link.type        = 'button';
		link.className   = 'ff-form__save-resume-link';
		link.textContent = settings.save_resume_label || 'Save and resume later';

		var panel = document.createElement( 'div' );
		panel.className = 'ff-form__save-resume-panel';
		panel.hidden    = true;
		panel.innerHTML =
			'<label class="ff-form__label">Your email' +
			'<input type="email" class="ff-form__input ff-form__save-resume-email" placeholder="you@example.com" /></label>' +
			'<button type="button" class="ff-form__save-resume-submit">Send me a link</button>' +
			'<div class="ff-form__save-resume-msg" aria-live="polite"></div>';

		link.addEventListener( 'click', function () { panel.hidden = ! panel.hidden; } );

		var submit = panel.querySelector( '.ff-form__save-resume-submit' );
		var input  = panel.querySelector( '.ff-form__save-resume-email' );
		var msg    = panel.querySelector( '.ff-form__save-resume-msg' );

		submit.addEventListener( 'click', function () {
			var email = ( input.value || '' ).trim();
			if ( ! email ) { msg.textContent = 'Please enter your email.'; return; }
			msg.textContent = 'Saving…';
			fetch( API_ROOT + '/forms/' + form.dataset.formId + '/save-progress', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json', 'X-WP-Nonce': NONCE },
				body: JSON.stringify( {
					email: email,
					data: getValues(),
					current_step: getStep(),
					token: form.dataset.resumeToken || '',
					_source_url: window.location.href,
				} ),
			} )
			.then( function ( r ) { return r.json(); } )
			.then( function ( result ) {
				if ( result && result.success ) {
					form.dataset.resumeToken = result.token;
					setToken( result.token );
					msg.textContent = 'Check your inbox — we sent you a link to resume.';
				} else {
					msg.textContent = ( result && result.message ) || 'Could not save your progress.';
				}
			} )
			.catch( function () { msg.textContent = 'A network error occurred.'; } );
		} );

		anchor.parentNode.insertBefore( link, anchor );
		anchor.parentNode.insertBefore( panel, anchor );
	}

	function maybeRestoreFromUrl( form, formId, schema, onDraft ) {
		var params = new URLSearchParams( window.location.search );
		var token  = params.get( 'formspress_resume' );
		if ( ! token ) return;
		fetch( API_ROOT + '/forms/' + formId + '/draft?token=' + encodeURIComponent( token ), {
			headers: { 'X-WP-Nonce': NONCE },
		} )
		.then( function ( r ) { return r.json(); } )
		.then( function ( draft ) { if ( draft && draft.success ) { form.dataset.resumeToken = draft.token; onDraft( draft ); } } )
		.catch( function () {} );
	}

	/* ── Condition evaluator (mirror of PHP ConditionEvaluator) ───── */
	var ConditionEval = {
		evaluate: function ( conditions, values ) {
			if ( ! conditions || ! conditions.rules || conditions.rules.length === 0 ) return true;
			var action  = conditions.action || 'show';
			var logic   = conditions.logic  || 'all';
			var matched = this.evalRules( conditions.rules, logic, values );
			return action === 'show' ? matched : ! matched;
		},
		evalRules: function ( rules, logic, values ) {
			var results = rules.map( function ( r ) { return ConditionEval.evalRule( r, values ); } );
			if ( logic === 'any' ) return results.indexOf( true ) > -1;
			return results.indexOf( false ) === -1;
		},
		evalRule: function ( rule, values ) {
			var op       = rule.op || 'equals';
			var expected = rule.value == null ? '' : String( rule.value );
			var actual   = values[ rule.field ];
			var actualStr = Array.isArray( actual ) ? actual.join( ', ' ) : ( actual == null ? '' : String( actual ) );
			switch ( op ) {
				case 'equals':       return actualStr === expected;
				case 'not_equals':   return actualStr !== expected;
				case 'contains':     return actualStr !== '' && expected !== '' && actualStr.toLowerCase().indexOf( expected.toLowerCase() ) > -1;
				case 'not_contains': return expected === '' || actualStr.toLowerCase().indexOf( expected.toLowerCase() ) === -1;
				case 'is_empty':     return actualStr.trim() === '';
				case 'is_not_empty': return actualStr.trim() !== '';
				case 'is_truthy':    return [ '1', 'true', 'yes', 'on' ].indexOf( actualStr.toLowerCase() ) > -1 || ( actualStr.trim() !== '' && actualStr !== '0' && actualStr.toLowerCase() !== 'false' );
				case 'is_falsy':     return [ '', '0', 'false', 'no', 'off' ].indexOf( actualStr.toLowerCase() ) > -1;
				case 'greater_than': return ! isNaN( parseFloat( actualStr ) ) && ! isNaN( parseFloat( expected ) ) && parseFloat( actualStr ) > parseFloat( expected );
				case 'less_than':    return ! isNaN( parseFloat( actualStr ) ) && ! isNaN( parseFloat( expected ) ) && parseFloat( actualStr ) < parseFloat( expected );
			}
			return false;
		},
	};
	window.FlowFormsConditions = ConditionEval;

	/* ── FLOW FORMS (Typeform-style) ────────────────────────────── */

	function initFlowForm( wrapper ) {
		/* Abort any previous keydown listener attached to document for this wrapper */
		if ( wrapper._ffCtrl && typeof wrapper._ffCtrl.abort === 'function' ) {
			try { wrapper._ffCtrl.abort(); } catch ( e ) {}
		}
		var ctrl = new AbortController();
		wrapper._ffCtrl = ctrl;

		var formId   = wrapper.dataset.formId;
		var settings = safeJSON( wrapper.dataset.settings, {} );
		var fields   = safeJSON( wrapper.dataset.fields, [] );
		var answers  = {};
		var currentStep = -1;

		/* Apply theme CSS custom properties */
		var theme = settings.theme || {};
		if ( theme.bg )         wrapper.style.setProperty( '--ff-bg',          theme.bg );
		if ( theme.text )       wrapper.style.setProperty( '--ff-text',        theme.text );
		if ( theme.primary )    wrapper.style.setProperty( '--ff-primary',     theme.primary );
		if ( theme.btnText )    wrapper.style.setProperty( '--ff-btn-text',    theme.btnText );
		if ( theme.fontFamily ) wrapper.style.setProperty( '--ff-font-family', theme.fontFamily );
		if ( theme.btnRadius )  wrapper.style.setProperty( '--ff-btn-radius',  theme.btnRadius );
		if ( theme.btnBg )      wrapper.style.setProperty( '--ff-btn-bg',      theme.btnBg );

		var activeFields = fields.filter( function ( f ) {
			return ! [ 'section', 'page_break', 'hidden' ].includes( f.type );
		} );

		var isFullscreen = wrapper.classList.contains( 'ff-form--fullscreen' );

		/* ── Build DOM structure ── */

		/* Progress bar */
		var progressWrap = el( 'div', 'ff-form__progress' );
		var progressBar  = el( 'div', 'ff-form__progress-bar' );
		progressBar.style.width = '0%';
		progressWrap.appendChild( progressBar );

		/* Close button (shown in fullscreen) */
		var closeBtn     = el( 'button', 'ff-form__close-btn' );
		closeBtn.textContent = '✕';
		closeBtn.setAttribute( 'aria-label', 'Close form' );
		closeBtn.addEventListener( 'click', deactivate );

		/* Stage */
		var stage = el( 'div', 'ff-flow-stage' );

		wrapper.innerHTML = '';
		wrapper.appendChild( progressWrap );
		wrapper.appendChild( closeBtn );
		wrapper.appendChild( stage );

		/* ── Welcome screen ── */
		showWelcome();

		/* Auto-activate on direct-link fullscreen page */
		if ( isFullscreen ) {
			activate();
		}

		/* Preview-mode jump: caller can set wrapper.dataset.previewStep to focus a specific step */
		if ( wrapper.dataset.previewStep !== undefined && wrapper.dataset.previewStep !== '' ) {
			var ps = wrapper.dataset.previewStep;
			if ( ps !== 'welcome' ) {
				activate();
				if ( ps === 'end' ) {
					showEnd( {} );
				} else {
					var psIdx = parseInt( ps, 10 );
					if ( ! isNaN( psIdx ) && psIdx >= 0 ) {
						showStep( Math.min( psIdx, activeFields.length ) );
					}
				}
			}
		}

		/* ── Keyboard: Enter to advance ── */
		document.addEventListener( 'keydown', function ( e ) {
			if ( ! wrapper.classList.contains( 'ff-form--active' ) ) return;
			if ( currentStep < 0 || currentStep >= activeFields.length ) return;
			if ( e.key !== 'Enter' ) return;
			/* Allow Enter in textareas only with Ctrl/Cmd */
			var focused = document.activeElement;
			if ( focused && focused.tagName === 'TEXTAREA' && ! e.ctrlKey && ! e.metaKey ) return;
			e.preventDefault();
			advanceStep();
		}, { signal: ctrl.signal } );

		/* ── Functions ── */

		function activate() {
			wrapper.classList.add( 'ff-form--active' );
		}

		function deactivate() {
			if ( isFullscreen ) {
				window.history.length > 1 ? window.history.back() : ( window.location.href = '/' );
				return;
			}
			wrapper.classList.remove( 'ff-form--active' );
			showWelcome( true );
		}

		function showWelcome( goingBack ) {
			var wasStep = currentStep;
			currentStep = -1;
			var layout    = settings.welcome_layout || 'center';
			var hasImage  = layout === 'image-left' && !! settings.welcome_image;
			var content   = el( 'div', 'ff-flow-screen' );

			/* Reset stage modifiers */
			stage.style.justifyContent = '';
			stage.style.paddingLeft    = '';
			stage.style.padding        = '';
			stage.classList.remove( 'ff-flow-stage--split' );

			if ( layout === 'left' ) {
				content.style.textAlign     = 'left';
				stage.style.justifyContent  = 'flex-start';
				stage.style.paddingLeft     = 'max(48px, 10vw)';
			}

			var title = el( 'div', 'ff-flow-screen__title' );
			title.textContent = settings.welcome_title || wrapper.dataset.formTitle || 'Welcome';
			content.appendChild( title );

			if ( settings.welcome_description ) {
				var desc = el( 'div', 'ff-flow-screen__desc' );
				desc.textContent = settings.welcome_description;
				content.appendChild( desc );
			}

			var startBtn = el( 'button', 'ff-flow-start-btn' );
			startBtn.textContent = settings.start_label || 'Start';
			startBtn.addEventListener( 'click', function () {
				activate();
				showStep( 0 );
			} );
			content.appendChild( startBtn );

			var screen;
			if ( hasImage ) {
				/* Split layout: image on left, content on right (full bleed) */
				stage.classList.add( 'ff-flow-stage--split' );
				stage.style.padding = '0';

				screen = el( 'div', 'ff-flow-split' );

				var imgPanel = el( 'div', 'ff-flow-split__image' );
				imgPanel.style.backgroundImage = 'url(' + settings.welcome_image + ')';
				if ( settings.welcome_image_alt ) {
					imgPanel.setAttribute( 'role', 'img' );
					imgPanel.setAttribute( 'aria-label', settings.welcome_image_alt );
				}

				var contentPanel = el( 'div', 'ff-flow-split__content' );
				content.style.textAlign = 'left';
				contentPanel.appendChild( content );

				screen.appendChild( imgPanel );
				screen.appendChild( contentPanel );
			} else {
				screen = content;
			}

			setStage( screen, goingBack !== false && wasStep >= 0 );
			setProgress( 0 );
		}

		function computeVisibleStepIndex( idx, direction ) {
			var dir = direction === -1 ? -1 : 1;
			while ( idx >= 0 && idx < activeFields.length ) {
				var f = activeFields[ idx ];
				var cond = f && f.conditions;
				if ( ! cond || ! cond.rules || cond.rules.length === 0 ) return idx;
				var visible = ConditionEval.evaluate( cond, answers );
				/* "skip" action: hide if rules match. "show"/"hide" follow same visibility rules. */
				if ( visible ) return idx;
				idx += dir;
			}
			return idx;
		}

		function showStep( idx ) {
			var direction = idx < currentStep ? -1 : 1;
			idx = computeVisibleStepIndex( idx, direction );
			var goingBack = idx < currentStep;
			currentStep = idx;
			if ( idx >= activeFields.length ) {
				submitFlow();
				return;
			}
			if ( idx < 0 ) {
				showWelcome( true );
				return;
			}

			var field = activeFields[ idx ];
			var pct   = Math.round( ( idx / activeFields.length ) * 100 );
			setProgress( pct );

			var q = el( 'div', 'ff-flow-question' );

			var num = el( 'div', 'ff-flow-question__num' );
			num.innerHTML = ( idx + 1 ) + ' <span style="opacity:.4">→</span>';
			q.appendChild( num );

			var label = el( 'h2', 'ff-flow-question__label' );
			label.innerHTML = escHtml( field.label );
			if ( field.required ) label.innerHTML += ' <span style="color:#d63638">*</span>';
			q.appendChild( label );

			if ( field.description ) {
				var desc = el( 'p', 'ff-flow-question__desc' );
				desc.textContent = field.description;
				q.appendChild( desc );
			}

			var fieldWrap = el( 'div', 'ff-flow-question__field' );
			var inputEl   = buildInput( field );
			if ( inputEl ) fieldWrap.appendChild( inputEl );

			/* Pre-fill answer if user is going back */
			prefillInput( fieldWrap, field );

			q.appendChild( fieldWrap );

			var errEl = el( 'div', 'ff-flow-error' );
			q.appendChild( errEl );

			var footer  = el( 'div', 'ff-flow-footer' );
			var nextBtn = el( 'button', 'ff-flow-next-btn' );
			var isLast  = idx === activeFields.length - 1;
			nextBtn.innerHTML = escHtml( isLast ? ( settings.submit_label || 'Submit' ) : ( settings.next_label || 'OK' ) ) +
				'<span class="ff-flow-next-btn__hint">press Enter ↵</span>';
			nextBtn.addEventListener( 'click', advanceStep );
			footer.appendChild( nextBtn );

			if ( idx > 0 ) {
				var backBtn = el( 'button', 'ff-flow-back-btn' );
				backBtn.textContent = '↑ Back';
				backBtn.addEventListener( 'click', function () { showStep( idx - 1 ); } );
				footer.appendChild( backBtn );
			}

			q.appendChild( footer );
			setStage( q, goingBack );

			/* Auto-focus first input + clear error on typing */
			var firstInput = fieldWrap.querySelector( 'input:not([type=hidden]), textarea, select' );
			if ( firstInput ) {
				setTimeout( function () { firstInput.focus(); }, 50 );
				firstInput.addEventListener( 'input', clearError );
				firstInput.addEventListener( 'change', clearError );
			}

			/* Store state so advanceStep can read it */
			stage._currentField   = field;
			stage._currentFieldEl = fieldWrap;
			stage._errEl          = errEl;
		}

		function validateField( field, val ) {
			var v = ( val || '' ).trim();
			if ( field.required && ! v ) return 'This field is required.';
			if ( ! v ) return '';
			if ( field.type === 'email' && ! /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test( v ) )
				return 'Please enter a valid email address.';
			if ( field.type === 'url' ) {
				try { new URL( v ); } catch ( e ) { return 'Please enter a valid URL (e.g. https://example.com).'; }
			}
			if ( field.type === 'number' && ( isNaN( Number( v ) ) || v === '' ) )
				return 'Please enter a valid number.';
			if ( field.type === 'phone' && ! /^[\d\s+\-().]{6,}$/.test( v ) )
				return 'Please enter a valid phone number.';
			return '';
		}

		function showError( msg ) {
			var errEl  = stage._errEl;
			var input  = stage._currentFieldEl ? stage._currentFieldEl.querySelector( 'input, textarea, select' ) : null;
			if ( ! errEl ) return;
			errEl.innerHTML = '<span class="ff-flow-error__icon">⚠</span> ' + msg;
			errEl.classList.add( 'is-visible' );
			if ( input ) { input.classList.add( 'is-invalid' ); input.focus(); }
			/* Shake the question block */
			var q = stage.querySelector( '.ff-flow-question' );
			if ( q ) {
				q.classList.add( 'ff-shake' );
				setTimeout( function () { q.classList.remove( 'ff-shake' ); }, 500 );
			}
		}

		function clearError() {
			var errEl = stage._errEl;
			var input = stage._currentFieldEl ? stage._currentFieldEl.querySelector( 'input, textarea, select' ) : null;
			if ( errEl ) { errEl.innerHTML = ''; errEl.classList.remove( 'is-visible' ); }
			if ( input ) input.classList.remove( 'is-invalid' );
		}

		function advanceStep() {
			var field = stage._currentField;
			if ( ! field ) return;

			var val = getFieldValue( stage._currentFieldEl, field );
			var err = validateField( field, val );

			if ( err ) { showError( err ); return; }

			clearError();
			answers[ field.id ] = val;
			showStep( currentStep + 1 );
		}

		function showEnd( result ) {
			setProgress( 100 );
			currentStep = activeFields.length;

			var screen = el( 'div', 'ff-flow-screen' );

			var check = el( 'div', 'ff-flow-screen__checkmark' );
			check.textContent = '✓';
			screen.appendChild( check );

			var title = el( 'div', 'ff-flow-screen__title' );
			title.textContent = settings.end_title || 'Thank you!';
			screen.appendChild( title );

			if ( settings.success_message || ( result && result.message ) ) {
				var msg = el( 'div', 'ff-flow-screen__desc' );
				msg.textContent = settings.success_message || result.message;
				screen.appendChild( msg );
			}

			var restartBtn = el( 'button', 'ff-flow-restart-btn' );
			restartBtn.textContent = 'Close';
			restartBtn.style.marginTop = '16px';
			restartBtn.addEventListener( 'click', deactivate );
			screen.appendChild( restartBtn );

			setStage( screen, false );
		}

		function submitFlow() {
			var data = Object.assign( {}, answers, { _source_url: window.location.href } );

			/* Show spinner */
			var spin = el( 'div', 'ff-flow-screen' );
			spin.style.fontSize = '32px';
			spin.textContent = '…';
			setStage( spin, false );

			fetch( API_ROOT + '/forms/' + formId + '/submit', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json', 'X-WP-Nonce': NONCE },
				body: JSON.stringify( data ),
			} )
			.then( function ( r ) { return r.json(); } )
			.then( function ( result ) {
				if ( result.success ) {
					if ( result.action === 'redirect' && result.redirect ) {
						window.location.href = result.redirect;
					} else {
						showEnd( result );
					}
				} else {
					var errScreen = el( 'div', 'ff-flow-screen' );
					var errMsg = el( 'div', 'ff-flow-screen__desc' );
					errMsg.style.color = '#d63638';
					errMsg.textContent = result.message || 'An error occurred.';
					errScreen.appendChild( errMsg );
					var retryBtn = el( 'button', 'ff-flow-start-btn' );
					retryBtn.textContent = 'Try again';
					retryBtn.addEventListener( 'click', function () { showStep( currentStep ); } );
					errScreen.appendChild( retryBtn );
					setStage( errScreen );
				}
			} )
			.catch( function () {
				showStep( currentStep );
			} );
		}

		function buildInput( field ) {
			if ( [ 'text', 'email', 'phone', 'number', 'url' ].includes( field.type ) ) {
				var inp = el( 'input', 'ff-flow-input' );
				inp.type = { phone: 'tel', number: 'number', email: 'email', url: 'url' }[ field.type ] || 'text';
				inp.placeholder = field.placeholder || '';
				inp.dataset.fieldId = field.id;
				return inp;
			}
			if ( field.type === 'textarea' ) {
				var ta = el( 'textarea', 'ff-flow-input ff-flow-input--textarea' );
				ta.placeholder = field.placeholder || '';
				ta.dataset.fieldId = field.id;
				return ta;
			}
			if ( field.type === 'select' ) {
				var sel = el( 'select', 'ff-flow-input ff-flow-input--select' );
				sel.dataset.fieldId = field.id;
				var def = el( 'option', '' );
				def.value = ''; def.textContent = 'Select…';
				sel.appendChild( def );
				( field.options || [] ).forEach( function ( o ) {
					var opt = el( 'option', '' );
					opt.value = o; opt.textContent = o;
					sel.appendChild( opt );
				} );
				return sel;
			}
			if ( field.type === 'radio' || field.type === 'checkbox' ) {
				var wrap = el( 'div', 'ff-flow-choices' );
				( field.options || [] ).forEach( function ( o, i ) {
					var choice = el( 'div', 'ff-flow-choice' );
					choice.dataset.value = o;

					var letter = el( 'span', 'ff-flow-choice__letter' );
					letter.textContent = String.fromCharCode( 65 + i );
					choice.appendChild( letter );

					var text = document.createTextNode( o );
					choice.appendChild( text );

					var hidden = el( 'input', '' );
					hidden.type = field.type;
					hidden.name = 'ff-flow-' + field.id;
					hidden.value = o;
					hidden.style.display = 'none';
					choice.appendChild( hidden );

					choice.addEventListener( 'click', function () {
						if ( field.type === 'radio' ) {
							wrap.querySelectorAll( '.ff-flow-choice' ).forEach( function ( c ) { c.classList.remove( 'is-selected' ); } );
							wrap.querySelectorAll( 'input[type=radio]' ).forEach( function ( r ) { r.checked = false; } );
						}
						choice.classList.toggle( 'is-selected', field.type === 'radio' ? true : ! choice.classList.contains( 'is-selected' ) );
						hidden.checked = choice.classList.contains( 'is-selected' );
					} );

					wrap.appendChild( choice );
				} );
				return wrap;
			}
			if ( field.type === 'rating' ) {
				var ratingWrap = el( 'div', 'ff-flow-rating' );
				var hiddenR = el( 'input', '' );
				hiddenR.type = 'hidden'; hiddenR.dataset.fieldId = field.id;
				ratingWrap.appendChild( hiddenR );
				var max = field.max || 5;
				for ( var i = 1; i <= max; i++ ) {
					( function ( val ) {
						var star = el( 'span', 'ff-flow-star' );
						star.textContent = '★';
						star.addEventListener( 'click', function () {
							hiddenR.value = val;
							ratingWrap.querySelectorAll( '.ff-flow-star' ).forEach( function ( s, si ) {
								s.classList.toggle( 'is-active', si < val );
							} );
						} );
						star.addEventListener( 'mouseover', function () {
							ratingWrap.querySelectorAll( '.ff-flow-star' ).forEach( function ( s, si ) {
								s.style.color = si < val ? 'var(--ff-primary)' : '';
							} );
						} );
						ratingWrap.appendChild( star );
					} )( i );
				}
				ratingWrap.addEventListener( 'mouseleave', function () {
					var cur = parseInt( hiddenR.value ) || 0;
					ratingWrap.querySelectorAll( '.ff-flow-star' ).forEach( function ( s, si ) {
						s.style.color = '';
						s.classList.toggle( 'is-active', si < cur );
					} );
				} );
				return ratingWrap;
			}
			if ( field.type === 'date' || field.type === 'time' ) {
				var dateInp = el( 'input', 'ff-flow-input' );
				dateInp.type = field.type;
				dateInp.dataset.fieldId = field.id;
				return dateInp;
			}
			return null;
		}

		function prefillInput( wrap, field ) {
			var saved = answers[ field.id ];
			if ( ! saved ) return;
			if ( field.type === 'radio' ) {
				wrap.querySelectorAll( '.ff-flow-choice' ).forEach( function ( c ) {
					if ( c.dataset.value === saved ) {
						c.classList.add( 'is-selected' );
						var r = c.querySelector( 'input[type=radio]' );
						if ( r ) r.checked = true;
					}
				} );
			} else if ( field.type === 'checkbox' ) {
				var vals = saved.split( ', ' );
				wrap.querySelectorAll( '.ff-flow-choice' ).forEach( function ( c ) {
					if ( vals.includes( c.dataset.value ) ) {
						c.classList.add( 'is-selected' );
						var cb = c.querySelector( 'input[type=checkbox]' );
						if ( cb ) cb.checked = true;
					}
				} );
			} else if ( field.type === 'rating' ) {
				var n = parseInt( saved );
				var hidden = wrap.querySelector( 'input[type=hidden]' );
				if ( hidden ) hidden.value = saved;
				wrap.querySelectorAll( '.ff-flow-star' ).forEach( function ( s, si ) {
					s.classList.toggle( 'is-active', si < n );
				} );
			} else {
				var inp = wrap.querySelector( '[data-field-id]' );
				if ( inp ) inp.value = saved;
			}
		}

		function getFieldValue( wrap, field ) {
			if ( field.type === 'checkbox' ) {
				return Array.from( wrap.querySelectorAll( '.ff-flow-choice.is-selected' ) )
					.map( function ( c ) { return c.dataset.value; } ).join( ', ' );
			}
			if ( field.type === 'radio' ) {
				var sel = wrap.querySelector( '.ff-flow-choice.is-selected' );
				return sel ? sel.dataset.value : '';
			}
			if ( field.type === 'rating' ) {
				var h = wrap.querySelector( 'input[type=hidden]' );
				return h ? h.value : '';
			}
			var inp = wrap.querySelector( '[data-field-id]' );
			return inp ? inp.value.trim() : '';
		}

		function setStage( child, goingBack ) {
			var fromY = goingBack ? '-20px' : '20px';
			var toY   = goingBack ? '20px'  : '-20px';
			var old   = stage.firstChild;

			function enterNew() {
				/* Start at offset — transition:none so the initial state is actually painted */
				child.style.opacity    = '0';
				child.style.transform  = 'translateY(' + fromY + ')';
				child.style.transition = 'none';
				stage.appendChild( child );
				/* Force reflow so the browser registers the initial state */
				void child.getBoundingClientRect();
				/* Now animate to final state */
				child.style.transition = 'opacity .28s ease, transform .28s cubic-bezier(.22,.61,.36,1)';
				child.style.opacity    = '1';
				child.style.transform  = 'translateY(0)';
			}

			if ( old ) {
				/* Exit old: fade + slight slide in opposite direction */
				old.style.transition = 'opacity .18s ease, transform .18s ease';
				void old.getBoundingClientRect();
				old.style.opacity   = '0';
				old.style.transform = 'translateY(' + toY + ')';
				/* Wait for exit to finish before entering new — no overlap in DOM */
				setTimeout( function () {
					if ( old.parentNode ) old.parentNode.removeChild( old );
					enterNew();
				}, 180 );
			} else {
				enterNew();
			}
		}

		function setProgress( pct ) {
			progressBar.style.width = pct + '%';
		}
	}

	/* Auto-init flow forms on the public-facing page */
	document.querySelectorAll( '.ff-form--flow' ).forEach( function ( wrapper ) {
		initFlowForm( wrapper );
	} );

	/* Expose for programmatic re-init (used by the builder iframe preview) */
	window.FlowFormsInit    = initFlowForm;
	window.FlowFormsDestroy = function ( wrapper ) {
		if ( wrapper && wrapper._ffCtrl && typeof wrapper._ffCtrl.abort === 'function' ) {
			try { wrapper._ffCtrl.abort(); } catch ( e ) {}
		}
		if ( wrapper ) {
			wrapper.innerHTML = '';
			wrapper.classList.remove( 'ff-form--active' );
		}
	};

	/* ── HELPERS ─────────────────────────────────────────────────── */

	function setupRatingFields( container ) {
		( container || document ).querySelectorAll( '.ff-form__rating' ).forEach( function ( rating ) {
			var stars = rating.querySelectorAll( '.ff-form__star' );
			var input = rating.querySelector( '.ff-rating-value' );
			stars.forEach( function ( star ) {
				star.addEventListener( 'click', function () {
					var val = star.dataset.value;
					if ( input ) input.value = val;
					stars.forEach( function ( s ) {
						s.classList.toggle( 'is-active', parseInt( s.dataset.value ) <= parseInt( val ) );
					} );
				} );
				star.addEventListener( 'mouseover', function () {
					var val = parseInt( star.dataset.value );
					stars.forEach( function ( s ) { s.style.color = parseInt( s.dataset.value ) <= val ? '#dba617' : ''; } );
				} );
				rating.addEventListener( 'mouseleave', function () {
					var current = input ? parseInt( input.value ) : 0;
					stars.forEach( function ( s ) { s.style.color = ''; s.classList.toggle( 'is-active', parseInt( s.dataset.value ) <= current ); } );
				} );
			} );
		} );
	}

	function clearErrors( form ) {
		form.querySelectorAll( '.ff-form__field-error' ).forEach( function ( e ) { e.textContent = ''; } );
		form.querySelectorAll( '.ff-form__messages' ).forEach( function ( e ) { e.innerHTML = ''; } );
	}

	function showFieldErrors( form, errors ) {
		Object.keys( errors ).forEach( function ( fieldId ) {
			var errEl = form.querySelector( '#ff-error-' + fieldId );
			if ( errEl ) errEl.textContent = errors[ fieldId ];
		} );
	}

	function showMessage( form, message, type ) {
		var el = form.querySelector( '.ff-form__messages' );
		if ( el ) el.innerHTML = '<div class="ff-form__message ff-form__message--' + type + '">' + escHtml( message ) + '</div>';
	}

	function el( tag, className ) {
		var e = document.createElement( tag );
		if ( className ) e.className = className;
		return e;
	}

	function safeJSON( str, fallback ) {
		try { return JSON.parse( str ); } catch ( e ) { return fallback; }
	}

	function escHtml( s ) {
		return String( s )
			.replace( /&/g, '&amp;' )
			.replace( /</g, '&lt;' )
			.replace( />/g, '&gt;' )
			.replace( /"/g, '&quot;' );
	}
} )();
