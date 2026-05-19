import { useState, useEffect, useCallback, useMemo } from '@wordpress/element';
import {
	Button,
	__experimentalVStack as VStack,
	__experimentalText as Text,
} from '@wordpress/components';
import { DataViews } from '@wordpress/dataviews';
import { __, sprintf } from '@wordpress/i18n';
import { useNavigate } from 'react-router-dom';
import { get, post, del } from '../../api/client';
import { FORMS, form as formEndpoint, formDup } from '../../api/endpoints';
import PageHeader from '../../components/PageHeader';
import EmptyState from '../../components/EmptyState';
import Toast from '../../components/Toast';
import useConfirmDialog from '../../hooks/useConfirmDialog';
import useDataViewPreferences from '../../hooks/useDataViewPreferences';
import TemplateBrowser from './TemplateBrowser';

const TYPE_LABELS = {
	standard: __( 'Standard', 'flowforms' ),
	flow: __( 'Flow', 'flowforms' ),
};
const TYPE_STYLES = {
	standard: { backgroundColor: '#e7f5ea', color: '#00a32a' },
	flow: { backgroundColor: '#f0f6ff', color: '#2271b1' },
};
const STATUS_LABELS = {
	active: __( 'Active', 'flowforms' ),
	inactive: __( 'Inactive', 'flowforms' ),
	draft: __( 'Draft', 'flowforms' ),
	trash: __( 'Trash', 'flowforms' ),
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
			if ( statusF?.value ) params.status = statusF.value;
			if ( typeF?.value ) params.type = typeF.value;
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
			setError( e.message || __( 'Failed to load forms.', 'flowforms' ) );
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
								'flowforms'
						  )
						: sprintf(
								__(
									'Delete %d forms and all their entries?',
									'flowforms'
								),
								count
						  ),
				confirmButtonText: __( 'Delete', 'flowforms' ),
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
							? __( 'Form deleted.', 'flowforms' )
							: sprintf(
									__( '%d forms deleted.', 'flowforms' ),
									count
							  ),
				} );
			} catch ( e ) {
				setError(
					e.message || __( 'Failed to delete forms.', 'flowforms' )
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
				message: __( 'Form duplicated.', 'flowforms' ),
			} );
		} catch ( e ) {
			setError(
				e.message || __( 'Failed to duplicate form.', 'flowforms' )
			);
		}
	}, [] );

	const fields = useMemo(
		() => [
			{
				id: 'title',
				label: __( 'Title', 'flowforms' ),
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
				label: __( 'Type', 'flowforms' ),
				enableSorting: false,
				filterBy: { operators: [ 'is' ] },
				elements: [
					{ value: 'standard', label: __( 'Standard', 'flowforms' ) },
					{ value: 'flow', label: __( 'Flow', 'flowforms' ) },
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
				label: __( 'Status', 'flowforms' ),
				enableSorting: true,
				filterBy: { operators: [ 'is' ] },
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
				label: __( 'Entries', 'flowforms' ),
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
				label: __( 'Created', 'flowforms' ),
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
				message: __( 'Shortcode copied to clipboard.', 'flowforms' ),
			} );
		} catch ( e ) {
			setError( __( 'Could not copy the shortcode.', 'flowforms' ) );
		}
	}, [] );

	const actions = useMemo(
		() => [
			{
				id: 'edit',
				label: __( 'Edit', 'flowforms' ),
				isPrimary: true,
				icon: 'edit',
				callback: ( [ f ] ) => navigate( `/forms/${ f.id }/edit` ),
			},
			{
				id: 'entries',
				label: __( 'View Entries', 'flowforms' ),
				callback: ( [ f ] ) => navigate( `/forms/${ f.id }/entries` ),
			},
			/* Quick clipboard copy of the universal shortcode so users can
			 * paste it into page builders without opening the form editor. */
			{
				id: 'copy-shortcode',
				label: __( 'Copy shortcode', 'flowforms' ),
				callback: handleCopyShortcode,
			},
			{
				id: 'duplicate',
				label: __( 'Duplicate', 'flowforms' ),
				callback: handleDuplicate,
			},
			{
				id: 'delete',
				label: __( 'Delete', 'flowforms' ),
				isDestructive: true,
				supportsBulk: true,
				callback: handleDelete,
			},
		],
		[ navigate, handleDelete, handleDuplicate, handleCopyShortcode ]
	);

	const showEmpty =
		forms.length === 0 &&
		! isLoading &&
		! ( view.filters?.length || view.search );

	return (
		<PageHeader
			className="ff-page ff-page--dataviews"
			title={ __( 'Forms', 'flowforms' ) }
			description={ __( 'Create and manage your forms.', 'flowforms' ) }
			hideBack
			right={
				<Button variant="primary" onClick={ () => setBrowser( true ) }>
					{ __( 'New Form', 'flowforms' ) }
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
						title={ __( 'No forms yet', 'flowforms' ) }
						description={ __(
							'Create your first form to start collecting submissions.',
							'flowforms'
						) }
						action={ () => setBrowser( true ) }
						actionLabel={ __(
							'Create Your First Form',
							'flowforms'
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
