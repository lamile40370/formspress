import { useEffect, useState } from '@wordpress/element';
import {
	Button,
	Spinner,
	TextControl,
	ToggleControl,
	Icon,
} from '@wordpress/components';
import { copy, payment } from '@wordpress/icons';
import { __ } from '@wordpress/i18n';
import PageHeader from '../../components/PageHeader';
import Badge from '../../components/Badge';
import Toast from '../../components/Toast';
import { get, put } from '../../api/client';
import { SETTINGS } from '../../api/endpoints';

const WEBHOOK_ENDPOINT = '/wp-json/flowforms/v1/stripe/webhook';

/**
 * Slim wrapper around the global settings option — Stripe section.
 * We keep the source of truth on the existing `/settings` endpoint to
 * avoid spinning up a parallel option scheme; the page just scopes the
 * keys it cares about.
 */
const StripeSettingsPage = () => {
	const [ data, setData ] = useState( null );
	const [ saving, setSaving ] = useState( false );
	const [ notice, setNotice ] = useState( null );

	useEffect( () => {
		get( SETTINGS )
			.then( ( res ) => setData( res.data || {} ) )
			.catch( () => setData( {} ) );
	}, [] );

	const update = ( key ) => ( value ) =>
		setData( ( prev ) => ( { ...prev, [ key ]: value } ) );

	const save = async () => {
		setSaving( true );
		setNotice( null );
		try {
			await put( SETTINGS, data );
			setNotice( {
				type: 'success',
				message: __( 'Saved.', 'flowforms' ),
			} );
		} catch ( e ) {
			setNotice( {
				type: 'error',
				message: __( 'Could not save.', 'flowforms' ),
			} );
		} finally {
			setSaving( false );
		}
	};

	const copyEndpoint = () => {
		navigator.clipboard?.writeText( WEBHOOK_ENDPOINT );
		setNotice( {
			type: 'success',
			message: __( 'Webhook endpoint copied.', 'flowforms' ),
		} );
	};

	if ( null === data ) {
		return (
			<div className="ff-page ff-page--loading">
				<Spinner />
			</div>
		);
	}

	const isTestMode = !! data.stripe_test_mode;
	const publishableKeyLabel = isTestMode
		? __( 'Test publishable key', 'flowforms' )
		: __( 'Live publishable key', 'flowforms' );
	const secretKeyLabel = isTestMode
		? __( 'Test secret key', 'flowforms' )
		: __( 'Live secret key', 'flowforms' );
	const webhookSecretLabel = isTestMode
		? __( 'Test webhook signing secret', 'flowforms' )
		: __( 'Live webhook signing secret', 'flowforms' );
	const publishableKeyPlaceholder = isTestMode ? 'pk_test_...' : 'pk_live_...';
	const secretKeyPlaceholder = isTestMode ? 'sk_test_...' : 'sk_live_...';

	return (
		<PageHeader
			title={ __( 'Stripe', 'flowforms' ) }
			description={ __(
				'Hosted Checkout sessions — keys are stored in wp_options and never sent to the browser.',
				'flowforms'
			) }
			right={
				<Button
					variant="primary"
					isBusy={ saving }
					disabled={ saving }
					onClick={ save }
				>
					{ __( 'Save changes', 'flowforms' ) }
				</Button>
			}
		>
			<div className="ff-page__body ff-integration-settings-page">
				<Toast notice={ notice } onRemove={ () => setNotice( null ) } />

				<div className="ff-integration-settings">
					<section className="ff-integration-settings__panel">
						<div className="ff-integration-settings__header">
							<div
								className="ff-integration-settings__icon"
								aria-hidden="true"
							>
								<Icon icon={ payment } size={ 24 } />
							</div>
							<div className="ff-integration-settings__title">
								<h2>{ __( 'API credentials', 'flowforms' ) }</h2>
								<p>
									{ __(
										'Connect Stripe Checkout with the keys from your Stripe dashboard.',
										'flowforms'
									) }
								</p>
							</div>
							<Badge
								intent={ isTestMode ? 'warning' : 'success' }
							>
								{ isTestMode
									? __( 'Test mode', 'flowforms' )
									: __( 'Live mode', 'flowforms' ) }
							</Badge>
						</div>

						<div className="ff-integration-settings__body">
							<div className="ff-integration-settings__toggle">
								<ToggleControl
									label={ __( 'Test mode', 'flowforms' ) }
									help={ __(
										'Use test keys and route to the test Checkout sandbox.',
										'flowforms'
									) }
									checked={ !! data.stripe_test_mode }
									onChange={ update( 'stripe_test_mode' ) }
									__nextHasNoMarginBottom
								/>
							</div>

							<div className="ff-integration-settings__fields">
								<TextControl
									label={ publishableKeyLabel }
									value={ data.stripe_publishable_key || '' }
									onChange={ update(
										'stripe_publishable_key'
									) }
									placeholder={ publishableKeyPlaceholder }
									__nextHasNoMarginBottom
									__next40pxDefaultSize
								/>
								<TextControl
									label={ secretKeyLabel }
									type="password"
									value={ data.stripe_secret_key || '' }
									onChange={ update( 'stripe_secret_key' ) }
									placeholder={ secretKeyPlaceholder }
									__nextHasNoMarginBottom
									__next40pxDefaultSize
								/>
								<div className="ff-integration-settings__field-full">
									<TextControl
										label={ webhookSecretLabel }
										type="password"
										value={
											data.stripe_webhook_secret || ''
										}
										onChange={ update(
											'stripe_webhook_secret'
										) }
										placeholder="whsec_..."
										__nextHasNoMarginBottom
										__next40pxDefaultSize
									/>
								</div>
							</div>
						</div>
					</section>

					<aside className="ff-integration-settings__aside">
						<div className="ff-integration-settings__aside-card">
							<h3>{ __( 'Webhook endpoint', 'flowforms' ) }</h3>
							<p>
								{ __(
									'Use this endpoint in Stripe to receive Checkout payment updates.',
									'flowforms'
								) }
							</p>
							<div className="ff-integration-settings__endpoint">
								<code>{ WEBHOOK_ENDPOINT }</code>
								<Button
									variant="tertiary"
									icon={ copy }
									label={ __( 'Copy endpoint', 'flowforms' ) }
									onClick={ copyEndpoint }
								/>
							</div>
						</div>
					</aside>
				</div>
			</div>
		</PageHeader>
	);
};

export default StripeSettingsPage;
