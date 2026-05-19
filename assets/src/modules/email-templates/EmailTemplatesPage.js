import { useEffect, useMemo, useState } from '@wordpress/element';
import { Spinner, Button } from '@wordpress/components';
import { DataViews } from '@wordpress/dataviews';
import { __, sprintf } from '@wordpress/i18n';
import { useLocation, useNavigate } from 'react-router-dom';
import { get, del } from '../../api/client';
import PageHeader from '../../components/PageHeader';
import EmptyState from '../../components/EmptyState';
import Toast from '../../components/Toast';
import useConfirmDialog from '../../hooks/useConfirmDialog';

const ENDPOINT = '/email-templates';

const DEFAULT_VIEW = {
	type: 'table',
	page: 1,
	perPage: 25,
	search: '',
	filters: [],
	layout: {},
	titleField: 'title',
	fields: [ 'subject' ],
};

const EmailTemplatesPage = () => {
	const navigate = useNavigate();
	const location = useLocation();
	const basePath = location.pathname.startsWith( '/tools/email-templates' )
		? '/tools/email-templates'
		: '/email-templates';
	const [ list, setList ] = useState( null );
	const [ error, setError ] = useState( null );
	const [ notice, setNotice ] = useState( null );
	const [ view, setView ] = useState( DEFAULT_VIEW );
	const { confirm, confirmDialog } = useConfirmDialog();

	const load = () => {
		get( ENDPOINT )
			.then( ( res ) => {
				const raw = Array.isArray( res?.data ) ? res.data : [];
				// DataViews wants a `title` field — our model uses `name`.
				setList(
					raw.map( ( t ) => ( {
						...t,
						title: t.name || __( '(untitled)', 'flowforms' ),
						subject: t.subject || __( '(no subject)', 'flowforms' ),
					} ) )
				);
			} )
			.catch( () =>
				setError( __( 'Could not load email templates.', 'flowforms' ) )
			);
	};

	useEffect( load, [] );

	// Search runs client-side: email templates are usually a small list
	// (no need for server pagination), and the global search across
	// title + subject feels instant.
	const filtered = useMemo( () => {
		if ( ! list ) return [];
		const search = ( view.search || '' ).trim().toLowerCase();
		return list.filter( ( t ) => {
			if ( ! search ) return true;
			const hay = `${ t.title } ${ t.subject || '' }`.toLowerCase();
			return hay.includes( search );
		} );
	}, [ list, view.search ] );

	const handleDelete = async ( items ) => {
		const count = items.length;
		const confirmed = await confirm( {
			message:
				count === 1
					? __(
							'Delete this email template? Forms that reference it keep their current subject + body — only the link is removed.',
							'flowforms'
					  )
					: sprintf(
							__(
								'Delete %d email templates? Forms that reference them keep their current subject + body — only the links are removed.',
								'flowforms'
							),
							count
					  ),
			confirmButtonText: __( 'Delete', 'flowforms' ),
		} );
		if ( ! confirmed ) return;
		try {
			await Promise.all(
				items.map( ( t ) => del( `${ ENDPOINT }/${ t.id }` ) )
			);
			const ids = new Set( items.map( ( t ) => t.id ) );
			setList( ( prev ) =>
				( prev || [] ).filter( ( t ) => ! ids.has( t.id ) )
			);
			setNotice( {
				type: 'success',
				message:
					count === 1
						? __( 'Email template deleted.', 'flowforms' )
						: sprintf(
								__(
									'%d email templates deleted.',
									'flowforms'
								),
								count
						  ),
			} );
		} catch ( e ) {
			setError(
				e.message ||
					__( 'Failed to delete email templates.', 'flowforms' )
			);
		}
	};

	const fields = useMemo(
		() => [
			{
				id: 'title',
				label: __( 'Name', 'flowforms' ),
				enableGlobalSearch: true,
				enableSorting: true,
			},
			{
				id: 'subject',
				label: __( 'Default subject', 'flowforms' ),
				enableGlobalSearch: true,
				enableSorting: true,
				render: ( { item } ) => (
					<span style={ { color: '#6b7280', fontSize: 13 } }>
						{ item.subject }
					</span>
				),
			},
		],
		[]
	);

	const actions = useMemo(
		() => [
			{
				id: 'edit',
				label: __( 'Edit', 'flowforms' ),
				isPrimary: true,
				icon: 'edit',
				callback: ( [ t ] ) => navigate( `${ basePath }/${ t.id }` ),
			},
			{
				id: 'delete',
				label: __( 'Delete', 'flowforms' ),
				isDestructive: true,
				supportsBulk: true,
				callback: handleDelete,
			},
		],
		[ navigate, basePath ]
	); // eslint-disable-line react-hooks/exhaustive-deps

	if ( null === list && ! error ) {
		return (
			<div className="ff-page ff-page--loading">
				<Spinner />
			</div>
		);
	}

	const isEmpty = ( list || [] ).length === 0;

	const paginationInfo = {
		totalItems: filtered.length,
		totalPages: Math.max( 1, Math.ceil( filtered.length / view.perPage ) ),
	};

	return (
		<PageHeader
			className="ff-page ff-page--dataviews"
			title={ __( 'Email templates', 'flowforms' ) }
			description={ __(
				'Reusable subject + body for the "Send email" actions on your forms. Write once, pick from a dropdown on every form.',
				'flowforms'
			) }
			hideBack
			right={
				! isEmpty && (
					<Button
						variant="primary"
						onClick={ () => navigate( `${ basePath }/new` ) }
					>
						{ __( 'Add new', 'flowforms' ) }
					</Button>
				)
			}
		>
			<div className="ff-page__body">
				<Toast
					notice={
						error ? { type: 'error', message: error } : notice
					}
					onRemove={ () => {
						setNotice( null );
						setError( null );
					} }
				/>

				{ isEmpty ? (
					<EmptyState
						icon="email-alt"
						title={ __( 'No email templates yet', 'flowforms' ) }
						description={ __(
							'Templates save you from re-typing the same email on every form. Example: a "New submission" template that all your contact forms send to the team, or a "Thanks for your message" auto-reply sent to the submitter. Add merge tags like {{first_name}} or {{email}} to personalise each send.',
							'flowforms'
						) }
						action={ () => navigate( `${ basePath }/new` ) }
						actionLabel={ __(
							'Create your first template',
							'flowforms'
						) }
					/>
				) : (
					<div className="ff-dataviews-container">
						<DataViews
							data={ filtered }
							fields={ fields }
							view={ view }
							onChangeView={ setView }
							actions={ actions }
							defaultLayouts={ { table: true } }
							paginationInfo={ paginationInfo }
							getItemId={ ( item ) => item.id }
							onClickItem={ ( item ) =>
								navigate( `${ basePath }/${ item.id }` )
							}
						/>
					</div>
				) }
			</div>

			{ confirmDialog }
		</PageHeader>
	);
};

export default EmailTemplatesPage;
