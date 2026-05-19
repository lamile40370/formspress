<?php

namespace FlowForms\Modules\Actions\Services;

class ActionRunner {

	public function __construct( private readonly ActionRegistry $registry ) {}

	public function run( array $form, array $entry ): void {
		$form_actions = $form['actions'] ?? [];

		if ( empty( $form_actions ) ) {
			return;
		}

		foreach ( $form_actions as $action_config ) {
			if ( empty( $action_config['type'] ) || empty( $action_config['enabled'] ) ) {
				continue;
			}

			if ( ! $this->evaluate_conditions( $action_config['conditions'] ?? [], $entry ) ) {
				continue;
			}

			$action = $this->registry->get( $action_config['type'] );

			if ( $action ) {
				try {
					$action->run( $action_config, $entry, $form );
					do_action( 'flowforms_action_ran', $action_config['type'], $entry, $form );
				} catch ( \Throwable $e ) {
					do_action( 'flowforms_action_failed', $action_config['type'], $e, $entry, $form );
				}
			}
		}
	}

	private function evaluate_conditions( array $conditions, array $entry ): bool {
		if ( empty( $conditions ) ) {
			return true;
		}

		$entry_values = [];
		foreach ( $entry['values'] ?? [] as $value ) {
			$entry_values[ $value['field_id'] ] = $value['field_value'];
		}

		foreach ( $conditions as $condition ) {
			$field_value = $entry_values[ $condition['field_id'] ?? '' ] ?? '';
			$operator    = $condition['operator'] ?? 'is';
			$compare     = $condition['value'] ?? '';

			$passes = match ( $operator ) {
				'is'         => $field_value === $compare,
				'is_not'     => $field_value !== $compare,
				'contains'   => str_contains( $field_value, $compare ),
				'not_contains' => ! str_contains( $field_value, $compare ),
				'is_empty'   => $field_value === '',
				'not_empty'  => $field_value !== '',
				default      => true,
			};

			if ( ! $passes ) {
				return false;
			}
		}

		return true;
	}
}
