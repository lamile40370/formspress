import { Button, Icon, useNavigator, Navigator } from '@wordpress/components';
import { useEffect, useMemo } from '@wordpress/element';
import {
	archive,
	code,
	customPostType,
	dashboard,
	download,
	envelope,
	globe,
	inbox,
	layout,
	listView,
	page,
	payment,
	plugins,
	receipt,
	settings as settingsIcon,
	shield,
	search,
	chevronRightSmall,
	chevronLeftSmall,
	tool,
	wordpress,
} from '@wordpress/icons';
import { __ } from '@wordpress/i18n';
import Logo from '../components/Logo';

// dashicon-name → Gutenberg-Icon map. PHP `get_nav_items()` keeps using
// familiar dashicon slugs; we map them to actual Icon components here.
const ICON_MAP = {
	dashboard,
	feedback: customPostType,
	'feedback-alt': customPostType,
	'post-list': receipt,
	'list-view': listView,
	'email-alt': envelope,
	email: envelope,
	'rest-api': code,
	plugins,
	tools: tool,
	'admin-tools': tool,
	'admin-generic': settingsIcon,
	'admin-plugins': plugins,
	download,
	exports: download,
	privacy: shield,
	logs: archive,
	templates: layout,
	forms: customPostType,
	submissions: inbox,
	integrations: plugins,
	settings: settingsIcon,
	page,
	globe,
	receipt,
	shield,
};

const PATH_ICON_MAP = {
	'/': dashboard,
	'/forms': customPostType,
	'/forms/templates': layout,
	'/entries': inbox,
	'/entries/exports': download,
	'/integrations': plugins,
	'/integrations/webhooks': code,
	'/integrations/stripe': payment,
	'/tools': tool,
	'/tools/email-templates': envelope,
	'/tools/logs': listView,
	'/tools/import-export': download,
	'/tools/privacy': shield,
	'/settings': settingsIcon,
	'/settings/forms': customPostType,
	'/settings/spam': shield,
	'/settings/email': envelope,
	'/settings/headless': globe,
};

const resolveIcon = ( item ) => {
	if ( 'string' === typeof item ) return ICON_MAP[ item ] || page;
	return PATH_ICON_MAP[ item?.path ] || ICON_MAP[ item?.icon ] || page;
};

const SIDEBAR_ROUTE_ALIASES = [
	{ from: '/email-templates', to: '/tools/email-templates' },
	{ from: '/webhooks', to: '/integrations/webhooks' },
];

const getSidebarPath = ( path ) => {
	const normalizedPath = String( path || '/' );
	const alias = SIDEBAR_ROUTE_ALIASES.find(
		( item ) =>
			normalizedPath === item.from ||
			normalizedPath.startsWith( item.from + '/' )
	);

	return alias
		? alias.to + normalizedPath.slice( alias.from.length )
		: normalizedPath;
};

const getNavigatorPathForRoute = ( items, path ) => {
	const normalizedPath = getSidebarPath( path );
	const matchingParent = ( items || [] ).find( ( item ) => {
		if ( ! item?.children?.length ) {
			return false;
		}
		if ( item.path === normalizedPath ) {
			return true;
		}
		return item.children.some(
			( child ) =>
				child.path === normalizedPath ||
				normalizedPath.startsWith( child.path + '/' )
		);
	} );

	return matchingParent?.path || '/';
};

const isItemActive = ( item, currentPath ) => {
	if ( ! item ) return false;
	const normalizedPath = getSidebarPath( currentPath );
	if ( item.path === normalizedPath ) return true;
	// "/forms/123/edit" should light up the "Forms" parent even though the
	// path itself isn't a registered nav item.
	if ( '/' !== item.path && normalizedPath.startsWith( item.path + '/' ) )
		return true;
	if ( item.children?.length ) {
		return item.children.some(
			( child ) =>
				child.path === normalizedPath ||
				normalizedPath.startsWith( child.path + '/' )
		);
	}
	return false;
};

