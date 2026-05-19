<?php

namespace FlowForms\Cli;

use FlowForms\Modules\EmailTemplates\Services\EmailTemplateRepository;
use FlowForms\Modules\Entries\Services\EntryRepository;
use FlowForms\Modules\Forms\Services\FormRepository;
use FlowForms\Modules\Templates\Services\TemplateRegistry;

/**
 * FormsPress WP-CLI commands.
 *
 * Run with: `wp formspress <subcommand>`.
 *
 * Subcommands:
 *   form list       List forms.
 *   form export     Export a single form definition to JSON.
 *   form import     Import a form from JSON.
 *   entry list      List entries for a form.
 *   entry export    Export entries (CSV or JSON).
 *   entry delete    Delete a single entry.
 *   entries purge   Bulk-delete old entries.
 *   template list   List built-in / user templates (form templates).
 *   template export Export a form template to JSON.
 */
class FormsPressCliCommands {

	public function __construct(
		private readonly FormRepository $forms,
		private readonly EntryRepository $entries,
		private readonly EmailTemplateRepository $email_templates,
		private readonly ?TemplateRegistry $template_registry = null,
	) {}

	/**
	 * Dispatcher: routes `wp formspress form list` → form_list etc.
	 *
	 * WP-CLI passes positional args + named args as ( $args, $assoc_args ).
	 */
	public function __invoke( array $args, array $assoc_args ): void {
		$sub = (string) ( $args[0] ?? '' );

		if ( '' === $sub ) {
			\WP_CLI::error( 'Usage: wp formspress <form|entry|entries|template> <subcommand>' );
		}

		$rest = array_slice( $args, 1 );

		switch ( $sub ) {
			case 'form':
				$this->dispatch_form( $rest, $assoc_args );
				break;
			case 'entry':
				$this->dispatch_entry( $rest, $assoc_args );
				break;
			case 'entries':
				$this->dispatch_entries( $rest, $assoc_args );
				break;
			case 'template':
				$this->dispatch_template( $rest, $assoc_args );
				break;
			default:
				\WP_CLI::error( "Unknown subcommand: {$sub}" );
		}
	}

	/* ----------------------------- form ------------------------------- */

	private function dispatch_form( array $args, array $assoc ): void {
		$action = (string) ( $args[0] ?? '' );
		$rest   = array_slice( $args, 1 );

		match ( $action ) {
			'list'   => $this->form_list( $rest, $assoc ),
			'export' => $this->form_export( $rest, $assoc ),
			'import' => $this->form_import( $rest, $assoc ),
			default  => \WP_CLI::error( 'Usage: wp formspress form <list|export|import>' ),
		};
	}

	private function form_list( array $args, array $assoc ): void {
		$format = (string) ( $assoc['format'] ?? 'table' );
		$status = (string) ( $assoc['status'] ?? '' );

		$result = $this->forms->get_all( [
			'per_page' => 100,
			'status'   => $status,
		] );

		$rows = array_map(
			fn( $f ) => [
				'id'            => (int) $f['id'],
				'title'         => $f['title'] ?? '',
				'type'          => $f['type'] ?? '',
				'status'        => $f['status'] ?? '',
				'entries_count' => (int) ( $f['entries_count'] ?? 0 ),
				'created_at'    => $f['created_at'] ?? '',
			],
			$result['items'] ?? []
		);

		\WP_CLI\Utils\format_items( $format, $rows, [ 'id', 'title', 'type', 'status', 'entries_count', 'created_at' ] );
	}

