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
	public function get_label(): string       { return __( 'Fitness class booking', 'flowforms' ); }
	public function get_description(): string { return __( 'Book a class — bold emerald card, class type / date / first-timer toggle.', 'flowforms' ); }
	public function get_category(): string    { return 'fitness'; }
	public function get_type(): string        { return 'standard'; }
	public function get_icon(): string        { return 'heart'; }

	public function get_fields(): array {
		return [
			[ 'id' => 'name',       'type' => 'text',     'label' => __( 'Full name', 'flowforms' ), 'required' => true ],
			[ 'id' => 'email',      'type' => 'email',    'label' => __( 'Email', 'flowforms' ),     'required' => true ],
			[ 'id' => 'class_type', 'type' => 'select',   'label' => __( 'Class', 'flowforms' ),     'required' => true, 'options' => [ __( 'HIIT', 'flowforms' ), __( 'Yoga', 'flowforms' ), __( 'Pilates', 'flowforms' ), __( 'CrossFit', 'flowforms' ), __( 'Boxing', 'flowforms' ) ] ],
			[ 'id' => 'date',       'type' => 'text',     'label' => __( 'Preferred date', 'flowforms' ), 'required' => true ],
			[ 'id' => 'first_time', 'type' => 'radio',    'label' => __( 'Is this your first class?', 'flowforms' ), 'options' => [ __( 'Yes — I am new', 'flowforms' ), __( 'No — I am a member', 'flowforms' ) ] ],
		];
	}

	public function get_block_markup(): ?string {
		$classes = [
			[ 'label' => __( 'HIIT', 'flowforms' ),     'value' => 'hiit' ],
			[ 'label' => __( 'Yoga', 'flowforms' ),     'value' => 'yoga' ],
			[ 'label' => __( 'Pilates', 'flowforms' ),  'value' => 'pilates' ],
			[ 'label' => __( 'CrossFit', 'flowforms' ), 'value' => 'crossfit' ],
			[ 'label' => __( 'Boxing', 'flowforms' ),   'value' => 'boxing' ],
		];
		$first_time = [
			[ 'label' => __( 'Yes — I am new', 'flowforms' ),       'value' => 'yes' ],
			[ 'label' => __( 'No — I am a member', 'flowforms' ),   'value' => 'no' ],
		];

		$inner = implode( "\n", [
			TB::heading( [
				'text' => __( 'Book your first class', 'flowforms' ),
				'level' => 2, 'size' => '36px', 'weight' => '800', 'color' => '#ffffff',
				'align' => 'center', 'marginBottom' => '8px',
			] ),
			TB::description( [
				'text' => __( 'First class is on us. Pick a slot and show up — we handle the rest.', 'flowforms' ),
				'color' => '#a7f3d0', 'size' => '16px', 'align' => 'center', 'marginBottom' => '28px',
			] ),
			TB::field_text(   [ 'fieldId' => 'name',       'label' => __( 'Full name', 'flowforms' ), 'required' => true ] ),
			TB::field_email(  [ 'fieldId' => 'email',      'label' => __( 'Email', 'flowforms' ),     'required' => true ] ),
			TB::field_select( [ 'fieldId' => 'class_type', 'label' => __( 'Class', 'flowforms' ),     'required' => true, 'options' => $classes ] ),
			TB::field_text(   [ 'fieldId' => 'date',       'label' => __( 'Preferred date', 'flowforms' ), 'required' => true, 'placeholder' => 'YYYY-MM-DD' ] ),
			TB::field_radio(  [ 'fieldId' => 'first_time', 'label' => __( 'Is this your first class?', 'flowforms' ), 'options' => $first_time ] ),
			TB::submit_button( [ 'text' => __( 'Reserve my spot', 'flowforms' ), 'bg' => '#ffffff', 'fg' => '#065f46', 'full' => true ] ),
		] );

		return TB::group( [
			'inner'   => $inner,
			'bg'      => '#064e3b',
			'fg'      => '#ffffff',
			'border'  => '#10b981',
			'radius'  => '20px',
			'padding' => '64px',
			'maxWidth' => '580px',
		] );
	}
}
