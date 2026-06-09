import { createRoot } from '@wordpress/element';
import domReady from '@wordpress/dom-ready';
import '@wordpress/format-library';
import * as dataviews from '@wordpress/dataviews';
import App from './App';
import './store';
import './styles/main.scss';

window.wp = window.wp || {};
window.wp.dataviews = window.wp.dataviews || dataviews;

domReady( () => {
	window.setTimeout( () => {
		const container = document.getElementById( 'flowforms-app' );
		if ( container ) {
			const root = createRoot( container );
			root.render( <App /> );
		}
	}, 0 );
} );
