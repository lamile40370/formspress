import { useState, useEffect, useCallback, useMemo } from '@wordpress/element';
import {
	Button,
	__experimentalVStack as VStack,
	__experimentalText as Text,
} from '@wordpress/components';
import { __, sprintf } from '@wordpress/i18n';
import { useNavigate } from 'react-router-dom';
import { applyFilters } from '@wordpress/hooks';
import { get, post, del } from '../../api/client';
import { FORMS, form as formEndpoint, formDup } from '../../api/endpoints';
import PageHeader from '../../components/PageHeader';
import EmptyState from '../../components/EmptyState';
import Toast from '../../components/Toast';
import { DataViews } from '@wordpress/dataviews';
import useConfirmDialog from '../../hooks/useConfirmDialog';
import useDataViewPreferences from '../../hooks/useDataViewPreferences';
import TemplateBrowser from './TemplateBrowser';
import { setFilterParam } from '../../utils/dataviewsFilters';

const TYPE_LABELS = {
	standard: __( 'Standard', 'formspress' ),
	flow: __( 'Flow', 'formspress' ),
};
const TYPE_STYLES = {
	standard: { backgroundColor: '#e7f5ea', color: '#00a32a' },
	flow: { backgroundColor: '#f0f6ff', color: '#2271b1' },
};
const STATUS_LABELS = {
	active: __( 'Active', 'formspress' ),
	inactive: __( 'Inactive', 'formspress' ),
	draft: __( 'Draft', 'formspress' ),
	trash: __( 'Trash', 'formspress' ),
};
const STATUS_STYLES = {
	active: { backgroundColor: '#e7f5ea', color: '#00a32a' },
	inactive: { backgroundColor: '#f0f0f0', color: '#50575e' },
	draft: { backgroundColor: '#fcf8e3', color: '#8a6d3b' },
	trash: { backgroundColor: '#fdebeb', color: '#d63638' },
};

const Badge = ( { label, style } ) => (
	<span
		style={ {
			...style,
			padding: '2px 8px',
			borderRadius: '2px',
			fontSize: '12px',
			whiteSpace: 'nowrap',
		} }
	>
		{ label }
	</span>
);

