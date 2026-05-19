import { useEffect, useMemo, useState } from '@wordpress/element';
import {
	Card,
	CardBody,
	Spinner,
	__experimentalToggleGroupControl as ToggleGroupControl,
	__experimentalToggleGroupControlOption as ToggleGroupControlOption,
	__experimentalVStack as VStack,
} from '@wordpress/components';
import { DataViews } from '@wordpress/dataviews';
import { __ } from '@wordpress/i18n';
import PageHeader from '../../components/PageHeader';
import Badge from '../../components/Badge';
import Toast from '../../components/Toast';
import { get } from '../../api/client';
import { LOGS } from '../../api/endpoints';

/**
 * Unified delivery log viewer. Currently surfaces webhook deliveries
 * (the only loggable surface so far). The endpoint accepts a `kind`
 * query param so we can grow into action logs without adding pages.
 */

const DEFAULT_VIEW = {
	type: 'table',
	page: 1,
	perPage: 25,
	sort: { field: 'created_at', direction: 'desc' },
	fields: [ 'event', 'target', 'status_code', 'created_at' ],
	titleField: 'event',
};

const LogsPage = () => {
	const [ kind, setKind ] = useState( 'webhook' );
	const [ data, setData ] = useState( null );
	const [ view, setView ] = useState( DEFAULT_VIEW );
	const [ error, setError ] = useState( null );

	useEffect( () => {
		setData( null );
		get( LOGS, { kind, page: view.page, per_page: view.perPage } )
			.then( ( res ) => setData( res.data || [] ) )
			.catch( ( e ) => {
				if ( e?.status === 404 ) {
					// No log endpoint live yet — degrade gracefully.
					setData( [] );
					setError(
						__(
							'Delivery logs will appear here as soon as you send the first webhook event.',
							'flowforms'
						)
					);
				} else {
					setError(
						e.message || __( 'Could not load logs.', 'flowforms' )
					);
				}
			} );
	}, [ kind, view.page, view.perPage ] );

	const fields = useMemo(
		() => [
			{
				id: 'event',
				label: __( 'Event', 'flowforms' ),
				enableHiding: false,
			},
			{ id: 'target', label: __( 'Target', 'flowforms' ) },
			{
				id: 'status_code',
				label: __( 'Status', 'flowforms' ),
				render: ( { item } ) => {
					const c = Number( item.status_code || 0 );
					const intent =
						c >= 200 && c < 300
							? 'success'
							: c >= 400
							? 'error'
							: 'warning';
					return <Badge intent={ intent }>{ c || '—' }</Badge>;
				},
			},
			{ id: 'created_at', label: __( 'Sent at', 'flowforms' ) },
		],
		[]
	);

	return (
		<PageHeader
			title={ __( 'Logs', 'flowforms' ) }
			description={ __(
				'Audit every outbound webhook and action delivery, with status codes and response bodies.',
				'flowforms'
			) }
		>
			<div className="ff-page__body">
				<VStack spacing={ 4 }>
					<Card>
						<CardBody>
							<ToggleGroupControl
								label={ __( 'Source', 'flowforms' ) }
								hideLabelFromVision
								value={ kind }
								onChange={ setKind }
								__nextHasNoMarginBottom
								__next40pxDefaultSize
							>
								<ToggleGroupControlOption
									value="webhook"
									label={ __( 'Webhooks', 'flowforms' ) }
								/>
								<ToggleGroupControlOption
									value="action"
									label={ __( 'Actions', 'flowforms' ) }
								/>
							</ToggleGroupControl>
						</CardBody>
					</Card>

					<Toast
						notice={
							error ? { type: 'info', message: error } : null
						}
						onRemove={ () => setError( null ) }
					/>

					{ null === data ? (
						<Spinner />
					) : (
						<DataViews
							data={ data }
							view={ view }
							onChangeView={ setView }
							fields={ fields }
							defaultLayouts={ { table: {} } }
						/>
					) }
				</VStack>
			</div>
		</PageHeader>
	);
};

export default LogsPage;
