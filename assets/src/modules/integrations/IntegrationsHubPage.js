import { useState, useEffect, useMemo } from '@wordpress/element';
import { Spinner, ExternalLink } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { Icon, lock } from '@wordpress/icons';
import { useNavigate } from 'react-router-dom';
import PageHeader from '../../components/PageHeader';
import Badge from '../../components/Badge';
import Toast from '../../components/Toast';
import { DataViews, filterSortAndPaginate } from '@wordpress/dataviews';
import { get } from '../../api/client';
import { INTEGRATIONS } from '../../api/endpoints';

const CATEGORY_LABELS = {
	notification: __( 'Notifications', 'formspress' ),
	workflow: __( 'Workflow', 'formspress' ),
	'email-marketing': __( 'Email marketing', 'formspress' ),
	crm: __( 'CRM', 'formspress' ),
	payment: __( 'Payments', 'formspress' ),
};

const PLAN_LABELS = {
	free: __( 'Free', 'formspress' ),
	pro: __( 'Pro', 'formspress' ),
};

const DEFAULT_LOGO_SRC = `${
	window.flowFormsData?.pluginUrl || ''
}assets/images/logo.svg`;

const DEFAULT_GRID_PREVIEW_SIZE = 350;

const UPGRADE_URL = 'https://example.com/formspress-pro';

const PlanBadge = ( { item } ) => {
	if ( item.plan === 'pro' ) {
		return (
			<span
				className={ `formspress-integration-plan formspress-integration-plan--pro${
					item.locked ? ' is-locked' : ''
				}` }
			>
				{ item.locked && <Icon icon={ lock } size={ 14 } /> }
				{ PLAN_LABELS.pro }
			</span>
		);
	}

	return (
		<span className="formspress-integration-plan formspress-integration-plan--free">
			{ PLAN_LABELS.free }
		</span>
	);
};

const IntegrationMedia = ( { item } ) => {
	return (
		<div
			className={ `formspress-integration-media${
				item.locked ? ' formspress-integration-media--locked' : ''
			}` }
			aria-hidden="true"
		>
			{ item.plan === 'pro' && <PlanBadge item={ item } /> }
			{ item.icon_svg ? (
				<span
					className="formspress-integration-logo formspress-integration-logo--svg"
					dangerouslySetInnerHTML={ { __html: item.icon_svg } }
				/>
			) : (
				<img
					className="formspress-integration-logo formspress-integration-logo--default"
					src={ DEFAULT_LOGO_SRC }
					alt=""
				/>
			) }
		</div>
	);
};

const DEFAULT_VIEW = {
	type: 'grid',
	page: 1,
	perPage: 12,
	search: '',
	filters: [],
	titleField: 'title',
	mediaField: 'media',
	descriptionField: 'description',
	fields: [ 'plan', 'category' ],
	layout: {
		previewSize: DEFAULT_GRID_PREVIEW_SIZE,
	},
};

