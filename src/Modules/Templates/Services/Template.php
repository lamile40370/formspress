<?php

namespace FlowForms\Modules\Templates\Services;

class Template {

	public function __construct(
		public readonly string $id,
		public readonly string $label,
		public readonly string $description,
		public readonly string $category,
		public readonly string $type,
		public readonly string $icon,
		public readonly array $fields,
		public readonly array $settings,
		public readonly array $actions = [],
		public readonly ?string $block_markup = null,
		public readonly bool $is_user = false,
	) {}

	public function to_array(): array {
		return [
			'id'           => $this->id,
			'label'        => $this->label,
			'description'  => $this->description,
			'category'     => $this->category,
			'type'         => $this->type,
			'icon'         => $this->icon,
			'fields'       => $this->fields,
			'settings'     => $this->settings,
			'actions'      => $this->actions,
			'block_markup' => $this->block_markup,
			'is_user'      => $this->is_user,
		];
	}

	public static function from_array( array $data ): self {
		return new self(
			id:           (string) ( $data['id'] ?? '' ),
			label:        (string) ( $data['label'] ?? '' ),
			description:  (string) ( $data['description'] ?? '' ),
			category:     (string) ( $data['category'] ?? 'other' ),
			type:         in_array( $data['type'] ?? 'standard', [ 'standard', 'flow' ], true ) ? $data['type'] : 'standard',
			icon:         (string) ( $data['icon'] ?? 'cog' ),
			fields:       is_array( $data['fields'] ?? null ) ? $data['fields'] : [],
			settings:     is_array( $data['settings'] ?? null ) ? $data['settings'] : [],
			actions:      is_array( $data['actions'] ?? null ) ? $data['actions'] : [],
			block_markup: is_string( $data['block_markup'] ?? null ) ? $data['block_markup'] : null,
			is_user:      ! empty( $data['is_user'] ),
		);
	}
}
