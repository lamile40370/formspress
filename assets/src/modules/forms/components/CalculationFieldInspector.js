/**
 * Inspector controls for the `calculation` field type.
 *
 * Renders the formula text input, format / decimals / currency selectors,
 * and a "Test formula" button that validates the formula by running it with
 * all zero values via `window.FlowFormsCalc.evaluate` (the same evaluator
 * used by the frontend at runtime).
 *
 * Intended to be rendered conditionally from the main FieldInspector when
 * `field.type === 'calculation'`.
 */
import {
	TextControl,
	SelectControl,
	ToggleControl,
	Button,
	Notice,
	PanelBody,
	__experimentalVStack as VStack,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { useState } from '@wordpress/element';

const FORMAT_OPTIONS = [
	{ value: 'number', label: __( 'Number', 'flowforms' ) },
	{ value: 'currency', label: __( 'Currency', 'flowforms' ) },
	{ value: 'percent', label: __( 'Percent', 'flowforms' ) },
	{ value: 'integer', label: __( 'Integer', 'flowforms' ) },
];

const HELP_TEXT = __(
	'Available: {field:id} references, operators + - * / %, comparisons == != < > <= >=, functions min, max, abs, round, floor, ceil, if, sum, avg.',
	'flowforms'
);

const CalculationFieldInspector = ( { field, allFields = [], onChange } ) => {
	const [ testResult, setTestResult ] = useState( null );
	const set = ( key ) => ( value ) =>
		onChange( { ...field, [ key ]: value } );

	const referenceableFields = allFields.filter(
		( f ) =>
			f &&
			f.id &&
			f.id !== field.id &&
			! [ 'section', 'page_break', 'row', 'statement' ].includes( f.type )
	);

	const runTest = () => {
		const formula = String( field.formula || '' );
		if ( ! formula.trim() ) {
			setTestResult( {
				ok: false,
				msg: __( 'Empty formula.', 'flowforms' ),
			} );
			return;
		}
		if ( ! window.FlowFormsCalc ) {
			setTestResult( {
				ok: false,
				msg: __( 'Evaluator not loaded.', 'flowforms' ),
			} );
			return;
		}
		const zeros = {};
		referenceableFields.forEach( ( f ) => {
			zeros[ f.id ] = 0;
		} );
		const value = window.FlowFormsCalc.evaluate( formula, zeros );
		setTestResult( {
			ok: Number.isFinite( value ),
			msg: Number.isFinite( value )
				? __(
						'Parsed OK. Result with all-zero inputs: ',
						'flowforms'
				  ) + value
				: __( 'Parse error.', 'flowforms' ),
		} );
	};

	return (
		<PanelBody
			title={ __( 'Calculation', 'flowforms' ) }
			initialOpen={ true }
		>
			<VStack spacing={ 4 }>
				<TextControl
					label={ __( 'Formula', 'flowforms' ) }
					value={ field.formula || '' }
					onChange={ set( 'formula' ) }
					placeholder="{field:qty} * {field:price}"
					help={ HELP_TEXT }
					__nextHasNoMarginBottom
					__next40pxDefaultSize
				/>
				<div className="ff-calc-inspector__hints">
					<p
						style={ {
							margin: '0 0 4px',
							fontSize: 12,
							color: '#757575',
						} }
					>
						{ __( 'Available fields:', 'flowforms' ) }
					</p>
					<div
						style={ { display: 'flex', flexWrap: 'wrap', gap: 4 } }
					>
						{ referenceableFields.length === 0 && (
							<span style={ { fontSize: 12, color: '#999' } }>
								{ __(
									'Add other fields to reference them.',
									'flowforms'
								) }
							</span>
						) }
						{ referenceableFields.map( ( f ) => (
							<code
								key={ f.id }
								style={ {
									fontSize: 11,
									background: '#f0f0f0',
									padding: '2px 4px',
									borderRadius: 2,
									cursor: 'pointer',
								} }
								onClick={ () =>
									set( 'formula' )(
										( field.formula || '' ) +
											`{field:${ f.id }}`
									)
								}
								title={ f.label || f.id }
							>
								{ `{field:${ f.id }}` }
							</code>
						) ) }
					</div>
				</div>

				<Button
					variant="secondary"
					onClick={ runTest }
					__next40pxDefaultSize
				>
					{ __( 'Test formula', 'flowforms' ) }
				</Button>
				{ testResult && (
					<Notice
						status={ testResult.ok ? 'success' : 'error' }
						isDismissible={ false }
					>
						{ testResult.msg }
					</Notice>
				) }

				<SelectControl
					label={ __( 'Format', 'flowforms' ) }
					value={ field.format || 'number' }
					options={ FORMAT_OPTIONS }
					onChange={ set( 'format' ) }
					__nextHasNoMarginBottom
					__next40pxDefaultSize
				/>

				{ 'currency' === ( field.format || 'number' ) && (
					<TextControl
						label={ __( 'Currency code', 'flowforms' ) }
						value={ field.currency_code || 'EUR' }
						onChange={ set( 'currency_code' ) }
						__nextHasNoMarginBottom
						__next40pxDefaultSize
					/>
				) }

				<TextControl
					type="number"
					label={ __( 'Decimals', 'flowforms' ) }
					value={ String(
						field.decimals == null ? 2 : field.decimals
					) }
					onChange={ ( v ) =>
						set( 'decimals' )( parseInt( v, 10 ) || 0 )
					}
					min={ 0 }
					max={ 8 }
					__nextHasNoMarginBottom
					__next40pxDefaultSize
				/>

				<ToggleControl
					label={ __( 'Show label', 'flowforms' ) }
					checked={ field.show_label !== false }
					onChange={ set( 'show_label' ) }
					__nextHasNoMarginBottom
				/>
			</VStack>
		</PanelBody>
	);
};

export default CalculationFieldInspector;
