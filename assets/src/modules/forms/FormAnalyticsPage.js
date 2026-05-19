import { useState, useEffect, useMemo, useCallback } from '@wordpress/element';
import {
	Card,
	CardHeader,
	CardBody,
	Button,
	Spinner,
	__experimentalToggleGroupControl as ToggleGroupControl,
	__experimentalToggleGroupControlOption as ToggleGroupControlOption,
	__experimentalVStack as VStack,
	__experimentalHStack as HStack,
	__experimentalHeading as Heading,
	__experimentalText as Text,
} from '@wordpress/components';
import { __, sprintf } from '@wordpress/i18n';
import { useParams } from 'react-router-dom';
import PageHeader from '../../components/PageHeader';
import Toast from '../../components/Toast';
import { get } from '../../api/client';
import { formAnalytics } from '../../api/endpoints';

const formatNumber = ( v ) => Number( v || 0 ).toLocaleString();
const formatPercent = ( v ) => `${ Number( v || 0 ).toFixed( 1 ) }%`;

const KpiTile = ( { label, value, caption } ) => (
	<Card size="small" className="formspress-dashboard__kpi">
		<CardBody>
			<VStack spacing={ 1 }>
				<Text size="small" className="formspress-dashboard__kpi-label">
					{ label }
				</Text>
				<Heading
					level={ 2 }
					className="formspress-dashboard__kpi-value"
				>
					{ value }
				</Heading>
				{ caption && (
					<Text
						variant="muted"
						size="small"
						className="formspress-dashboard__kpi-caption"
					>
						{ caption }
					</Text>
				) }
			</VStack>
		</CardBody>
	</Card>
);

/**
 * Compact stacked area chart implemented with inline SVG — no external deps.
 * Renders views (light fill), starts (mid), submits (dark).
 */
const StackedAreaChart = ( { data } ) => {
	if ( ! data || data.length === 0 ) {
		return (
			<Text variant="muted">{ __( 'No data yet.', 'flowforms' ) }</Text>
		);
	}

	const w = 720,
		h = 180,
		pad = 24;
	const max = Math.max( 1, ...data.map( ( d ) => d.views || 0 ) );

	const xStep = ( w - pad * 2 ) / Math.max( 1, data.length - 1 );
	const y = ( v ) => h - pad - ( v / max ) * ( h - pad * 2 );

	const buildPath = ( key ) => {
		const points = data.map(
			( d, i ) => `${ pad + i * xStep },${ y( d[ key ] || 0 ) }`
		);
		return `M ${ pad },${ h - pad } L ${ points.join( ' L ' ) } L ${
			pad + ( data.length - 1 ) * xStep
		},${ h - pad } Z`;
	};

	const tone = 'var(--wp-admin-theme-color, #3858e9)';

	return (
		<svg
			viewBox={ `0 0 ${ w } ${ h }` }
			style={ { width: '100%', height: 'auto', display: 'block' } }
			aria-hidden="true"
		>
			<path d={ buildPath( 'views' ) } fill={ tone } opacity="0.15" />
			<path d={ buildPath( 'starts' ) } fill={ tone } opacity="0.35" />
			<path d={ buildPath( 'submits' ) } fill={ tone } opacity="0.75" />
		</svg>
	);
};

const FunnelRow = ( { step, max } ) => {
	const pct = max > 0 ? Math.max( 2, ( step.visitors / max ) * 100 ) : 0;
	return (
		<div className="formspress-dashboard__status-row">
			<div className="formspress-dashboard__status-meta">
				<Text
					size="small"
					className="formspress-dashboard__status-label"
				>
					{ step.label }
				</Text>
				<Text
					size="small"
					className="formspress-dashboard__status-count"
				>
					{ formatNumber( step.visitors ) }
					{ step.dropoff > 0 && (
						<span style={ { color: '#d63638', marginLeft: 8 } }>
							{ '−' + formatPercent( step.dropoff ) }
						</span>
					) }
				</Text>
			</div>
			<div className="formspress-dashboard__status-track">
				<span
					className="formspress-dashboard__status-fill"
					style={ {
						backgroundColor: 'var(--wp-admin-theme-color, #3858e9)',
						width: `${ pct }%`,
					} }
				/>
			</div>
		</div>
	);
};

