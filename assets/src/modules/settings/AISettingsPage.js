/* eslint-disable @wordpress/no-unsafe-wp-apis */
import {
	Card,
	CardBody,
	Notice,
	SelectControl,
	TextControl,
	ToggleControl,
	RangeControl,
	__experimentalVStack as VStack,
	__experimentalHeading as Heading,
	__experimentalText as Text,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import SettingsShell from './SettingsShell';
import useSettings from './useSettings';
import Badge from '../../components/Badge';
import ProPush from '../../components/ProPush';

const OpenAILogo = () => (
	<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
		<path d="M21.6 10.62a6.73 6.73 0 0 0-.56-5.73 6.85 6.85 0 0 0-7.37-3.2 6.72 6.72 0 0 0-10.86 4.9A6.74 6.74 0 0 0 2.4 18.1a6.85 6.85 0 0 0 7.37 3.2 6.73 6.73 0 0 0 10.86-4.9 6.73 6.73 0 0 0 .97-5.78Zm-9.55 8.94a4.44 4.44 0 0 1-2.84-.99l.14-.08 4.72-2.73a1.14 1.14 0 0 0 .57-.98V8.1l1.99 1.15c.05.03.08.08.08.14v3.87a6.29 6.29 0 0 1-4.66 6.3Zm-7.7-2.59a4.43 4.43 0 0 1-.54-2.96l.14.08 4.72 2.73c.35.2.78.2 1.13 0l4.06-2.34v2.3a.15.15 0 0 1-.08.13l-3.36 1.94a4.43 4.43 0 0 1-6.07-1.88Zm-.36-9.07a4.43 4.43 0 0 1 2.3-1.98v5.6c0 .4.22.78.57.98l4.06 2.34-1.99 1.15a.15.15 0 0 1-.15 0l-3.35-1.94a4.43 4.43 0 0 1-1.44-6.15Zm13.16 3.6-4.06-2.34 1.99-1.15a.15.15 0 0 1 .15 0l3.35 1.94a4.43 4.43 0 0 1-.86 8.13v-5.6c0-.4-.22-.78-.57-.98Zm3.04-1.5-.14-.08-4.72-2.73a1.14 1.14 0 0 0-1.13 0l-4.06 2.34v-2.3c0-.06.03-.11.08-.14l3.36-1.94a4.43 4.43 0 0 1 6.61 4.85ZM9.36 15.9l-1.99-1.15a.15.15 0 0 1-.08-.14v-3.87a4.43 4.43 0 0 1 7.5-3.22l-.14.08-4.72 2.73c-.35.2-.57.58-.57.98v4.59Zm.78-5.47L12 9.36l1.86 1.07v2.14L12 13.64l-1.86-1.07v-2.14Z" />
	</svg>
);

const ClaudeLogo = () => (
	<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
		<path d="M12 2.4 14.42 9l6.78-2.1-4.36 5.1 4.36 5.1-6.78-2.1L12 21.6 9.58 15 2.8 17.1 7.16 12 2.8 6.9 9.58 9 12 2.4Z" />
	</svg>
);

const DeepSeekLogo = () => (
	<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
		<path d="M4.2 12.75c1.6-4.36 6.17-6.75 10.42-5.35 2.5.82 4.3 2.74 5.02 5.08.55-.88.9-1.86 1.05-2.92.04-.27.39-.35.55-.13 1.1 1.52 1.18 3.77.09 5.78-1.66 3.06-5.46 4.77-9.58 4.3-4.87-.56-8.35-3.15-7.55-6.76Zm4.06.04c.64 1.67 2.58 2.7 4.76 2.49 2.3-.22 4.04-1.72 4.04-3.48 0-.47-.13-.92-.36-1.33-.55 1.24-1.95 2.2-3.62 2.36-1.9.18-3.58-.66-4.22-2.01-.46.58-.68 1.26-.6 1.97Z" />
	</svg>
);

const GeminiLogo = () => (
	<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
		<path d="M12 2.5c.85 4.7 3.03 6.88 7.5 7.5-4.47.62-6.65 2.8-7.5 7.5-.85-4.7-3.03-6.88-7.5-7.5 4.47-.62 6.65-2.8 7.5-7.5Zm5.7 11.4c.38 2.1 1.34 3.06 3.3 3.3-1.96.24-2.92 1.2-3.3 3.3-.38-2.1-1.34-3.06-3.3-3.3 1.96-.24 2.92-1.2 3.3-3.3Z" />
	</svg>
);

const CustomLogo = () => (
	<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
		<path d="M8.7 16.3 3.9 12l4.8-4.3 1.35 1.5L6.95 12l3.1 2.8-1.35 1.5Zm6.6 0-1.35-1.5 3.1-2.8-3.1-2.8 1.35-1.5 4.8 4.3-4.8 4.3ZM11.1 18h-2l3.8-12h2l-3.8 12Z" />
	</svg>
);

const ProviderLogo = ( { provider } ) => {
	const Logo = provider.Logo || CustomLogo;

	return (
		<span className="ff-ai-settings__provider-logo">
			<Logo />
		</span>
	);
};

const modelOption = ( value, label = value ) => ( { label, value } );

const PROVIDERS = [
	{
		value: 'openai',
		label: __( 'OpenAI / GPT', 'formspress' ),
		shortLabel: __( 'OpenAI', 'formspress' ),
		description: __(
			'Best for complex form and copy workflows.',
			'formspress'
		),
		Logo: OpenAILogo,
		model: 'gpt-5.5',
		models: [
			modelOption( 'gpt-5.5', __( 'GPT-5.5', 'formspress' ) ),
			modelOption( 'gpt-5.5-pro', __( 'GPT-5.5 Pro', 'formspress' ) ),
			modelOption( 'gpt-5.4', __( 'GPT-5.4', 'formspress' ) ),
			modelOption( 'gpt-5.4-pro', __( 'GPT-5.4 Pro', 'formspress' ) ),
			modelOption( 'gpt-5.4-mini', __( 'GPT-5.4 Mini', 'formspress' ) ),
			modelOption( 'gpt-5.4-nano', __( 'GPT-5.4 Nano', 'formspress' ) ),
			modelOption( 'gpt-5-mini', __( 'GPT-5 Mini', 'formspress' ) ),
			modelOption( 'gpt-5-nano', __( 'GPT-5 Nano', 'formspress' ) ),
			modelOption( 'gpt-4.1', __( 'GPT-4.1', 'formspress' ) ),
		],
		endpoint: 'https://api.openai.com/v1',
	},
	{
		value: 'anthropic',
		label: __( 'Anthropic / Claude', 'formspress' ),
		shortLabel: __( 'Claude', 'formspress' ),
		description: __(
			'Strong reasoning and long-context prompts.',
			'formspress'
		),
		Logo: ClaudeLogo,
		model: 'claude-opus-4-7',
		models: [
			modelOption(
				'claude-opus-4-7',
				__( 'Claude Opus 4.7', 'formspress' )
			),
			modelOption(
				'claude-sonnet-4-6',
				__( 'Claude Sonnet 4.6', 'formspress' )
			),
			modelOption(
				'claude-haiku-4-5-20251001',
				__( 'Claude Haiku 4.5', 'formspress' )
			),
		],
		endpoint: 'https://api.anthropic.com/v1',
	},
	{
		value: 'deepseek',
		label: __( 'DeepSeek', 'formspress' ),
		shortLabel: __( 'DeepSeek', 'formspress' ),
		description: __(
			'Cost-effective everyday text generation.',
			'formspress'
		),
		Logo: DeepSeekLogo,
		model: 'deepseek-v4-pro',
		models: [
			modelOption(
				'deepseek-v4-pro',
				__( 'DeepSeek V4 Pro', 'formspress' )
			),
			modelOption(
				'deepseek-v4-flash',
				__( 'DeepSeek V4 Flash', 'formspress' )
			),
		],
		endpoint: 'https://api.deepseek.com',
	},
	{
		value: 'gemini',
		label: __( 'Google Gemini', 'formspress' ),
		shortLabel: __( 'Gemini', 'formspress' ),
		description: __( 'Fast Google AI models.', 'formspress' ),
		Logo: GeminiLogo,
		model: 'gemini-3.1-pro-preview',
		models: [
			modelOption(
				'gemini-3.1-pro-preview',
				__( 'Gemini 3.1 Pro Preview', 'formspress' )
			),
			modelOption(
				'gemini-3-flash-preview',
				__( 'Gemini 3 Flash Preview', 'formspress' )
			),
			modelOption(
				'gemini-3.1-flash-lite',
				__( 'Gemini 3.1 Flash-Lite', 'formspress' )
			),
			modelOption(
				'gemini-3.1-flash-lite-preview',
				__( 'Gemini 3.1 Flash-Lite Preview', 'formspress' )
			),
			modelOption(
				'gemini-2.5-pro',
				__( 'Gemini 2.5 Pro', 'formspress' )
			),
			modelOption(
				'gemini-2.5-flash',
				__( 'Gemini 2.5 Flash', 'formspress' )
			),
		],
		endpoint: 'https://generativelanguage.googleapis.com',
	},
	{
		value: 'custom',
		label: __( 'Custom OpenAI-compatible endpoint', 'formspress' ),
		shortLabel: __( 'Custom', 'formspress' ),
		description: __( 'Use a compatible gateway or proxy.', 'formspress' ),
		Logo: CustomLogo,
		model: 'gpt-5.5',
		models: [
			modelOption( 'gpt-5.5', __( 'GPT-5.5', 'formspress' ) ),
			modelOption( 'gpt-5.4', __( 'GPT-5.4', 'formspress' ) ),
			modelOption( 'gpt-5.4-mini', __( 'GPT-5.4 Mini', 'formspress' ) ),
			modelOption( 'gpt-oss-120b', __( 'GPT-OSS 120B', 'formspress' ) ),
			modelOption( 'gpt-oss-20b', __( 'GPT-OSS 20B', 'formspress' ) ),
		],
		endpoint: '',
	},
];

const getProvider = ( provider ) =>
	PROVIDERS.find( ( item ) => item.value === provider ) || PROVIDERS[ 0 ];

const getProviderModel = ( provider, model ) =>
	provider.models.some( ( item ) => item.value === model )
		? model
		: provider.model;

const getProviderStatusLabel = ( isActive, hasKey ) => {
	if ( ! isActive ) {
		return __( 'Available', 'formspress' );
	}

	return hasKey
		? __( 'API key stored', 'formspress' )
		: __( 'No API key', 'formspress' );
};

const AI_UPGRADE_URL =
	window.flowFormsData?.pro?.upgradeUrl ||
	window.flowFormsData?.pro?.pricingUrl;

const AISettingsPage = () => {
	const state = useSettings();
	const isAiAvailable = !! (
		window.flowFormsData?.features?.ai || window.flowFormsData?.pro?.active
	);
	const { settings, set } = state;
	const providerId = settings?.ai_provider || 'openai';
	const provider = getProvider( providerId );
	const enabled = !! settings?.ai_enabled;
	const hasKey = !! String( settings?.ai_api_key || '' ).trim();
	const model = getProviderModel( provider, settings?.ai_model );
	const endpoint = settings?.ai_endpoint || provider.endpoint;

	const setProvider = ( nextProvider ) => {
		const next = getProvider( nextProvider );
		set( 'ai_provider' )( nextProvider );
		if ( nextProvider !== providerId ) {
			set( 'ai_model' )( next.model );
			set( 'ai_endpoint' )( next.endpoint );
		}
	};

	if ( ! isAiAvailable ) {
		return (
			<ProPush
				title={ __( 'AI', 'formspress' ) }
				description={ __(
					'Generate forms, improve copy, summarize submissions, and qualify leads with FormsPress Pro.',
					'formspress'
				) }
				upgradeUrl={ AI_UPGRADE_URL }
			/>
		);
	}

	return (
		<SettingsShell
			title={ __( 'AI', 'formspress' ) }
			description={ __(
				'Connect an AI provider for form generation, copy suggestions, summaries, and lead qualification.',
				'formspress'
			) }
			{ ...state }
			onSave={ () => state.save( { ai_model: model } ) }
		>
			<div className="ff-ai-settings">
				<div className="ff-ai-settings__layout">
					<Card className="ff-ai-settings__panel ff-ai-settings__panel--wide">
						<CardBody>
							<VStack spacing={ 4 }>
								<div className="ff-ai-settings__section-head">
									<div>
										<Heading level={ 3 }>
											{ __(
												'Choose a provider',
												'formspress'
											) }
										</Heading>
										<Text variant="muted">
											{ __(
												'Select the AI service FormsPress should use, then add the model and API key below.',
												'formspress'
											) }
										</Text>
									</div>
									<Badge
										intent={
											enabled && hasKey
												? 'success'
												: 'warning'
										}
									>
										{ enabled && hasKey
											? __( 'AI ready', 'formspress' )
											: __(
													'Setup needed',
													'formspress'
											  ) }
									</Badge>
								</div>
								<ToggleControl
									label={ __(
										'Enable AI features',
										'formspress'
									) }
									help={ __(
										'Keeps all AI entry points disabled until a provider is configured.',
										'formspress'
									) }
									checked={ enabled }
									onChange={ set( 'ai_enabled' ) }
									__nextHasNoMarginBottom
								/>

								<div className="ff-ai-settings__provider-grid">
									{ PROVIDERS.map( ( item ) => {
										const isActive =
											item.value === providerId;

										return (
											<button
												key={ item.value }
												type="button"
												className={ `ff-ai-settings__provider-card${
													isActive ? ' is-active' : ''
												}` }
												onClick={ () =>
													setProvider( item.value )
												}
												aria-pressed={ isActive }
											>
												<ProviderLogo
													provider={ item }
												/>
												<span className="ff-ai-settings__provider-body">
													<strong>
														{ item.shortLabel }
													</strong>
													<span className="ff-ai-settings__provider-description">
														{ item.description }
													</span>
													<small>
														{ getProviderStatusLabel(
															isActive,
															hasKey
														) }
													</small>
												</span>
												{ isActive && (
													<span
														className="ff-ai-settings__provider-check"
														aria-hidden="true"
													/>
												) }
											</button>
										);
									} ) }
								</div>

								<div className="ff-ai-settings__config-card">
									<div className="ff-ai-settings__config-title">
										<ProviderLogo provider={ provider } />
										<Heading level={ 3 }>
											{ provider.shortLabel }{ ' ' }
											{ __(
												'Configuration',
												'formspress'
											) }
										</Heading>
									</div>
									<div className="ff-ai-settings__fields ff-ai-settings__fields--two">
										<SelectControl
											label={ __(
												'Model',
												'formspress'
											) }
											value={ model }
											onChange={ set( 'ai_model' ) }
											options={ provider.models }
											__nextHasNoMarginBottom
											__next40pxDefaultSize
										/>
										<TextControl
											label={ __(
												'API base URL',
												'formspress'
											) }
											type="url"
											value={ endpoint }
											onChange={ set( 'ai_endpoint' ) }
											placeholder={ provider.endpoint }
											help={ __(
												'Leave the default unless you use a proxy or compatible gateway.',
												'formspress'
											) }
											__nextHasNoMarginBottom
											__next40pxDefaultSize
										/>
									</div>
									<TextControl
										label={ __( 'API key', 'formspress' ) }
										type="password"
										value={ settings?.ai_api_key || '' }
										onChange={ set( 'ai_api_key' ) }
										placeholder="sk-..."
										help={ __(
											'Stored in WordPress options. Do not expose it in frontend code.',
											'formspress'
										) }
										__nextHasNoMarginBottom
										__next40pxDefaultSize
									/>
									<RangeControl
										label={ __(
											'Temperature',
											'formspress'
										) }
										value={ Number(
											settings?.ai_temperature ?? 0.3
										) }
										onChange={ set( 'ai_temperature' ) }
										min={ 0 }
										max={ 2 }
										step={ 0.1 }
										help={ __(
											'Lower values keep generations more predictable; higher values are more creative.',
											'formspress'
										) }
										__nextHasNoMarginBottom
										__next40pxDefaultSize
									/>
									{ ! hasKey && (
										<Notice
											status="warning"
											isDismissible={ false }
										>
											{ __(
												'No API key configured for this provider. AI features will stay unavailable until you add one.',
												'formspress'
											) }
										</Notice>
									) }
								</div>
							</VStack>
						</CardBody>
					</Card>
				</div>
			</div>
		</SettingsShell>
	);
};

export default AISettingsPage;
