<?php

namespace FlowForms\Modules\Templates\Services\Templates;

use FlowForms\Modules\Templates\Services\AbstractTemplate;
use FlowForms\Modules\Templates\Services\TemplateBlocks as TB;

/**
 * Fitness class booking — vibrant emerald gradient feel with high-energy
 * typography. Class type + date + first-timer toggle. Designed for
 * gym / yoga studio landing pages.
 */
class FitnessClassBookingTemplate extends AbstractTemplate {

	public function get_id(): string          { return 'fitness-class-booking'; }
	public function get_label(): string       { return __( 'Fitness class booking', 'formspress' ); }
	public function get_description(): string { return __( 'Book a class — bold emerald card, class type / date / first-timer toggle.', 'formspress' ); }
	public function get_category(): string    { return 'fitness'; }
	public function get_type(): string        { return 'standard'; }
	public function get_icon(): string        { return 'heart'; }

	public function get_fields(): array {
		return [
			[ 'id' => 'name',       'type' => 'text',     'label' => __( 'Full name', 'formspress' ), 'required' => true ],
			[ 'id' => 'email',      'type' => 'email',    'label' => __( 'Email', 'formspress' ),     'required' => true ],
			[ 'id' => 'class_type', 'type' => 'select',   'label' => __( 'Class', 'formspress' ),     'required' => true, 'options' => [ __( 'HIIT', 'formspress' ), __( 'Yoga', 'formspress' ), __( 'Pilates', 'formspress' ), __( 'CrossFit', 'formspress' ), __( 'Boxing', 'formspress' ) ] ],
			[ 'id' => 'date',       'type' => 'text',     'label' => __( 'Preferred date', 'formspress' ), 'required' => true ],
			[ 'id' => 'first_time', 'type' => 'radio',    'label' => __( 'Is this your first class?', 'formspress' ), 'options' => [ __( 'Yes — I am new', 'formspress' ), __( 'No — I am a member', 'formspress' ) ] ],
		];
	}

	public function get_block_markup(): ?string {
		$classes = [
			[ 'label' => __( 'HIIT', 'formspress' ),     'value' => 'hiit' ],
			[ 'label' => __( 'Yoga', 'formspress' ),     'value' => 'yoga' ],
			[ 'label' => __( 'Pilates', 'formspress' ),  'value' => 'pilates' ],
			[ 'label' => __( 'CrossFit', 'formspress' ), 'value' => 'crossfit' ],
			[ 'label' => __( 'Boxing', 'formspress' ),   'value' => 'boxing' ],
		];
		$first_time = [
			[ 'label' => __( 'Yes — I am new', 'formspress' ),       'value' => 'yes' ],
			[ 'label' => __( 'No — I am a member', 'formspress' ),   'value' => 'no' ],
		];

		$inner = implode( "\n", [
			TB::heading( [
				'text' => __( 'Book your first class', 'formspress' ),
				'level' => 2, 'size' => '36px', 'weight' => '800', 'color' => '#ffffff',
				'align' => 'center', 'marginBottom' => '8px',
			] ),
			TB::description( [
				'text' => __( 'First class is on us. Pick a slot and show up — we handle the rest.', 'formspress' ),
				'color' => '#a7f3d0', 'size' => '16px', 'align' => 'center', 'marginBottom' => '28px',
			] ),
			TB::field_text(   [ 'fieldId' => 'name',       'label' => __( 'Full name', 'formspress' ), 'required' => true ] ),
			TB::field_email(  [ 'fieldId' => 'email',      'label' => __( 'Email', 'formspress' ),     'required' => true ] ),
			TB::field_select( [ 'fieldId' => 'class_type', 'label' => __( 'Class', 'formspress' ),     'required' => true, 'options' => $classes ] ),
			TB::field_text(   [ 'fieldId' => 'date',       'label' => __( 'Preferred date', 'formspress' ), 'required' => true, 'placeholder' => 'YYYY-MM-DD' ] ),
			TB::field_radio(  [ 'fieldId' => 'first_time', 'label' => __( 'Is this your first class?', 'formspress' ), 'options' => $first_time ] ),
			TB::submit_button( [ 'text' => __( 'Reserve my spot', 'formspress' ), 'bg' => '#ffffff', 'fg' => '#065f46', 'full' => true ] ),
		] );

		return TB::group( [
			'inner'   => $inner,
			'gradient' => 'linear-gradient(145deg,#052e16 0%,#047857 58%,#bef264 100%)',
			'fg'      => '#ffffff',
			'border'  => '#10b981',
			'radius'  => '20px',
			'padding' => '64px',
			'maxWidth' => '580px',
		] );
	}
}
