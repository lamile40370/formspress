import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { SlotFillProvider } from '@wordpress/components';
import AdminLayout from './layout/AdminLayout';

import dashboardRoutes from './modules/dashboard';
import formsRoutes from './modules/forms';
import entriesRoutes from './modules/entries';
import integrationsRoutes from './modules/integrations';
import toolsRoutes from './modules/tools';
import settingsRoutes from './modules/settings';

// Legacy top-level routes kept registered so old bookmarks still resolve,
// but they're no longer surfaced in the sidebar (Email Templates lives
// under Tools, Webhooks lives under Integrations).
import emailTemplatesRoutes from './modules/email-templates';
import webhooksRoutes from './modules/webhooks';

const allRoutes = [
	...dashboardRoutes,
	...formsRoutes,
	...entriesRoutes,
	...integrationsRoutes,
	...toolsRoutes,
	...settingsRoutes,
	...emailTemplatesRoutes,
	...webhooksRoutes,
];

const App = () => (
	<SlotFillProvider>
		<HashRouter>
			<AdminLayout>
				<Routes>
					{ allRoutes.map( ( route ) => (
						<Route
							key={ route.path }
							path={ route.path }
							element={ route.element }
						/>
					) ) }
					<Route path="*" element={ <Navigate to="/" replace /> } />
				</Routes>
			</AdminLayout>
		</HashRouter>
	</SlotFillProvider>
);

export default App;
