<?php
/**
 * Pattern: support-request
 */

return [
	'title'       => __( 'Support request', 'flowforms' ),
	'description' => __( 'Two columns — FAQ list on the left, support form on the right.', 'flowforms' ),
	'categories'  => [ 'formspress', 'columns' ],
	'keywords'    => [ 'support', 'help', 'faq' ],
	'content'     => '<!-- wp:group {"layout":{"type":"constrained"}} -->
<div class="wp-block-group">
	<!-- wp:heading {"textAlign":"center","level":2} -->
	<h2 class="wp-block-heading has-text-align-center">' . esc_html__( 'How can we help?', 'flowforms' ) . '</h2>
	<!-- /wp:heading -->

	<!-- wp:columns -->
	<div class="wp-block-columns">
		<!-- wp:column {"width":"45%"} -->
		<div class="wp-block-column" style="flex-basis:45%">
			<!-- wp:heading {"level":3} -->
			<h3 class="wp-block-heading">' . esc_html__( 'Frequently asked', 'flowforms' ) . '</h3>
			<!-- /wp:heading -->

			<!-- wp:list -->
			<ul class="wp-block-list">
				<li>' . esc_html__( 'How do I reset my password?', 'flowforms' ) . '</li>
				<li>' . esc_html__( 'Where can I find my invoices?', 'flowforms' ) . '</li>
				<li>' . esc_html__( 'How do I cancel my subscription?', 'flowforms' ) . '</li>
				<li>' . esc_html__( 'Do you offer a refund policy?', 'flowforms' ) . '</li>
			</ul>
			<!-- /wp:list -->
		</div>
		<!-- /wp:column -->

		<!-- wp:column {"width":"55%"} -->
		<div class="wp-block-column" style="flex-basis:55%">
			<!-- wp:heading {"level":3} -->
			<h3 class="wp-block-heading">' . esc_html__( 'Still need help?', 'flowforms' ) . '</h3>
			<!-- /wp:heading -->

			<!-- wp:formspress/form {"formId":0} /-->
		</div>
		<!-- /wp:column -->
	</div>
	<!-- /wp:columns -->
</div>
<!-- /wp:group -->',
];
