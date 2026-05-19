<?php

namespace FlowForms\Modules\Webhooks\Services;

use FlowForms\Hooks\Attributes\Action;

/**
 * Bridges native FormsPress WP hooks into our normalised event names.
 *
 * Each handler builds a clean payload (no internal/private fields) and forwards
 * to `WebhookDispatcher::dispatch()`. We also fire a generic
 * `do_action( 'flowforms_event', $event, $payload )` so third-party plugins
 * can listen without needing to subscribe to each underlying hook.
 */
class WebhookEventBridge {

	public function __construct(
		private readonly WebhookDispatcher $dispatcher,
	) {}

	#[Action( 'flowforms_entry_created', priority: 99, accepted_args: 2 )]
	public function on_entry_created( array $entry, array $form ): void {
		$this->fire( 'entry.created', [
			'entry' => $this->serialize_entry( $entry ),
			'form'  => $this->serialize_form( $form ),
		] );
	}

	#[Action( 'flowforms_entry_deleted', priority: 10, accepted_args: 2 )]
	public function on_entry_deleted( int $entry_id, int $form_id ): void {
		$this->fire( 'entry.deleted', [
			'entry_id' => $entry_id,
			'form_id'  => $form_id,
		] );
	}

	#[Action( 'flowforms_entry_status_changed', priority: 10, accepted_args: 3 )]
	public function on_entry_status_changed( int $entry_id, string $new_status, string $old_status ): void {
		if ( 'starred' === $new_status && 'starred' !== $old_status ) {
			$this->fire( 'entry.starred', [
				'entry_id' => $entry_id,
				'status'   => $new_status,
			] );
		}
	}

	#[Action( 'flowforms_form_created', priority: 10, accepted_args: 1 )]
	public function on_form_created( array $form ): void {
		$this->fire( 'form.created', [ 'form' => $this->serialize_form( $form ) ] );
	}

	#[Action( 'flowforms_form_updated', priority: 10, accepted_args: 2 )]
	public function on_form_updated( array $form, array $previous = [] ): void {
		$this->fire( 'form.updated', [
			'form'     => $this->serialize_form( $form ),
			'previous' => $previous ? $this->serialize_form( $previous ) : null,
		] );

		$status_now  = (string) ( $form['status']     ?? '' );
		$status_prev = (string) ( $previous['status'] ?? '' );

		if ( 'active' === $status_now && $status_prev && 'active' !== $status_prev ) {
			$this->fire( 'form.published', [ 'form_id' => (int) ( $form['id'] ?? 0 ) ] );
		}
		if ( 'inactive' === $status_now && 'active' === $status_prev ) {
			$this->fire( 'form.unpublished', [ 'form_id' => (int) ( $form['id'] ?? 0 ) ] );
		}
	}

	#[Action( 'flowforms_form_deleted', priority: 10, accepted_args: 1 )]
	public function on_form_deleted( int $form_id ): void {
		$this->fire( 'form.deleted', [ 'form_id' => $form_id ] );
	}

	private function fire( string $event, array $payload ): void {
		$this->dispatcher->dispatch( $event, $payload );
		do_action( 'flowforms_event', $event, $payload );
	}

	private function serialize_entry( array $entry ): array {
		$fields = [];
		foreach ( $entry['values'] ?? [] as $v ) {
			$fields[ (string) ( $v['field_id'] ?? '' ) ] = [
				'label' => $v['field_label'] ?? '',
				'value' => $v['field_value'] ?? '',
			];
		}

		return [
			'id'         => (int) ( $entry['id']      ?? 0 ),
			'form_id'    => (int) ( $entry['form_id'] ?? 0 ),
			'status'     => $entry['status']     ?? '',
			'created_at' => $entry['created_at'] ?? '',
			'source_url' => $entry['source_url'] ?? '',
			'fields'     => $fields,
		];
	}

	private function serialize_form( array $form ): array {
		return [
			'id'     => (int) ( $form['id'] ?? 0 ),
			'title'  => (string) ( $form['title']  ?? '' ),
			'type'   => (string) ( $form['type']   ?? '' ),
			'status' => (string) ( $form['status'] ?? '' ),
		];
	}
}
