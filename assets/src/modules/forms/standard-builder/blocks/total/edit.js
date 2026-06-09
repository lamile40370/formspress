import { SelectControl, ToggleControl } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import FieldEdit from '../shared/FieldEdit';
import FieldInspector from '../shared/FieldInspector';

const CURRENCY_OPTIONS = [
	{ value: 'EUR', label: 'EUR' },
	{ value: 'USD', label: 'USD' },
	{ value: 'GBP', label: 'GBP' },
	{ value: 'CAD', label: 'CAD' },
	{ value: 'AUD', label: 'AUD' },
	{ value: 'JPY', label: 'JPY' },
];

const formatMoney = ( amount, currency ) => {
	try {
		return new Intl.NumberFormat( undefined, {
			style: 'currency',
			currency: currency || 'EUR',
		} ).format( Number( amount || 0 ) );
	} catch ( e ) {
		return `${ Number( amount || 0 ).toFixed( 2 ) } ${ currency || 'EUR' }`;
	}
};

const Edit = ( props ) => {
	const { attributes, setAttributes } = props;
	const { currency = 'EUR', totalLayout = 'inline', showLabel = true } =
		attributes;

	const extras = (
		<>
			<SelectControl
				label={ __( 'Layout', 'formspress' ) }
				value={ totalLayout || 'inline' }
				options={ [
					{ value: 'inline', label: __( 'Inline', 'formspress' ) },
					{ value: 'stacked', label: __( 'Stacked', 'formspress' ) },
					{ value: 'split', label: __( 'Split', 'formspress' ) },
				] }
				onChange={ ( value ) =>
					setAttributes( { totalLayout: value } )
				}
				__nextHasNoMarginBottom
				__next40pxDefaultSize
			/>
			<SelectControl
				label={ __( 'Currency', 'formspress' ) }
				value={ currency || 'EUR' }
				options={ CURRENCY_OPTIONS }
				onChange={ ( value ) => setAttributes( { currency: value } ) }
				__nextHasNoMarginBottom
				__next40pxDefaultSize
			/>
			<ToggleControl
				label={ __( 'Show label', 'formspress' ) }
				checked={ !! showLabel }
				onChange={ ( value ) => setAttributes( { showLabel: value } ) }
				__nextHasNoMarginBottom
			/>
		</>
	);

	return (
		<>
			<FieldInspector
				attributes={ attributes }
				setAttributes={ setAttributes }
				showPlaceholder={ false }
				showDefault={ false }
				extras={ extras }
			/>
			<FieldEdit
				{ ...props }
				labelPlaceholder={ __( 'Total label', 'formspress' ) }
			>
				<div
					className={ `ff-form__total-preview ff-form__total-preview--${
						totalLayout || 'inline'
					}` }
				>
					{ showLabel && (
						<span>
							{ attributes.label || __( 'Total', 'formspress' ) }
						</span>
					) }
					<strong>{ formatMoney( 0, currency ) }</strong>
				</div>
			</FieldEdit>
		</>
	);
};

export default Edit;
