import { useState, useEffect } from '@wordpress/element';

const STORAGE_KEY = 'flowforms_dataview_prefs';

const useDataViewPreferences = ( viewKey, defaultView ) => {
	const [ view, setViewState ] = useState( () => {
		try {
			const stored = localStorage.getItem( STORAGE_KEY );
			const prefs = stored ? JSON.parse( stored ) : {};
			return prefs[ viewKey ]
				? { ...defaultView, ...prefs[ viewKey ] }
				: defaultView;
		} catch ( e ) {
			return defaultView;
		}
	} );

	const setView = ( newView ) => {
		setViewState( newView );
		try {
			const stored = localStorage.getItem( STORAGE_KEY );
			const prefs = stored ? JSON.parse( stored ) : {};
			prefs[ viewKey ] = newView;
			localStorage.setItem( STORAGE_KEY, JSON.stringify( prefs ) );
		} catch ( e ) {}
	};

	return [ view, setView ];
};

export default useDataViewPreferences;
