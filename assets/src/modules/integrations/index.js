import IntegrationsHubPage from './IntegrationsHubPage';
import StripeSettingsPage from './StripeSettingsPage';
import WebhooksPage from '../webhooks/WebhooksPage';

const routes = [
	{ path: '/integrations', element: <IntegrationsHubPage /> },
	{ path: '/integrations/stripe', element: <StripeSettingsPage /> },
	{ path: '/integrations/webhooks', element: <WebhooksPage /> },
];

export default routes;
