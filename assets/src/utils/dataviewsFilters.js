export const getFilterValues = ( filter ) => {
	if (
		! filter ||
		undefined === filter.value ||
		null === filter.value ||
		'' === filter.value
	) {
		return [];
	}

	return ( Array.isArray( filter.value ) ? filter.value : [ filter.value ] )
		.map( ( value ) => String( value ) )
		.filter( Boolean );
};

export const filterIncludesValue = ( filter, value ) => {
	const values = getFilterValues( filter );
	return ! values.length || values.includes( String( value ) );
};

export const setFilterParam = ( params, key, filter ) => {
	const values = getFilterValues( filter );
	if ( values.length ) {
		params[ key ] = values.join( ',' );
	}
};
