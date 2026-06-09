import {
	Button,
	Card,
	CardBody,
	Notice,
	SelectControl,
	TextControl,
	ToggleControl,
	TextareaControl,
	ExternalLink,
	__experimentalVStack as VStack,
	__experimentalHeading as Heading,
	__experimentalText as Text,
} from '@wordpress/components';
import { __, sprintf } from '@wordpress/i18n';
import SettingsShell from './SettingsShell';
import useSettings from './useSettings';
import Badge from '../../components/Badge';

const PROVIDER_META = {
	none: {
		label: __( 'No external CAPTCHA', 'formspress' ),
		description: __(
			'Keep only the invisible built-in honeypot. Best for low-risk forms.',
			'formspress'
		),
		tag: __( 'Honeypot only', 'formspress' ),
		intent: 'warning',
	},
	recaptcha_v3: {
		tag: __( 'Invisible', 'formspress' ),
		intent: 'info',
	},
	turnstile: {
		tag: __( 'Recommended', 'formspress' ),
		intent: 'success',
	},
	hcaptcha: {
		tag: __( 'Privacy', 'formspress' ),
		intent: 'info',
	},
};

const SETUP_LINKS = {
	recaptcha_v3: 'https://www.google.com/recaptcha/admin/create',
	turnstile: 'https://dash.cloudflare.com/?to=/:account/turnstile',
	hcaptcha: 'https://dashboard.hcaptcha.com/sites',
};

const renderProviderField = ( field, value, onChange ) => {
	const common = {
		label: field.label,
		help: field.help,
		placeholder: field.placeholder,
		value: value ?? field.default ?? '',
		onChange,
		__nextHasNoMarginBottom: true,
		__next40pxDefaultSize: true,
	};
	switch ( field.type ) {
		case 'textarea':
			return <TextareaControl { ...common } rows={ field.rows ?? 4 } />;
		case 'select':
			return (
				<SelectControl { ...common } options={ field.options ?? [] } />
			);
		case 'toggle':
			return (
				<ToggleControl
					label={ field.label }
					help={ field.help }
					checked={ !! value }
					onChange={ onChange }
					__nextHasNoMarginBottom
				/>
			);
		case 'password':
			return <TextControl { ...common } type="password" />;
		case 'url':
			return <TextControl { ...common } type="url" />;
		case 'number':
			return (
				<TextControl
					{ ...common }
					type="number"
					min={ field.min }
					max={ field.max }
				/>
			);
		default:
			return <TextControl { ...common } />;
	}
};

const isFieldFilled = ( field, config ) => {
	if ( 'threshold' === field.key ) {
		return true;
	}
	const value = config?.[ field.key ];
	return undefined !== value && null !== value && '' !== String( value );
};

const providerStatus = ( provider, config ) => {
	if ( ! provider ) {
		return {
			intent: 'warning',
			label: __( 'Basic', 'formspress' ),
			message: __(
				'Built-in honeypot is active. Add a CAPTCHA provider when a form needs stronger verification.',
				'formspress'
			),
		};
	}

	const missing = ( provider.settings || [] ).filter(
		( field ) => ! isFieldFilled( field, config )
	);

	if ( missing.length ) {
		return {
			intent: 'warning',
			label: __( 'Needs keys', 'formspress' ),
			message: __(
				'Honeypot is active, but this CAPTCHA layer needs keys before it can verify submissions.',
				'formspress'
			),
		};
	}

	return {
		intent: 'success',
		label: __( 'Ready', 'formspress' ),
		message: __(
			'Honeypot and provider verification will both run on new submissions.',
			'formspress'
		),
	};
};

const providerCard = ( provider, activeId, onSelect, config ) => {
	const isNone = 'none' === provider.id;
	const isActive = activeId === provider.id;
	const meta = PROVIDER_META[ provider.id ] || {};
	const status = isActive
		? providerStatus( isNone ? null : provider, config )
		: null;

	return (
		<button
			key={ provider.id }
			type="button"
			className={ `ff-spam-provider-card${
				isActive ? ' is-active' : ''
			}` }
			onClick={ () => onSelect( provider.id ) }
			aria-pressed={ isActive }
		>
			<span className="ff-spam-provider-card__top">
				<span className="ff-spam-provider-card__name">
					{ provider.label }
				</span>
				<Badge intent={ meta.intent || 'default' }>
					{ meta.tag || __( 'Provider', 'formspress' ) }
				</Badge>
			</span>
			<span className="ff-spam-provider-card__description">
				{ provider.description }
			</span>
			<span className="ff-spam-provider-card__footer">
				<span>{ isActive ? __( 'Selected', 'formspress' ) : ' ' }</span>
				{ status && (
					<Badge intent={ status.intent }>{ status.label }</Badge>
				) }
			</span>
		</button>
	);
};

