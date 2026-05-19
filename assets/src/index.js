import { createRoot } from '@wordpress/element';
import domReady from '@wordpress/dom-ready';
import '@wordpress/format-library';
import App from './App';
import './store';
import './styles/main.scss';

domReady( () => {
	const container = document.getElementById( 'flowforms-app' );
	if ( container ) {
		const root = createRoot( container );
		root.render( <App /> );
	}
} );
