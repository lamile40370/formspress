/* FlowForms — frontend formula evaluator
 *
 * Mirror of the PHP `FormulaEvaluator`. Pure function exposed as
 * `window.FlowFormsCalc.evaluate( formulaString, valuesMap )`.
 *
 * Same grammar (shunting-yard → AST walk, no `Function`/`eval`):
 *   operators  + - * / %  ==  !=  <  >  <=  >=  &&  ||
 *   functions  min, max, abs, round, floor, ceil, if, sum, avg
 *   variables  {field:id}
 *
 * Returns Number (NaN-safe — bad parse returns 0).
 */
( function () {
	'use strict';

	var MAX_DEPTH = 32;

	var FUNCTIONS = {
		min:   -1,
		max:   -1,
		abs:    1,
		round: -1,
		floor:  1,
		ceil:   1,
		if:     3,
		sum:   -1,
		avg:   -1,
	};

	var PREC = {
		'||': 1, '&&': 2,
		'==': 3, '!=': 3,
		'<':  4, '<=': 4, '>': 4, '>=': 4,
		'+':  5, '-': 5,
		'*':  6, '/': 6, '%': 6,
		'u-': 8, 'u+': 8,
	};

	function evaluate( formula, values ) {
		try {
			var tokens = tokenize( String( formula || '' ) );
			if ( tokens.length === 0 ) return 0;
			var rpn = shuntingYard( tokens );
			var ast = buildAst( rpn );
			return walk( ast, values || {}, 0 );
		} catch ( e ) {
			return 0;
		}
	}

	function tokenize( s ) {
		var tokens = [];
		var i      = 0;
		var n      = s.length;
		while ( i < n ) {
			var ch = s[ i ];

			if ( /\s/.test( ch ) ) { i++; continue; }

			if ( /[0-9]/.test( ch ) || ( ch === '.' && /[0-9]/.test( s[ i + 1 ] || '' ) ) ) {
				var num = '';
				while ( i < n && /[0-9.]/.test( s[ i ] ) ) { num += s[ i++ ]; }
				tokens.push( { type: 'number', value: parseFloat( num ) } );
				continue;
			}

			if ( ch === '{' ) {
				var close = s.indexOf( '}', i );
				if ( close < 0 ) throw new Error( 'Unclosed {' );
				var body = s.substring( i + 1, close );
				if ( body.indexOf( 'field:' ) !== 0 ) throw new Error( 'Bad variable' );
				var id = body.substring( 6 ).trim();
				if ( ! /^[A-Za-z0-9_\-]+$/.test( id ) ) throw new Error( 'Bad field id' );
				tokens.push( { type: 'var', value: id } );
				i = close + 1;
				continue;
			}

			if ( /[A-Za-z_]/.test( ch ) ) {
				var name = '';
				while ( i < n && /[A-Za-z0-9_]/.test( s[ i ] ) ) { name += s[ i++ ]; }
				var lower = name.toLowerCase();
				if ( ! FUNCTIONS.hasOwnProperty( lower ) ) throw new Error( 'Unknown fn ' + name );
				tokens.push( { type: 'func', value: lower } );
				continue;
			}

			var two = ch + ( s[ i + 1 ] || '' );
			if ( two === '==' || two === '!=' || two === '>=' || two === '<=' || two === '&&' || two === '||' ) {
				tokens.push( { type: 'op', value: two } );
				i += 2;
				continue;
			}

			if ( '+-*/%<>'.indexOf( ch ) > -1 ) {
				tokens.push( { type: 'op', value: ch } );
				i++;
				continue;
			}

			if ( ch === '(' || ch === ')' ) {
				tokens.push( { type: 'paren', value: ch } );
				i++;
				continue;
			}

			if ( ch === ',' ) { tokens.push( { type: 'comma' } ); i++; continue; }

			throw new Error( 'Unexpected ' + ch );
		}
		return tokens;
	}

	function shuntingYard( tokens ) {
		var out   = [];
		var stack = [];
		var prev  = null;

		tokens.forEach( function ( tok ) {
			var t = tok.type;

			if ( t === 'number' || t === 'var' ) {
				out.push( tok );
			} else if ( t === 'func' ) {
				stack.push( tok );
			} else if ( t === 'comma' ) {
				while ( stack.length && ! ( stack[ stack.length - 1 ].type === 'paren' && stack[ stack.length - 1 ].value === '(' ) ) {
					out.push( stack.pop() );
				}
				if ( ! stack.length ) throw new Error( 'comma' );
				var top = stack[ stack.length - 1 ];
				top.arg_count = ( top.arg_count || 1 ) + 1;
			} else if ( t === 'op' ) {
				var op = tok.value;
				if ( ( op === '+' || op === '-' ) && (
					! prev || prev.type === 'op' || prev.type === 'comma' ||
					( prev.type === 'paren' && prev.value === '(' )
				) ) {
					op = op === '-' ? 'u-' : 'u+';
					tok = { type: 'op', value: op };
				}
				var prec = PREC[ op ] || 0;
				while ( stack.length ) {
					var s = stack[ stack.length - 1 ];
					if ( s.type === 'op' ) {
						var sPrec = PREC[ s.value ] || 0;
						var isUnary = op === 'u-' || op === 'u+';
						if ( sPrec > prec || ( sPrec === prec && ! isUnary ) ) {
							out.push( stack.pop() );
							continue;
						}
					}
					break;
				}
				stack.push( tok );
			} else if ( t === 'paren' && tok.value === '(' ) {
				if ( prev && prev.type === 'func' ) {
					stack.push( { type: 'paren', value: '(', arg_count: 1, is_func_call: true } );
				} else {
					stack.push( { type: 'paren', value: '(' } );
				}
			} else if ( t === 'paren' && tok.value === ')' ) {
				while ( stack.length && ! ( stack[ stack.length - 1 ].type === 'paren' && stack[ stack.length - 1 ].value === '(' ) ) {
					out.push( stack.pop() );
				}
				if ( ! stack.length ) throw new Error( 'paren' );
				var open = stack.pop();
				if ( stack.length && stack[ stack.length - 1 ].type === 'func' ) {
					var fn = stack.pop();
					fn.arg_count = open.arg_count || 1;
					out.push( fn );
				}
			}
			prev = tok;
		} );

		while ( stack.length ) {
			var top2 = stack.pop();
			if ( top2.type === 'paren' ) throw new Error( 'paren' );
			out.push( top2 );
		}
		return out;
	}

	function buildAst( rpn ) {
		var stack = [];
		rpn.forEach( function ( tok ) {
			if ( tok.type === 'number' ) {
				stack.push( { num: tok.value } );
			} else if ( tok.type === 'var' ) {
				stack.push( { v: tok.value } );
			} else if ( tok.type === 'op' ) {
				var op = tok.value;
				if ( op === 'u-' || op === 'u+' ) {
					var a = stack.pop();
					stack.push( { op: op, a: a } );
				} else {
					var r = stack.pop();
					var l = stack.pop();
					stack.push( { op: op, l: l, r: r } );
				}
			} else if ( tok.type === 'func' ) {
				var argc = tok.arg_count || 1;
				var args = [];
				for ( var k = 0; k < argc; k++ ) args.unshift( stack.pop() );
				stack.push( { fn: tok.value, args: args } );
			}
		} );
		if ( stack.length !== 1 ) throw new Error( 'ast' );
		return stack[ 0 ];
	}

	function walk( node, values, depth ) {
		if ( depth > MAX_DEPTH ) throw new Error( 'depth' );
		if ( 'num' in node ) return node.num;
		if ( 'v' in node ) {
			var raw = values[ node.v ];
			if ( Array.isArray( raw ) ) return raw.filter( function ( x ) { return x !== '' && x !== null; } ).length;
			if ( raw == null ) return 0;
			var f = parseFloat( raw );
			return isNaN( f ) ? 0 : f;
		}
		if ( 'fn' in node ) {
			var args = node.args.map( function ( a ) { return walk( a, values, depth + 1 ); } );
			return callFn( node.fn, args );
		}
		if ( 'op' in node ) {
			var op = node.op;
			if ( op === 'u-' ) return - walk( node.a, values, depth + 1 );
			if ( op === 'u+' ) return walk( node.a, values, depth + 1 );
			var l = walk( node.l, values, depth + 1 );
			var r = walk( node.r, values, depth + 1 );
			switch ( op ) {
				case '+':  return l + r;
				case '-':  return l - r;
				case '*':  return l * r;
				case '/':  return r === 0 ? 0 : l / r;
				case '%':  return r === 0 ? 0 : l % r;
				case '==': return l === r ? 1 : 0;
				case '!=': return l !== r ? 1 : 0;
				case '>':  return l > r ? 1 : 0;
				case '<':  return l < r ? 1 : 0;
				case '>=': return l >= r ? 1 : 0;
				case '<=': return l <= r ? 1 : 0;
				case '&&': return ( l && r ) ? 1 : 0;
				case '||': return ( l || r ) ? 1 : 0;
			}
		}
		throw new Error( 'walk' );
	}

	function callFn( name, args ) {
		switch ( name ) {
			case 'min': return Math.min.apply( null, args );
			case 'max': return Math.max.apply( null, args );
			case 'abs': return Math.abs( args[ 0 ] );
			case 'round': return args.length > 1
				? Math.round( args[ 0 ] * Math.pow( 10, args[ 1 ] ) ) / Math.pow( 10, args[ 1 ] )
				: Math.round( args[ 0 ] );
			case 'floor': return Math.floor( args[ 0 ] );
			case 'ceil':  return Math.ceil( args[ 0 ] );
			case 'if':    return args[ 0 ] ? args[ 1 ] : args[ 2 ];
			case 'sum':   return args.reduce( function ( a, b ) { return a + b; }, 0 );
			case 'avg':   return args.length ? args.reduce( function ( a, b ) { return a + b; }, 0 ) / args.length : 0;
		}
		throw new Error( 'unknown fn' );
	}

	function formatValue( value, format, decimals, currency ) {
		var n = Number( value );
		if ( isNaN( n ) ) n = 0;
		var d = Number.isFinite( decimals ) ? decimals : 2;
		if ( format === 'integer' ) return String( Math.round( n ) );
		if ( format === 'percent' )  return n.toFixed( d ) + '%';
		if ( format === 'currency' ) {
			try {
				return new Intl.NumberFormat( undefined, {
					style: 'currency',
					currency: currency || 'EUR',
					minimumFractionDigits: d,
					maximumFractionDigits: d,
				} ).format( n );
			} catch ( e ) {
				return n.toFixed( d ) + ' ' + ( currency || '' );
			}
		}
		return n.toFixed( d );
	}

	window.FlowFormsCalc = { evaluate: evaluate, format: formatValue };
} )();
