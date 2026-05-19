import { useState, useEffect, useMemo } from '@wordpress/element';
import { Spinner, ExternalLink } from '@wordpress/components';
import { DataViews } from '@wordpress/dataviews';
import { __ } from '@wordpress/i18n';
import { useNavigate } from 'react-router-dom';
import PageHeader from '../../components/PageHeader';
import Badge from '../../components/Badge';
import Toast from '../../components/Toast';
import { get } from '../../api/client';
import { INTEGRATIONS } from '../../api/endpoints';

const CATEGORY_LABELS = {
	'email-marketing': __( 'Email marketing', 'flowforms' ),
	crm: __( 'CRM', 'flowforms' ),
	payment: __( 'Payments', 'flowforms' ),
	developer: __( 'Developer', 'flowforms' ),
};

const STATUS_LABELS = {
	active: __( 'Active', 'flowforms' ),
	inactive: __( 'Inactive', 'flowforms' ),
};

const DEFAULT_LOGO_SRC = `${
	window.flowFormsData?.pluginUrl || ''
}assets/images/logo.svg`;

const DEFAULT_GRID_PREVIEW_SIZE = 350;

const IntegrationMedia = ( { item } ) => {
	if ( item.icon_svg ) {
		return (
			<div className="formspress-integration-media" aria-hidden="true">
				<span
					className="formspress-integration-logo formspress-integration-logo--svg"
					dangerouslySetInnerHTML={ { __html: item.icon_svg } }
				/>
			</div>
		);
	}

	return (
		<div className="formspress-integration-media" aria-hidden="true">
			<img
				className="formspress-integration-logo formspress-integration-logo--default"
				src={ DEFAULT_LOGO_SRC }
				alt=""
			/>
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
	fields: [ 'category', 'status' ],
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
				// DataViews wants `title`; the API ships `label`. We also
				// surface `status` as a derived string so it can be filtered.
				setList(
					raw.map( ( i ) => ( {
						...i,
						title: i.label || i.id,
						status: i.active ? 'active' : 'inactive',
					} ) )
				);
			} )
			.catch( () =>
				setError( __( 'Could not load integrations.', 'flowforms' ) )
			);
	}, [] );

	// Client-side filter + search (the full integrations list is small,
	// no need for server pagination).
	const filtered = useMemo( () => {
		if ( ! list ) return [];
		const search = ( view.search || '' ).trim().toLowerCase();
		const catF = view.filters?.find( ( f ) => 'category' === f.field );
		const statusF = view.filters?.find( ( f ) => 'status' === f.field );
		return list.filter( ( i ) => {
			if ( catF?.value && i.category !== catF.value ) return false;
			if ( statusF?.value && i.status !== statusF.value ) return false;
			if ( search ) {
				const hay = `${ i.title } ${ i.description || '' } ${
					i.category || ''
				}`.toLowerCase();
				if ( ! hay.includes( search ) ) return false;
			}
			return true;
		} );
	}, [ list, view.search, view.filters ] );

	const fields = useMemo(
		() => [
			{
				id: 'title',
				label: __( 'Name', 'flowforms' ),
				enableGlobalSearch: true,
				enableSorting: true,
			},
			{
				id: 'media',
				label: __( 'Logo', 'flowforms' ),
				render: ( { item } ) => <IntegrationMedia item={ item } />,
			},
			{
				id: 'description',
				label: __( 'Description', 'flowforms' ),
				enableGlobalSearch: true,
				render: ( { item } ) => (
					<div className="formspress-integration-desc">
						<p>{ item.description }</p>
						{ item.docs && (
							<ExternalLink href={ item.docs }>
								{ __( 'Documentation', 'flowforms' ) }
							</ExternalLink>
						) }
					</div>
				),
			},
			{
				id: 'category',
				label: __( 'Category', 'flowforms' ),
				filterBy: { operators: [ 'is' ] },
				elements: Object.entries( CATEGORY_LABELS ).map(
					( [ value, label ] ) => ( { value, label } )
				),
				render: ( { item } ) => (
					<Badge>
						{ CATEGORY_LABELS[ item.category ] || item.category }
					</Badge>
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
							'active' === item.status ? 'success' : 'default'
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
				id: 'configure',
				label: __( 'Configure', 'flowforms' ),
				isPrimary: true,
				isEligible: ( item ) => !! item.settings,
				callback: ( items ) => {
					const t = items?.[ 0 ];
					if ( t?.settings ) navigate( t.settings );
				},
			},
			{
				id: 'docs',
				label: __( 'Documentation', 'flowforms' ),
				isEligible: ( item ) => !! item.docs,
				callback: ( items ) => {
					const t = items?.[ 0 ];
					if ( t?.docs )
						window.open( t.docs, '_blank', 'noopener,noreferrer' );
				},
			},
		],
		[ navigate ]
	);

	if ( null === list && ! error ) {
		return (
			<div className="ff-page ff-page--loading">
				<Spinner />
			</div>
		);
	}

	const paginationInfo = {
		totalItems: filtered.length,
		totalPages: Math.max( 1, Math.ceil( filtered.length / view.perPage ) ),
	};

	return (
		<PageHeader
			className="ff-page ff-page--dataviews"
			title={ __( 'Integrations', 'flowforms' ) }
			description={ __(
				'Connect FormsPress to your email marketing, CRM and payment stack.',
				'flowforms'
			) }
		>
			<div className="ff-page__body">
				<Toast
					notice={ error ? { type: 'error', message: error } : null }
					onRemove={ () => setError( null ) }
				/>
				<div className="ff-dataviews-container ff-integrations-dataviews">
					<DataViews
						data={ filtered }
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
							if ( item.settings ) navigate( item.settings );
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
