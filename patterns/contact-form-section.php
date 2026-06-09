<?php
/**
 * Pattern: contact-form-section
 */

return [
	'title'       => __( 'Contact form section', 'formspress' ),
	'description' => __( 'A simple contact section with a heading and a contact form.', 'formspress' ),
	'categories'  => [ 'formspress', 'contact' ],
	'keywords'    => [ 'contact', 'form', 'support' ],
	'content'     => '<!-- wp:group {"layout":{"type":"constrained"}} -->
<div class="wp-block-group">
	<!-- wp:heading {"textAlign":"center","level":2} -->
	<h2 class="wp-block-heading has-text-align-center">' . esc_html__( 'Get in touch', 'formspress' ) . '</h2>
	<!-- /wp:heading -->

	<!-- wp:paragraph {"align":"center"} -->
	<p class="has-text-align-center">' . esc_html__( 'We usually reply within one business day.', 'formspress' ) . '</p>
	<!-- /wp:paragraph -->

	<!-- wp:formspress/form {"formId":0} /-->
</div>
<!-- /wp:group -->',
];
