import { useCallback, useEffect, useMemo, useState } from '@wordpress/element';
import {
	Button,
	__experimentalHStack as HStack,
	__experimentalText as Text,
	__experimentalVStack as VStack,
} from '@wordpress/components';
import { DataViews } from '@wordpress/dataviews';
import { __, sprintf } from '@wordpress/i18n';
import PageHeader from '../../components/PageHeader';
import Toast from '../../components/Toast';
import Badge from '../../components/Badge';
import EmptyState from '../../components/EmptyState';
import { get, del } from '../../api/client';
import { ENTRIES, FORMS, entry as entryEndpoint } from '../../api/endpoints';
import EntryDetailModal from './EntryDetailModal';
import useConfirmDialog from '../../hooks/useConfirmDialog';
import useDataViewPreferences from '../../hooks/useDataViewPreferences';

const DEFAULT_VIEW = {
	type: 'list',
	page: 1,
	perPage: 20,
	sort: { field: 'created_at', direction: 'desc' },
	filters: [],
	search: '',
	titleField: 'id',
	descriptionField: 'submitted_summary',
	fields: [ 'form_title', 'status', 'ip_address', 'source_url' ],
	layout: {},
};

const STATUS_LABELS = {
	unread: __( 'Unread', 'flowforms' ),
	read: __( 'Read', 'flowforms' ),
	starred: __( 'Starred', 'flowforms' ),
	spam: __( 'Spam', 'flowforms' ),
};

const STATUS_INTENTS = {
	unread: 'success',
	read: 'default',
	starred: 'warning',
	spam: 'error',
};

