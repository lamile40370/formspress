<?php

namespace FlowForms\Modules\Analytics\Services;

/**
 * Variant resolution for A/B testing. Reads/writes the `ff_variant_{form_id}`
 * cookie and merges the selected variant's fields/settings into the form
 * payload that FormRenderer consumes.
 */
class VariantPicker {

	/**
	 * Inspect the form's `variants` column (already decoded by FormRepository)
	 * and return the active variant for this visitor. Returns null when A/B
	 * testing is not configured on the form.
	 *
	 * @param array<string,mixed> $form
	 * @return array{ id:string, name:string, weight:int, fields:array, settings:array }|null
	 */
	public function pick_for_request( array $form ): ?array {
		$variants = $this->normalize_variants( $form );
		if ( count( $variants ) < 2 ) {
			return null;
		}

		$form_id     = (int) ( $form['id'] ?? 0 );
		$cookie_name = 'ff_variant_' . $form_id;

		/* Sticky assignment via cookie. */
		if ( $form_id && isset( $_COOKIE[ $cookie_name ] ) ) {
			$existing = sanitize_text_field( wp_unslash( $_COOKIE[ $cookie_name ] ) );
			foreach ( $variants as $v ) {
				if ( $v['id'] === $existing ) {
					return $v;
				}
			}
		}

		$picked = $this->weighted_pick( $variants );

		/* Persist for 30 days, SameSite=Lax. */
		if ( $form_id && ! headers_sent() ) {
			setcookie(
				$cookie_name,
				$picked['id'],
				[
					'expires'  => time() + 30 * DAY_IN_SECONDS,
					'path'     => '/',
					'samesite' => 'Lax',
					'secure'   => is_ssl(),
					'httponly' => false,
				]
			);
			/* Reflect immediately for this request — setcookie() only takes effect on next request otherwise. */
			$_COOKIE[ $cookie_name ] = $picked['id'];
		}

		return $picked;
	}

	/**
	 * Apply the picked variant's overrides to the form array. Mutates fields
	 * and settings only when the variant actually defines them.
	 *
	 * @param array<string,mixed> $form
	 * @param array<string,mixed> $variant
	 * @return array<string,mixed>
	 */
	public function apply_variant( array $form, array $variant ): array {
		if ( ! empty( $variant['fields'] ) && is_array( $variant['fields'] ) ) {
			$form['fields'] = $variant['fields'];
		}
		if ( ! empty( $variant['settings'] ) && is_array( $variant['settings'] ) ) {
			$form['settings'] = array_merge( $form['settings'] ?? [], $variant['settings'] );
		}
		return $form;
	}

	/**
	 * Normalize and validate the variants column. Returns [] if disabled.
	 *
	 * @param array<string,mixed> $form
	 * @return array<int,array<string,mixed>>
	 */
	private function normalize_variants( array $form ): array {
		$raw = $form['variants'] ?? null;
		if ( is_string( $raw ) ) {
			$raw = json_decode( $raw, true );
		}
		if ( ! is_array( $raw ) ) {
			return [];
		}

		$out = [];
		foreach ( $raw as $v ) {
			if ( ! is_array( $v ) ) {
				continue;
			}
			$id     = isset( $v['id'] ) ? substr( (string) $v['id'], 0, 32 ) : '';
			$name   = isset( $v['name'] ) ? (string) $v['name'] : $id;
			$weight = isset( $v['weight'] ) ? max( 0, (int) $v['weight'] ) : 50;
			if ( '' === $id ) {
				continue;
			}
			$out[] = [
				'id'       => $id,
				'name'     => $name,
				'weight'   => $weight,
				'fields'   => is_array( $v['fields'] ?? null ) ? $v['fields'] : [],
				'settings' => is_array( $v['settings'] ?? null ) ? $v['settings'] : [],
			];
		}

		return $out;
	}

	/**
	 * Pick by weight. Defaults to uniform if all weights are 0.
	 *
	 * @param array<int,array<string,mixed>> $variants
	 * @return array<string,mixed>
	 */
	private function weighted_pick( array $variants ): array {
		$total = array_sum( array_column( $variants, 'weight' ) );
		if ( $total <= 0 ) {
			return $variants[ array_rand( $variants ) ];
		}

		$roll = wp_rand( 1, $total );
		$acc  = 0;
		foreach ( $variants as $v ) {
			$acc += (int) $v['weight'];
			if ( $roll <= $acc ) {
				return $v;
			}
		}
		/* Fallback — shouldn't reach here. */
		return $variants[0];
	}
}
