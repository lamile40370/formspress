<?php

namespace FlowForms\Modules\Templates\Services\Templates;

use FlowForms\Modules\Templates\Services\AbstractTemplate;
use FlowForms\Modules\Templates\Services\TemplateBlocks as TB;

class CourseEnrollmentTemplate extends AbstractTemplate {

	public function get_id(): string          { return 'course-enrollment'; }
	public function get_label(): string       { return __( 'Course enrollment', 'formspress' ); }
	public function get_description(): string { return __( 'Education signup with cohort selection, experience level and learning goals.', 'formspress' ); }
	public function get_category(): string    { return 'education'; }
	public function get_type(): string        { return 'standard'; }
	public function get_icon(): string        { return 'welcome-learn-more'; }

	public function get_fields(): array {
		return [
			[ 'id' => 'student_name', 'type' => 'text', 'label' => __( 'Student name', 'formspress' ), 'required' => true ],
			[ 'id' => 'email', 'type' => 'email', 'label' => __( 'Email', 'formspress' ), 'required' => true ],
			[ 'id' => 'cohort', 'type' => 'select', 'label' => __( 'Preferred cohort', 'formspress' ), 'options' => [ __( 'Weekdays', 'formspress' ), __( 'Evenings', 'formspress' ), __( 'Weekend intensive', 'formspress' ) ] ],
			[ 'id' => 'level', 'type' => 'radio', 'label' => __( 'Current level', 'formspress' ), 'options' => [ __( 'Beginner', 'formspress' ), __( 'Intermediate', 'formspress' ), __( 'Advanced', 'formspress' ) ] ],
			[ 'id' => 'goals', 'type' => 'textarea', 'label' => __( 'Learning goals', 'formspress' ), 'required' => true ],
		];
	}

	public function get_block_markup(): ?string {
		$cohorts = [
			[ 'label' => __( 'Weekdays', 'formspress' ),          'value' => 'weekdays' ],
			[ 'label' => __( 'Evenings', 'formspress' ),          'value' => 'evenings' ],
			[ 'label' => __( 'Weekend intensive', 'formspress' ), 'value' => 'weekend' ],
		];
		$levels = [
			[ 'label' => __( 'Beginner', 'formspress' ),     'value' => 'beginner' ],
			[ 'label' => __( 'Intermediate', 'formspress' ), 'value' => 'intermediate' ],
			[ 'label' => __( 'Advanced', 'formspress' ),     'value' => 'advanced' ],
		];

		$identity_row = TB::columns(
			TB::field_text( [ 'fieldId' => 'student_name', 'label' => __( 'Student name', 'formspress' ), 'required' => true ] ),
			TB::field_email( [ 'fieldId' => 'email', 'label' => __( 'Email', 'formspress' ), 'required' => true ] ),
			'16px'
		);
		$program_row = TB::columns(
			TB::field_select( [ 'fieldId' => 'cohort', 'label' => __( 'Preferred cohort', 'formspress' ), 'options' => $cohorts ] ),
			TB::field_radio( [ 'fieldId' => 'level', 'label' => __( 'Current level', 'formspress' ), 'options' => $levels ] ),
			'20px'
		);

		$inner = implode( "\n", [
			TB::group( [
				'inner' => implode( "\n", [
					TB::heading( [
						'text' => __( 'Weekend intensive', 'formspress' ),
						'level' => 3, 'size' => '17px', 'weight' => '700', 'align' => 'center',
						'color' => '#fde68a', 'marginBottom' => '18px',
					] ),
					TB::heading( [
						'text' => __( 'Join the next cohort', 'formspress' ),
						'level' => 2, 'size' => '42px', 'weight' => '800', 'align' => 'center',
						'color' => '#ffffff', 'marginBottom' => '10px',
					] ),
					TB::description( [
						'text' => __( 'Enroll in a practical course built around live sessions, assignments and feedback.', 'formspress' ),
						'color' => '#fffbeb', 'size' => '16px', 'align' => 'center', 'marginBottom' => '0',
					] ),
				] ),
				'gradient' => 'linear-gradient(135deg,#111827 0%,#7c2d12 55%,#f59e0b 100%)',
				'fg' => '#ffffff',
				'radius' => '24px',
				'padding' => '58px',
			] ),
			TB::group( [
				'inner' => implode( "\n", [
					$identity_row,
					$program_row,
					TB::field_textarea( [ 'fieldId' => 'goals', 'label' => __( 'Learning goals', 'formspress' ), 'rows' => 4, 'required' => true ] ),
					TB::submit_button( [ 'text' => __( 'Enroll now', 'formspress' ), 'bg' => '#b45309', 'fg' => '#ffffff', 'full' => true ] ),
				] ),
				'bg' => '#ffffff',
				'border' => '#fed7aa',
				'radius' => '18px',
				'padding' => '46px',
			] ),
		] );

		return TB::group( [
			'inner' => $inner,
			'gradient' => 'linear-gradient(180deg,#fff7ed 0%,#fffbeb 50%,#f8fafc 100%)',
			'border' => '#fed7aa',
			'radius' => '22px',
			'padding' => '26px',
			'maxWidth' => '860px',
		] );
	}
}
