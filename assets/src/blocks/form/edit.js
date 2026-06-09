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

const FormBlockEdit = ( { attributes, setAttributes } ) => {
	const { formId, displayTitle, displayDescription } = attributes;
	const blockProps = useBlockProps( { className: 'ff-form-block' } );

	const [ forms, setForms ] = useState( [] );
	const [ isLoading, setLoading ] = useState( true );

	const ns = window.flowFormsEditorData?.apiNamespace || 'flowforms/v1';

	useEffect( () => {
		apiFetch( { path: `/${ ns }/forms?per_page=100` } )
			.then( ( res ) => setForms( res.data || [] ) )
			.finally( () => setLoading( false ) );
	}, [] );

	const formOptions = [
		{ value: 0, label: __( '— Select a form —', 'formspress' ) },
		...forms.map( ( f ) => ( { value: f.id, label: f.title } ) ),
	];

	const selectedForm = forms.find( ( f ) => f.id === formId );

	return (
		<>
			<InspectorControls>
				<PanelBody title={ __( 'Form Settings', 'formspress' ) }>
					{ isLoading ? (
						<Spinner />
					) : (
						<SelectControl
							label={ __( 'Select Form', 'formspress' ) }
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
						label={ __( 'Display Form Title', 'formspress' ) }
						checked={ displayTitle }
						onChange={ ( v ) =>
							setAttributes( { displayTitle: v } )
						}
						__nextHasNoMarginBottom
					/>
					<ToggleControl
						label={ __( 'Display Description', 'formspress' ) }
						checked={ displayDescription }
						onChange={ ( v ) =>
							setAttributes( { displayDescription: v } )
						}
						__nextHasNoMarginBottom
					/>
				</PanelBody>
			</InspectorControls>

			<div { ...blockProps }>
				{ ! formId ? (
					<Placeholder
						icon="feedback"
						label={ __( 'FlowForms — Standard Form', 'formspress' ) }
						instructions={ __(
							'Select a form in the block settings panel.',
							'formspress'
						) }
					/>
				) : (
					<div className="ff-form-block__preview">
						<span className="ff-form-block__icon dashicons dashicons-feedback" />
						<strong>
							{ selectedForm?.title ||
								__( 'Form #', 'formspress' ) + formId }
						</strong>
						<em>
							{ __(
								'Form will render on the frontend.',
								'formspress'
							) }
						</em>
					</div>
				) }
			</div>
		</>
	);
};

export default FormBlockEdit;
