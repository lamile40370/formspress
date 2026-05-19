import GeneralSettingsPage from './GeneralSettingsPage';
import FormsDefaultsPage from './FormsDefaultsPage';
import SpamSettingsPage from './SpamSettingsPage';
import EmailSettingsPage from './EmailSettingsPage';
import HeadlessSettingsPage from './HeadlessSettingsPage';

const routes = [
	{ path: '/settings', element: <GeneralSettingsPage /> },
	{ path: '/settings/forms', element: <FormsDefaultsPage /> },
	{ path: '/settings/spam', element: <SpamSettingsPage /> },
	{ path: '/settings/email', element: <EmailSettingsPage /> },
	{ path: '/settings/headless', element: <HeadlessSettingsPage /> },
];

export default routes;