	private function form_export( array $args, array $assoc ): void {
		$id   = (int) ( $args[0] ?? 0 );
		$path = (string) ( $assoc['output'] ?? '' );

		if ( ! $id || '' === $path ) {
			\WP_CLI::error( 'Usage: wp formspress form export <id> --output=<path>' );
		}

		$form = $this->forms->get( $id );
		if ( ! $form ) {
			\WP_CLI::error( "Form #{$id} not found." );
		}

		$payload = [
			'_flowforms_export' => 'form',
			'_version'          => defined( 'FLOWFORMS_VERSION' ) ? FLOWFORMS_VERSION : '1.0.0',
			'title'             => $form['title'],
			'description'       => $form['description'] ?? '',
			'type'              => $form['type'],
			'fields'            => $form['fields'] ?? [],
			'settings'          => $form['settings'] ?? [],
			'actions'           => $form['actions'] ?? [],
		];

		$json = wp_json_encode( $payload, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE );
		if ( false === file_put_contents( $path, $json ) ) {
			\WP_CLI::error( "Failed to write to {$path}" );
		}

		\WP_CLI::success( "Form #{$id} exported to {$path}" );
	}

	private function form_import( array $args, array $assoc ): void {
		$path      = (string) ( $args[0] ?? '' );
		$overwrite = ! empty( $assoc['overwrite'] );

		if ( '' === $path || ! file_exists( $path ) ) {
			\WP_CLI::error( 'Usage: wp formspress form import <path> [--overwrite]' );
		}

		$json = file_get_contents( $path );
		$data = json_decode( (string) $json, true );

		if ( ! is_array( $data ) || ( $data['_flowforms_export'] ?? '' ) !== 'form' ) {
			\WP_CLI::error( 'Invalid FormsPress form export file.' );
		}

		$payload = [
			'title'       => $data['title']       ?? __( 'Imported form', 'flowforms' ),
			'description' => $data['description'] ?? '',
			'type'        => $data['type']        ?? 'standard',
			'fields'      => $data['fields']      ?? [],
			'settings'    => $data['settings']    ?? [],
			'actions'     => $data['actions']     ?? [],
		];

		if ( $overwrite && ! empty( $data['id'] ) && $this->forms->get( (int) $data['id'] ) ) {
			$id = (int) $data['id'];
			$this->forms->update( $id, $payload );
			\WP_CLI::success( "Form #{$id} updated from {$path}." );
			return;
		}

		$new_id = $this->forms->create( $payload );
		if ( ! $new_id ) {
			\WP_CLI::error( 'Failed to create form.' );
		}

		\WP_CLI::success( "Form imported as #{$new_id}." );
	}

	/* ----------------------------- entry ------------------------------ */

	private function dispatch_entry( array $args, array $assoc ): void {
		$action = (string) ( $args[0] ?? '' );
		$rest   = array_slice( $args, 1 );

		match ( $action ) {
			'list'   => $this->entry_list( $rest, $assoc ),
			'export' => $this->entry_export( $rest, $assoc ),
			'delete' => $this->entry_delete( $rest, $assoc ),
			default  => \WP_CLI::error( 'Usage: wp formspress entry <list|export|delete>' ),
		};
	}

	private function entry_list( array $args, array $assoc ): void {
		$form_id = (int) ( $args[0] ?? 0 );
		$format  = (string) ( $assoc['format'] ?? 'table' );
		$limit   = max( 1, (int) ( $assoc['limit'] ?? 50 ) );
		$since   = (string) ( $assoc['since'] ?? '' );

		if ( ! $form_id ) {
			\WP_CLI::error( 'Usage: wp formspress entry list <form_id>' );
		}

		$result = $this->entries->get_all( $form_id, [ 'per_page' => $limit ] );

		$rows = [];
		foreach ( $result['items'] ?? [] as $row ) {
			if ( '' !== $since && strtotime( $row['created_at'] ?? '' ) < strtotime( $since ) ) {
				continue;
			}
			$rows[] = [
				'id'         => (int) $row['id'],
				'status'     => $row['status'] ?? '',
				'created_at' => $row['created_at'] ?? '',
				'ip_address' => $row['ip_address'] ?? '',
			];
		}

		\WP_CLI\Utils\format_items( $format, $rows, [ 'id', 'status', 'created_at', 'ip_address' ] );
	}

