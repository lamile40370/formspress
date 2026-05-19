import { useState, useEffect } from '@wordpress/element';
import {
	Card,
	CardHeader,
	CardBody,
	Button,
	Spinner,
	__experimentalVStack as VStack,
	__experimentalHStack as HStack,
	__experimentalHeading as Heading,
	__experimentalText as Text,
} from '@wordpress/components';
import { __, sprintf } from '@wordpress/i18n';
import { Link, useNavigate } from 'react-router-dom';
import PageHeader from '../../components/PageHeader';
import Toast from '../../components/Toast';
import { get } from '../../api/client';
import { STATS } from '../../api/endpoints';

const STATUS_COLORS = {
	unread: '#dba617',
	read: '#50575e',
	starred: '#8a6d3b',
	spam: '#d63638',
};

const formatNumber = ( value ) => Number( value || 0 ).toLocaleString();
const formatPercent = ( value ) => `${ Number( value || 0 ).toFixed( 1 ) }%`;

const formatDateTime = ( value ) => {
	if ( ! value ) return '—';
	const date = new Date( value.replace ? value.replace( ' ', 'T' ) : value );
	if ( Number.isNaN( date.getTime() ) ) return value;
	return date.toLocaleString( undefined, {
		month: 'short',
		day: 'numeric',
		hour: '2-digit',
		minute: '2-digit',
	} );
};

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

