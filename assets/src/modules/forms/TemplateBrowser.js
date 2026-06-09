import { useState, useEffect, useMemo } from '@wordpress/element';
import {
	Modal,
	Button,
	Spinner,
	__experimentalVStack as VStack,
	__experimentalText as Text,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { Icon, external, lock, plus } from '@wordpress/icons';
import { useNavigate } from 'react-router-dom';
import Toast from '../../components/Toast';
import { DataViews, filterSortAndPaginate } from '@wordpress/dataviews';
import { get, post } from '../../api/client';
import { FORMS, TEMPLATES, templateCreate } from '../../api/endpoints';
import { resolveIcon } from './icons';
import { TemplatePreview } from './FormTemplatesPage';

const CATEGORIES = [
	{ id: 'all', label: __( 'All templates', 'formspress' ) },
	{ id: 'blank', label: __( 'Blank', 'formspress' ) },
	{ id: 'contact', label: __( 'Contact', 'formspress' ) },
	{ id: 'lead-gen', label: __( 'Lead generation', 'formspress' ) },
	{ id: 'survey', label: __( 'Survey', 'formspress' ) },
	{ id: 'feedback', label: __( 'Feedback', 'formspress' ) },
	{ id: 'event', label: __( 'Event', 'formspress' ) },
	{ id: 'other', label: __( 'Other', 'formspress' ) },
	{ id: 'user', label: __( 'My templates', 'formspress' ) },
];

const TYPE_LABELS = {
	standard: __( 'Standard', 'formspress' ),
	flow: __( 'Flow', 'formspress' ),
};

const TEMPLATE_VIEW = {
	type: 'grid',
	page: 1,
	perPage: 12,
	search: '',
	filters: [],
	titleField: 'title',
	descriptionField: 'description',
	mediaField: 'preview',
	fields: [ 'type', 'categoryFilter' ],
	layout: {
		previewSize: 290,
	},
};

const CATEGORY_FILTERS = CATEGORIES.filter(
	( category ) => 'all' !== category.id
);

const FlowLockModal = ( { onClose } ) => (
	<Modal
		onRequestClose={ onClose }
		className="ff-flow-lock-modal"
		title={ __( 'Flow forms are a Pro feature', 'formspress' ) }
		shouldCloseOnClickOutside
	>
		<VStack spacing={ 4 } className="ff-flow-lock-modal__content">
			<Icon icon={ lock } size={ 22 } className="ff-flow-lock-modal__icon" />
			<Text variant="muted" size="small">
				{ __(
					'Upgrade to FormsPress Pro to create conversational, one-question-at-a-time flow forms.',
					'formspress'
				) }
			</Text>
			<Button
				variant="primary"
				href="https://example.com/formspress-pro"
				target="_blank"
				rel="noreferrer"
				icon={ external }
				className="ff-flow-lock-modal__button"
			>
				{ __( 'Upgrade to Pro', 'formspress' ) }
			</Button>
		</VStack>
	</Modal>
);

const TemplateBrowser = ( { onClose } ) => {
	const navigate = useNavigate();
	const [ builtIn, setBuiltIn ] = useState( [] );
	const [ user, setUser ] = useState( [] );
	const [ isLoading, setLoading ] = useState( true );
	const [ error, setError ] = useState( null );
	const [ view, setView ] = useState( TEMPLATE_VIEW );
	const [ busyId, setBusyId ] = useState( null );
	const [ showFlowLock, setShowFlowLock ] = useState( false );
	const canUseFlowForms = !! window.flowFormsData?.pro?.active;

	const loadTemplates = () => {
		setLoading( true );
		get( TEMPLATES )
			.then( ( res ) => {
				setBuiltIn( res.data?.built_in || [] );
				setUser( res.data?.user || [] );
				setError( null );
			} )
			.catch( ( e ) =>
				setError(
					e.message || __( 'Failed to load templates.', 'formspress' )
				)
			)
			.finally( () => setLoading( false ) );
	};

	useEffect( () => {
		loadTemplates();
	}, [] );

	const templates = useMemo( () => {
		const categories = new Map(
			CATEGORIES.map( ( category ) => [ category.id, category.label ] )
		);
		const normalize = ( template, source ) => {
			const icon = resolveIcon( template.icon );

			return {
				...template,
				id: String( template.id ),
				title: template.label || template.title || template.id,
				source,
				categoryFilter:
					'user' === source ? 'user' : template.category || 'other',
				categoryLabel:
					'user' === source
						? __( 'My templates', 'formspress' )
						: categories.get( template.category ) ||
						  __( 'Other', 'formspress' ),
				iconPreview: (
					<span className="ff-template-browser__icon-preview">
						{ icon && <Icon icon={ icon } size={ 24 } /> }
					</span>
				),
			};
		};

		return [
			{
				id: '__blank_standard',
				title: __( 'Blank standard form', 'formspress' ),
				description: __(
					'Start from an empty standard form.',
					'formspress'
				),
				type: 'standard',
				category: 'blank',
				categoryFilter: 'blank',
				categoryLabel: __( 'Blank', 'formspress' ),
				source: 'blank',
				iconPreview: (
					<span className="ff-template-browser__icon-preview">
						<Icon icon={ plus } size={ 24 } />
					</span>
				),
			},
			{
				id: '__blank_flow',
				title: __( 'Blank flow form', 'formspress' ),
				description: __(
					'Start from an empty conversational flow form.',
					'formspress'
				),
				type: 'flow',
				category: 'blank',
				categoryFilter: 'blank',
				categoryLabel: __( 'Blank', 'formspress' ),
				source: 'blank',
				iconPreview: (
					<span className="ff-template-browser__icon-preview">
						<Icon
							icon={ canUseFlowForms ? plus : lock }
							size={ 24 }
						/>
					</span>
				),
			},
			...builtIn.map( ( template ) => normalize( template, 'built_in' ) ),
			...user.map( ( template ) => normalize( template, 'user' ) ),
		];
	}, [ builtIn, user, canUseFlowForms ] );

	const fields = useMemo(
		() => [
			{
				id: 'title',
				label: __( 'Template', 'formspress' ),
				enableGlobalSearch: true,
				enableSorting: true,
			},
			{
				id: 'description',
				label: __( 'Description', 'formspress' ),
				enableGlobalSearch: true,
			},
			{
				id: 'type',
				label: __( 'Template type', 'formspress' ),
				filterBy: { operators: [ 'isAny' ], isPrimary: true },
				elements: Object.entries( TYPE_LABELS ).map(
					( [ value, label ] ) => ( { value, label } )
				),
				render: ( { item } ) => (
					<span
						className={ `ff-template-browser__type ff-template-browser__type--${ item.type }` }
					>
						{ TYPE_LABELS[ item.type ] || item.type }
					</span>
				),
			},
			{
				id: 'categoryFilter',
				label: __( 'Category', 'formspress' ),
				filterBy: { operators: [ 'isAny' ], isPrimary: true },
				elements: CATEGORY_FILTERS.map( ( category ) => ( {
					value: category.id,
					label: category.label,
				} ) ),
				render: ( { item } ) => item.categoryLabel,
			},
			{
				id: 'iconPreview',
				label: __( 'Icon', 'formspress' ),
				render: ( { item } ) => item.iconPreview,
			},
			{
				id: 'preview',
				label: __( 'Preview', 'formspress' ),
				render: ( { item } ) =>
					'blank' === item.source ? (
						<span className="ff-template-browser__blank-preview">
							{ item.iconPreview }
						</span>
					) : (
						<TemplatePreview item={ item } />
					),
			},
		],
		[]
	);

	const { data: shownTemplates, paginationInfo } = useMemo(
		() => filterSortAndPaginate( templates, view, fields ),
		[ templates, view, fields ]
	);

	const handleUse = async ( template ) => {
		if ( 'blank' === template.source ) {
			await handleBlank( template.type );
			return;
		}

		if ( 'flow' === template.type && ! canUseFlowForms ) {
			setShowFlowLock( true );
			return;
		}

		setBusyId( template.id );
		try {
			const res = await post( templateCreate( template.id ), {} );
			onClose();
			navigate( `/forms/${ res.data.id }/edit` );
		} catch ( e ) {
			setError(
				e.message || __( 'Failed to create form.', 'formspress' )
			);
		} finally {
			setBusyId( null );
		}
	};

	const handleBlank = async ( type ) => {
		if ( 'flow' === type && ! canUseFlowForms ) {
			setShowFlowLock( true );
			return;
		}

		setBusyId( '__blank_' + type );
		try {
			const title =
				type === 'flow'
					? __( 'Untitled flow form', 'formspress' )
					: __( 'Untitled form', 'formspress' );
			const res = await post( FORMS, { title, type, status: 'draft' } );
			onClose();
			navigate( `/forms/${ res.data.id }/edit` );
		} catch ( e ) {
			setError(
				e.message || __( 'Failed to create form.', 'formspress' )
			);
		} finally {
			setBusyId( null );
		}
	};

	const actions = useMemo(
		() => [
			{
				id: 'use',
				label: __( 'Use template', 'formspress' ),
				isPrimary: true,
				callback: ( items ) => {
					const template = items?.[ 0 ];
					if ( template ) {
						handleUse( template );
					}
				},
			},
		],
		[ handleUse ]
	);

	return (
		<Modal
			title={ __( 'Choose a template', 'formspress' ) }
			onRequestClose={ onClose }
			size="large"
			className="ff-template-browser-modal"
		>
			<Toast
				notice={ error ? { type: 'error', message: error } : null }
				onRemove={ () => setError( null ) }
			/>

			<div className="ff-template-browser">
				<div className="ff-template-browser__main">
						{ isLoading ? (
							<div className="ff-template-browser__loading">
								<Spinner />
							</div>
						) : (
							<DataViews
								data={ shownTemplates }
								fields={ fields }
								view={ view }
								onChangeView={ setView }
							actions={ actions }
							defaultLayouts={ { grid: {}, table: {} } }
							paginationInfo={ paginationInfo }
							getItemId={ ( item ) => item.id }
							onClickItem={ handleUse }
							isLoading={ !! busyId }
						/>
					) }
				</div>
			</div>
			{ showFlowLock && (
				<FlowLockModal onClose={ () => setShowFlowLock( false ) } />
			) }
		</Modal>
	);
};

export default TemplateBrowser;