const AllEntriesPage = () => {
	const [ forms, setForms ] = useState( [] );
	const [ entries, setEntries ] = useState( [] );
	const [ total, setTotal ] = useState( 0 );
	const [ isLoading, setLoading ] = useState( true );
	const [ error, setError ] = useState( null );
	const [ notice, setNotice ] = useState( null );
	const [ selectedEntry, setSelectedEntry ] = useState( null );
	const { confirm, confirmDialog } = useConfirmDialog();
	const [ view, setView ] = useDataViewPreferences(
		'all-entries',
		DEFAULT_VIEW
	);

	useEffect( () => {
		get( FORMS, { per_page: 100 } )
			.then( ( res ) => setForms( res.data || [] ) )
			.catch( () => setForms( [] ) );
	}, [] );

	const fetchEntries = useCallback( async () => {
		setLoading( true );
		try {
			const params = {
				page: view.page,
				per_page: view.perPage,
			};
			const formFilter = view.filters?.find(
				( filter ) => filter.field === 'form_id'
			);
			const statusFilter = view.filters?.find(
				( filter ) => filter.field === 'status'
			);

			if ( formFilter?.value ) params.form_id = formFilter.value;
			if ( statusFilter?.value ) params.status = statusFilter.value;
			if ( view.search ) params.search = view.search;
			if ( view.sort?.field ) {
				params.sort = view.sort.field;
				params.order = view.sort.direction || 'desc';
			}

			const res = await get( ENTRIES, params );
			setEntries( res.data || [] );
			setTotal( res.total || 0 );
			setError( null );
		} catch ( e ) {
			setError(
				e.message || __( 'Could not load submissions.', 'flowforms' )
			);
		} finally {
			setLoading( false );
		}
	}, [ view.page, view.perPage, view.filters, view.search, view.sort ] );

	useEffect( () => {
		fetchEntries();
	}, [ fetchEntries ] );

	const handleDelete = useCallback(
		async ( selected ) => {
			const count = selected.length;
			const confirmed = await confirm( {
				message:
					count === 1
						? __(
								'Delete this submission permanently?',
								'flowforms'
						  )
						: sprintf(
								__(
									'Delete %d submissions permanently?',
									'flowforms'
								),
								count
						  ),
				confirmButtonText: __( 'Delete', 'flowforms' ),
			} );

			if ( ! confirmed ) return;

			try {
				await Promise.all(
					selected.map( ( item ) => del( entryEndpoint( item.id ) ) )
				);
				const ids = new Set( selected.map( ( item ) => item.id ) );
				setEntries( ( current ) =>
					current.filter( ( item ) => ! ids.has( item.id ) )
				);
				setTotal( ( current ) => Math.max( 0, current - count ) );
				setNotice( {
					type: 'success',
					message:
						count === 1
							? __( 'Submission deleted.', 'flowforms' )
							: sprintf(
									__(
										'%d submissions deleted.',
										'flowforms'
									),
									count
							  ),
				} );
			} catch ( e ) {
				setError(
					e.message ||
						__( 'Failed to delete submissions.', 'flowforms' )
				);
			}
		},
		[ confirm ]
	);

	const formElements = useMemo(
		() =>
			forms.map( ( form ) => ( {
				value: String( form.id ),
				label:
					form.title ||
					sprintf( __( 'Form #%d', 'flowforms' ), form.id ),
			} ) ),
		[ forms ]
	);

	const fields = useMemo(
		() => [
			{
				id: 'id',
				label: __( 'Submission', 'flowforms' ),
				enableSorting: true,
				enableGlobalSearch: true,
				render: ( { item } ) => (
					<VStack spacing={ 0 }>
						<Button
							variant="link"
							onClick={ () => setSelectedEntry( item.id ) }
							style={ { fontWeight: 500 } }
						>
							{ sprintf( __( '#%d', 'flowforms' ), item.id ) }
						</Button>
						<Text variant="muted" size="small">
							{ item.form_title ||
								__( 'Unknown form', 'flowforms' ) }
						</Text>
					</VStack>
				),
			},
			{
				id: 'submitted_summary',
				label: __( 'Submitted', 'flowforms' ),
				render: ( { item } ) => (
					<Text variant="muted">
						{ new Date( item.created_at ).toLocaleString() }
					</Text>
				),
			},
			{
				id: 'form_title',
				label: __( 'Form', 'flowforms' ),
				enableSorting: true,
				render: ( { item } ) => (
					<Text>
						{ item.form_title || __( 'Unknown form', 'flowforms' ) }
					</Text>
				),
			},
			{
				id: 'form_id',
				label: __( 'Form', 'flowforms' ),
				filterBy: { operators: [ 'is' ], isPrimary: true },
				elements: formElements,
			},
			{
				id: 'created_at',
				label: __( 'Submitted', 'flowforms' ),
				enableSorting: true,
				render: ( { item } ) => (
					<Text>
						{ new Date( item.created_at ).toLocaleString() }
					</Text>
				),
			},
			{
				id: 'status',
				label: __( 'Status', 'flowforms' ),
				enableSorting: true,
				filterBy: { operators: [ 'is' ], isPrimary: true },
				elements: Object.entries( STATUS_LABELS ).map(
					( [ value, label ] ) => ( { value, label } )
				),
				render: ( { item } ) => (
					<Badge
						intent={ STATUS_INTENTS[ item.status ] || 'default' }
					>
						{ STATUS_LABELS[ item.status ] || item.status }
					</Badge>
				),
			},
			{
				id: 'ip_address',
				label: __( 'IP', 'flowforms' ),
				render: ( { item } ) => <Text>{ item.ip_address || '—' }</Text>,
			},
			{
				id: 'source_url',
				label: __( 'Source', 'flowforms' ),
				enableGlobalSearch: true,
				render: ( { item } ) => (
					<Text
						numberOfLines={ 1 }
						style={ {
							maxWidth: 260,
							overflow: 'hidden',
							textOverflow: 'ellipsis',
						} }
					>
						{ item.source_url || '—' }
					</Text>
				),
			},
		],
		[ formElements ]
	);

	const actions = useMemo(
		() => [
			{
				id: 'view',
				label: __( 'View', 'flowforms' ),
				isPrimary: true,
				callback: ( [ item ] ) => setSelectedEntry( item.id ),
			},
			{
				id: 'delete',
				label: __( 'Delete', 'flowforms' ),
				isDestructive: true,
				supportsBulk: true,
				callback: handleDelete,
			},
		],
		[ handleDelete ]
	);

	const showEmpty =
		entries.length === 0 &&
		! isLoading &&
		! ( view.filters?.length || view.search );

	return (
		<PageHeader
			className="ff-page ff-page--dataviews"
			title={ __( 'All submissions', 'flowforms' ) }
			description={ __(
				'Browse, filter and review entries across every form.',
				'flowforms'
			) }
			hideBack
			right={
				<HStack spacing={ 2 }>
					<Badge intent="info">
						{ sprintf( __( '%d total', 'flowforms' ), total ) }
					</Badge>
				</HStack>
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

				{ showEmpty ? (
					<EmptyState
						icon="feedback"
						title={ __( 'No submissions yet', 'flowforms' ) }
						description={ __(
							'Submissions will appear here as soon as visitors send a form.',
							'flowforms'
						) }
					/>
				) : (
					<div className="ff-dataviews-container">
						<DataViews
							data={ entries }
							view={ view }
							onChangeView={ setView }
							fields={ fields }
							actions={ actions }
							paginationInfo={ {
								totalItems: total,
								totalPages: Math.max(
									1,
									Math.ceil( total / view.perPage )
								),
							} }
							defaultLayouts={ { list: {}, table: {} } }
							getItemId={ ( item ) => item.id }
							isLoading={ isLoading }
							empty={ __(
								'No submissions match these filters.',
								'flowforms'
							) }
						/>
					</div>
				) }
			</div>

			{ selectedEntry && (
				<EntryDetailModal
					entryId={ selectedEntry }
					onClose={ () => setSelectedEntry( null ) }
					onStatusChange={ ( id, status ) => {
						setEntries( ( current ) =>
							current.map( ( item ) =>
								item.id === id ? { ...item, status } : item
							)
						);
					} }
				/>
			) }

			{ confirmDialog }
		</PageHeader>
	);
};

export default AllEntriesPage;
