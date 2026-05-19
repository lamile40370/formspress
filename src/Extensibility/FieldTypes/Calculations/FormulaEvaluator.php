<?php

namespace FlowForms\Extensibility\FieldTypes\Calculations;

/**
 * Safe arithmetic formula evaluator for FlowForms calculation fields.
 *
 * Parses a formula string of the form `{field:qty} * {field:price} * 1.20`
 * via the shunting-yard algorithm, builds an AST, then walks the tree to
 * compute a numeric result. Strictly NO use of `eval()`. The grammar is a
 * fixed whitelist of operators / functions; anything else is a parse error
 * and the evaluator returns 0.
 *
 * Supported operators: + - * / %  ( )  and comparisons ==, !=, >, <, >=, <=
 * Supported functions: min, max, abs, round, floor, ceil, if, sum, avg
 * Variables: {field:id} — resolved against the values map; non-numeric → 0.
 */
class FormulaEvaluator {

	/** Maximum AST depth — guards against pathologically nested formulas. */
	private const MAX_DEPTH = 32;

	/** Whitelisted function names. */
	private const FUNCTIONS = [
		'min'   => -1, // variadic
		'max'   => -1,
		'abs'   => 1,
		'round' => -1, // 1 or 2 args
		'floor' => 1,
		'ceil'  => 1,
		'if'    => 3,
		'sum'   => -1,
		'avg'   => -1,
	];

	/** Operator precedence (higher = binds tighter). */
	private const PRECEDENCE = [
		'||' => 1,
		'&&' => 2,
		'==' => 3, '!=' => 3,
		'<'  => 4, '<=' => 4, '>' => 4, '>=' => 4,
		'+'  => 5, '-' => 5,
		'*'  => 6, '/' => 6, '%' => 6,
		'u-' => 8, // unary minus
		'u+' => 8,
	];

	/** @var array<string,float|int|string> */
	private array $values = [];

	/**
	 * Evaluate the formula. Returns float; returns 0.0 on parse/evaluation
	 * failure so the caller's form submission never blows up on a bad formula.
	 *
	 * @param string                        $formula Formula string.
	 * @param array<string,float|int|string> $values  Map of field_id => value.
	 */
	public function evaluate( string $formula, array $values ): float {
		$this->values = $values;

		try {
			$tokens = $this->tokenize( $formula );
			if ( empty( $tokens ) ) {
				return 0.0;
			}
			$rpn = $this->shunting_yard( $tokens );
			$ast = $this->build_ast( $rpn );

			return (float) $this->walk( $ast, 0 );
		} catch ( \Throwable $e ) {
			return 0.0;
		}
	}

