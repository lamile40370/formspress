<?php
/**
 * Pattern: lead-capture-hero
 */

return [
	'title'       => __( 'Lead-capture hero', 'flowforms' ),
	'description' => __( 'A full-width hero with a big title and a lead-capture form below.', 'flowforms' ),
	'categories'  => [ 'formspress', 'banner' ],
	'keywords'    => [ 'lead', 'hero', 'signup', 'banner' ],
	'content'     => '<!-- wp:cover {"dimRatio":50,"minHeight":520,"align":"full","style":{"color":{}}} -->
<div class="wp-block-cover alignfull" style="min-height:520px">
	<span aria-hidden="true" class="wp-block-cover__background has-background-dim-50 has-background-dim"></span>
	<div class="wp-block-cover__inner-container">
		<!-- wp:group {"layout":{"type":"constrained","contentSize":"720px"}} -->
		<div class="wp-block-group">
			<!-- wp:heading {"textAlign":"center","level":1,"style":{"typography":{"fontSize":"3.5rem","lineHeight":"1.1"}}} -->
			<h1 class="wp-block-heading has-text-align-center" style="font-size:3.5rem;line-height:1.1">' . esc_html__( 'Built for teams that move fast', 'flowforms' ) . '</h1>
			<!-- /wp:heading -->

			<!-- wp:paragraph {"align":"center","style":{"typography":{"fontSize":"1.125rem"}}} -->
			<p class="has-text-align-center" style="font-size:1.125rem">' . esc_html__( 'Sign up below and we\'ll be in touch within 24 hours.', 'flowforms' ) . '</p>
			<!-- /wp:paragraph -->

			<!-- wp:formspress/form {"formId":0} /-->
		</div>
		<!-- /wp:group -->
	</div>
</div>
<!-- /wp:cover -->',
];
