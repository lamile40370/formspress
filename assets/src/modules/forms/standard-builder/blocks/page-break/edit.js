import { useBlockProps } from '@wordpress/block-editor';
import { __ } from '@wordpress/i18n';

const Edit = () => {
	const blockProps = useBlockProps( {
		className: 'formspress-page-break',
	} );

	return (
		<div { ...blockProps }>
			<span className="formspress-page-break__line" />
			<span className="formspress-page-break__label">
				{ __( 'Page Break', 'formspress' ) }
			</span>
			<span className="formspress-page-break__line" />
		</div>
	);
};

export default Edit;