	/**
	 * Lexer. Emits tokens of shape:
	 *   [ 'type' => 'number',   'value' => float ]
	 *   [ 'type' => 'var',      'value' => string  (field id) ]
	 *   [ 'type' => 'func',     'value' => string ]
	 *   [ 'type' => 'op',       'value' => string ]
	 *   [ 'type' => 'paren',    'value' => '(' | ')' ]
	 *   [ 'type' => 'comma' ]
	 *
	 * @return array<int,array<string,mixed>>
	 */
	private function tokenize( string $formula ): array {
		$tokens = [];
		$i      = 0;
		$len    = strlen( $formula );

		while ( $i < $len ) {
			$ch = $formula[ $i ];

			if ( ctype_space( $ch ) ) {
				$i++;
				continue;
			}

			/* Number literal (integer or decimal). */
			if ( ctype_digit( $ch ) || ( '.' === $ch && $i + 1 < $len && ctype_digit( $formula[ $i + 1 ] ) ) ) {
				$num = '';
				while ( $i < $len && ( ctype_digit( $formula[ $i ] ) || '.' === $formula[ $i ] ) ) {
					$num .= $formula[ $i ];
					$i++;
				}
				$tokens[] = [ 'type' => 'number', 'value' => (float) $num ];
				continue;
			}

			/* Variable: {field:id} */
			if ( '{' === $ch ) {
				$close = strpos( $formula, '}', $i );
				if ( false === $close ) {
					throw new \RuntimeException( 'Unclosed variable token' );
				}
				$body = substr( $formula, $i + 1, $close - $i - 1 );
				if ( ! str_starts_with( $body, 'field:' ) ) {
					throw new \RuntimeException( 'Unsupported variable: ' . $body );
				}
				$field_id = substr( $body, 6 );
				$field_id = trim( $field_id );
				if ( '' === $field_id || ! preg_match( '/^[A-Za-z0-9_\-]+$/', $field_id ) ) {
					throw new \RuntimeException( 'Invalid field id: ' . $field_id );
				}
				$tokens[] = [ 'type' => 'var', 'value' => $field_id ];
				$i        = $close + 1;
				continue;
			}

			/* Identifier (function name). */
			if ( ctype_alpha( $ch ) || '_' === $ch ) {
				$name = '';
				while ( $i < $len && ( ctype_alnum( $formula[ $i ] ) || '_' === $formula[ $i ] ) ) {
					$name .= $formula[ $i ];
					$i++;
				}
				$lower = strtolower( $name );
				if ( ! isset( self::FUNCTIONS[ $lower ] ) ) {
					throw new \RuntimeException( 'Unknown function: ' . $name );
				}
				$tokens[] = [ 'type' => 'func', 'value' => $lower ];
				continue;
			}

			/* Multi-char operators. */
			if ( $i + 1 < $len ) {
				$two = $formula[ $i ] . $formula[ $i + 1 ];
				if ( in_array( $two, [ '==', '!=', '>=', '<=', '&&', '||' ], true ) ) {
					$tokens[] = [ 'type' => 'op', 'value' => $two ];
					$i       += 2;
					continue;
				}
			}

			/* Single-char operators / punctuation. */
			if ( in_array( $ch, [ '+', '-', '*', '/', '%', '>', '<' ], true ) ) {
				$tokens[] = [ 'type' => 'op', 'value' => $ch ];
				$i++;
				continue;
			}

			if ( '(' === $ch || ')' === $ch ) {
				$tokens[] = [ 'type' => 'paren', 'value' => $ch ];
				$i++;
				continue;
			}

			if ( ',' === $ch ) {
				$tokens[] = [ 'type' => 'comma' ];
				$i++;
				continue;
			}

			throw new \RuntimeException( 'Unexpected character: ' . $ch );
		}

		return $tokens;
	}

