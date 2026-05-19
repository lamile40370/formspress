import EmailTemplatesPage from './EmailTemplatesPage';
import EmailTemplateEditor from './EmailTemplateEditor';

const routes = [
	{ path: '/email-templates', element: <EmailTemplatesPage /> },
	{ path: '/email-templates/new', element: <EmailTemplateEditor /> },
	{ path: '/email-templates/:id', element: <EmailTemplateEditor /> },
];

export default routes;
