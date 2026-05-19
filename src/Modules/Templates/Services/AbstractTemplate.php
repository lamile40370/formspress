<?php

namespace FlowForms\Modules\Templates\Services;

abstract class AbstractTemplate {

	abstract public function get_id(): string;

	abstract public function get_label(): string;

	abstract public function get_description(): string;

	abstract public function get_category(): string;

	abstract public function get_type(): string;

	abstract public function get_icon(): string;

	abstract public function get_fields(): array;

	public function get_settings(): array {
		return [];
	}

	public function get_actions(): array {
		return [];
	}

	/**
	 * Optional Gutenberg-block-markup body for this template.
	 *
	 * Templates that override this method ship a fully-designed form
	 * (root container with background / padding / typography + native
	 * heading / paragraph / image blocks + the `formspress/field-*`
	 * inputs). When non-null, `CreateFromTemplate` stores it directly
	 * as `fields_markup`, so a form created from the template arrives
	 * in the builder with all of its layout intact — no schema-to-markup
	 * round-trip.
	 *
	 * Default: `null` — falls back to the legacy schema path
	 * (`get_fields()`), which then gets a default styled root group
	 * wrapper applied on first edit.
	 */
	public function get_block_markup(): ?string {
		return null;
	}

	public function to_template(): Template {
		return new Template(
			id:           $this->get_id(),
			label:        $this->get_label(),
			description:  $this->get_description(),
			category:     $this->get_category(),
			type:         $this->get_type(),
			icon:         $this->get_icon(),
			fields:       $this->get_fields(),
			settings:     $this->get_settings(),
			actions:      $this->get_actions(),
			block_markup: $this->get_block_markup(),
			is_user:      false,
		);
	}
}