const SpamSettingsPage = () => {
	const state = useSettings();
	const { settings } = state;
	const spamProviders = window.flowFormsData?.spamProviders || [];

	const spamProvider = settings?.spam?.provider || 'none';
	const spamConfig = settings?.spam?.config || {};

	const setSpamProvider = ( id ) =>
		state.set( 'spam' )( { ...( settings?.spam || {} ), provider: id } );
	const setSpamConfig = ( key ) => ( val ) =>
		state.set( 'spam' )( {
			...( settings?.spam || {} ),
			config: { ...( settings?.spam?.config || {} ), [ key ]: val },
		} );

	const activeProviderDef = spamProviders.find(
		( p ) => p.id === spamProvider
	);
	const selectedProvider = activeProviderDef || null;
	const selectedStatus = providerStatus( selectedProvider, spamConfig );
	const protectionTitle = selectedProvider
		? sprintf(
				/* translators: %s: provider name. */
				__( 'Honeypot + %s', 'formspress' ),
				selectedProvider.label
		  )
		: __( 'Honeypot only', 'formspress' );
	const providerOptions = [
		{
			id: 'none',
			label: PROVIDER_META.none.label,
			description: PROVIDER_META.none.description,
			settings: [],
		},
		...spamProviders,
	];
	const configuredCount = spamProviders.filter(
		( provider ) =>
			0 ===
			( provider.settings || [] ).filter(
				( field ) => ! isFieldFilled( field, spamConfig )
			).length
	).length;

	return (
		<SettingsShell
			title={ __( 'Spam & security', 'formspress' ) }
			description={ __(
				'Block bots without burning real submitters.',
				'formspress'
			) }
			{ ...state }
			onSave={ () => state.save() }
		>
			<div className="ff-spam-settings">
				<section className="ff-spam-settings__hero">
					<div>
						<Badge intent={ selectedStatus.intent }>
							{ selectedStatus.label }
						</Badge>
						<Heading level={ 2 }>
							{ protectionTitle }
						</Heading>
						<Text>
							{ selectedStatus.message }
						</Text>
					</div>
					<div className="ff-spam-settings__metrics">
						<div>
							<strong>{ spamProviders.length }</strong>
							<span>{ __( 'CAPTCHAs', 'formspress' ) }</span>
						</div>
						<div>
							<strong>{ configuredCount }</strong>
							<span>{ __( 'Configured', 'formspress' ) }</span>
						</div>
						<div>
							<strong>
								{ selectedProvider
									? __( 'Trap + token', 'formspress' )
									: __( 'Trap', 'formspress' ) }
							</strong>
							<span>{ __( 'Layers', 'formspress' ) }</span>
						</div>
					</div>
				</section>

				<div className="ff-spam-settings__layout">
					<Card className="ff-spam-settings__panel">
						<CardBody>
							<VStack spacing={ 4 }>
								<div className="ff-spam-settings__section-head">
									<div>
										<Heading level={ 3 }>
											{ __( 'CAPTCHA layer', 'formspress' ) }
										</Heading>
										<Text variant="muted">
											{ __(
												'Honeypot is always included. Choose whether new forms also run a provider challenge.',
												'formspress'
											) }
										</Text>
									</div>
								</div>

								<div className="ff-spam-provider-grid">
									{ providerOptions.map( ( provider ) =>
										providerCard(
											provider,
											spamProvider,
											setSpamProvider,
											spamConfig
										)
									) }
								</div>

								<SelectControl
									className="ff-spam-settings__compact-select"
									label={ __( 'Active provider', 'formspress' ) }
									value={ spamProvider }
									options={ [
										{
											value: 'none',
											label: __(
												'No external CAPTCHA',
												'formspress'
											),
										},
										...spamProviders.map( ( p ) => ( {
											value: p.id,
											label: p.label,
										} ) ),
									] }
									onChange={ setSpamProvider }
									__nextHasNoMarginBottom
									__next40pxDefaultSize
								/>
							</VStack>
						</CardBody>
					</Card>

					<Card className="ff-spam-settings__panel">
						<CardBody>
							<VStack spacing={ 4 }>
								<div className="ff-spam-settings__section-head">
									<div>
										<Heading level={ 3 }>
											{ __( 'CAPTCHA setup', 'formspress' ) }
										</Heading>
										<Text variant="muted">
											{ selectedProvider
												? selectedProvider.description
												: __(
														'No external provider is selected. The built-in honeypot still runs on every form.',
														'formspress'
												  ) }
										</Text>
									</div>
									{ selectedProvider &&
										SETUP_LINKS[ selectedProvider.id ] && (
											<ExternalLink
												href={
													SETUP_LINKS[
														selectedProvider.id
													]
												}
											>
												{ __( 'Get keys', 'formspress' ) }
											</ExternalLink>
										) }
								</div>

								<Notice
									status={ selectedStatus.intent }
									isDismissible={ false }
								>
									{ selectedStatus.message }
								</Notice>

								{ selectedProvider ? (
									<div className="ff-spam-settings__fields">
										{ selectedProvider.settings?.map( ( f ) => (
											<div
												className="ff-spam-settings__field"
												key={ f.key }
											>
												{ renderProviderField(
													f,
													spamConfig[ f.key ],
													setSpamConfig( f.key )
												) }
											</div>
										) ) }
									</div>
								) : (
									<div className="ff-spam-settings__empty">
										<Heading level={ 4 }>
											{ __(
												'Built-in baseline is active',
												'formspress'
											) }
										</Heading>
										<Text>
											{ __(
												'Honeypot protection stays enabled for every form. Add Turnstile, reCAPTCHA or hCaptcha when you need server-side challenge verification as a second layer.',
												'formspress'
											) }
										</Text>
										<Button
											variant="secondary"
											onClick={ () =>
												setSpamProvider( 'turnstile' )
											}
										>
											{ __(
												'Use Cloudflare Turnstile',
												'formspress'
											) }
										</Button>
									</div>
								) }
							</VStack>
						</CardBody>
					</Card>
				</div>
			</div>
		</SettingsShell>
	);
};

export default SpamSettingsPage;