const FormsListPage = () => {
	const navigate = useNavigate();
	const isProActive = !! window.flowFormsData?.pro?.active;
	const [ forms, setForms ] = useState( [] );
	const [ total, setTotal ] = useState( 0 );
	const [ isLoading, setLoading ] = useState( true );
	const [ error, setError ] = useState( null );
	const [ notice, setNotice ] = useState( null );
	const [ isBrowserOpen, setBrowser ] = useState( false );
	const { confirm, confirmDialog } = useConfirmDialog();

	const [ view, setView ] = useDataViewPreferences( 'forms', {
		type: 'table',
		perPage: 20,
		page: 1,
		sort: { field: 'created_at', direction: 'desc' },
		filters: [],
		search: '',
		fields: [ 'title', 'type', 'status', 'entries_count', 'created_at' ],
	} );

	const fetchForms = useCallback( async () => {
		setLoading( true );
		try {
			const params = { page: view.page, per_page: view.perPage };
			const statusF = view.filters?.find( ( f ) => f.field === 'status' );
			const typeF = view.filters?.find( ( f ) => f.field === 'type' );
			setFilterParam( params, 'status', statusF );
			setFilterParam( params, 'type', typeF );
			if ( view.search ) params.search = view.search;
			if ( view.sort?.field ) {
				params.sort = view.sort.field;
				params.order = view.sort.direction || 'desc';
			}

			const res = await get( FORMS, params );
			setForms( res.data || [] );
			setTotal( res.total || 0 );
			setError( null );
		} catch ( e ) {
			setError( e.message || __( 'Failed to load forms.', 'formspress' ) );
		} finally {
			setLoading( false );
		}
	}, [ view.page, view.perPage, view.filters, view.search, view.sort ] );

	useEffect( () => {
		fetchForms();
	}, [ fetchForms ] );

	const handleDelete = useCallback(
		async ( selected ) => {
			const count = selected.length;
			const confirmed = await confirm( {
				message:
					count === 1
						? __(
								'Delete this form and all its entries?',
								'formspress'
						  )
						: sprintf(
								__(
									'Delete %d forms and all their entries?',
									'formspress'
								),
								count
						  ),
				confirmButtonText: __( 'Delete', 'formspress' ),
			} );
			if ( ! confirmed ) return;
			try {
				await Promise.all(
					selected.map( ( f ) => del( formEndpoint( f.id ) ) )
				);
				const ids = new Set( selected.map( ( f ) => f.id ) );
				setForms( ( prev ) =>
					prev.filter( ( f ) => ! ids.has( f.id ) )
				);
				setTotal( ( prev ) => prev - count );
				setNotice( {
					type: 'success',
					message:
						count === 1
							? __( 'Form deleted.', 'formspress' )
							: sprintf(
									__( '%d forms deleted.', 'formspress' ),
									count
							  ),
				} );
			} catch ( e ) {
				setError(
					e.message || __( 'Failed to delete forms.', 'formspress' )
				);
			}
		},
		[ confirm ]
	);

	const handleDuplicate = useCallback( async ( [ f ] ) => {
		try {
			const res = await post( formDup( f.id ) );
			setForms( ( prev ) => [ res.data, ...prev ] );
			setTotal( ( prev ) => prev + 1 );
			setNotice( {
				type: 'success',
				message: __( 'Form duplicated.', 'formspress' ),
			} );
		} catch ( e ) {
			setError(
				e.message || __( 'Failed to duplicate form.', 'formspress' )
			);
		}
	}, [] );

	const fields = useMemo(
		() => [
			{
				id: 'title',
				label: __( 'Title', 'formspress' ),
				enableGlobalSearch: true,
				enableSorting: true,
				render: ( { item } ) => (
					<VStack spacing={ 0 }>
						<Button
							variant="link"
							onClick={ () =>
								navigate( `/forms/${ item.id }/edit` )
							}
							style={ { fontWeight: 500 } }
						>
							{ item.title }
						</Button>
						{ item.description && (
							<Text variant="muted" size="small">
								{ item.description }
							</Text>
						) }
					</VStack>
				),
			},
			{
				id: 'type',
				label: __( 'Type', 'formspress' ),
				enableSorting: false,
				filterBy: { operators: [ 'isAny' ] },
				elements: [
					{ value: 'standard', label: __( 'Standard', 'formspress' ) },
					{ value: 'flow', label: __( 'Flow', 'formspress' ) },
				],
				render: ( { item } ) => (
					<Badge
						label={ TYPE_LABELS[ item.type ] || item.type }
						style={ TYPE_STYLES[ item.type ] || {} }
					/>
				),
			},
			{
				id: 'status',
				label: __( 'Status', 'formspress' ),
				enableSorting: true,
				filterBy: { operators: [ 'isAny' ] },
				elements: Object.entries( STATUS_LABELS ).map(
					( [ value, label ] ) => ( { value, label } )
				),
				render: ( { item } ) => (
					<Badge
						label={ STATUS_LABELS[ item.status ] || item.status }
						style={ STATUS_STYLES[ item.status ] || {} }
					/>
				),
			},
			{
				id: 'entries_count',
				label: __( 'Entries', 'formspress' ),
				enableSorting: false,
				render: ( { item } ) => (
					<Button
						variant="link"
						onClick={ () =>
							navigate( `/forms/${ item.id }/entries` )
						}
					>
						{ item.entries_count ?? 0 }
					</Button>
				),
			},
			{
				id: 'created_at',
				label: __( 'Created', 'formspress' ),
				enableSorting: true,
				render: ( { item } ) => (
					<Text>
						{ new Date( item.created_at ).toLocaleDateString() }
					</Text>
				),
			},
		],
		[ navigate ]
	);

	const handleCopyShortcode = useCallback( async ( [ f ] ) => {
		const sc = `[formspress id="${ f.id }"]`;
		try {
			if ( navigator.clipboard?.writeText ) {
				await navigator.clipboard.writeText( sc );
			} else {
				// Old-browser fallback — temporary textarea + execCommand.
				const ta = document.createElement( 'textarea' );
				ta.value = sc;
				ta.style.position = 'fixed';
				ta.style.opacity = '0';
				document.body.appendChild( ta );
				ta.select();
				document.execCommand( 'copy' );
				document.body.removeChild( ta );
			}
			setNotice( {
				type: 'success',
				message: __( 'Shortcode copied to clipboard.', 'formspress' ),
			} );
		} catch ( e ) {
			setError( __( 'Could not copy the shortcode.', 'formspress' ) );
		}
	}, [] );

	const actions = useMemo(
		() =>
			applyFilters(
				'flowforms.forms.list.actions',
				[
			{
				id: 'edit',
				label: __( 'Edit', 'formspress' ),
				isPrimary: true,
				icon: 'edit',
				callback: ( [ f ] ) => navigate( `/forms/${ f.id }/edit` ),
			},
			{
				id: 'entries',
				label: __( 'View Entries', 'formspress' ),
				callback: ( [ f ] ) => navigate( `/forms/${ f.id }/entries` ),
			},
			...( isProActive
				? []
				: [
						{
							id: 'analytics',
							label: __( 'Analytics', 'formspress' ),
							callback: ( [ f ] ) =>
								navigate( `/forms/${ f.id }/analytics` ),
						},
				  ] ),
			/* Quick clipboard copy of the universal shortcode so users can
			 * paste it into page builders without opening the form editor. */
			{
				id: 'copy-shortcode',
				label: __( 'Copy shortcode', 'formspress' ),
				callback: handleCopyShortcode,
			},
			{
				id: 'duplicate',
				label: __( 'Duplicate', 'formspress' ),
				callback: handleDuplicate,
			},
			{
				id: 'delete',
				label: __( 'Delete', 'formspress' ),
				isDestructive: true,
				supportsBulk: true,
				callback: handleDelete,
			},
				],
				{ navigate }
			),
		[
			navigate,
			isProActive,
			handleDelete,
			handleDuplicate,
			handleCopyShortcode,
		]
	);

	const showEmpty =
		forms.length === 0 &&
		! isLoading &&
		! ( view.filters?.length || view.search );

	return (
		<PageHeader
			className="ff-page ff-page--dataviews"
			title={ __( 'Forms', 'formspress' ) }
			description={ __( 'Create and manage your forms.', 'formspress' ) }
			hideBack
			right={
				<Button variant="primary" onClick={ () => setBrowser( true ) }>
					{ __( 'New Form', 'formspress' ) }
				</Button>
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
						title={ __( 'No forms yet', 'formspress' ) }
						description={ __(
							'Create your first form to start collecting submissions.',
							'formspress'
						) }
						action={ () => setBrowser( true ) }
						actionLabel={ __(
							'Create Your First Form',
							'formspress'
						) }
					/>
				) : (
					<div className="ff-dataviews-container">
						<DataViews
							data={ forms }
							fields={ fields }
							view={ view }
							onChangeView={ setView }
							actions={ actions }
							defaultLayouts={ { table: {}, grid: {} } }
							paginationInfo={ {
								totalItems: total,
								totalPages: Math.ceil( total / view.perPage ),
							} }
							getItemId={ ( item ) => item.id }
							isLoading={ isLoading }
						/>
					</div>
				) }
			</div>

			{ isBrowserOpen && (
				<TemplateBrowser onClose={ () => setBrowser( false ) } />
			) }

			{ confirmDialog }
		</PageHeader>
	);
};

export default FormsListPage;
