import { useState, useEffect } from '@wordpress/element';
import { useParams } from 'react-router-dom';
import { Spinner } from '@wordpress/components';
import { applyFilters } from '@wordpress/hooks';
import { __ } from '@wordpress/i18n';
import FormsListPage from './FormsListPage';
import FormBuilderPage from './FormBuilderPage';
import StandardBuilder from './standard-builder';
import FormTemplatesPage from './FormTemplatesPage';
import { get } from '../../api/client';
import { form as formEndpoint } from '../../api/endpoints';
import ProPush from '../../components/ProPush';

/**
 * Standard forms → new builder (real Gutenberg block-editor inside our
 * shared EditorSkeleton, same shell as FlowBuilder).
 *
 * Flow forms → Pro-owned editor injected through `flowforms.forms.flowEditElement`.
 * Legacy custom builder stays reachable at /edit-legacy as a fallback.
 */
const FormEditRouter = () => {
	const { id } = useParams();
	const [ type, setType ] = useState( null );
	const [ proEditorVersion, setProEditorVersion ] = useState( 0 );

	useEffect( () => {
		get( formEndpoint( id ) )
			.then( ( res ) => setType( res.data?.type || 'standard' ) )
			.catch( () => setType( 'standard' ) );
	}, [ id ] );

	useEffect( () => {
		const refreshProEditor = () =>
			setProEditorVersion( ( version ) => version + 1 );

		window.addEventListener(
			'flowforms-pro-flow-editor-ready',
			refreshProEditor
		);

		return () => {
			window.removeEventListener(
				'flowforms-pro-flow-editor-ready',
				refreshProEditor
			);
		};
	}, [] );

	if ( ! type ) {
		return (
			<div className="ff-page ff-page--loading">
				<Spinner />
			</div>
		);
	}
	if ( 'flow' === type ) {
		return applyFilters(
			'flowforms.forms.flowEditElement',
			<ProPush
				title={ __( 'Flow Forms', 'formspress' ) }
				description={ __(
					'Create conversational, one-question-at-a-time forms with welcome screens, animated steps, and focused completion flows.',
					'formspress'
				) }
			/>,
			{ id, proEditorVersion }
		);
	}

	return <StandardBuilder />;
};

const routes = [
	{ path: '/forms', element: <FormsListPage /> },
	{ path: '/forms/templates', element: <FormTemplatesPage /> },
	{ path: '/forms/:id/edit', element: <FormEditRouter /> },
	{ path: '/forms/:id/edit-legacy', element: <FormBuilderPage /> },
];

export default routes;
