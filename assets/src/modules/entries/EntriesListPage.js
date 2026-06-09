import { useState, useEffect, useCallback, useMemo } from '@wordpress/element';
import { Button, __experimentalText as Text } from '@wordpress/components';
import { __, sprintf } from '@wordpress/i18n';
import { useParams } from 'react-router-dom';
import { get, del } from '../../api/client';
import {
	form as formEndpoint,
	formEntries,
	formExport,
	entry as entryEndpoint,
} from '../../api/endpoints';
import PageHeader from '../../components/PageHeader';
import EmptyState from '../../components/EmptyState';
import Toast from '../../components/Toast';
import { DataViews } from '@wordpress/dataviews';
import EntryDetailModal from './EntryDetailModal';
import useConfirmDialog from '../../hooks/useConfirmDialog';
import useDataViewPreferences from '../../hooks/useDataViewPreferences';
import { setFilterParam } from '../../utils/dataviewsFilters';

const STATUS_LABELS = {
	unread: __( 'Unread', 'formspress' ),
	read: __( 'Read', 'formspress' ),
	starred: __( 'Starred', 'formspress' ),
	spam: __( 'Spam', 'formspress' ),
	trash: __( 'Trash', 'formspress' ),
};
const STATUS_STYLES = {
	unread: { backgroundColor: '#e7f5ea', color: '#00a32a' },
	read: { backgroundColor: '#f0f0f0', color: '#50575e' },
	starred: { backgroundColor: '#fcf8e3', color: '#8a6d3b' },
	spam: { backgroundColor: '#f2dede', color: '#a94442' },
};

