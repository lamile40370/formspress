import { useEffect, useMemo, useState } from '@wordpress/element';
import {
	Button,
	Spinner,
	TextControl,
	ToggleControl,
	CheckboxControl,
	Card,
	CardBody,
	__experimentalVStack as VStack,
	__experimentalHStack as HStack,
	__experimentalHeading as Heading,
} from '@wordpress/components';
import { DataViews } from '@wordpress/dataviews';
import { __ } from '@wordpress/i18n';
import { get, post, put, del } from '../../api/client';
import PageHeader from '../../components/PageHeader';
import Badge from '../../components/Badge';
import Toast from '../../components/Toast';

const ENDPOINT = '/webhooks';
const EVENTS_PATH = '/webhooks/events';

const STATUS_LABELS = {
	active: __( 'Active', 'flowforms' ),
	disabled: __( 'Disabled', 'flowforms' ),
};

const DEFAULT_VIEW = {
	type: 'table',
	page: 1,
	perPage: 25,
	search: '',
	filters: [],
	layout: {},
	titleField: 'title',
	fields: [ 'url', 'events_summary', 'secret', 'status' ],
};

const blankSubscription = () => ( {
	name: '',
	url: '',
	events: [ 'entry.created' ],
	secret: '',
	active: true,
} );

const WebhookForm = ( { value, eventList, onChange, onCancel, onSave } ) => {
	const toggleEvent = ( ev ) => {
		const next = value.events.includes( ev )
			? value.events.filter( ( e ) => e !== ev )
			: [ ...value.events, ev ];
		onChange( { ...value, events: next } );
	};

	return (
		<Card>
			<CardBody>
				<VStack spacing={ 3 }>
					<TextControl
						__nextHasNoMarginBottom
						__next40pxDefaultSize
						label={ __( 'Name', 'flowforms' ) }
						value={ value.name }
						onChange={ ( v ) => onChange( { ...value, name: v } ) }
					/>
					<TextControl
						__nextHasNoMarginBottom
						__next40pxDefaultSize
						type="url"
						label={ __( 'Target URL', 'flowforms' ) }
						placeholder="https://hooks.zapier.com/…"
						value={ value.url }
						onChange={ ( v ) => onChange( { ...value, url: v } ) }
					/>

					<div>
						<Heading level={ 5 } style={ { marginBottom: 8 } }>
							{ __( 'Events', 'flowforms' ) }
						</Heading>
						<VStack spacing={ 1 }>
							{ eventList.map( ( ev ) => (
								<CheckboxControl
									key={ ev }
									__nextHasNoMarginBottom
									label={ ev }
									checked={ value.events.includes( ev ) }
									onChange={ () => toggleEvent( ev ) }
								/>
							) ) }
						</VStack>
					</div>

					<TextControl
						__nextHasNoMarginBottom
						__next40pxDefaultSize
						label={ __( 'Secret (HMAC-SHA256)', 'flowforms' ) }
						help={ __(
							'Sent as X-FormsPress-Signature on every delivery.',
							'flowforms'
						) }
						value={ value.secret }
						onChange={ ( v ) =>
							onChange( { ...value, secret: v } )
						}
					/>

					<ToggleControl
						__nextHasNoMarginBottom
						label={ __( 'Active', 'flowforms' ) }
						checked={ !! value.active }
						onChange={ ( v ) =>
							onChange( { ...value, active: v } )
						}
					/>

					<HStack spacing={ 2 } justify="flex-end">
						<Button variant="tertiary" onClick={ onCancel }>
							{ __( 'Cancel', 'flowforms' ) }
						</Button>
						<Button variant="primary" onClick={ onSave }>
							{ __( 'Save', 'flowforms' ) }
						</Button>
					</HStack>
				</VStack>
			</CardBody>
		</Card>
	);
};

