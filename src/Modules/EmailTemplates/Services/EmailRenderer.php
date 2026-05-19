<?php

namespace FlowForms\Modules\EmailTemplates\Services;

/**
 * Wraps a fragment of email-safe HTML in a responsive container.
 *
 * Used by the EmailAction when the user-authored body is just the inner content
 * (no `<!DOCTYPE>` / `<html>` shell). Keeps inline styles simple for client compat.
 */
class EmailRenderer {

	public static function is_full_document( string $body ): bool {
		$trimmed = ltrim( $body );
		if ( '' === $trimmed ) {
			return false;
		}
		$head = strtolower( substr( $trimmed, 0, 200 ) );
		return str_starts_with( $head, '<!doctype' ) || str_contains( $head, '<html' );
	}

	public static function wrap( string $inner_html, array $form = [] ): string {
		$title = esc_html( $form['title'] ?? get_bloginfo( 'name' ) );

		return '<!DOCTYPE html>
<html lang="' . esc_attr( get_bloginfo( 'language' ) ) . '">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>' . $title . '</title>
<style>
body { margin:0; padding:0; background:#f4f5f7; -webkit-font-smoothing:antialiased; }
table { border-collapse:collapse; }
img { border:0; display:block; max-width:100%; height:auto; }
h1, h2, h3, h4 { color:#1d2327; margin:0 0 12px; line-height:1.3; }
p { color:#3c434a; line-height:1.6; margin:0 0 12px; }
a { color:#2271b1; }
.ff-email-inner table { width:100%; }
.ff-email-inner table td { padding:8px; border:1px solid #e5e7eb; }
</style>
</head>
<body>
<table role="presentation" align="center" width="600" cellpadding="0" cellspacing="0" border="0" style="margin:24px auto;width:600px;max-width:600px;background:#ffffff;border:1px solid #e5e7eb;border-radius:8px;">
	<tr>
		<td style="padding:32px;font-family:-apple-system,BlinkMacSystemFont,&quot;Segoe UI&quot;,Roboto,sans-serif;color:#1d2327;font-size:14px;">
			<div class="ff-email-inner">' . $inner_html . '</div>
		</td>
	</tr>
	<tr>
		<td style="padding:16px 32px;text-align:center;color:#8c8f94;font-size:12px;font-family:-apple-system,BlinkMacSystemFont,&quot;Segoe UI&quot;,Roboto,sans-serif;">
			' . esc_html( get_bloginfo( 'name' ) ) . '
		</td>
	</tr>
</table>
</body>
</html>';
	}
}