const IntegrationsHubPage = () => {
	const navigate = useNavigate();
	const [ list, setList ] = useState( null );
	const [ error, setError ] = useState( null );
	const [ view, setView ] = useState( DEFAULT_VIEW );

	useEffect( () => {
		get( INTEGRATIONS )
			.then( ( res ) => {
				const raw = Array.isArray( res?.data ) ? res.data : [];
				// DataViews wants `title`; the API ships `label`.
				setList(
					raw.map( ( i ) => ( {
						...i,
						title: i.label || i.id,
						plan: i.plan || ( i.pro_feature ? 'pro' : 'free' ),
						locked: !! i.locked,
					} ) )
				);
			} )
			.catch( () =>
				setError( __( 'Could not load integrations.', 'formspress' ) )
			);
	}, [] );

	const fields = useMemo(
		() => [
			{
				id: 'title',
				label: __( 'Name', 'formspress' ),
				enableGlobalSearch: true,
				enableSorting: true,
			},
			{
				id: 'media',
				label: __( 'Logo', 'formspress' ),
				render: ( { item } ) => <IntegrationMedia item={ item } />,
			},
			{
				id: 'description',
				label: __( 'Description', 'formspress' ),
				enableGlobalSearch: true,
				render: ( { item } ) => (
					<div className="formspress-integration-desc">
						<p>{ item.description }</p>
						{ item.locked && (
							<p className="formspress-integration-desc__locked">
								{ __(
									'Available as a Pro submission action.',
									'formspress'
								) }
							</p>
						) }
						{ item.docs && ! item.locked && (
							<ExternalLink href={ item.docs }>
								{ __( 'Documentation', 'formspress' ) }
							</ExternalLink>
						) }
					</div>
				),
			},
			{
				id: 'plan',
				label: __( 'Plan', 'formspress' ),
				filterBy: { operators: [ 'isAny' ] },
				elements: Object.entries( PLAN_LABELS ).map(
					( [ value, label ] ) => ( { value, label } )
				),
				render: ( { item } ) => <PlanBadge item={ item } />,
			},
			{
				id: 'category',
				label: __( 'Category', 'formspress' ),
				filterBy: { operators: [ 'isAny' ] },
				elements: Object.entries( CATEGORY_LABELS ).map(
					( [ value, label ] ) => ( { value, label } )
				),
				render: ( { item } ) => (
					<Badge>
						{ CATEGORY_LABELS[ item.category ] || item.category }
					</Badge>
				),
			},
		],
		[]
	);

	const actions = useMemo(
		() => [
			{
				id: 'configure',
				label: __( 'Configure', 'formspress' ),
				isPrimary: true,
				isEligible: ( item ) => !! item.settings && ! item.locked,
				callback: ( items ) => {
					const t = items?.[ 0 ];
					if ( t?.settings ) navigate( t.settings );
				},
			},
			{
				id: 'upgrade',
				label: __( 'Upgrade to Pro', 'formspress' ),
				isPrimary: true,
				isEligible: ( item ) => !! item.locked,
				callback: () => {
					window.open( UPGRADE_URL, '_blank', 'noopener,noreferrer' );
				},
			},
			{
				id: 'docs',
				label: __( 'Documentation', 'formspress' ),
				isEligible: ( item ) => !! item.docs && ! item.locked,
				callback: ( items ) => {
					const t = items?.[ 0 ];
					if ( t?.docs )
						window.open( t.docs, '_blank', 'noopener,noreferrer' );
				},
			},
		],
		[ navigate ]
	);

	const { data: shownIntegrations, paginationInfo } = useMemo(
		() => filterSortAndPaginate( list || [], view, fields ),
		[ list, view, fields ]
	);

	if ( null === list && ! error ) {
		return (
			<div className="ff-page ff-page--loading">
				<Spinner />
			</div>
		);
	}

	return (
		<PageHeader
			className="ff-page ff-page--dataviews"
			title={ __( 'Integrations', 'formspress' ) }
			description={ __(
				'Submission actions you can add to forms. Free includes email notifications; Pro unlocks redirects, webhooks, payments, and marketing integrations.',
				'formspress'
			) }
		>
			<div className="ff-page__body">
				<Toast
					notice={ error ? { type: 'error', message: error } : null }
					onRemove={ () => setError( null ) }
				/>
				<div className="ff-dataviews-container ff-integrations-dataviews">
					<DataViews
						data={ shownIntegrations }
						fields={ fields }
						view={ view }
						onChangeView={ setView }
						actions={ actions }
						defaultLayouts={ {
							grid: {
								layout: {
									previewSize: DEFAULT_GRID_PREVIEW_SIZE,
								},
							},
							table: {},
						} }
						paginationInfo={ paginationInfo }
						getItemId={ ( item ) => item.id }
						onClickItem={ ( item ) => {
							if ( item.locked )
								window.open(
									UPGRADE_URL,
									'_blank',
									'noopener,noreferrer'
								);
							else if ( item.settings ) navigate( item.settings );
							else if ( item.docs )
								window.open(
									item.docs,
									'_blank',
									'noopener,noreferrer'
								);
						} }
					/>
				</div>
			</div>
		</PageHeader>
	);
};

export default IntegrationsHubPage;
