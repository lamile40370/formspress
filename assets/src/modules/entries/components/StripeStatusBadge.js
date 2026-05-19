/**
 * Stripe payment-status badge for the Entries list.
 *
 * Renders a small colored pill reflecting `entry.meta.stripe_status`
 * (one of: pending, paid, failed). Returns null when the entry has no
 * Stripe meta — keeps the column empty for forms without payments.
 */
import { __ } from '@wordpress/i18n';

const STYLES = {
	pending: {
		bg: '#fff8e1',
		fg: '#7a5b00',
		border: '#f5c518',
		label: __( 'Pending', 'flowforms' ),
	},
	paid: {
		bg: '#e7f5ec',
		fg: '#1c6b3a',
		border: '#46b876',
		label: __( 'Paid', 'flowforms' ),
	},
	failed: {
		bg: '#fbeaea',
		fg: '#a31515',
		border: '#cc1818',
		label: __( 'Failed', 'flowforms' ),
	},
};

const StripeStatusBadge = ( { entry } ) => {
	const status = entry && entry.meta ? entry.meta.stripe_status : null;
	if ( ! status ) return null;
	const cfg = STYLES[ status ];
	if ( ! cfg ) return null;
	return (
		<span
			className="ff-stripe-badge"
			data-status={ status }
			style={ {
				display: 'inline-block',
				padding: '2px 8px',
				borderRadius: 10,
				fontSize: 11,
				fontWeight: 500,
				background: cfg.bg,
				color: cfg.fg,
				border: '1px solid ' + cfg.border,
			} }
		>
			{ cfg.label }
		</span>
	);
};

export default StripeStatusBadge;
