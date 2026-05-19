import { get } from '../api/client';
import { STATS, SETTINGS } from '../api/endpoints';
import { setStats, setSettings } from './actions';

export const getStats =
	() =>
	async ( { dispatch } ) => {
		try {
			const response = await get( STATS );
			dispatch( setStats( response.data ) );
		} catch ( e ) {}
	};

export const getSettings =
	() =>
	async ( { dispatch } ) => {
		try {
			const response = await get( SETTINGS );
			dispatch( setSettings( response.data ) );
		} catch ( e ) {}
	};
