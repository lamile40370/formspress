<?php

namespace FlowForms\Modules\Templates\Services;

use FlowForms\Modules\Templates\Services\Templates\ContactFormTemplate;
use FlowForms\Modules\Templates\Services\Templates\NewsletterSignupTemplate;
use FlowForms\Modules\Templates\Services\Templates\SupportRequestTemplate;
use FlowForms\Modules\Templates\Services\Templates\LeadCaptureFlowTemplate;
use FlowForms\Modules\Templates\Services\Templates\CustomerSurveyTemplate;
use FlowForms\Modules\Templates\Services\Templates\EventRSVPTemplate;
use FlowForms\Modules\Templates\Services\Templates\JobApplicationTemplate;
use FlowForms\Modules\Templates\Services\Templates\QuickPollTemplate;
use FlowForms\Modules\Templates\Services\Templates\HeroCoverSignupTemplate;
use FlowForms\Modules\Templates\Services\Templates\QuoteRequestTemplate;
use FlowForms\Modules\Templates\Services\Templates\EventRegistrationTemplate;
use FlowForms\Modules\Templates\Services\Templates\RestaurantReservationTemplate;
use FlowForms\Modules\Templates\Services\Templates\RealEstateInquiryTemplate;
use FlowForms\Modules\Templates\Services\Templates\FitnessClassBookingTemplate;
use FlowForms\Modules\Templates\Services\Templates\HealthcareAppointmentTemplate;
use FlowForms\Modules\Templates\Services\Templates\NonprofitDonationTemplate;
use FlowForms\Modules\Templates\Services\Templates\PhotographyBookingTemplate;

class TemplateRegistry {

	private const USER_OPTION = 'flowforms_user_templates';

	/** @var Template[] */
	private array $templates = [];

	public function __construct() {
		$built_ins = [
			// Hero / lead-gen
			new HeroCoverSignupTemplate(),
			new NewsletterSignupTemplate(),
			new QuoteRequestTemplate(),
			// Contact / support
			new ContactFormTemplate(),
			new SupportRequestTemplate(),
			// Events
			new EventRegistrationTemplate(),
			// Industry-specific
			new RestaurantReservationTemplate(),
			new RealEstateInquiryTemplate(),
			new FitnessClassBookingTemplate(),
			new HealthcareAppointmentTemplate(),
			new NonprofitDonationTemplate(),
			new PhotographyBookingTemplate(),
			new JobApplicationTemplate(),
			// Flow forms (multi-step)
			new LeadCaptureFlowTemplate(),
			new CustomerSurveyTemplate(),
			new EventRSVPTemplate(),
			new QuickPollTemplate(),
		];

		foreach ( $built_ins as $tpl ) {
			$this->register( $tpl->to_template() );
		}

		/**
		 * Allow third-party plugins to register their own FormsPress templates.
		 *
		 * Example:
		 *     add_action( 'flowforms_register_templates', function ( $registry ) {
		 *         $registry->register_from_array( [
		 *             'id'    => 'my-template',
		 *             'label' => 'My template',
		 *             'type'  => 'standard',
		 *             'fields'=> [ ... ],
		 *         ] );
		 *     } );
		 *
		 * @param TemplateRegistry $registry The template registry instance.
		 */
		do_action( 'flowforms_register_templates', $this );
	}

	public function register( Template $template ): void {
		$this->templates[ $template->id ] = $template;
	}

	public function register_from_array( array $data ): void {
		$template = Template::from_array( $data );

		if ( '' === $template->id ) {
			return;
		}

		$this->register( $template );
	}

	public function get( string $id ): ?Template {
		if ( isset( $this->templates[ $id ] ) ) {
			return $this->templates[ $id ];
		}

		foreach ( $this->get_user_templates() as $tpl ) {
			if ( $tpl->id === $id ) {
				return $tpl;
			}
		}

		return null;
	}

	/** @return Template[] */
	public function all(): array {
		return array_values( $this->templates );
	}

	/** @return Template[] */
	public function get_user_templates(): array {
		$raw = get_option( self::USER_OPTION, [] );

		if ( ! is_array( $raw ) ) {
			return [];
		}

		$out = [];

		foreach ( $raw as $data ) {
			if ( ! is_array( $data ) ) {
				continue;
			}

			$data['is_user'] = true;
			$out[] = Template::from_array( $data );
		}

		return $out;
	}

	public function save_user_template( array $data, int $form_id ): array {
		$id = 'user_' . wp_generate_password( 8, false, false );

		$record = [
			'id'          => $id,
			'label'       => sanitize_text_field( $data['label'] ?? '' ),
			'description' => sanitize_textarea_field( $data['description'] ?? '' ),
			'category'    => sanitize_key( $data['category'] ?? 'other' ),
			'type'        => in_array( $data['type'] ?? 'standard', [ 'standard', 'flow' ], true ) ? $data['type'] : 'standard',
			'icon'        => sanitize_key( $data['icon'] ?? 'cog' ),
			'fields'      => is_array( $data['fields'] ?? null ) ? $data['fields'] : [],
			'settings'    => is_array( $data['settings'] ?? null ) ? $data['settings'] : [],
			'actions'     => is_array( $data['actions'] ?? null ) ? $data['actions'] : [],
			'source_form' => $form_id,
			'created_at'  => current_time( 'mysql' ),
			'is_user'     => true,
		];

		$existing   = get_option( self::USER_OPTION, [] );
		$existing   = is_array( $existing ) ? $existing : [];
		$existing[] = $record;

		update_option( self::USER_OPTION, $existing );

		return $record;
	}

	public function delete_user_template( string $id ): bool {
		if ( ! str_starts_with( $id, 'user_' ) ) {
			return false;
		}

		$existing = get_option( self::USER_OPTION, [] );

		if ( ! is_array( $existing ) ) {
			return false;
		}

		$filtered = array_values( array_filter(
			$existing,
			fn( $tpl ) => is_array( $tpl ) && ( $tpl['id'] ?? '' ) !== $id
		) );

		if ( count( $filtered ) === count( $existing ) ) {
			return false;
		}

		update_option( self::USER_OPTION, $filtered );

		return true;
	}

	public function get_built_in_schema(): array {
		return array_map( fn( Template $t ) => $t->to_array(), $this->all() );
	}

	public function get_user_schema(): array {
		return array_map( fn( Template $t ) => $t->to_array(), $this->get_user_templates() );
	}
}
