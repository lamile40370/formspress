/* eslint-disable @wordpress/no-unsafe-wp-apis */
import {
	FontSizePicker,
	InspectorControls,
	LineHeightControl,
	PanelColorSettings,
} from '@wordpress/block-editor';
import {
	BorderBoxControl,
	BoxControl,
	__experimentalToolsPanel as ToolsPanel,
	__experimentalToolsPanelItem as ToolsPanelItem,
	__experimentalUnitControl as UnitControl,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';

const LENGTH_UNITS = [
	{ value: 'px', label: 'px', default: 0 },
	{ value: 'em', label: 'em', default: 0 },
	{ value: 'rem', label: 'rem', default: 0 },
	{ value: '%', label: '%', default: 0 },
	{ value: 'vw', label: 'vw', default: 0 },
	{ value: 'vh', label: 'vh', default: 0 },
];

const getThemePalette = () => window.flowFormsData?.themePalette || [];

const clearKeys = ( source, keys ) => {
	const next = { ...( source || {} ) };
	keys.forEach( ( key ) => delete next[ key ] );
	return next;
};

const nextInputStyle = ( inputStyle, key, value ) => {
	const next = { ...( inputStyle || {} ) };
	if ( value === undefined || value === null || value === '' ) {
		delete next[ key ];
	} else {
		next[ key ] = value;
	}
	return next;
};

const hasStyleValue = ( value ) =>
	value !== undefined && value !== null && value !== '';

const getStyleValue = ( value, fallback ) =>
	hasStyleValue( value ) ? value : fallback;

const cssLength = ( value ) => {
	if ( ! hasStyleValue( value ) ) {
		return undefined;
	}
	if ( typeof value === 'number' ) {
		return `${ value }px`;
	}
	if ( /^[\d.]+$/.test( String( value ) ) ) {
		return `${ value }px`;
	}
	return String( value );
};

const getPaddingValue = ( inputStyle ) => ( {
	top: getStyleValue( inputStyle.paddingTop, inputStyle.paddingY ),
	right: getStyleValue( inputStyle.paddingRight, inputStyle.paddingX ),
	bottom: getStyleValue( inputStyle.paddingBottom, inputStyle.paddingY ),
	left: getStyleValue( inputStyle.paddingLeft, inputStyle.paddingX ),
} );

const setPaddingValue = ( inputStyle, value ) => {
	const next = clearKeys( inputStyle, [
		'paddingX',
		'paddingY',
		'paddingTop',
		'paddingRight',
		'paddingBottom',
		'paddingLeft',
	] );

	[
		[ 'paddingTop', value?.top ],
		[ 'paddingRight', value?.right ],
		[ 'paddingBottom', value?.bottom ],
		[ 'paddingLeft', value?.left ],
	].forEach( ( [ key, nextValue ] ) => {
		if ( hasStyleValue( nextValue ) ) {
			next[ key ] = nextValue;
		}
	} );

	return next;
};

const getBorderValue = ( inputStyle ) =>
	inputStyle.border || {
		color: inputStyle.borderColor,
		style: inputStyle.borderStyle,
		width: inputStyle.borderWidth,
	};

const setBorderValue = ( inputStyle, value ) => {
	const next = clearKeys( inputStyle, [
		'border',
		'borderColor',
		'borderStyle',
		'borderWidth',
	] );
	if ( value ) {
		next.border = value;
	}
	return next;
};

const addBorderStyle = ( style, border, side = '' ) => {
	if ( ! border ) {
		return style;
	}

	const suffix = side
		? `${ side[ 0 ].toUpperCase() }${ side.slice( 1 ) }`
		: '';
	return {
		...style,
		[ `border${ suffix }Color` ]: border.color || undefined,
		[ `border${ suffix }Style` ]: border.style || undefined,
		[ `border${ suffix }Width` ]: border.width || undefined,
	};
};

export const INPUT_STYLE_ATTRIBUTE = {
	type: 'object',
	default: {},
};

export const getInputStyleVars = ( attributes ) => {
	const inputStyle = attributes.inputStyle || {};
	const padding = getPaddingValue( inputStyle );
	const style = {};

	[
		[ '--ff-input-width', inputStyle.width ],
		[ '--ff-input-padding-top', padding.top ],
		[ '--ff-input-padding-right', padding.right ],
		[ '--ff-input-padding-bottom', padding.bottom ],
		[ '--ff-input-padding-left', padding.left ],
	].forEach( ( [ property, value ] ) => {
		const length = cssLength( value );
		if ( length ) {
			style[ property ] = length;
		}
	} );

	if ( hasStyleValue( inputStyle.textColor ) ) {
		style[ '--ff-input-text-color' ] = inputStyle.textColor;
	}

	return style;
};

export const getInputControlStyle = ( attributes, extra = {} ) => {
	const inputStyle = attributes.inputStyle || {};
	let style = {
		color: inputStyle.textColor || undefined,
		backgroundColor: inputStyle.backgroundColor || undefined,
		width: cssLength( inputStyle.width ),
		borderRadius: cssLength( inputStyle.borderRadius ),
		paddingLeft: cssLength(
			getStyleValue( inputStyle.paddingLeft, inputStyle.paddingX )
		),
		paddingRight: cssLength(
			getStyleValue( inputStyle.paddingRight, inputStyle.paddingX )
		),
		paddingTop: cssLength(
			getStyleValue( inputStyle.paddingTop, inputStyle.paddingY )
		),
		paddingBottom: cssLength(
			getStyleValue( inputStyle.paddingBottom, inputStyle.paddingY )
		),
		fontSize: cssLength( inputStyle.fontSize ),
		lineHeight: inputStyle.lineHeight || undefined,
		...extra,
	};
	const border = getBorderValue( inputStyle );

	if ( border?.top || border?.right || border?.bottom || border?.left ) {
		[ 'top', 'right', 'bottom', 'left' ].forEach( ( side ) => {
			style = addBorderStyle( style, border[ side ], side );
		} );
		return style;
	}

	return addBorderStyle( style, border );
};

const InputStyleInspector = ( { attributes, setAttributes } ) => {
	const inputStyle = attributes.inputStyle || {};
	const setInputStyle = ( next ) => setAttributes( { inputStyle: next } );
	const setStyle = ( key ) => ( value ) =>
		setInputStyle( nextInputStyle( inputStyle, key, value ) );

	return (
		<InspectorControls group="styles">
			<PanelColorSettings
				title={ __( 'Input color', 'flowforms' ) }
				colorSettings={ [
					{
						label: __( 'Text', 'flowforms' ),
						value: inputStyle.textColor,
						onChange: setStyle( 'textColor' ),
						clearable: true,
					},
					{
						label: __( 'Background', 'flowforms' ),
						value: inputStyle.backgroundColor,
						onChange: setStyle( 'backgroundColor' ),
						clearable: true,
					},
				] }
				__experimentalIsRenderedInSidebar
				enableAlpha
			/>

			<ToolsPanel
				label={ __( 'Input typography', 'flowforms' ) }
				resetAll={ () =>
					setInputStyle(
						clearKeys( inputStyle, [ 'fontSize', 'lineHeight' ] )
					)
				}
			>
				<ToolsPanelItem
					label={ __( 'Font size', 'flowforms' ) }
					hasValue={ () => !! inputStyle.fontSize }
					onDeselect={ () => setStyle( 'fontSize' )( undefined ) }
					isShownByDefault
				>
					<FontSizePicker
						value={ inputStyle.fontSize }
						onChange={ setStyle( 'fontSize' ) }
						withReset={ false }
					/>
				</ToolsPanelItem>
				<ToolsPanelItem
					label={ __( 'Line height', 'flowforms' ) }
					hasValue={ () => !! inputStyle.lineHeight }
					onDeselect={ () => setStyle( 'lineHeight' )( undefined ) }
				>
					<LineHeightControl
						__next40pxDefaultSize
						value={ inputStyle.lineHeight }
						onChange={ setStyle( 'lineHeight' ) }
					/>
				</ToolsPanelItem>
			</ToolsPanel>

			<ToolsPanel
				label={ __( 'Input dimensions', 'flowforms' ) }
				resetAll={ () =>
					setInputStyle(
						clearKeys( setPaddingValue( inputStyle, {} ), [
							'width',
						] )
					)
				}
			>
				<ToolsPanelItem
					label={ __( 'Width', 'flowforms' ) }
					hasValue={ () => hasStyleValue( inputStyle.width ) }
					onDeselect={ () => setStyle( 'width' )( undefined ) }
					isShownByDefault
				>
					<UnitControl
						__next40pxDefaultSize
						label={ __( 'Width', 'flowforms' ) }
						value={ getStyleValue( inputStyle.width, '' ) }
						onChange={ setStyle( 'width' ) }
						units={ LENGTH_UNITS }
						min={ 0 }
						placeholder="100%"
					/>
				</ToolsPanelItem>
				<ToolsPanelItem
					label={ __( 'Padding', 'flowforms' ) }
					hasValue={ () =>
						[
							'paddingX',
							'paddingY',
							'paddingTop',
							'paddingRight',
							'paddingBottom',
							'paddingLeft',
						].some( ( key ) => hasStyleValue( inputStyle[ key ] ) )
					}
					onDeselect={ () =>
						setInputStyle( setPaddingValue( inputStyle, {} ) )
					}
					isShownByDefault
				>
					<BoxControl
						__next40pxDefaultSize
						label={ __( 'Padding', 'flowforms' ) }
						values={ getPaddingValue( inputStyle ) }
						onChange={ ( value ) =>
							setInputStyle(
								setPaddingValue( inputStyle, value )
							)
						}
						units={ LENGTH_UNITS }
						allowReset={ false }
					/>
				</ToolsPanelItem>
			</ToolsPanel>

			<ToolsPanel
				label={ __( 'Input border & shadow', 'flowforms' ) }
				resetAll={ () =>
					setInputStyle(
						clearKeys( inputStyle, [ 'border', 'borderRadius' ] )
					)
				}
			>
				<ToolsPanelItem
					label={ __( 'Border', 'flowforms' ) }
					hasValue={ () =>
						!! inputStyle.border ||
						!! inputStyle.borderColor ||
						!! inputStyle.borderStyle ||
						!! inputStyle.borderWidth
					}
					onDeselect={ () =>
						setInputStyle( setBorderValue( inputStyle ) )
					}
					isShownByDefault
				>
					<BorderBoxControl
						__next40pxDefaultSize
						label={ __( 'Border', 'flowforms' ) }
						value={ getBorderValue( inputStyle ) }
						colors={ getThemePalette() }
						enableStyle
						enableAlpha
						__experimentalIsRenderedInSidebar
						onChange={ ( value ) =>
							setInputStyle( setBorderValue( inputStyle, value ) )
						}
					/>
				</ToolsPanelItem>
				<ToolsPanelItem
					label={ __( 'Radius', 'flowforms' ) }
					hasValue={ () => !! inputStyle.borderRadius }
					onDeselect={ () => setStyle( 'borderRadius' )( undefined ) }
				>
					<UnitControl
						__next40pxDefaultSize
						label={ __( 'Radius', 'flowforms' ) }
						value={ getStyleValue( inputStyle.borderRadius, '' ) }
						onChange={ setStyle( 'borderRadius' ) }
						units={ LENGTH_UNITS }
						min={ 0 }
					/>
				</ToolsPanelItem>
			</ToolsPanel>
		</InspectorControls>
	);
};

export default InputStyleInspector;
