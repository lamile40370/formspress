import { Navigate } from 'react-router-dom';
import FormsDefaultsPage from './FormsDefaultsPage';
import SpamSettingsPage from './SpamSettingsPage';
import EmailSettingsPage from './EmailSettingsPage';
import HeadlessSettingsPage from './HeadlessSettingsPage';
import AISettingsPage from './AISettingsPage';

const routes = [
	{ path: '/settings', element: <Navigate to="/settings/forms" replace /> },
	{ path: '/settings/forms', element: <FormsDefaultsPage /> },
	{ path: '/settings/spam', element: <SpamSettingsPage /> },
	{ path: '/settings/email', element: <EmailSettingsPage /> },
	{ path: '/settings/ai', element: <AISettingsPage /> },
	{ path: '/settings/headless', element: <HeadlessSettingsPage /> },
];

export default routes;
