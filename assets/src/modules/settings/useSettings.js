import { useEffect, useState, useCallback } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { get, put } from '../../api/client';
import { SETTINGS } from '../../api/endpoints';

/**
 * Shared loader / saver used by every settings sub-screen. Centralising it
 * here keeps the option payload coherent — each sub-page only edits the
 * keys it owns, but PATCH-style merges back into the same wp_options row.
 */
export default function useSettings() {
	const [ settings, setSettings ] = useState( null );
	const [ isSaving, setSaving ] = useState( false );
	const [ notice, setNotice ] = useState( null );

	useEffect( () => {
		get( SETTINGS )
			.then( ( res ) => setSettings( res.data || {} ) )
			.catch( () => setSettings( {} ) );
	}, [] );

	const set = useCallback(
		( key ) => ( value ) =>
			setSettings( ( prev ) => ( {
				...( prev || {} ),
				[ key ]: value,
			} ) ),
		[]
	);

	const save = useCallback(
		async ( overrides ) => {
			setSaving( true );
			setNotice( null );
			try {
				const payload = overrides
					? { ...settings, ...overrides }
					: settings;
				await put( SETTINGS, payload );
				setNotice( {
					type: 'success',
					message: __( 'Settings saved.', 'flowforms' ),
				} );
			} catch ( e ) {
				setNotice( {
					type: 'error',
					message:
						e.message ||
						__( 'Could not save settings.', 'flowforms' ),
				} );
			} finally {
				setSaving( false );
			}
		},
		[ settings ]
	);

	return { settings, set, save, isSaving, notice, setNotice };
}
