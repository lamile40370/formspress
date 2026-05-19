import LogsPage from './LogsPage';
import ImportExportPage from './ImportExportPage';
import PrivacyPage from './PrivacyPage';
import EmailTemplatesPage from '../email-templates/EmailTemplatesPage';
import EmailTemplateEditor from '../email-templates/EmailTemplateEditor';

const routes = [
	{ path: '/tools/logs', element: <LogsPage /> },
	{ path: '/tools/import-export', element: <ImportExportPage /> },
	{ path: '/tools/privacy', element: <PrivacyPage /> },
	{ path: '/tools/email-templates', element: <EmailTemplatesPage /> },
	{ path: '/tools/email-templates/new', element: <EmailTemplateEditor /> },
	{ path: '/tools/email-templates/:id', element: <EmailTemplateEditor /> },
];

export default routes;
