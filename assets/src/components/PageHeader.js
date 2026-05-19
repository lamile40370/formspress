import { Page } from '@wordpress/admin-ui';

/**
 * Page adapter for the Gutenberg Admin UI Page component.
 */
const PageHeader = ( {
	title,
	description = '',
	right = null,
	leftMeta = null,
	className = 'ff-page',
	children,
} ) => {
	return (
		<Page
			className={ className }
			headingLevel={ 2 }
			title={ title }
			subTitle={ description }
			badges={ leftMeta }
			actions={ right }
			ariaLabel={ typeof title === 'string' ? title : undefined }
			hasPadding={ false }
			showSidebarToggle={ false }
		>
			{ children }
		</Page>
	);
};

export default PageHeader;
