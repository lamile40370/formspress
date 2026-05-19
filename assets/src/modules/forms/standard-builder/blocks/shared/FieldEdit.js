import { useEffect } from '@wordpress/element';
import {
	useBlockProps,
	useInnerBlocksProps,
} from '@wordpress/block-editor';
import { __ } from '@wordpress/i18n';
import { getInputStyleVars } from './input-style';

const FIELD_TEXT_BLOCKS = [
	'core/paragraph',
	'core/heading',
	'core/list',
	'core/group',
	'core/separator',
	'core/spacer',
];

const buildTemplate = ( label, help, labelPlaceholder ) => [
	[
		'core/paragraph',
		{
			content: label || '',
			placeholder: labelPlaceholder,
			className: 'ff-field-label',
		},
	],
	...( help
		? [
				[
					'core/paragraph',
					{
						content: help,
						className: 'ff-field-help',
						fontSize: 'small',
					},
				],
		  ]
		: [] ),
];

const FieldEdit = ( {
	attributes,
	setAttributes,
	clientId,
	children,
	labelPlaceholder = __( 'Label', 'flowforms' ),
} ) => {
	const { fieldId, label, required, help } = attributes;
	const blockProps = useBlockProps( {
		className: required ? 'is-required' : undefined,
		style: getInputStyleVars( attributes ),
	} );

	const innerBlocksProps = useInnerBlocksProps(
		{
			className: 'formspress-field__content',
		},
		{
			allowedBlocks: FIELD_TEXT_BLOCKS,
			template: buildTemplate( label, help, labelPlaceholder ),
			templateLock: false,
			renderAppender: false,
		}
	);

	useEffect( () => {
		if ( ! fieldId && clientId ) {
			setAttributes( { fieldId: clientId.slice( 0, 8 ) } );
		}
	}, [ fieldId, clientId, setAttributes ] );

	return (
		<div { ...blockProps }>
			<div { ...innerBlocksProps } />
			{ children }
		</div>
	);
};

export default FieldEdit;