const RANGE_OPTIONS = [
	{ value: '7', label: __( '7d', 'flowforms' ) },
	{ value: '14', label: __( '14d', 'flowforms' ) },
	{ value: '30', label: __( '30d', 'flowforms' ) },
	{ value: '90', label: __( '90d', 'flowforms' ) },
];

const FormAnalyticsPage = () => {
	const { id } = useParams();
	const [ range, setRange ] = useState( '14' );
	const [ data, setData ] = useState( null );
	const [ isLoading, setLoading ] = useState( true );
	const [ error, setError ] = useState( null );

	const fetchData = useCallback( () => {
		setLoading( true );
		setError( null );
		get( formAnalytics( id ), { range } )
			.then( ( res ) => setData( res.data ) )
			.catch( ( err ) =>
				setError(
					err.message ||
						__( 'Failed to load analytics.', 'flowforms' )
				)
			)
			.finally( () => setLoading( false ) );
	}, [ id, range ] );

	useEffect( () => {
		fetchData();
	}, [ fetchData ] );

	const funnelMax = useMemo(
		() =>
			Math.max(
				1,
				...( data?.funnel || [] ).map( ( s ) => s.visitors || 0 )
			),
		[ data ]
	);

	const hasVariants = ( data?.variants?.length || 0 ) > 1;

	return (
		<PageHeader
			title={ __( 'Form Analytics', 'flowforms' ) }
			description={ __(
				'Views, starts, completions and funnel drop-off.',
				'flowforms'
			) }
			right={
				<ToggleGroupControl
					value={ range }
					onChange={ ( v ) => setRange( String( v ) ) }
					label={ __( 'Range', 'flowforms' ) }
					hideLabelFromVision
					isBlock
					__nextHasNoMarginBottom
				>
					{ RANGE_OPTIONS.map( ( opt ) => (
						<ToggleGroupControlOption
							key={ opt.value }
							value={ opt.value }
							label={ opt.label }
						/>
					) ) }
				</ToggleGroupControl>
			}
		>
			<div className="ff-page__body">
				<div className="formspress-dashboard">
					<Toast
						notice={
							error ? { type: 'error', message: error } : null
						}
						onRemove={ () => setError( null ) }
					/>

					{ isLoading || ! data ? (
						<div className="formspress-dashboard__loading">
							<Spinner />
						</div>
					) : (
						<>
							<div className="formspress-dashboard__kpis">
								<KpiTile
									label={ __( 'Views', 'flowforms' ) }
									value={ formatNumber( data.views ) }
									caption={ sprintf(
										__( 'last %d days', 'flowforms' ),
										data.range
									) }
								/>
								<KpiTile
									label={ __( 'Starts', 'flowforms' ) }
									value={ formatNumber( data.starts ) }
									caption={
										data.views > 0
											? sprintf(
													__(
														'%s of viewers started',
														'flowforms'
													),
													formatPercent(
														( data.starts /
															data.views ) *
															100
													)
											  )
											: __( '—', 'flowforms' )
									}
								/>
								<KpiTile
									label={ __( 'Submissions', 'flowforms' ) }
									value={ formatNumber( data.submits ) }
									caption={ sprintf(
										__( '%s of viewers', 'flowforms' ),
										formatPercent(
											data.view_to_submit_rate
										)
									) }
								/>
								<KpiTile
									label={ __(
										'Completion rate',
										'flowforms'
									) }
									value={ formatPercent(
										data.completion_rate
									) }
									caption={ __(
										'submits ÷ starts',
										'flowforms'
									) }
								/>
							</div>

							<div className="formspress-dashboard__widgets">
								<Card
									size="small"
									className="formspress-widget formspress-widget--trend"
								>
									<CardHeader>
										<Heading level={ 4 }>
											{ __(
												'Activity over time',
												'flowforms'
											) }
										</Heading>
									</CardHeader>
									<CardBody>
										<StackedAreaChart
											data={ data.by_day }
										/>
									</CardBody>
								</Card>

								<Card
									size="small"
									className="formspress-widget formspress-widget--funnel"
								>
									<CardHeader>
										<HStack
											alignment="center"
											justify="space-between"
										>
											<Heading level={ 4 }>
												{ __( 'Funnel', 'flowforms' ) }
											</Heading>
											<Text variant="muted" size="small">
												{ __(
													'visitors by step + drop-off %',
													'flowforms'
												) }
											</Text>
										</HStack>
									</CardHeader>
									<CardBody>
										{ ! data.funnel?.length ? (
											<Text variant="muted">
												{ __(
													'Not enough data yet.',
													'flowforms'
												) }
											</Text>
										) : (
											<VStack spacing={ 3 }>
												{ data.funnel.map( ( s ) => (
													<FunnelRow
														key={ s.step }
														step={ s }
														max={ funnelMax }
													/>
												) ) }
											</VStack>
										) }
									</CardBody>
								</Card>

								<Card
									size="small"
									className="formspress-widget formspress-widget--referrers"
								>
									<CardHeader>
										<Heading level={ 4 }>
											{ __(
												'Top referrers',
												'flowforms'
											) }
										</Heading>
									</CardHeader>
									<CardBody>
										{ ! data.top_referrers?.length ? (
											<Text variant="muted">
												{ __(
													'No referrers yet.',
													'flowforms'
												) }
											</Text>
										) : (
											<VStack spacing={ 2 }>
												{ data.top_referrers.map(
													( r ) => (
														<HStack
															key={ r.referrer }
															alignment="center"
															justify="space-between"
														>
															<Text
																size="small"
																style={ {
																	wordBreak:
																		'break-all',
																} }
															>
																{ r.referrer }
															</Text>
															<Text
																size="small"
																variant="muted"
															>
																{ formatNumber(
																	r.count
																) }
															</Text>
														</HStack>
													)
												) }
											</VStack>
										) }
									</CardBody>
								</Card>

								{ data.top_countries?.length > 0 && (
									<Card
										size="small"
										className="formspress-widget formspress-widget--countries"
									>
										<CardHeader>
											<Heading level={ 4 }>
												{ __(
													'Top countries',
													'flowforms'
												) }
											</Heading>
										</CardHeader>
										<CardBody>
											<VStack spacing={ 2 }>
												{ data.top_countries.map(
													( c ) => (
														<HStack
															key={
																c.country_code
															}
															alignment="center"
															justify="space-between"
														>
															<Text size="small">
																{
																	c.country_code
																}
															</Text>
															<Text
																size="small"
																variant="muted"
															>
																{ formatNumber(
																	c.count
																) }
															</Text>
														</HStack>
													)
												) }
											</VStack>
										</CardBody>
									</Card>
								) }

								{ hasVariants && (
									<Card
										size="small"
										className="formspress-widget formspress-widget--variants"
									>
										<CardHeader>
											<Heading level={ 4 }>
												{ __(
													'A/B variants',
													'flowforms'
												) }
											</Heading>
										</CardHeader>
										<CardBody>
											<VStack spacing={ 3 }>
												{ data.variants.map( ( v ) => (
													<div
														key={ v.variant_id }
														className="formspress-dashboard__status-row"
													>
														<div className="formspress-dashboard__status-meta">
															<Text
																size="small"
																className="formspress-dashboard__status-label"
															>
																{ v.variant_id }
															</Text>
															<Text
																size="small"
																className="formspress-dashboard__status-count"
															>
																{ formatPercent(
																	v.rate
																) }{ ' ' }
																·{ ' ' }
																{ formatNumber(
																	v.submits
																) }{ ' ' }
																/{ ' ' }
																{ formatNumber(
																	v.views
																) }
															</Text>
														</div>
														<div className="formspress-dashboard__status-track">
															<span
																className="formspress-dashboard__status-fill"
																style={ {
																	backgroundColor:
																		'var(--wp-admin-theme-color, #3858e9)',
																	width: `${ Math.min(
																		100,
																		v.rate
																	) }%`,
																} }
															/>
														</div>
													</div>
												) ) }
											</VStack>
											<Button
												variant="tertiary"
												onClick={ fetchData }
												style={ { marginTop: 12 } }
											>
												{ __( 'Refresh', 'flowforms' ) }
											</Button>
										</CardBody>
									</Card>
								) }
							</div>
						</>
					) }
				</div>
			</div>
		</PageHeader>
	);
};

export default FormAnalyticsPage;