const DashboardPage = () => {
	const [ stats, setStats ] = useState( null );
	const [ isLoading, setLoading ] = useState( true );
	const [ error, setError ] = useState( null );
	const navigate = useNavigate();

	useEffect( () => {
		get( STATS )
			.then( ( res ) => setStats( res.data ) )
			.catch( ( err ) =>
				setError(
					err.message ||
						__( 'Failed to load dashboard metrics.', 'flowforms' )
				)
			)
			.finally( () => setLoading( false ) );
	}, [] );

	const total = stats?.total_forms || 0;
	const active = stats?.active_forms || 0;
	const totalEntries = stats?.total_entries || 0;
	const unread = stats?.unread_entries || 0;
	const thisWeek = stats?.entries_this_week || 0;
	const lastWeek = stats?.entries_last_week || 0;
	const today = stats?.entries_today || 0;
	const topForms = stats?.top_forms || [];
	const recentEntries = stats?.recent_entries || [];

	const weekDelta =
		lastWeek > 0
			? Math.round( ( ( thisWeek - lastWeek ) / lastWeek ) * 100 )
			: thisWeek > 0
			? 100
			: 0;

	const topFormsMax = Math.max(
		1,
		...topForms.map( ( f ) => Number( f.entries_count ) || 0 )
	);

	return (
		<PageHeader
			title={ __( 'Dashboard', 'flowforms' ) }
			description={ __(
				'Track your forms and submissions activity.',
				'flowforms'
			) }
			hideBack
			right={
				<HStack spacing={ 2 } wrap>
					<Link to="/forms/new" style={ { textDecoration: 'none' } }>
						<Button variant="primary">
							{ __( 'Create Form', 'flowforms' ) }
						</Button>
					</Link>
					<Link to="/forms" style={ { textDecoration: 'none' } }>
						<Button variant="secondary">
							{ __( 'View All Forms', 'flowforms' ) }
						</Button>
					</Link>
				</HStack>
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

					{ isLoading ? (
						<div className="formspress-dashboard__loading">
							<Spinner />
						</div>
					) : (
						<>
							<div className="formspress-dashboard__kpis">
								<KpiTile
									label={ __(
										'Submissions This Week',
										'flowforms'
									) }
									value={ formatNumber( thisWeek ) }
									caption={
										weekDelta === 0
											? __( 'no change', 'flowforms' )
											: sprintf(
													/* translators: %s is the percentage delta vs the previous week */
													__(
														'%s vs last week',
														'flowforms'
													),
													( weekDelta > 0
														? '+'
														: '' ) +
														weekDelta +
														'%'
											  )
									}
								/>
								<KpiTile
									label={ __(
										'Submissions Today',
										'flowforms'
									) }
									value={ formatNumber( today ) }
									caption={ sprintf(
										/* translators: %d is the count of yesterday submissions */
										__( '%d yesterday', 'flowforms' ),
										stats?.entries_yesterday || 0
									) }
								/>
								<KpiTile
									label={ __(
										'Unread Entries',
										'flowforms'
									) }
									value={ formatNumber( unread ) }
									caption={ sprintf(
										/* translators: %d total entries */
										__( '%d total entries', 'flowforms' ),
										totalEntries
									) }
								/>
								<KpiTile
									label={ __( 'Active Forms', 'flowforms' ) }
									value={ `${ formatNumber(
										active
									) } / ${ formatNumber( total ) }` }
									caption={
										total > 0
											? sprintf(
													/* translators: %s is the active forms percentage */
													__(
														'%s active',
														'flowforms'
													),
													formatPercent(
														( active / total ) * 100
													)
											  )
											: __( 'no forms yet', 'flowforms' )
									}
								/>
							</div>

							<div className="formspress-dashboard__widgets">
								<Card
									size="small"
									className="formspress-widget formspress-widget--top-forms"
								>
									<CardHeader>
										<Heading level={ 4 }>
											{ __( 'Top Forms', 'flowforms' ) }
										</Heading>
									</CardHeader>
									<CardBody>
										{ topForms.length === 0 ? (
											<Text variant="muted">
												{ __(
													'No forms yet. Create your first form to start collecting submissions.',
													'flowforms'
												) }
											</Text>
										) : (
											<VStack spacing={ 3 }>
												{ topForms.map( ( form ) => {
													const count =
														Number(
															form.entries_count
														) || 0;
													const pct =
														topFormsMax > 0
															? Math.max(
																	( count /
																		topFormsMax ) *
																		100,
																	3
															  )
															: 0;
													return (
														<div
															key={ form.id }
															className="formspress-dashboard__status-row"
														>
															<div className="formspress-dashboard__status-meta">
																<Text
																	size="small"
																	className="formspress-dashboard__status-label"
																>
																	{ form.title ||
																		__(
																			'(Untitled)',
																			'flowforms'
																		) }
																</Text>
																<Text
																	size="small"
																	className="formspress-dashboard__status-count"
																>
																	{ formatNumber(
																		count
																	) }
																</Text>
															</div>
															<div className="formspress-dashboard__status-track">
																<span
																	className="formspress-dashboard__status-fill"
																	style={ {
																		backgroundColor:
																			'var(--wp-admin-theme-color, #3858e9)',
																		width: `${ pct }%`,
																	} }
																/>
															</div>
														</div>
													);
												} ) }
											</VStack>
										) }
									</CardBody>
								</Card>

								<Card
									size="small"
									className="formspress-widget formspress-widget--recent"
								>
									<CardHeader>
										<HStack
											alignment="center"
											justify="space-between"
										>
											<Heading level={ 4 }>
												{ __(
													'Recent Submissions',
													'flowforms'
												) }
											</Heading>
											<Button
												variant="tertiary"
												size="small"
												onClick={ () =>
													navigate( '/entries' )
												}
											>
												{ __(
													'View all',
													'flowforms'
												) }
											</Button>
										</HStack>
									</CardHeader>
									<CardBody>
										{ recentEntries.length === 0 ? (
											<Text variant="muted">
												{ __(
													'No submissions yet.',
													'flowforms'
												) }
											</Text>
										) : (
											<VStack spacing={ 2 }>
												{ recentEntries.map(
													( entry ) => (
														<div
															key={ entry.id }
															className="formspress-dashboard__list-item"
														>
															<button
																type="button"
																className="formspress-dashboard__list-link"
																onClick={ () =>
																	navigate(
																		`/forms/${ entry.form_id }/entries`
																	)
																}
															>
																<Text
																	size="small"
																	className="formspress-dashboard__list-title"
																>
																	{ entry.form_title ||
																		__(
																			'(Deleted form)',
																			'flowforms'
																		) }
																</Text>
															</button>
															<HStack
																alignment="center"
																justify="space-between"
																spacing={ 2 }
															>
																<Text
																	size="small"
																	variant="muted"
																>
																	{ formatDateTime(
																		entry.created_at
																	) }
																</Text>
																<Text
																	size="small"
																	className="formspress-dashboard__summary-pill"
																	style={ {
																		color:
																			STATUS_COLORS[
																				entry
																					.status
																			] ||
																			'#50575e',
																	} }
																>
																	{
																		entry.status
																	}
																</Text>
															</HStack>
														</div>
													)
												) }
											</VStack>
										) }
									</CardBody>
								</Card>
							</div>
						</>
					) }
				</div>
			</div>
		</PageHeader>
	);
};

export default DashboardPage;
