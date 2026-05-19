import { useState, useEffect } from '@wordpress/element';
import { useParams } from 'react-router-dom';
import { Spinner } from '@wordpress/components';
import FormsListPage from './FormsListPage';
import FormBuilderPage from './FormBuilderPage';
import FlowBuilderPage from './FlowBuilderPage';
import StandardBuilder from './standard-builder';
import FormTemplatesPage from './FormTemplatesPage';
import { get } from '../../api/client';
import { form as formEndpoint } from '../../api/endpoints';

/**
 * Standard forms → new builder (real Gutenberg block-editor inside our
 * shared EditorSkeleton, same shell as FlowBuilder).
 *
 * Flow forms → dedicated FlowBuilder.
 * Legacy custom builder stays reachable at /edit-legacy as a fallback.
 */
const FormEditRouter = () => {
	const { id } = useParams();
	const [ type, setType ] = useState( null );

	useEffect( () => {
		get( formEndpoint( id ) )
			.then( ( res ) => setType( res.data?.type || 'standard' ) )
			.catch( () => setType( 'standard' ) );
	}, [ id ] );

	if ( ! type ) {
		return (
			<div className="ff-page ff-page--loading">
				<Spinner />
			</div>
		);
	}
	return 'flow' === type ? <FlowBuilderPage /> : <StandardBuilder />;
};

const routes = [
	{ path: '/forms', element: <FormsListPage /> },
	{ path: '/forms/templates', element: <FormTemplatesPage /> },
	{ path: '/forms/:id/edit', element: <FormEditRouter /> },
	{ path: '/forms/:id/edit-legacy', element: <FormBuilderPage /> },
];

export default routes;
