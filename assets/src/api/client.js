import apiFetch from '@wordpress/api-fetch';

const API_NAMESPACE = window.flowFormsData?.apiNamespace || 'flowforms/v1';

export const get = ( endpoint, params = {} ) => {
	const queryString = new URLSearchParams( params ).toString();
	const path = `/${ API_NAMESPACE }${ endpoint }${
		queryString ? '?' + queryString : ''
	}`;
	return apiFetch( { path } );
};

export const post = ( endpoint, data = {} ) =>
	apiFetch( {
		path: `/${ API_NAMESPACE }${ endpoint }`,
		method: 'POST',
		data,
	} );

export const put = ( endpoint, data = {} ) =>
	apiFetch( {
		path: `/${ API_NAMESPACE }${ endpoint }`,
		method: 'PUT',
		data,
	} );

export const patch = ( endpoint, data = {} ) =>
	apiFetch( {
		path: `/${ API_NAMESPACE }${ endpoint }`,
		method: 'PATCH',
		data,
	} );

export const del = ( endpoint ) =>
	apiFetch( { path: `/${ API_NAMESPACE }${ endpoint }`, method: 'DELETE' } );
