<?php

namespace FlowForms\Extensibility\FieldTypes;

use FlowForms\Extensibility\FieldTypes\Types\AddressFieldType;
use FlowForms\Extensibility\FieldTypes\Types\CalculationFieldType;
use FlowForms\Extensibility\FieldTypes\Types\CheckboxFieldType;
use FlowForms\Extensibility\FieldTypes\Types\DateFieldType;
use FlowForms\Extensibility\FieldTypes\Types\EmailFieldType;
use FlowForms\Extensibility\FieldTypes\Types\FileFieldType;
use FlowForms\Extensibility\FieldTypes\Types\HiddenFieldType;
use FlowForms\Extensibility\FieldTypes\Types\NpsFieldType;
use FlowForms\Extensibility\FieldTypes\Types\NumberFieldType;
use FlowForms\Extensibility\FieldTypes\Types\OpinionScaleFieldType;
use FlowForms\Extensibility\FieldTypes\Types\PageBreakFieldType;
use FlowForms\Extensibility\FieldTypes\Types\PhoneFieldType;
use FlowForms\Extensibility\FieldTypes\Types\RadioFieldType;
use FlowForms\Extensibility\FieldTypes\Types\RatingFieldType;
use FlowForms\Extensibility\FieldTypes\Types\RowFieldType;
use FlowForms\Extensibility\FieldTypes\Types\SectionFieldType;
use FlowForms\Extensibility\FieldTypes\Types\SelectFieldType;
use FlowForms\Extensibility\FieldTypes\Types\SignatureFieldType;
use FlowForms\Extensibility\FieldTypes\Types\StatementFieldType;
use FlowForms\Extensibility\FieldTypes\Types\TextFieldType;
use FlowForms\Extensibility\FieldTypes\Types\TextareaFieldType;
use FlowForms\Extensibility\FieldTypes\Types\TimeFieldType;
use FlowForms\Extensibility\FieldTypes\Types\UrlFieldType;
use FlowForms\Extensibility\FieldTypes\Types\YesNoFieldType;

class FieldTypeRegistry {

	/** @var AbstractFieldType[] */
	private array $types = [];

	public function __construct() {
		/* Basic */
		$this->register( new TextFieldType() );
		$this->register( new EmailFieldType() );
		$this->register( new PhoneFieldType() );
		$this->register( new NumberFieldType() );
		$this->register( new UrlFieldType() );
		$this->register( new TextareaFieldType() );

		/* Choice */
		$this->register( new SelectFieldType() );
		$this->register( new RadioFieldType() );
		$this->register( new CheckboxFieldType() );
		$this->register( new YesNoFieldType() );

		/* Advanced */
		$this->register( new DateFieldType() );
		$this->register( new TimeFieldType() );
		$this->register( new FileFieldType() );
		$this->register( new RatingFieldType() );
		$this->register( new OpinionScaleFieldType() );
		$this->register( new NpsFieldType() );
		$this->register( new HiddenFieldType() );
		$this->register( new SignatureFieldType() );
		$this->register( new AddressFieldType() );
		$this->register( new CalculationFieldType() );

		/* Layout */
		$this->register( new RowFieldType() );
		$this->register( new StatementFieldType() );
		$this->register( new SectionFieldType() );
		$this->register( new PageBreakFieldType() );

		/**
		 * Allow third-party plugins to register their own FlowForms field types.
		 *
		 * Example:
		 *     add_action( 'flowforms_register_field_types', function ( $registry ) {
		 *         $registry->register( new \MyPlugin\StarRatingReviewsFieldType() );
		 *     } );
		 *
		 * @param FieldTypeRegistry $registry The field type registry instance.
		 */
		do_action( 'flowforms_register_field_types', $this );
	}

	public function register( AbstractFieldType $type ): void {
		$this->types[ $type->get_id() ] = $type;
	}

	public function get( string $id ): ?AbstractFieldType {
		return $this->types[ $id ] ?? null;
	}

	/** @return AbstractFieldType[] */
	public function all(): array {
		return $this->types;
	}

	/**
	 * Schema array for JS / wp_localize_script consumption.
	 *
	 * @return array<int, array<string, mixed>>
	 */
	public function get_schema(): array {
		return array_values( array_map(
			fn( AbstractFieldType $t ) => [
				'id'          => $t->get_id(),
				'label'       => $t->get_label(),
				'group'       => $t->get_group(),
				'icon'        => $t->get_icon(),
				'description' => $t->get_description(),
				'settings'    => $t->get_settings_schema(),
				'storable'    => $t->is_storable(),
			],
			$this->types
		) );
	}
}
