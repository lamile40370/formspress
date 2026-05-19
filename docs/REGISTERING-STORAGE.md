# Registering a custom FlowForms storage provider

Extend `FlowForms\Extensibility\Storage\AbstractStorageProvider` and register on the `flowforms_register_storage_providers` hook. Storage providers receive uploaded files from the `file` field type and decide where they live (local disk, S3, Drive, …).

## Required methods

| Method                                                            | Purpose                                          |
|-------------------------------------------------------------------|--------------------------------------------------|
| `get_id()`                                                        | Stable snake_case id                             |
| `get_label()`                                                     | Label in the storage selector                    |
| `store( $uploaded_file, $form, $config ): array`                  | Returns `{ url, path, size, mime }`              |
| `delete( $path, $config ): bool`                                  | Deletes a previously stored file                 |

`get_settings_schema()` (optional) returns the global config fields (bucket, region, key, …).

## Stub example: AWS S3 storage provider

This skeleton uses `wp_remote_request()` with SigV4 — replace with your preferred SDK in production.

```php
<?php
/**
 * Plugin Name: FlowForms S3 Storage
 */

use FlowForms\Extensibility\Storage\AbstractStorageProvider;

class S3StorageProvider extends AbstractStorageProvider {

    public function get_id(): string    { return 's3'; }
    public function get_label(): string { return __( 'Amazon S3', 'my-plugin' ); }

    public function get_settings_schema(): array {
        return [
            [ 'key' => 'bucket',     'type' => 'text',     'label' => __( 'Bucket name', 'my-plugin' ) ],
            [ 'key' => 'region',     'type' => 'text',     'label' => __( 'Region', 'my-plugin' ), 'default' => 'us-east-1' ],
            [ 'key' => 'access_key', 'type' => 'text',     'label' => __( 'Access key ID', 'my-plugin' ) ],
            [ 'key' => 'secret_key', 'type' => 'password', 'label' => __( 'Secret access key', 'my-plugin' ) ],
            [ 'key' => 'path_prefix','type' => 'text',     'label' => __( 'Path prefix', 'my-plugin' ), 'default' => 'flowforms/' ],
        ];
    }

    public function store( array $uploaded_file, array $form, array $config ): array {
        $bucket = (string) ( $config['bucket'] ?? '' );
        $region = (string) ( $config['region'] ?? 'us-east-1' );
        if ( '' === $bucket ) {
            throw new \RuntimeException( __( 'S3 bucket is not configured.', 'my-plugin' ) );
        }

        $key  = trim( (string) ( $config['path_prefix'] ?? 'flowforms/' ), '/' )
              . '/' . gmdate( 'Y/m' )
              . '/' . wp_unique_id() . '-' . sanitize_file_name( $uploaded_file['name'] );
        $body = file_get_contents( $uploaded_file['tmp_name'] );
        $mime = (string) ( $uploaded_file['type'] ?? 'application/octet-stream' );

        // ↓ Replace with your SigV4 PUT implementation / aws-sdk-php call.
        $url = "https://{$bucket}.s3.{$region}.amazonaws.com/{$key}";
        $put = wp_remote_request( $url, [
            'method'  => 'PUT',
            'headers' => $this->sign_v4_headers( $config, 'PUT', $bucket, $region, $key, $mime, $body ),
            'body'    => $body,
            'timeout' => 30,
        ] );

        if ( is_wp_error( $put ) || 200 !== (int) wp_remote_retrieve_response_code( $put ) ) {
            throw new \RuntimeException( __( 'Failed to upload to S3.', 'my-plugin' ) );
        }

        return [
            'url'  => $url,
            'path' => $key,
            'size' => (int) $uploaded_file['size'],
            'mime' => $mime,
        ];
    }

    public function delete( string $path, array $config ): bool {
        $bucket = (string) ( $config['bucket'] ?? '' );
        $region = (string) ( $config['region'] ?? 'us-east-1' );
        $url    = "https://{$bucket}.s3.{$region}.amazonaws.com/{$path}";
        $resp   = wp_remote_request( $url, [
            'method'  => 'DELETE',
            'headers' => $this->sign_v4_headers( $config, 'DELETE', $bucket, $region, $path, '', '' ),
            'timeout' => 15,
        ] );
        return ! is_wp_error( $resp ) && in_array( (int) wp_remote_retrieve_response_code( $resp ), [ 200, 204 ], true );
    }

    /**
     * Returns SigV4-signed headers. Replace with your preferred AWS signing routine.
     *
     * @return array<string, string>
     */
    private function sign_v4_headers( array $config, string $method, string $bucket, string $region, string $key, string $mime, string $body ): array {
        // Skeleton — implement SigV4 here (e.g. with aws/aws-sdk-php or a small helper).
        return [ 'Content-Type' => $mime ?: 'application/octet-stream' ];
    }
}

add_action( 'flowforms_register_storage_providers', function ( $registry ) {
    $registry->register( new S3StorageProvider() );
} );
```

Admins select the active storage in **Settings → Storage** (saved as `flowforms_settings.storage.provider` with config under `flowforms_settings.storage.config`). The `SubmitForm` endpoint pipes any `$_FILES` uploads through `StorageRegistry::get_active()->store()` before saving the entry, so individual field types don't need to know about storage at all.

## Built-in providers

`local` — writes to `wp-content/uploads/flowforms/` using `wp_handle_upload`. Source at `src/Extensibility/Storage/Types/LocalStorageProvider.php`.
