/**
 * Editor script for `formspress/flow-form`.
 */
import { registerBlockType } from '@wordpress/blocks';
import { useState, useEffect } from '@wordpress/element';
import { useBlockProps, InspectorControls } from '@wordpress/block-editor';
import {
	PanelBody,
	SelectControl,
	ToggleControl,
	Spinner,
	Placeholder,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import apiFetch from '@wordpress/api-fetch';

/* Block name kept in sync with blocks/flow-form/block.json. */
const BLOCK_NAME = 'formspress/flow-form';

function Edit( { attributes, setAttributes } ) {
	const { formId, displayTitle } = attributes;
	const blockProps = useBlockProps( { className: 'ff-flow-form-block' } );

	const [ forms, setForms ] = useState( [] );
	const [ isLoading, setLoading ] = useState( true );

	const ns =
		( window.flowFormsEditorData &&
			window.flowFormsEditorData.apiNamespace ) ||
		'flowforms/v1';

	useEffect( () => {
		apiFetch( { path: `/${ ns }/forms?per_page=100&type=flow` } )
			.then( ( res ) => setForms( res.data || [] ) )
			.finally( () => setLoading( false ) );
	}, [] );

	const selectedForm = forms.find( ( f ) => f.id === formId );

	const formOptions = [
		{ value: 0, label: __( '— Choose a flow form —', 'formspress' ) },
		...forms.map( ( f ) => ( { value: f.id, label: f.title } ) ),
	];

	return (
		<>
			<InspectorControls>
				<PanelBody title={ __( 'Flow Form', 'formspress' ) }>
					{ isLoading ? (
						<Spinner />
					) : (
						<SelectControl
							label={ __( 'Choose a flow form…', 'formspress' ) }
							value={ formId }
							options={ formOptions }
							onChange={ ( v ) =>
								setAttributes( {
									formId: parseInt( v, 10 ) || 0,
								} )
							}
							__nextHasNoMarginBottom
							__next40pxDefaultSize
						/>
					) }
					<ToggleControl
						label={ __( 'Display title', 'formspress' ) }
						checked={ !! displayTitle }
						onChange={ ( v ) =>
							setAttributes( { displayTitle: v } )
						}
						__nextHasNoMarginBottom
					/>
				</PanelBody>
			</InspectorControls>

			<div { ...blockProps }>
				{ ! formId ? (
					<Placeholder
						icon="media-interactive"
						label={ __( 'FormsPress Flow Form', 'formspress' ) }
						instructions={ __(
							'Choose a flow form in the block sidebar.',
							'formspress'
						) }
					/>
				) : (
					<div className="ff-form-block__preview ff-form-block__preview--flow">
						<span className="ff-form-block__icon dashicons dashicons-media-interactive" />
						<strong>
							{ selectedForm?.title ||
								`${ __(
									'Flow Form #',
									'formspress'
								) }${ formId }` }
						</strong>
						<em>
							{ __(
								'Conversational form — renders on the frontend.',
								'formspress'
							) }
						</em>
					</div>
				) }
			</div>
		</>
	);
}

registerBlockType( BLOCK_NAME, {
	edit: Edit,
	save: () => null,
} );
