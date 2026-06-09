import {
	SelectControl,
	TextControl,
	ToggleControl,
} from '@wordpress/components';
import { __, sprintf } from '@wordpress/i18n';
import FieldEdit from '../shared/FieldEdit';
import FieldInspector from '../shared/FieldInspector';
import { getInputControlStyle } from '../shared/input-style';

const CURRENCY_OPTIONS = [
	{ value: 'EUR', label: 'EUR' },
	{ value: 'USD', label: 'USD' },
	{ value: 'GBP', label: 'GBP' },
	{ value: 'CAD', label: 'CAD' },
	{ value: 'AUD', label: 'AUD' },
	{ value: 'JPY', label: 'JPY' },
];

const parseNumber = ( value, fallback = undefined ) => {
	if ( value === '' || value === undefined || value === null ) {
		return fallback;
	}
	const parsed = Number( value );
	return Number.isNaN( parsed ) ? fallback : parsed;
};

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
	const {
		productName,
		price,
		currency = 'EUR',
		minQuantity = 0,
		maxQuantity,
		stepQuantity = 1,
		defaultValue,
		productLayout = 'stacked',
		showProductName = true,
		showUnitPrice = true,
		showQuantityLabel = true,
		showLineTotal = true,
		quantityLabel,
	} = attributes;
	const quantity = parseNumber( defaultValue, minQuantity || 0 );
	const lineTotal = Number( price || 0 ) * Number( quantity || 0 );
	const productTitle =
		productName || attributes.label || __( 'Product', 'formspress' );
	const quantityText = quantityLabel || __( 'Quantity', 'formspress' );

	const extras = (
		<>
			<SelectControl
				label={ __( 'Layout', 'formspress' ) }
				value={ productLayout || 'stacked' }
				options={ [
					{ value: 'stacked', label: __( 'Stacked', 'formspress' ) },
					{ value: 'inline', label: __( 'Inline', 'formspress' ) },
					{ value: 'split', label: __( 'Split', 'formspress' ) },
				] }
				onChange={ ( value ) =>
					setAttributes( { productLayout: value } )
				}
				__nextHasNoMarginBottom
				__next40pxDefaultSize
			/>
			<TextControl
				label={ __( 'Product name', 'formspress' ) }
				value={ productName || '' }
				onChange={ ( value ) =>
					setAttributes( {
						productName: value,
						label: attributes.label || value,
					} )
				}
				__nextHasNoMarginBottom
				__next40pxDefaultSize
			/>
			<TextControl
				label={ __( 'Unit price', 'formspress' ) }
				type="number"
				value={ price ?? '' }
				min={ 0 }
				step="0.01"
				onChange={ ( value ) =>
					setAttributes( { price: parseNumber( value, 0 ) } )
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
			<TextControl
				label={ __( 'Quantity label', 'formspress' ) }
				value={ quantityText }
				onChange={ ( value ) =>
					setAttributes( { quantityLabel: value } )
				}
				__nextHasNoMarginBottom
				__next40pxDefaultSize
			/>
			<TextControl
				label={ __( 'Default quantity', 'formspress' ) }
				type="number"
				value={ defaultValue ?? '' }
				min={ minQuantity ?? 0 }
				max={ maxQuantity ?? undefined }
				step={ stepQuantity || 1 }
				onChange={ ( value ) =>
					setAttributes( { defaultValue: String( value || '' ) } )
				}
				__nextHasNoMarginBottom
				__next40pxDefaultSize
			/>
			<TextControl
				label={ __( 'Minimum quantity', 'formspress' ) }
				type="number"
				value={ minQuantity ?? '' }
				min={ 0 }
				step={ stepQuantity || 1 }
				onChange={ ( value ) =>
					setAttributes( { minQuantity: parseNumber( value, 0 ) } )
				}
				__nextHasNoMarginBottom
				__next40pxDefaultSize
			/>
			<TextControl
				label={ __( 'Maximum quantity', 'formspress' ) }
				type="number"
				value={ maxQuantity ?? '' }
				min={ minQuantity ?? 0 }
				step={ stepQuantity || 1 }
				onChange={ ( value ) =>
					setAttributes( { maxQuantity: parseNumber( value ) } )
				}
				__nextHasNoMarginBottom
				__next40pxDefaultSize
			/>
			<ToggleControl
				label={ __( 'Show product name', 'formspress' ) }
				checked={ !! showProductName }
				onChange={ ( value ) =>
					setAttributes( { showProductName: value } )
				}
				__nextHasNoMarginBottom
			/>
			<ToggleControl
				label={ __( 'Show unit price', 'formspress' ) }
				checked={ !! showUnitPrice }
				onChange={ ( value ) =>
					setAttributes( { showUnitPrice: value } )
				}
				__nextHasNoMarginBottom
			/>
			<ToggleControl
				label={ __( 'Show quantity label', 'formspress' ) }
				checked={ !! showQuantityLabel }
				onChange={ ( value ) =>
					setAttributes( { showQuantityLabel: value } )
				}
				__nextHasNoMarginBottom
			/>
			<ToggleControl
				label={ __( 'Show line total', 'formspress' ) }
				checked={ !! showLineTotal }
				onChange={ ( value ) =>
					setAttributes( { showLineTotal: value } )
				}
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
				extras={ extras }
			/>
			<FieldEdit
				{ ...props }
				labelPlaceholder={ __( 'Product name', 'formspress' ) }
			>
				<div
					className={ `ff-form__product-preview ff-form__product-preview--${
						productLayout || 'stacked'
					}` }
				>
					<div className="ff-form__product-row">
						<div className="ff-form__product-summary">
							{ showProductName && (
								<strong className="ff-form__product-name">
									{ productTitle }
								</strong>
							) }
							{ showUnitPrice && (
								<div className="ff-form__product-price">
									{ formatMoney( price, currency ) }
								</div>
							) }
						</div>
						<div className="ff-form__product-quantity-control">
							{ showQuantityLabel && (
								<label className="ff-form__product-quantity-label">
									{ quantityText }
								</label>
							) }
							<TextControl
								label={ quantityText }
								hideLabelFromVision
								type="number"
								value={ quantity }
								min={ minQuantity ?? 0 }
								max={ maxQuantity ?? undefined }
								step={ stepQuantity || 1 }
								disabled
								onChange={ () => {} }
								__nextHasNoMarginBottom
								__next40pxDefaultSize
								style={ getInputControlStyle( attributes ) }
							/>
						</div>
					</div>
					{ showLineTotal && (
						<div className="ff-form__product-line-total">
							{ sprintf(
								/* translators: %s: formatted line total. */
								__( 'Line total: %s', 'formspress' ),
								formatMoney( lineTotal, currency )
							) }
						</div>
					) }
				</div>
			</FieldEdit>
		</>
	);
};

export default Edit;
