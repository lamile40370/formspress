<?php

namespace FlowForms\Modules\Privacy\Services;

/**
 * Suggested privacy policy text for FormsPress.
 *
 * WordPress surfaces this in the Privacy Policy editor (Settings → Privacy)
 * so site owners can paste it into their own policy.
 */
class PrivacyPolicyContent {

	public function register(): void {
		if ( ! function_exists( 'wp_add_privacy_policy_content' ) ) {
			return;
		}

		$content = '<h2>' . __( 'Forms', 'formspress' ) . '</h2>'
			. '<p>' . __( 'When you submit a form on this site (built with FormsPress), the data you enter is stored in the site\'s database. The following information is collected:', 'formspress' ) . '</p>'
			. '<ul>'
			. '<li>' . __( 'All values you typed into the form fields (name, email, message, etc.).', 'formspress' ) . '</li>'
			. '<li>' . __( 'Your IP address, used to mitigate spam.', 'formspress' ) . '</li>'
			. '<li>' . __( 'Your browser user-agent string, used for security and analytics.', 'formspress' ) . '</li>'
			. '<li>' . __( 'The URL of the page where you submitted the form.', 'formspress' ) . '</li>'
			. '</ul>'
			. '<p>' . __( 'Submissions are retained for the duration set by the site administrator. You can request a copy or deletion of your data via Tools → Export Personal Data and Tools → Erase Personal Data using your email address.', 'formspress' ) . '</p>';

		wp_add_privacy_policy_content(
			'FormsPress',
			wp_kses_post( wpautop( $content, false ) )
		);
	}
}
