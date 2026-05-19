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

const FlowFormBlockEdit = ( { attributes, setAttributes } ) => {
	const { formId, displayTitle } = attributes;
	const blockProps = useBlockProps( { className: 'ff-flow-form-block' } );

	const [ forms, setForms ] = useState( [] );
	const [ isLoading, setLoading ] = useState( true );

	const ns = window.flowFormsEditorData?.apiNamespace || 'flowforms/v1';

	useEffect( () => {
		apiFetch( { path: `/${ ns }/forms?per_page=100&type=flow` } )
			.then( ( res ) => setForms( res.data || [] ) )
			.finally( () => setLoading( false ) );
	}, [] );

	const formOptions = [
		{ value: 0, label: __( '— Select a flow form —', 'flowforms' ) },
		...forms.map( ( f ) => ( { value: f.id, label: f.title } ) ),
	];

	const selectedForm = forms.find( ( f ) => f.id === formId );

	return (
		<>
			<InspectorControls>
				<PanelBody title={ __( 'Flow Form Settings', 'flowforms' ) }>
					{ isLoading ? (
						<Spinner />
					) : (
						<SelectControl
							label={ __( 'Select Flow Form', 'flowforms' ) }
							value={ formId }
							options={ formOptions }
							onChange={ ( v ) =>
								setAttributes( { formId: parseInt( v, 10 ) } )
							}
							__nextHasNoMarginBottom
							__next40pxDefaultSize
						/>
					) }
					<ToggleControl
						label={ __( 'Display Form Title', 'flowforms' ) }
						checked={ displayTitle }
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
						label={ __( 'FlowForms — Flow Form', 'flowforms' ) }
						instructions={ __(
							'Select a flow form in the block settings panel.',
							'flowforms'
						) }
					/>
				) : (
					<div className="ff-form-block__preview ff-form-block__preview--flow">
						<span className="ff-form-block__icon dashicons dashicons-media-interactive" />
						<strong>
							{ selectedForm?.title ||
								__( 'Flow Form #', 'flowforms' ) + formId }
						</strong>
						<em>
							{ __(
								'Conversational flow form — renders on the frontend.',
								'flowforms'
							) }
						</em>
					</div>
				) }
			</div>
		</>
	);
};

export default FlowFormBlockEdit;
