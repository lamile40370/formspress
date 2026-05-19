<?php

namespace FlowForms\Modules\Blocks;

/**
 * Registers block patterns and a dedicated pattern category. Each pattern
 * lives under `/patterns/{slug}.php` and returns an array compatible with
 * `register_block_pattern()`.
 */
class PatternRegistry {

	private const CATEGORY = 'formspress';

	private const PATTERNS = [
		'contact-form-section',
		'newsletter-cta',
		'event-rsvp',
		'support-request',
		'lead-capture-hero',
	];

	public static function register(): void {
		if ( ! function_exists( 'register_block_pattern' ) || ! function_exists( 'register_block_pattern_category' ) ) {
			return;
		}

		register_block_pattern_category(
			self::CATEGORY,
			[ 'label' => __( 'FormsPress', 'flowforms' ) ]
		);

		$dir = FLOWFORMS_DIR . 'patterns/';

		foreach ( self::PATTERNS as $slug ) {
			$file = $dir . $slug . '.php';
			if ( ! file_exists( $file ) ) {
				continue;
			}

			/* Each pattern file returns the array. */
			$pattern = include $file;

			if ( ! is_array( $pattern ) || empty( $pattern['content'] ) ) {
				continue;
			}

			register_block_pattern( 'formspress/' . $slug, $pattern );
		}
	}
}
