<?php

namespace FlowForms\Extensibility\Storage;

/**
 * Base class for FlowForms file storage providers (local disk, S3, Drive, …).
 *
 * Third-party plugins extend this class and register on the
 * `flowforms_register_storage_providers` hook to add custom providers.
 */
abstract class AbstractStorageProvider {

	/**
	 * Stable, unique id (snake_case).
	 */
	abstract public function get_id(): string;

	/**
	 * Human-readable label shown in global settings.
	 */
	abstract public function get_label(): string;

	/**
	 * Field descriptors for the provider's global configuration (bucket, region, …).
	 *
	 * @return array<int, array<string, mixed>>
	 */
	public function get_settings_schema(): array {
		return [];
	}

	/**
	 * Store an uploaded file.
	 *
	 * @param array{name:string, type:string, tmp_name:string, error:int, size:int} $uploaded_file PHP $_FILES entry.
	 * @param array<string, mixed> $form
	 * @param array<string, mixed> $config Provider config.
	 *
	 * @return array{url:string, path:string, size:int, mime:string}
	 *
	 * @throws \RuntimeException If the file cannot be stored.
	 */
	abstract public function store( array $uploaded_file, array $form, array $config ): array;

	/**
	 * Delete a previously stored file.
	 *
	 * @param string $path The path returned by store().
	 * @param array<string, mixed> $config Provider config.
	 */
	abstract public function delete( string $path, array $config ): bool;
}