const WebhooksPage = () => {
	const [ loading, setLoading ] = useState( true );
	const [ items, setItems ] = useState( [] );
	const [ events, setEvents ] = useState( [] );
	const [ editing, setEditing ] = useState( null );
	const [ notice, setNotice ] = useState( null );
	const [ view, setView ] = useState( DEFAULT_VIEW );

	const load = () => {
		setLoading( true );
		Promise.all( [ get( ENDPOINT ), get( EVENTS_PATH ) ] )
			.then( ( [ subs, evs ] ) => {
				setItems( subs?.data || [] );
				setEvents( evs?.data || [] );
			} )
			.finally( () => setLoading( false ) );
	};
	useEffect( load, [] );

	const save = async () => {
		try {
			if ( editing.id ) {
				await put( `${ ENDPOINT }/${ editing.id }`, editing );
				setNotice( {
					type: 'success',
					message: __( 'Webhook updated.', 'flowforms' ),
				} );
			} else {
				await post( ENDPOINT, editing );
				setNotice( {
					type: 'success',
					message: __( 'Webhook created.', 'flowforms' ),
				} );
			}
			setEditing( null );
			load();
		} catch ( e ) {
			setNotice( {
				type: 'error',
				message: e.message || __( 'Save failed.', 'flowforms' ),
			} );
		}
	};

	const remove = async ( id ) => {
		if ( ! window.confirm( __( 'Delete this webhook?', 'flowforms' ) ) )
			return;
		await del( `${ ENDPOINT }/${ id }` );
		load();
	};

	const test = async ( id ) => {
		try {
			const res = await post( `${ ENDPOINT }/${ id }/test`, {} );
			const code = res?.data?.response_code;
			setNotice( {
				type: code >= 200 && code < 300 ? 'success' : 'warning',
				message: `Test delivered. Remote responded with HTTP ${ code }.`,
			} );
		} catch ( e ) {
			setNotice( {
				type: 'error',
				message: e.message || __( 'Test failed.', 'flowforms' ),
			} );
		}
	};

	const copy = ( s ) => {
		navigator.clipboard?.writeText( s );
		setNotice( {
			type: 'success',
			message: __( 'Secret copied.', 'flowforms' ),
		} );
	};

	const startEditing = ( item ) => {
		const webhook = { ...item };
		delete webhook.title;
		delete webhook.events_summary;
		delete webhook.status;
		setEditing( { ...webhook } );
	};

	const data = useMemo(
		() =>
			items.map( ( item ) => ( {
				...item,
				title: item.name || __( '(unnamed)', 'flowforms' ),
				events_summary:
					( item.events || [] ).join( ', ' ) ||
					__( 'No events', 'flowforms' ),
				status: item.active ? 'active' : 'disabled',
			} ) ),
		[ items ]
	);

	const filtered = useMemo( () => {
		const search = ( view.search || '' ).trim().toLowerCase();
		const statusFilter = view.filters?.find(
			( filter ) => 'status' === filter.field
		);

		return data.filter( ( item ) => {
			if ( statusFilter?.value && item.status !== statusFilter.value ) {
				return false;
			}

			if ( ! search ) {
				return true;
			}

			const haystack = `${ item.title } ${ item.url || '' } ${
				item.events_summary || ''
			}`.toLowerCase();

			return haystack.includes( search );
		} );
	}, [ data, view.search, view.filters ] );

	const fields = useMemo(
		() => [
			{
				id: 'title',
				label: __( 'Name', 'flowforms' ),
				enableGlobalSearch: true,
				enableSorting: true,
			},
			{
				id: 'url',
				label: __( 'Target URL', 'flowforms' ),
				enableGlobalSearch: true,
				render: ( { item } ) => (
					<span style={ { wordBreak: 'break-all' } }>
						{ item.url }
					</span>
				),
			},
			{
				id: 'events_summary',
				label: __( 'Events', 'flowforms' ),
				enableGlobalSearch: true,
			},
			{
				id: 'secret',
				label: __( 'Secret', 'flowforms' ),
				render: ( { item } ) =>
					item.secret ? (
						<HStack spacing={ 2 } justify="flex-start">
							<code>{ item.secret }</code>
							<Button
								size="small"
								variant="tertiary"
								onClick={ () => copy( item.secret ) }
							>
								{ __( 'Copy', 'flowforms' ) }
							</Button>
						</HStack>
					) : (
						'—'
					),
			},
			{
				id: 'status',
				label: __( 'Status', 'flowforms' ),
				filterBy: { operators: [ 'is' ] },
				elements: Object.entries( STATUS_LABELS ).map(
					( [ value, label ] ) => ( { value, label } )
				),
				render: ( { item } ) => (
					<Badge
						intent={
							'active' === item.status ? 'success' : 'error'
						}
					>
						{ STATUS_LABELS[ item.status ] || item.status }
					</Badge>
				),
			},
		],
		[]
	);

	const actions = useMemo(
		() => [
			{
				id: 'test',
				label: __( 'Test', 'flowforms' ),
				isPrimary: true,
				callback: ( [ item ] ) => test( item.id ),
			},
			{
				id: 'edit',
				label: __( 'Edit', 'flowforms' ),
				icon: 'edit',
				callback: ( [ item ] ) => startEditing( item ),
			},
			{
				id: 'delete',
				label: __( 'Delete', 'flowforms' ),
				isDestructive: true,
				callback: ( [ item ] ) => remove( item.id ),
			},
		],
		[]
	); // eslint-disable-line react-hooks/exhaustive-deps

	const paginationInfo = {
		totalItems: filtered.length,
		totalPages: Math.max( 1, Math.ceil( filtered.length / view.perPage ) ),
	};

	if ( loading )
		return (
			<div className="ff-page ff-page--loading">
				<Spinner />
			</div>
		);

	return (
		<PageHeader
			title={ __( 'Outgoing Webhooks', 'flowforms' ) }
			description={ __(
				'Push FormsPress events to Zapier, Make, n8n, or any HTTPS endpoint.',
				'flowforms'
			) }
			hideBack
			right={
				! editing && (
					<Button
						variant="primary"
						onClick={ () => setEditing( blankSubscription() ) }
					>
						{ __( 'Add webhook', 'flowforms' ) }
					</Button>
				)
			}
		>
			<div className="ff-page__body">
				<Toast notice={ notice } onRemove={ () => setNotice( null ) } />

				{ editing && (
					<WebhookForm
						value={ editing }
						eventList={ events }
						onChange={ setEditing }
						onCancel={ () => setEditing( null ) }
						onSave={ save }
					/>
				) }

				{ ! editing && (
					<div className="ff-dataviews-container">
						<DataViews
							data={ filtered }
							fields={ fields }
							view={ view }
							onChangeView={ setView }
							actions={ actions }
							defaultLayouts={ { table: {} } }
							paginationInfo={ paginationInfo }
							getItemId={ ( item ) => item.id }
							onClickItem={ startEditing }
						/>
					</div>
				) }
			</div>
		</PageHeader>
	);
};

export default WebhooksPage;