	/**
	 * Shunting-yard: infix tokens → RPN. Handles unary minus/plus by replacing
	 * with the synthetic 'u-' / 'u+' operators (precedence 8, right-assoc).
	 *
	 * @param array<int,array<string,mixed>> $tokens
	 * @return array<int,array<string,mixed>>
	 */
	private function shunting_yard( array $tokens ): array {
		$output  = [];
		$stack   = [];
		$prev    = null;

		foreach ( $tokens as $tok ) {
			$type = $tok['type'];

			if ( 'number' === $type || 'var' === $type ) {
				$output[] = $tok;
			} elseif ( 'func' === $type ) {
				$stack[] = $tok;
			} elseif ( 'comma' === $type ) {
				while ( ! empty( $stack ) && ! ( 'paren' === end( $stack )['type'] && '(' === end( $stack )['value'] ) ) {
					$output[] = array_pop( $stack );
				}
				if ( empty( $stack ) ) {
					throw new \RuntimeException( 'Misplaced comma' );
				}
				// Track arg count on the function via the paren marker
				$last_index = count( $stack ) - 1;
				if ( isset( $stack[ $last_index ]['arg_count'] ) ) {
					$stack[ $last_index ]['arg_count']++;
				} else {
					$stack[ $last_index ]['arg_count'] = 2;
				}
			} elseif ( 'op' === $type ) {
				$op = $tok['value'];
				/* Detect unary +/-. */
				if ( ( '+' === $op || '-' === $op ) && (
					null === $prev
					|| 'op' === $prev['type']
					|| 'comma' === $prev['type']
					|| ( 'paren' === $prev['type'] && '(' === $prev['value'] )
				) ) {
					$op  = ( '-' === $op ) ? 'u-' : 'u+';
					$tok = [ 'type' => 'op', 'value' => $op ];
				}

				$prec = self::PRECEDENCE[ $op ] ?? 0;
				while ( ! empty( $stack ) ) {
					$top = end( $stack );
					if ( 'op' === $top['type'] ) {
						$top_prec = self::PRECEDENCE[ $top['value'] ] ?? 0;
						$is_unary = in_array( $op, [ 'u-', 'u+' ], true );
						// Unary operators are right-associative; do not pop equal-precedence.
						if ( $top_prec > $prec || ( $top_prec === $prec && ! $is_unary ) ) {
							$output[] = array_pop( $stack );
							continue;
						}
					}
					break;
				}
				$stack[] = $tok;
			} elseif ( 'paren' === $type && '(' === $tok['value'] ) {
				/* If previous token is a function, mark arg_count=1 on the paren if function call follows. */
				if ( null !== $prev && 'func' === $prev['type'] ) {
					$stack[] = [ 'type' => 'paren', 'value' => '(', 'arg_count' => 1, 'is_func_call' => true ];
				} else {
					$stack[] = [ 'type' => 'paren', 'value' => '(' ];
				}
			} elseif ( 'paren' === $type && ')' === $tok['value'] ) {
				while ( ! empty( $stack ) && ! ( 'paren' === end( $stack )['type'] && '(' === end( $stack )['value'] ) ) {
					$output[] = array_pop( $stack );
				}
				if ( empty( $stack ) ) {
					throw new \RuntimeException( 'Mismatched parenthesis' );
				}
				$open = array_pop( $stack );
				if ( ! empty( $stack ) && 'func' === end( $stack )['type'] ) {
					$fn              = array_pop( $stack );
					$fn['arg_count'] = $open['arg_count'] ?? ( $prev && ( 'paren' === $prev['type'] && '(' === $prev['value'] ) ? 0 : 1 );
					$output[]        = $fn;
				}
			}

			$prev = $tok;
		}

		while ( ! empty( $stack ) ) {
			$top = array_pop( $stack );
			if ( 'paren' === $top['type'] ) {
				throw new \RuntimeException( 'Mismatched parenthesis' );
			}
			$output[] = $top;
		}

		return $output;
	}

	/**
	 * Build an AST from RPN tokens. Each AST node is an array of the form:
	 *   [ 'op'  => '+',     'l' => <node>, 'r' => <node> ]
	 *   [ 'op'  => 'u-',    'a' => <node> ]
	 *   [ 'fn'  => 'min',   'args' => [<node>, …] ]
	 *   [ 'num' => 3.14 ]
	 *   [ 'var' => 'qty' ]
	 *
	 * @param array<int,array<string,mixed>> $rpn
	 * @return array<string,mixed>
	 */
	private function build_ast( array $rpn ): array {
		$stack = [];

		foreach ( $rpn as $tok ) {
			if ( 'number' === $tok['type'] ) {
				$stack[] = [ 'num' => (float) $tok['value'] ];
			} elseif ( 'var' === $tok['type'] ) {
				$stack[] = [ 'var' => (string) $tok['value'] ];
			} elseif ( 'op' === $tok['type'] ) {
				$op = $tok['value'];
				if ( 'u-' === $op || 'u+' === $op ) {
					if ( empty( $stack ) ) {
						throw new \RuntimeException( 'Missing operand for unary op' );
					}
					$a       = array_pop( $stack );
					$stack[] = [ 'op' => $op, 'a' => $a ];
				} else {
					if ( count( $stack ) < 2 ) {
						throw new \RuntimeException( 'Missing operand for op ' . $op );
					}
					$r = array_pop( $stack );
					$l = array_pop( $stack );
					$stack[] = [ 'op' => $op, 'l' => $l, 'r' => $r ];
				}
			} elseif ( 'func' === $tok['type'] ) {
				$name  = $tok['value'];
				$argc  = (int) ( $tok['arg_count'] ?? 1 );
				$args  = [];
				for ( $k = 0; $k < $argc; $k++ ) {
					if ( empty( $stack ) ) {
						throw new \RuntimeException( 'Missing arg for ' . $name );
					}
					array_unshift( $args, array_pop( $stack ) );
				}
				$stack[] = [ 'fn' => $name, 'args' => $args ];
			}
		}

		if ( 1 !== count( $stack ) ) {
			throw new \RuntimeException( 'Malformed expression' );
		}

		return $stack[0];
	}

