import EntriesListPage from './EntriesListPage';
import AllEntriesPage from './AllEntriesPage';
import EntriesExportsPage from './EntriesExportsPage';

const routes = [
	{ path: '/entries', element: <AllEntriesPage /> },
	{ path: '/entries/exports', element: <EntriesExportsPage /> },
	{ path: '/forms/:formId/entries', element: <EntriesListPage /> },
];

export default routes;
