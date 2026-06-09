<?php
/**
 * Pattern: newsletter-cta
 */

return [
	'title'       => __( 'Newsletter CTA', 'formspress' ),
	'description' => __( 'A colored full-width section with a heading and a one-field newsletter form.', 'formspress' ),
	'categories'  => [ 'formspress', 'call-to-action' ],
	'keywords'    => [ 'newsletter', 'subscribe', 'cta' ],
	'content'     => '<!-- wp:group {"align":"full","style":{"color":{"background":"#0f172a","text":"#ffffff"},"spacing":{"padding":{"top":"var:preset|spacing|80","bottom":"var:preset|spacing|80","left":"var:preset|spacing|50","right":"var:preset|spacing|50"}}},"layout":{"type":"constrained","contentSize":"640px"}} -->
<div class="wp-block-group alignfull has-text-color has-background" style="color:#ffffff;background-color:#0f172a;padding-top:var(--wp--preset--spacing--80);padding-right:var(--wp--preset--spacing--50);padding-bottom:var(--wp--preset--spacing--80);padding-left:var(--wp--preset--spacing--50)">
	<!-- wp:heading {"textAlign":"center","level":2,"style":{"typography":{"fontSize":"2.5rem"}}} -->
	<h2 class="wp-block-heading has-text-align-center" style="font-size:2.5rem">' . esc_html__( 'Join the newsletter', 'formspress' ) . '</h2>
	<!-- /wp:heading -->

	<!-- wp:paragraph {"align":"center"} -->
	<p class="has-text-align-center">' . esc_html__( 'One short email every Friday. Unsubscribe anytime.', 'formspress' ) . '</p>
	<!-- /wp:paragraph -->

	<!-- wp:formspress/form {"formId":0} /-->
</div>
<!-- /wp:group -->',
];
