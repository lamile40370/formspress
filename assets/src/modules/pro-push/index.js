import { __ } from '@wordpress/i18n';
import ProPush from '../../components/ProPush';

const FEATURES = {
	webhooks: {
		title: __( 'Outgoing Webhooks', 'formspress' ),
		description: __(
			'Send signed webhooks to Zapier, Make, n8n, CRMs, internal tools, and any HTTP endpoint when form events occur.',
			'formspress'
		),
	},
	stripe: {
		title: __( 'Stripe Payments', 'formspress' ),
		description: __(
			'Accept one-time and recurring payments from FormsPress forms with Stripe Checkout and payment status tracking.',
			'formspress'
		),
	},
	emailTemplates: {
		title: __( 'Email Templates', 'formspress' ),
		description: __(
			'Create reusable branded email templates and load them into form notification actions without rebuilding the same message.',
			'formspress'
		),
	},
	logs: {
		title: __( 'Delivery Logs', 'formspress' ),
		description: __(
			'Inspect outbound webhook and action delivery attempts, status codes, response bodies, and troubleshooting details.',
			'formspress'
		),
	},
	headless: {
		title: __( 'Headless API', 'formspress' ),
		description: __(
			'Use public submission tokens and CORS controls to embed FormsPress forms safely in headless or decoupled front ends.',
			'formspress'
		),
	},
	analytics: {
		title: __( 'Form Analytics', 'formspress' ),
		description: __(
			'Track views, starts, completions, conversion rates, step drop-off, devices, referrers, and A/B test variants.',
			'formspress'
		),
	},
};

const ProFeaturePage = ( { feature } ) => {
	const config = FEATURES[ feature ] || FEATURES.analytics;

	return <ProPush { ...config } />;
};

export const proPushRoutes = [
	{ path: '/integrations/webhooks', element: <ProFeaturePage feature="webhooks" /> },
	{ path: '/integrations/stripe', element: <ProFeaturePage feature="stripe" /> },
	{ path: '/tools/email-templates', element: <ProFeaturePage feature="emailTemplates" /> },
	{ path: '/tools/email-templates/new', element: <ProFeaturePage feature="emailTemplates" /> },
	{ path: '/tools/email-templates/:id', element: <ProFeaturePage feature="emailTemplates" /> },
	{ path: '/tools/logs', element: <ProFeaturePage feature="logs" /> },
	{ path: '/settings/headless', element: <ProFeaturePage feature="headless" /> },
	{ path: '/forms/:id/analytics', element: <ProFeaturePage feature="analytics" /> },
];

export default ProFeaturePage;
