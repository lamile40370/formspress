export const SET_FORMS = 'SET_FORMS';
export const SET_CURRENT_FORM = 'SET_CURRENT_FORM';
export const SET_STATS = 'SET_STATS';
export const SET_SETTINGS = 'SET_SETTINGS';
export const INVALIDATE_FORMS = 'INVALIDATE_FORMS';

export const setForms = ( forms ) => ( { type: SET_FORMS, forms } );
export const setCurrentForm = ( form ) => ( { type: SET_CURRENT_FORM, form } );
export const setStats = ( stats ) => ( { type: SET_STATS, stats } );
export const setSettings = ( settings ) => ( { type: SET_SETTINGS, settings } );
export const invalidateForms = () => ( { type: INVALIDATE_FORMS } );