const EntriesListPage = () => {
	const { formId } = useParams();
	const [ form, setForm ] = useState( null );
	const [ entries, setEntries ] = useState( [] );
	const [ total, setTotal ] = useState( 0 );
	const [ isLoading, setLoading ] = useState( true );
	const [ error, setError ] = useState( null );
	const [ notice, setNotice ] = useState( null );
	const [ selectedEntry, setSelected ] = useState( null );
	const { confirm, confirmDialog } = useConfirmDialog();

	const [ view, setView ] = useDataViewPreferences( `entries-${ formId }`, {
		type: 'table',
		perPage: 20,
		page: 1,
		sort: { field: 'created_at', direction: 'desc' },
		filters: [],
		search: '',
		fields: [ 'status', 'created_at', 'ip_address', 'source_url' ],
	} );

	useEffect( () => {
		get( formEndpoint( formId ) )
			.then( ( res ) => setForm( res.data ) )
			.catch( () => {} );
	}, [ formId ] );

	const fetchEntries = useCallback( async () => {
		setLoading( true );
		try {
			const params = { page: view.page, per_page: view.perPage };
			const statusF = view.filters?.find( ( f ) => f.field === 'status' );
			setFilterParam( params, 'status', statusF );
			if ( view.search ) params.search = view.search;
			if ( view.sort?.field ) {
				params.sort = view.sort.field;
				params.order = view.sort.direction || 'desc';
			}

			const res = await get( formEntries( formId ), params );
			setEntries( res.data || [] );
			setTotal( res.total || 0 );
			setError( null );
		} catch ( e ) {
			setError(
				e.message || __( 'Failed to load entries.', 'formspress' )
			);
		} finally {
			setLoading( false );
		}
	}, [
		formId,
		view.page,
		view.perPage,
		view.filters,
		view.search,
		view.sort,
	] );

	useEffect( () => {
		fetchEntries();
	}, [ fetchEntries ] );

	const handleDelete = useCallback(
		async ( selected ) => {
			const count = selected.length;
			const confirmed = await confirm( {
				message:
					count === 1
						? __( 'Delete this entry permanently?', 'formspress' )
						: sprintf(
								__(
									'Delete %d entries permanently?',
									'formspress'
								),
								count
						  ),
				confirmButtonText: __( 'Delete', 'formspress' ),
			} );
			if ( ! confirmed ) return;
			try {
				await Promise.all(
					selected.map( ( e ) => del( entryEndpoint( e.id ) ) )
				);
				const ids = new Set( selected.map( ( e ) => e.id ) );
				setEntries( ( prev ) =>
					prev.filter( ( e ) => ! ids.has( e.id ) )
				);
				setTotal( ( prev ) => prev - count );
				setNotice( {
					type: 'success',
					message:
						count === 1
							? __( 'Entry deleted.', 'formspress' )
							: sprintf(
									__( '%d entries deleted.', 'formspress' ),
									count
							  ),
				} );
			} catch ( e ) {
				setError(
					e.message || __( 'Failed to delete entries.', 'formspress' )
				);
			}
		},
		[ confirm ]
	);

	const handleExport = async () => {
		try {
			const res = await get( formExport( formId ) );
			const rows = res.data.rows;
			const csv = rows
				.map( ( row ) =>
					row
						.map(
							( cell ) =>
								`"${ String( cell ).replace( /"/g, '""' ) }"`
						)
						.join( ',' )
				)
				.join( '\n' );
			const blob = new Blob( [ '﻿' + csv ], {
				type: 'text/csv;charset=utf-8;',
			} );
			const url = URL.createObjectURL( blob );
			const a = document.createElement( 'a' );
			a.href = url;
			a.download = `${ res.data.form_title }-entries.csv`;
			a.click();
			URL.revokeObjectURL( url );
		} catch ( e ) {
			setError( __( 'Failed to export entries.', 'formspress' ) );
		}
	};

	const fields = useMemo(
		() => [
			{
				id: 'status',
				label: __( 'Status', 'formspress' ),
				enableSorting: false,
				filterBy: { operators: [ 'isAny' ] },
				elements: Object.entries( STATUS_LABELS )
					.filter( ( [ k ] ) => k !== 'trash' )
					.map( ( [ value, label ] ) => ( { value, label } ) ),
				render: ( { item } ) => {
					const style =
						STATUS_STYLES[ item.status ] || STATUS_STYLES.read;
					return (
						<Button
							variant="link"
							onClick={ () => setSelected( item.id ) }
							style={ { textDecoration: 'none' } }
						>
							<span
								style={ {
									...style,
									padding: '2px 8px',
									borderRadius: '2px',
									fontSize: '12px',
								} }
							>
								{ STATUS_LABELS[ item.status ] || item.status }
							</span>
						</Button>
					);
				},
			},
			{
				id: 'created_at',
				label: __( 'Date', 'formspress' ),
				enableSorting: true,
				render: ( { item } ) => (
					<Button
						variant="link"
						onClick={ () => setSelected( item.id ) }
					>
						{ new Date( item.created_at ).toLocaleString() }
					</Button>
				),
			},
			{
				id: 'ip_address',
				label: __( 'IP', 'formspress' ),
				enableSorting: false,
				render: ( { item } ) => <Text>{ item.ip_address || '—' }</Text>,
			},
			{
				id: 'source_url',
				label: __( 'Source', 'formspress' ),
				enableSorting: false,
				render: ( { item } ) => (
					<Text
						numberOfLines={ 1 }
						style={ {
							maxWidth: 200,
							overflow: 'hidden',
							textOverflow: 'ellipsis',
						} }
					>
						{ item.source_url || '—' }
					</Text>
				),
			},
		],
		[]
	);

	const actions = useMemo(
		() => [
			{
				id: 'view',
				label: __( 'View', 'formspress' ),
				isPrimary: true,
				callback: ( [ e ] ) => setSelected( e.id ),
			},
			{
				id: 'delete',
				label: __( 'Delete', 'formspress' ),
				isDestructive: true,
				supportsBulk: true,
				callback: handleDelete,
			},
		],
		[ handleDelete ]
	);

	const showEmpty =
		entries.length === 0 && ! isLoading && ! view.filters?.length;

	return (
		<PageHeader
			className="ff-page ff-page--dataviews"
			title={
				form
					? sprintf( __( 'Entries — %s', 'formspress' ), form.title )
					: __( 'Entries', 'formspress' )
			}
			right={
				<Button variant="secondary" onClick={ handleExport }>
					{ __( 'Export CSV', 'formspress' ) }
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
						title={ __( 'No entries yet', 'formspress' ) }
						description={ __(
							'Submissions will appear here once your form receives responses.',
							'formspress'
						) }
					/>
				) : (
					<div className="ff-dataviews-container">
						<DataViews
							data={ entries }
							fields={ fields }
							view={ view }
							onChangeView={ setView }
							actions={ actions }
							defaultLayouts={ { table: {} } }
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

			{ selectedEntry && (
				<EntryDetailModal
					entryId={ selectedEntry }
					onClose={ () => setSelected( null ) }
					onStatusChange={ ( id, status ) => {
						setEntries( ( prev ) =>
							prev.map( ( e ) =>
								e.id === id ? { ...e, status } : e
							)
						);
					} }
				/>
			) }

			{ confirmDialog }
		</PageHeader>
	);
};

export default EntriesListPage;
