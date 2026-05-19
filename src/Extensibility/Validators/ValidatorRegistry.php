<?php

namespace FlowForms\Extensibility\Validators;

use FlowForms\Extensibility\Validators\Types\EmailDnsValidator;
use FlowForms\Extensibility\Validators\Types\FileSizeValidator;
use FlowForms\Extensibility\Validators\Types\FileTypeValidator;
use FlowForms\Extensibility\Validators\Types\MaxLengthValidator;
use FlowForms\Extensibility\Validators\Types\MaxValueValidator;
use FlowForms\Extensibility\Validators\Types\MinLengthValidator;
use FlowForms\Extensibility\Validators\Types\MinValueValidator;
use FlowForms\Extensibility\Validators\Types\PatternRegexValidator;
use FlowForms\Extensibility\Validators\Types\RequiredValidator;

class ValidatorRegistry {

	/** @var AbstractValidator[] */
	private array $validators = [];

	public function __construct() {
		$this->register( new RequiredValidator() );
		$this->register( new MinLengthValidator() );
		$this->register( new MaxLengthValidator() );
		$this->register( new PatternRegexValidator() );
		$this->register( new EmailDnsValidator() );
		$this->register( new MinValueValidator() );
		$this->register( new MaxValueValidator() );
		$this->register( new FileTypeValidator() );
		$this->register( new FileSizeValidator() );

		/**
		 * Allow third-party plugins to register custom FlowForms validators.
		 *
		 * Example:
		 *     add_action( 'flowforms_register_validators', function ( $registry ) {
		 *         $registry->register( new \MyPlugin\LuhnValidator() );
		 *     } );
		 *
		 * @param ValidatorRegistry $registry The validator registry instance.
		 */
		do_action( 'flowforms_register_validators', $this );
	}

	public function register( AbstractValidator $validator ): void {
		$this->validators[ $validator->get_id() ] = $validator;
	}

	public function get( string $id ): ?AbstractValidator {
		return $this->validators[ $id ] ?? null;
	}

	/** @return AbstractValidator[] */
	public function all(): array {
		return $this->validators;
	}

	public function get_schema(): array {
		return array_values( array_map(
			fn( AbstractValidator $v ) => [
				'id'          => $v->get_id(),
				'label'       => $v->get_label(),
				'description' => $v->get_description(),
				'settings'    => $v->get_settings_schema(),
			],
			$this->validators
		) );
	}
}
