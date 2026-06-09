import { useEffect, useState } from '@wordpress/element';
import {
	BlockControls,
	useBlockProps,
	useInnerBlocksProps,
	store as blockEditorStore,
} from '@wordpress/block-editor';
import { useSelect } from '@wordpress/data';
import {
	Button,
	Modal,
	Notice,
	ToolbarButton,
	ToolbarGroup,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { filter } from '@wordpress/icons';
import ConditionsPanel from '../../../components/ConditionsPanel';
import {
	collectStandardFields,
	getBlockFieldType,
	getProPricingUrl,
} from './conditional-display';
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
	labelPlaceholder = __( 'Label', 'formspress' ),
} ) => {
	const { fieldId, label, required, help } = attributes;
	const [ isConditionsModalOpen, setIsConditionsModalOpen ] =
		useState( false );
	const isPro = !! window.flowFormsData?.features?.conditionalLogic;
	const { allFields, selectedType, isEmbeddedFormPreview } = useSelect(
		( select ) => {
			const editor = select( blockEditorStore );
			const currentBlock = editor.getBlock( clientId );
			const parentClientIds = editor.getBlockParents( clientId ) || [];

			return {
				allFields: collectStandardFields( editor.getBlocks() ),
				selectedType: getBlockFieldType( currentBlock?.name ),
				isEmbeddedFormPreview: parentClientIds.some(
					( parentClientId ) =>
						editor.getBlock( parentClientId )?.name ===
						'formspress/form'
				),
			};
		},
		[ clientId ]
	);
	const currentField = {
		id: fieldId || '',
		type: selectedType,
		label: label || fieldId || '',
		options: attributes.options || [],
		conditions: attributes.conditions,
	};
	const hasConditions = !! attributes.conditions?.rules?.length;
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
		<>
			<BlockControls group="block">
				{ ! isEmbeddedFormPreview && (
					<ToolbarGroup>
						<ToolbarButton
							icon={ filter }
							label={ __( 'Conditional display', 'formspress' ) }
							isPressed={ hasConditions }
							onClick={ () => setIsConditionsModalOpen( true ) }
						/>
					</ToolbarGroup>
				) }
			</BlockControls>
			{ ! isEmbeddedFormPreview && isConditionsModalOpen && (
				<Modal
					title={ __( 'Conditional display', 'formspress' ) }
					onRequestClose={ () => setIsConditionsModalOpen( false ) }
					size="large"
					className="ff-conditional-display-modal"
				>
					{ isPro ? (
						<ConditionsPanel
							field={ currentField }
							allFields={ allFields }
							onChange={ ( nextField ) =>
								setAttributes( {
									conditions: nextField.conditions,
								} )
							}
							title={ __( 'Conditional display', 'formspress' ) }
							displayMode="modal"
						/>
					) : (
						<Notice status="info" isDismissible={ false }>
							{ __(
								'Show or hide this field based on previous answers. Available in FormsPress Pro.',
								'formspress'
							) }{ ' ' }
							<Button
								variant="link"
								href={ getProPricingUrl() }
								target="_blank"
								rel="noreferrer"
							>
								{ __( 'View Pro pricing', 'formspress' ) }
							</Button>
						</Notice>
					) }
				</Modal>
			) }
			<div { ...blockProps }>
				<div { ...innerBlocksProps } />
				{ children }
			</div>
		</>
	);
};

export default FieldEdit;
