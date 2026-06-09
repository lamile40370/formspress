import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { SlotFillProvider } from '@wordpress/components';
import { applyFilters } from '@wordpress/hooks';
import AdminLayout from './layout/AdminLayout';

import dashboardRoutes from './modules/dashboard';
import formsRoutes from './modules/forms';
import entriesRoutes from './modules/entries';
import integrationsRoutes from './modules/integrations';
import toolsRoutes from './modules/tools';
import settingsRoutes from './modules/settings';
import { proPushRoutes } from './modules/pro-push';

const App = () => {
	const coreRoutes = [
		...dashboardRoutes,
		...formsRoutes,
		...entriesRoutes,
		...integrationsRoutes,
		...toolsRoutes,
		...settingsRoutes,
		...( window.flowFormsData?.pro?.active ? [] : proPushRoutes ),
	];

	const allRoutes = applyFilters( 'flowforms.admin.routes', coreRoutes );

	return (
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
};

export default App;
