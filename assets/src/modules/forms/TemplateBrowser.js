import { useState, useEffect, useMemo } from '@wordpress/element';
import {
	Modal,
	Button,
	Spinner,
	SearchControl,
	DropdownMenu,
	__experimentalVStack as VStack,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { Icon, plus, moreVertical, trash } from '@wordpress/icons';
import { useNavigate } from 'react-router-dom';
import Toast from '../../components/Toast';
import { get, post, del } from '../../api/client';
import {
	FORMS,
	TEMPLATES,
	template as templateEndpoint,
	templateCreate,
} from '../../api/endpoints';
import { resolveIcon } from './icons';

const CATEGORIES = [
	{ id: 'all', label: __( 'All templates', 'flowforms' ) },
	{ id: 'contact', label: __( 'Contact', 'flowforms' ) },
	{ id: 'lead-gen', label: __( 'Lead generation', 'flowforms' ) },
	{ id: 'survey', label: __( 'Survey', 'flowforms' ) },
	{ id: 'feedback', label: __( 'Feedback', 'flowforms' ) },
	{ id: 'event', label: __( 'Event', 'flowforms' ) },
	{ id: 'other', label: __( 'Other', 'flowforms' ) },
	{ id: 'user', label: __( 'My templates', 'flowforms' ) },
];

const TYPE_LABELS = {
	standard: __( 'Standard', 'flowforms' ),
	flow: __( 'Flow', 'flowforms' ),
};

const TemplateCard = ( { template, onUse, onDelete, isBusy } ) => {
	const icon = resolveIcon( template.icon );

	return (
		<div className="ff-template-card">
			<div className="ff-template-card__head">
				<span className="ff-template-card__icon">
					{ icon && <Icon icon={ icon } size={ 20 } /> }
				</span>
				<span
					className={ `ff-template-card__type-badge ff-template-card__type-badge--${ template.type }` }
				>
					{ TYPE_LABELS[ template.type ] || template.type }
				</span>
				{ template.is_user && onDelete && (
					<span
						className="ff-template-card__menu"
						onClick={ ( e ) => e.stopPropagation() }
					>
						<DropdownMenu
							icon={ moreVertical }
							label={ __( 'Template options', 'flowforms' ) }
							controls={ [
								{
									title: __( 'Delete', 'flowforms' ),
									icon: trash,
									onClick: () => onDelete( template ),
								},
							] }
							toggleProps={ { size: 'small' } }
						/>
					</span>
				) }
			</div>
			<h3 className="ff-template-card__label">{ template.label }</h3>
			{ template.description && (
				<p className="ff-template-card__desc">
					{ template.description }
				</p>
			) }
			<div className="ff-template-card__footer">
				<Button
					variant="secondary"
					onClick={ () => onUse( template ) }
					isBusy={ isBusy }
					disabled={ isBusy }
					__next40pxDefaultSize
				>
					{ __( 'Use template', 'flowforms' ) }
				</Button>
			</div>
		</div>
	);
};

const BlankCard = ( { onPick, isBusy } ) => (
	<div className="ff-template-card ff-template-card--blank">
		<div className="ff-template-card__head">
			<span className="ff-template-card__icon">
				<Icon icon={ plus } size={ 20 } />
			</span>
		</div>
		<h3 className="ff-template-card__label">
			{ __( 'Start from blank', 'flowforms' ) }
		</h3>
		<p className="ff-template-card__desc">
			{ __( 'Pick a form type and build it from scratch.', 'flowforms' ) }
		</p>
		<div className="ff-template-card__footer">
			<VStack spacing={ 2 }>
				<Button
					variant="secondary"
					onClick={ () => onPick( 'standard' ) }
					isBusy={ isBusy }
					disabled={ isBusy }
					__next40pxDefaultSize
				>
					{ __( 'Blank standard form', 'flowforms' ) }
				</Button>
				<Button
					variant="secondary"
					onClick={ () => onPick( 'flow' ) }
					isBusy={ isBusy }
					disabled={ isBusy }
					__next40pxDefaultSize
				>
					{ __( 'Blank flow form', 'flowforms' ) }
				</Button>
			</VStack>
		</div>
	</div>
);

const TemplateBrowser = ( { onClose } ) => {
	const navigate = useNavigate();
	const [ builtIn, setBuiltIn ] = useState( [] );
	const [ user, setUser ] = useState( [] );
	const [ isLoading, setLoading ] = useState( true );
	const [ error, setError ] = useState( null );
	const [ category, setCategory ] = useState( 'all' );
	const [ search, setSearch ] = useState( '' );
	const [ busyId, setBusyId ] = useState( null );

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
					e.message || __( 'Failed to load templates.', 'flowforms' )
				)
			)
			.finally( () => setLoading( false ) );
	};

	useEffect( () => {
		loadTemplates();
	}, [] );

	const filtered = useMemo( () => {
		let pool = [];
		if ( 'user' === category ) {
			pool = user;
		} else if ( 'all' === category ) {
			pool = [ ...builtIn, ...user ];
		} else {
			pool = builtIn.filter( ( t ) => t.category === category );
		}

		const q = search.trim().toLowerCase();
		if ( q ) {
			pool = pool.filter(
				( t ) =>
					( t.label || '' ).toLowerCase().includes( q ) ||
					( t.description || '' ).toLowerCase().includes( q )
			);
		}

		return pool;
	}, [ builtIn, user, category, search ] );

	const handleUse = async ( template ) => {
		setBusyId( template.id );
		try {
			const res = await post( templateCreate( template.id ), {} );
			onClose();
			navigate( `/forms/${ res.data.id }/edit` );
		} catch ( e ) {
			setError(
				e.message || __( 'Failed to create form.', 'flowforms' )
			);
		} finally {
			setBusyId( null );
		}
	};

	const handleBlank = async ( type ) => {
		setBusyId( '__blank_' + type );
		try {
			const title =
				type === 'flow'
					? __( 'Untitled flow form', 'flowforms' )
					: __( 'Untitled form', 'flowforms' );
			const res = await post( FORMS, { title, type, status: 'draft' } );
			onClose();
			navigate( `/forms/${ res.data.id }/edit` );
		} catch ( e ) {
			setError(
				e.message || __( 'Failed to create form.', 'flowforms' )
			);
		} finally {
			setBusyId( null );
		}
	};

	const handleDelete = async ( tpl ) => {
		// eslint-disable-next-line no-alert
		if (
			! window.confirm(
				__(
					'Delete this template? This cannot be undone.',
					'flowforms'
				)
			)
		)
			return;
		try {
			await del( templateEndpoint( tpl.id ) );
			setUser( ( prev ) => prev.filter( ( t ) => t.id !== tpl.id ) );
		} catch ( e ) {
			setError(
				e.message || __( 'Failed to delete template.', 'flowforms' )
			);
		}
	};

	return (
		<Modal
			title={ __( 'Choose a template', 'flowforms' ) }
			onRequestClose={ onClose }
			size="large"
			className="ff-template-browser-modal"
		>
			<Toast
				notice={ error ? { type: 'error', message: error } : null }
				onRemove={ () => setError( null ) }
			/>

			<div className="ff-template-browser">
				<aside className="ff-template-browser__sidebar">
					<div className="ff-template-browser__search">
						<SearchControl
							__nextHasNoMarginBottom
							value={ search }
							onChange={ setSearch }
							placeholder={ __(
								'Search templates',
								'flowforms'
							) }
						/>
					</div>
					<ul className="ff-template-browser__cats">
						{ CATEGORIES.map( ( cat ) => (
							<li key={ cat.id }>
								<button
									type="button"
									className={ `ff-template-browser__cat${
										category === cat.id ? ' is-active' : ''
									}` }
									onClick={ () => setCategory( cat.id ) }
								>
									{ cat.label }
								</button>
							</li>
						) ) }
					</ul>
				</aside>

				<div className="ff-template-browser__main">
					{ isLoading ? (
						<div className="ff-template-browser__loading">
							<Spinner />
						</div>
					) : (
						<div className="ff-template-browser__grid">
							{ 'all' === category && '' === search && (
								<BlankCard
									onPick={ handleBlank }
									isBusy={ !! busyId }
								/>
							) }
							{ filtered.map( ( tpl ) => (
								<TemplateCard
									key={ tpl.id }
									template={ tpl }
									onUse={ handleUse }
									onDelete={
										tpl.is_user ? handleDelete : null
									}
									isBusy={ busyId === tpl.id }
								/>
							) ) }
							{ filtered.length === 0 && 'all' !== category && (
								<p className="ff-template-browser__empty">
									{ __(
										'No templates in this category yet.',
										'flowforms'
									) }
								</p>
							) }
						</div>
					) }
				</div>
			</div>
		</Modal>
	);
};

export default TemplateBrowser;
