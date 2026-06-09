<?php

namespace FlowForms\Modules\Entries\Endpoints;

use FlowForms\Core\AbstractEndpoint;
use FlowForms\Modules\Entries\Services\EntryRepository;
use FlowForms\Modules\Forms\Services\FormRepository;
use WP_REST_Request;
use WP_REST_Response;

class ExportEntries extends AbstractEndpoint {

	public function __construct(
		private readonly EntryRepository $entry_repo,
		private readonly FormRepository $form_repo,
	) {}

	public function __invoke( WP_REST_Request $request ): WP_REST_Response {
		$form_id = (int) $request->get_param( 'form_id' );
		$form    = $this->form_repo->get( $form_id );

		if ( ! $form ) {
			return $this->error( __( 'Form not found.', 'formspress' ), 404 );
		}

		$entries = $this->entry_repo->export_csv( $form_id );

		$rows   = [];
		$rows[] = [ 'ID', 'Date', 'Status', 'IP', 'Source URL', 'Fields' ];

		foreach ( $entries as $entry ) {
			$rows[] = [
				$entry['id'],
				$entry['created_at'],
				$entry['status'],
				$entry['ip_address'],
				$entry['source_url'],
				$entry['values_str'] ?? '',
			];
		}

		return $this->success( [
			'form_title' => $form['title'],
			'rows'       => $rows,
			'count'      => count( $entries ),
		] );
	}
}