	/**
	 * Recursive AST walker. Returns float (or int — caller coerces to float).
	 *
	 * @param array<string,mixed> $node
	 */
	private function walk( array $node, int $depth ): float {
		if ( $depth > self::MAX_DEPTH ) {
			throw new \RuntimeException( 'AST depth exceeded' );
		}

		if ( isset( $node['num'] ) ) {
			return (float) $node['num'];
		}

		if ( isset( $node['var'] ) ) {
			$raw = $this->values[ $node['var'] ] ?? 0;
			if ( is_array( $raw ) ) {
				$raw = count( array_filter( $raw, fn( $v ) => '' !== $v && null !== $v ) );
				return (float) $raw;
			}
			return is_numeric( $raw ) ? (float) $raw : 0.0;
		}

		if ( isset( $node['fn'] ) ) {
			$args = array_map( fn( $a ) => $this->walk( $a, $depth + 1 ), $node['args'] );
			return $this->call_function( $node['fn'], $args );
		}

		if ( isset( $node['op'] ) ) {
			$op = $node['op'];

			if ( 'u-' === $op ) {
				return - $this->walk( $node['a'], $depth + 1 );
			}
			if ( 'u+' === $op ) {
				return $this->walk( $node['a'], $depth + 1 );
			}

			$l = $this->walk( $node['l'], $depth + 1 );
			$r = $this->walk( $node['r'], $depth + 1 );

			return match ( $op ) {
				'+'  => $l + $r,
				'-'  => $l - $r,
				'*'  => $l * $r,
				'/'  => 0.0 === $r ? 0.0 : $l / $r,
				'%'  => 0.0 === $r ? 0.0 : fmod( $l, $r ),
				'==' => $l === $r ? 1.0 : 0.0,
				'!=' => $l !== $r ? 1.0 : 0.0,
				'>'  => $l > $r ? 1.0 : 0.0,
				'<'  => $l < $r ? 1.0 : 0.0,
				'>=' => $l >= $r ? 1.0 : 0.0,
				'<=' => $l <= $r ? 1.0 : 0.0,
				'&&' => ( $l && $r ) ? 1.0 : 0.0,
				'||' => ( $l || $r ) ? 1.0 : 0.0,
				default => throw new \RuntimeException( 'Unknown op ' . $op ),
			};
		}

		throw new \RuntimeException( 'Unknown node' );
	}

	/**
	 * @param float[] $args
	 */
	private function call_function( string $name, array $args ): float {
		$expected = self::FUNCTIONS[ $name ] ?? 1;
		if ( $expected >= 0 && count( $args ) !== $expected ) {
			if ( ! ( 'round' === $name && 1 === count( $args ) ) ) {
				throw new \RuntimeException( 'Wrong arg count for ' . $name );
			}
		}
		if ( -1 === $expected && 0 === count( $args ) ) {
			return 0.0;
		}

		return match ( $name ) {
			'min'   => (float) min( $args ),
			'max'   => (float) max( $args ),
			'abs'   => (float) abs( $args[0] ),
			'round' => (float) round( $args[0], (int) ( $args[1] ?? 0 ) ),
			'floor' => (float) floor( $args[0] ),
			'ceil'  => (float) ceil( $args[0] ),
			'if'    => $args[0] ? (float) $args[1] : (float) $args[2],
			'sum'   => (float) array_sum( $args ),
			'avg'   => count( $args ) > 0 ? (float) ( array_sum( $args ) / count( $args ) ) : 0.0,
			default => throw new \RuntimeException( 'Unknown function ' . $name ),
		};
	}
}
