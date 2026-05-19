import { Snackbar } from '@wordpress/components';

const Toast = ( { notice, onRemove } ) => {
	const message = 'string' === typeof notice ? notice : notice?.message;
	const type = 'string' === typeof notice ? 'info' : notice?.type || 'info';

	if ( ! message ) {
		return null;
	}

	return (
		<div className={ `ff-admin-toast ff-admin-toast--${ type }` }>
			<Snackbar
				key={ `${ type }-${ message }` }
				onRemove={ onRemove }
				politeness={ 'error' === type ? 'assertive' : 'polite' }
			>
				{ message }
			</Snackbar>
		</div>
	);
};

export default Toast;
