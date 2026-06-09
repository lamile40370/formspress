<?php

namespace FlowForms\Modules\Templates\Services\Templates;

use FlowForms\Modules\Templates\Services\AbstractTemplate;
use FlowForms\Modules\Templates\Services\TemplateBlocks as TB;

/**
 * Event registration — premium conference / workshop signup. Hero
 * image banner at the top (via core/image), then a white card with
 * structured registration fields. Dietary preferences as checkboxes,
 * ticket type as a select, full-width branded submit.
 */
class EventRegistrationTemplate extends AbstractTemplate {

	public function get_id(): string          { return 'event-registration'; }
	public function get_label(): string       { return __( 'Event registration', 'formspress' ); }
	public function get_description(): string { return __( 'Conference / workshop signup — banner image, ticket type, dietary checkboxes.', 'formspress' ); }
	public function get_category(): string    { return 'event'; }
	public function get_type(): string        { return 'standard'; }
	public function get_icon(): string        { return 'calendar-alt'; }

	public function get_fields(): array {
		return [
			[ 'id' => 'first_name', 'type' => 'text',     'label' => __( 'First name', 'formspress' ), 'required' => true ],
			[ 'id' => 'last_name',  'type' => 'text',     'label' => __( 'Last name', 'formspress' ),  'required' => true ],
			[ 'id' => 'email',      'type' => 'email',    'label' => __( 'Email', 'formspress' ),      'required' => true ],
			[ 'id' => 'company',    'type' => 'text',     'label' => __( 'Company', 'formspress' ) ],
			[ 'id' => 'ticket',     'type' => 'select',   'label' => __( 'Ticket type', 'formspress' ), 'required' => true, 'options' => [ __( 'General admission', 'formspress' ), __( 'VIP', 'formspress' ), __( 'Student', 'formspress' ) ] ],
			[ 'id' => 'dietary',    'type' => 'checkbox', 'label' => __( 'Dietary preferences', 'formspress' ), 'options' => [ __( 'Vegetarian', 'formspress' ), __( 'Vegan', 'formspress' ), __( 'Gluten-free', 'formspress' ) ] ],
			[ 'id' => 'notes',      'type' => 'textarea', 'label' => __( 'Anything else we should know?', 'formspress' ) ],
		];
	}

	public function get_actions(): array {
		return [
			[
				'type'     => 'email',
				'enabled'  => true,
				'to'       => get_option( 'admin_email', '' ),
				'subject'  => sprintf( __( 'Event registration — %s %s', 'formspress' ), '{field:first_name}', '{field:last_name}' ),
				'body'     => '',
				'reply_to' => '{field:email}',
			],
		];
	}

	public function get_block_markup(): ?string {
		$image_url = TB::placeholder( '1200x500', '4f46e5', 'ffffff' );

		$tickets = [
			[ 'label' => __( 'General admission', 'formspress' ), 'value' => 'general' ],
			[ 'label' => __( 'VIP', 'formspress' ),               'value' => 'vip' ],
			[ 'label' => __( 'Student', 'formspress' ),           'value' => 'student' ],
		];
		$diet = [
			[ 'label' => __( 'Vegetarian', 'formspress' ),  'value' => 'vegetarian' ],
			[ 'label' => __( 'Vegan', 'formspress' ),       'value' => 'vegan' ],
			[ 'label' => __( 'Gluten-free', 'formspress' ), 'value' => 'gluten-free' ],
		];

		$name_row = TB::columns(
			TB::field_text( [ 'fieldId' => 'first_name', 'label' => __( 'First name', 'formspress' ), 'required' => true ] ),
			TB::field_text( [ 'fieldId' => 'last_name',  'label' => __( 'Last name', 'formspress' ),  'required' => true ] ),
			'16px'
		);

		$inner = implode( "\n", [
			TB::image( $image_url, __( 'Event banner', 'formspress' ), [ 'radius' => '12px' ] ),
			TB::heading( [
				'text'         => __( 'Register for the event', 'formspress' ),
				'level'        => 2,
				'size'         => '30px',
				'weight'       => '800',
				'color'        => '#0f172a',
				'marginBottom' => '8px',
			] ),
			TB::description( [
				'text'         => __( 'Limited seats — registration closes one week before the event.', 'formspress' ),
				'color'        => '#475569',
				'size'         => '15px',
				'marginBottom' => '24px',
			] ),
			$name_row,
			TB::field_email(   [ 'fieldId' => 'email',   'label' => __( 'Email', 'formspress' ), 'required' => true, 'placeholder' => 'you@example.com' ] ),
			TB::field_text(    [ 'fieldId' => 'company', 'label' => __( 'Company / organisation', 'formspress' ) ] ),
			TB::field_select(  [ 'fieldId' => 'ticket',  'label' => __( 'Ticket type', 'formspress' ), 'required' => true, 'options' => $tickets ] ),
			TB::field_checkbox([ 'fieldId' => 'dietary', 'label' => __( 'Dietary preferences', 'formspress' ), 'options' => $diet ] ),
			TB::field_textarea([ 'fieldId' => 'notes',   'label' => __( 'Anything else we should know?', 'formspress' ), 'rows' => 3 ] ),
			TB::submit_button( [ 'text' => __( 'Complete registration', 'formspress' ), 'bg' => '#4f46e5', 'fg' => '#ffffff', 'full' => true ] ),
		] );

		return TB::group( [
			'inner'    => $inner,
			'bg'       => '#ffffff',
			'border'   => '#a5b4fc',
			'borderWidth' => '1px',
			'radius'   => '18px',
			'padding'  => '56px',
			'maxWidth' => '700px',
		] );
	}
}
