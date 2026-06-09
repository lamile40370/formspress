const FIELD_BLOCK_TYPES = {
	'formspress/field-text': 'text',
	'formspress/field-email': 'email',
	'formspress/field-textarea': 'textarea',
	'formspress/field-number': 'number',
	'formspress/field-select': 'select',
	'formspress/field-radio': 'radio',
	'formspress/field-checkbox': 'checkbox',
	'formspress/field-product': 'product',
	'formspress/field-total': 'total',
};

export const getProPricingUrl = () =>
	window.flowFormsData?.pro?.pricingUrl ||
	window.flowFormsData?.pro?.upgradeUrl ||
	'https://example.com/formspress-pro';

const textFromHtml = ( value = '' ) =>
	String( value )
		.replace( /<[^>]*>/g, '' )
		.replace( /&nbsp;/g, ' ' )
		.trim();

export const getBlockFieldType = ( blockName ) =>
	FIELD_BLOCK_TYPES[ blockName ] || 'text';

const getBlockFieldLabel = ( block ) => {
	if ( block?.attributes?.productName ) {
		return block.attributes.productName;
	}

	if ( block?.attributes?.label ) {
		return block.attributes.label;
	}

	const labelBlock = ( block?.innerBlocks || [] ).find( ( inner ) =>
		inner?.attributes?.className
			?.split( /\s+/ )
			.includes( 'ff-field-label' )
	);

	return textFromHtml( labelBlock?.attributes?.content || '' );
};

export const collectStandardFields = ( blocks ) => {
	const fields = [];
	const walk = ( list ) => {
		for ( const block of list || [] ) {
			const type = FIELD_BLOCK_TYPES[ block?.name ];
			const fieldId = block?.attributes?.fieldId || '';
			if ( type && fieldId ) {
				fields.push( {
					id: fieldId,
					type,
					label: getBlockFieldLabel( block ) || fieldId,
					options: block?.attributes?.options || [],
				} );
			}
			walk( block?.innerBlocks || [] );
		}
	};
	walk( blocks );
	return fields;
};
