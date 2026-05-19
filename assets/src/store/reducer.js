import {
	SET_FORMS,
	SET_CURRENT_FORM,
	SET_STATS,
	SET_SETTINGS,
	INVALIDATE_FORMS,
} from './actions';

const DEFAULT_STATE = {
	forms: [],
	formsTotal: 0,
	currentForm: null,
	stats: null,
	settings: {},
	formsValid: false,
};

const reducer = ( state = DEFAULT_STATE, action ) => {
	switch ( action.type ) {
		case SET_FORMS:
			return { ...state, forms: action.forms, formsValid: true };

		case SET_CURRENT_FORM:
			return { ...state, currentForm: action.form };

		case SET_STATS:
			return { ...state, stats: action.stats };

		case SET_SETTINGS:
			return { ...state, settings: action.settings };

		case INVALIDATE_FORMS:
			return { ...state, formsValid: false };

		default:
			return state;
	}
};

export default reducer;