	private function entry_export( array $args, array $assoc ): void {
		$form_id = (int) ( $args[0] ?? 0 );
		$path    = (string) ( $assoc['output'] ?? '' );
		$format  = strtolower( (string) ( $assoc['format'] ?? 'csv' ) );
		$since   = (string) ( $assoc['since'] ?? '' );

		if ( ! $form_id || '' === $path ) {
			\WP_CLI::error( 'Usage: wp formspress entry export <form_id> --output=<path> [--format=csv|json] [--since=YYYY-MM-DD]' );
		}

		if ( ! in_array( $format, [ 'csv', 'json' ], true ) ) {
			\WP_CLI::error( '--format must be "csv" or "json"' );
		}

		$result = $this->entries->get_all( $form_id, [ 'per_page' => 1000 ] );
		$items  = $result['items'] ?? [];

		$rich = [];
		foreach ( $items as $row ) {
			if ( '' !== $since && strtotime( $row['created_at'] ?? '' ) < strtotime( $since ) ) {
				continue;
			}
			$full   = $this->entries->get( (int) $row['id'] ) ?? $row;
			$flat   = [
				'id'         => $full['id'],
				'status'     => $full['status'] ?? '',
				'created_at' => $full['created_at'] ?? '',
				'ip_address' => $full['ip_address'] ?? '',
			];
			foreach ( $full['values'] ?? [] as $v ) {
				$flat[ (string) ( $v['field_id'] ?? '' ) ] = (string) ( $v['field_value'] ?? '' );
			}
			$rich[] = $flat;
		}

		if ( 'json' === $format ) {
			$json = wp_json_encode( $rich, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE );
			if ( false === file_put_contents( $path, $json ) ) {
				\WP_CLI::error( "Failed to write to {$path}" );
			}
		} else {
			$fp = fopen( $path, 'w' );
			if ( ! $fp ) {
				\WP_CLI::error( "Failed to open {$path} for writing." );
			}
			$headers = [];
			foreach ( $rich as $row ) {
				foreach ( array_keys( $row ) as $k ) {
					if ( ! in_array( $k, $headers, true ) ) {
						$headers[] = $k;
					}
				}
			}
			fputcsv( $fp, $headers );
			foreach ( $rich as $row ) {
				$line = [];
				foreach ( $headers as $h ) {
					$line[] = $row[ $h ] ?? '';
				}
				fputcsv( $fp, $line );
			}
			fclose( $fp );
		}

		\WP_CLI::success( count( $rich ) . " entries exported to {$path}" );
	}

	private function entry_delete( array $args, array $assoc ): void {
		$entry_id = (int) ( $args[0] ?? 0 );

		if ( ! $entry_id ) {
			\WP_CLI::error( 'Usage: wp formspress entry delete <entry_id> [--yes]' );
		}

		\WP_CLI::confirm( "Delete entry #{$entry_id}?", $assoc );

		global $wpdb;
		$table = $wpdb->prefix . 'ff_entries';
		$result = $wpdb->delete( $table, [ 'id' => $entry_id ], [ '%d' ] );

		if ( false === $result ) {
			\WP_CLI::error( 'Delete failed.' );
		}

		\WP_CLI::success( "Entry #{$entry_id} deleted." );
	}

	/* ---------------------------- entries ----------------------------- */

	private function dispatch_entries( array $args, array $assoc ): void {
		$action = (string) ( $args[0] ?? '' );
		$rest   = array_slice( $args, 1 );

		match ( $action ) {
			'purge'  => $this->entries_purge( $rest, $assoc ),
			default  => \WP_CLI::error( 'Usage: wp formspress entries purge <form_id> [--older-than=30 days]' ),
		};
	}