const SidebarContent = ( { allItems, currentPath, onNavigate, adminUrl } ) => {
	const { goTo, goBack, location } = useNavigator();
	const navigatorPath = location?.path || '/';
	const sidebarPath = getSidebarPath( currentPath );
	const targetNavigatorPath = useMemo(
		() => getNavigatorPathForRoute( allItems, currentPath ),
		[ allItems, currentPath ]
	);

	useEffect( () => {
		if ( ! targetNavigatorPath || navigatorPath === targetNavigatorPath ) {
			return;
		}
		const currentDepth = navigatorPath
			.split( '/' )
			.filter( Boolean ).length;
		const targetDepth = targetNavigatorPath
			.split( '/' )
			.filter( Boolean ).length;
		goTo( targetNavigatorPath, { isBack: targetDepth < currentDepth } );
	}, [ goTo, navigatorPath, targetNavigatorPath ] );

	const itemsWithChildren = allItems.filter(
		( item ) => item.children?.length
	);
	const dashboardPath =
		allItems.find( ( item ) => item.path === '/' )?.path || '/';
	const activeRootItem =
		allItems.find( ( item ) => isItemActive( item, sidebarPath ) ) ||
		allItems[ 0 ] ||
		null;

	return (
		<>
			{ /* Root screen */ }
			<Navigator.Screen path="/">
				<div className="ff-sidebar__subscreen">
					<div className="ff-sidebar__subscreen-header ff-sidebar__subscreen-header--root">
						<Button
							variant="link"
							className="ff-sidebar__back"
							onClick={ () => {
								window.location.href = adminUrl;
							} }
							icon={ chevronLeftSmall }
							iconSize={ 24 }
							size="compact"
							label={ __( 'Back to WP Admin', 'flowforms' ) }
						/>
						<span className="ff-sidebar__subscreen-title">
							{ activeRootItem?.label ||
								__( 'FormsPress', 'flowforms' ) }
						</span>
					</div>
					{ activeRootItem?.description && (
						<p className="ff-sidebar__subscreen-desc ff-sidebar__subscreen-desc--root">
							{ activeRootItem.description }
						</p>
					) }

					<nav className="ff-sidebar__nav ff-sidebar__nav--root">
						{ allItems.map( ( item ) => {
							const hasChildren = !! item.children?.length;
							const isActive = isItemActive( item, currentPath );
							const icon = resolveIcon( item );

							if ( hasChildren ) {
								return (
									<Button
										key={ item.path }
										variant="link"
										className={ `ff-sidebar__item ff-sidebar__item--has-children${
											isActive ? ' is-active' : ''
										}` }
										onClick={ () => {
											goTo( item.path );
											// Land on the first child path so the
											// content panel always shows something.
											onNavigate(
												item.children[ 0 ].path
											);
										} }
										icon={ icon }
										iconSize={ 24 }
									>
										{ item.label }
										<Icon
											icon={ chevronRightSmall }
											size={ 24 }
											className="ff-sidebar__chevron"
										/>
									</Button>
								);
							}

							return (
								<Button
									key={ item.path }
									variant="link"
									className={ `ff-sidebar__item${
										isActive ? ' is-active' : ''
									}` }
									onClick={ () => onNavigate( item.path ) }
									icon={ icon }
									iconSize={ 24 }
								>
									{ item.label }
								</Button>
							);
						} ) }
					</nav>
				</div>
			</Navigator.Screen>

			{ /* Sub-screens — one per parent with children. */ }
			{ itemsWithChildren.map( ( item ) => (
				<Navigator.Screen key={ item.path } path={ item.path }>
					<div className="ff-sidebar__subscreen">
						<div className="ff-sidebar__subscreen-header">
							<Button
								variant="link"
								className="ff-sidebar__back"
								onClick={ () => {
									goBack();
									onNavigate( dashboardPath );
								} }
								icon={ chevronLeftSmall }
								iconSize={ 24 }
								size="compact"
							/>
							<span className="ff-sidebar__subscreen-title">
								{ item.label }
							</span>
						</div>
						{ item.description && (
							<p className="ff-sidebar__subscreen-desc">
								{ item.description }
							</p>
						) }
						{ /* Resolve the active child by best-match: the
							 sibling with the LONGEST path that the current
							 URL starts with. `/forms/templates` highlights
							 "Templates" only (not "All forms" whose `/forms`
							 is a shorter prefix). `/forms/123/edit` falls
							 back to "All forms" since none of the other
							 children match. */ }
						<nav className="ff-sidebar__nav">
							{ ( () => {
								const bestPath = item.children
									.filter(
										( c ) =>
											sidebarPath === c.path ||
											sidebarPath.startsWith(
												c.path + '/'
											)
									)
									.sort(
										( a, b ) =>
											b.path.length - a.path.length
									)[ 0 ]?.path;
								return item.children.map( ( child ) => {
									const isActive = child.path === bestPath;
									return (
										<Button
											key={ child.path }
											variant="link"
											className={ `ff-sidebar__item${
												isActive ? ' is-active' : ''
											}` }
											onClick={ () =>
												onNavigate( child.path )
											}
											icon={ resolveIcon( child ) }
											iconSize={ 24 }
										>
											{ child.label }
										</Button>
									);
								} );
							} )() }
						</nav>
					</div>
				</Navigator.Screen>
			) ) }
		</>
	);
};

const Sidebar = ( {
	navItems,
	currentPath,
	onNavigate,
	isOpen,
	onOpenSearch = () => {},
} ) => {
	const adminUrl = window.flowFormsData?.adminUrl || '/wp-admin/';
	const navigatorInitialPath = useMemo(
		() => getNavigatorPathForRoute( navItems, currentPath ),
		[ navItems, currentPath ]
	);

	return (
		<aside className={ `ff-sidebar${ isOpen ? ' is-open' : '' }` }>
			<div className="ff-sidebar__brand">
				<a
					href={ adminUrl }
					className="ff-sidebar__brand-link"
					aria-label={ __( 'Open WP Admin', 'flowforms' ) }
				>
					<Logo size={ 36 } className="ff-sidebar__brand-icon" />
				</a>
				<span className="ff-sidebar__brand-title">
					{ __( 'FormsPress', 'flowforms' ) }
				</span>
				<Button
					icon={ search }
					label={ __( 'Search', 'flowforms' ) }
					className="ff-sidebar__search-btn"
					size="compact"
					onClick={ onOpenSearch }
				/>
			</div>

			<Navigator
				initialPath={ navigatorInitialPath }
				className="ff-sidebar__navigator"
			>
				<SidebarContent
					allItems={ navItems || [] }
					currentPath={ currentPath }
					onNavigate={ onNavigate }
					adminUrl={ adminUrl }
				/>
			</Navigator>

			<div className="ff-sidebar__global-footer">
				<a href={ adminUrl } className="ff-sidebar__wp-admin-link">
					<Icon icon={ wordpress } size={ 20 } />
					<span>{ __( 'Open WP Admin', 'flowforms' ) }</span>
				</a>
			</div>
		</aside>
	);
};

export default Sidebar;
