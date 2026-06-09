<?php
/**
 * Pattern: event-rsvp
 */

return [
	'title'       => __( 'Event RSVP', 'formspress' ),
	'description' => __( 'Event image on the left and an RSVP form on the right.', 'formspress' ),
	'categories'  => [ 'formspress', 'columns' ],
	'keywords'    => [ 'event', 'rsvp', 'invite' ],
	'content'     => '<!-- wp:group {"layout":{"type":"constrained"}} -->
<div class="wp-block-group">
	<!-- wp:columns {"verticalAlignment":"center"} -->
	<div class="wp-block-columns are-vertically-aligned-center">
		<!-- wp:column {"verticalAlignment":"center","width":"50%"} -->
		<div class="wp-block-column is-vertically-aligned-center" style="flex-basis:50%">
			<!-- wp:image {"sizeSlug":"large"} -->
			<figure class="wp-block-image size-large"><img alt="' . esc_attr__( 'Event image', 'formspress' ) . '" /></figure>
			<!-- /wp:image -->
		</div>
		<!-- /wp:column -->

		<!-- wp:column {"verticalAlignment":"center","width":"50%"} -->
		<div class="wp-block-column is-vertically-aligned-center" style="flex-basis:50%">
			<!-- wp:heading {"level":2} -->
			<h2 class="wp-block-heading">' . esc_html__( 'You\'re invited', 'formspress' ) . '</h2>
			<!-- /wp:heading -->

			<!-- wp:paragraph -->
			<p>' . esc_html__( 'Reserve your spot — seats are limited.', 'formspress' ) . '</p>
			<!-- /wp:paragraph -->

			<!-- wp:formspress/form {"formId":0} /-->
		</div>
		<!-- /wp:column -->
	</div>
	<!-- /wp:columns -->
</div>
<!-- /wp:group -->',
];