	private function entries_purge( array $args, array $assoc ): void {
		$form_id = (int) ( $args[0] ?? 0 );
		$older   = (string) ( $assoc['older-than'] ?? '30 days' );

		if ( ! $form_id ) {
			\WP_CLI::error( 'Usage: wp formspress entries purge <form_id> [--older-than=30 days]' );
		}

		$cutoff_ts = strtotime( '-' . $older );
		if ( ! $cutoff_ts ) {
			\WP_CLI::error( "Could not parse --older-than={$older}" );
		}
		$cutoff = gmdate( 'Y-m-d H:i:s', $cutoff_ts );

		\WP_CLI::confirm( "Delete entries for form #{$form_id} created before {$cutoff}?", $assoc );

		global $wpdb;
		$table  = $wpdb->prefix . 'ff_entries';
		$deleted = $wpdb->query(
			$wpdb->prepare( // phpcs:ignore
				"DELETE FROM {$table} WHERE form_id = %d AND created_at < %s",
				$form_id,
				$cutoff
			)
		);

		\WP_CLI::success( "{$deleted} entries purged." );
	}

	/* --------------------------- template ----------------------------- */

	private function dispatch_template( array $args, array $assoc ): void {
		$action = (string) ( $args[0] ?? '' );
		$rest   = array_slice( $args, 1 );

		match ( $action ) {
			'list'   => $this->template_list( $rest, $assoc ),
			'export' => $this->template_export( $rest, $assoc ),
			default  => \WP_CLI::error( 'Usage: wp formspress template <list|export>' ),
		};
	}

	private function template_list( array $args, array $assoc ): void {
		$format = (string) ( $assoc['format'] ?? 'table' );

		$form_templates = [];
		if ( $this->template_registry && method_exists( $this->template_registry, 'all' ) ) {
			foreach ( (array) $this->template_registry->all() as $tpl ) {
				$form_templates[] = [
					'id'    => is_array( $tpl ) ? ( $tpl['id'] ?? '' )    : ( method_exists( $tpl, 'id' )    ? $tpl->id()    : '' ),
					'label' => is_array( $tpl ) ? ( $tpl['label'] ?? '' ) : ( method_exists( $tpl, 'label' ) ? $tpl->label() : '' ),
					'kind'  => 'form',
				];
			}
		}

		$email_templates = $this->email_templates->get_all();
		foreach ( $email_templates as $row ) {
			$form_templates[] = [
				'id'    => (string) $row['id'],
				'label' => $row['name'],
				'kind'  => 'email',
			];
		}

		\WP_CLI\Utils\format_items( $format, $form_templates, [ 'id', 'label', 'kind' ] );
	}

	private function template_export( array $args, array $assoc ): void {
		$id   = (string) ( $args[0] ?? '' );
		$path = (string) ( $assoc['output'] ?? '' );

		if ( '' === $id || '' === $path ) {
			\WP_CLI::error( 'Usage: wp formspress template export <id> --output=<path>' );
		}

		$tpl = null;

		// Email template (numeric ID) first.
		if ( is_numeric( $id ) ) {
			$row = $this->email_templates->get( (int) $id );
			if ( $row ) {
				$tpl = [
					'_flowforms_export' => 'email-template',
					'name'              => $row['name'],
					'subject'           => $row['subject'],
					'body'              => $row['body'],
				];
			}
		}

		// Otherwise form template via registry.
		if ( ! $tpl && $this->template_registry && method_exists( $this->template_registry, 'get' ) ) {
			$registry_tpl = $this->template_registry->get( $id );
			if ( $registry_tpl ) {
				$tpl = [
					'_flowforms_export' => 'form-template',
					'data'              => is_array( $registry_tpl ) ? $registry_tpl : (array) $registry_tpl,
				];
			}
		}

		if ( ! $tpl ) {
			\WP_CLI::error( "Template '{$id}' not found." );
		}

		$json = wp_json_encode( $tpl, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE );
		if ( false === file_put_contents( $path, $json ) ) {
			\WP_CLI::error( "Failed to write to {$path}" );
		}

		\WP_CLI::success( "Template '{$id}' exported to {$path}" );
	}
}
