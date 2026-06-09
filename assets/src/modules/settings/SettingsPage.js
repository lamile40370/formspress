import { useState, useEffect } from '@wordpress/element';
import {
	Button,
	Spinner,
	TextControl,
	ToggleControl,
	SelectControl,
	TextareaControl,
	Card,
	CardBody,
	__experimentalVStack as VStack,
	__experimentalHeading as Heading,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { get, put } from '../../api/client';
import { SETTINGS } from '../../api/endpoints';
import PageHeader from '../../components/PageHeader';
import Toast from '../../components/Toast';

const SettingField = ( { field, value, onChange } ) => {
	const fallback = field.default ?? ( 'toggle' === field.type ? false : '' );
	const current = value ?? fallback;

	const common = {
		label: field.label,
		help: field.help,
		placeholder: field.placeholder,
		value: current,
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
					onChange={ ( v ) =>
						onChange( v === '' ? '' : Number( v ) )
					}
				/>
			);
		case 'text':
		default:
			return <TextControl { ...common } />;
	}
};

const SettingsPage = () => {
	const [ settings, setSettings ] = useState( null );
	const [ isLoading, setLoading ] = useState( true );
	const [ isSaving, setSaving ] = useState( false );
	const [ notice, setNotice ] = useState( null );

	const spamProviders = window.flowFormsData?.spamProviders || [];

	useEffect( () => {
		get( SETTINGS )
			.then( ( res ) => setSettings( res.data ) )
			.finally( () => setLoading( false ) );
	}, [] );

	const handleSave = async () => {
		setSaving( true );
		try {
			await put( SETTINGS, settings );
			setNotice( {
				type: 'success',
				message: __( 'Settings saved.', 'formspress' ),
			} );
		} catch ( e ) {
			setNotice( {
				type: 'error',
				message:
					e.message || __( 'Failed to save settings.', 'formspress' ),
			} );
		} finally {
			setSaving( false );
		}
	};

	const set = ( key ) => ( value ) =>
		setSettings( ( s ) => ( { ...s, [ key ]: value } ) );

	const spamProvider = settings?.spam?.provider || 'none';
	const spamConfig = settings?.spam?.config || {};

	const setSpamProvider = ( id ) =>
		setSettings( ( s ) => ( {
			...s,
			spam: { ...( s.spam || {} ), provider: id },
		} ) );

	const setSpamConfig = ( key ) => ( val ) =>
		setSettings( ( s ) => ( {
			...s,
			spam: {
				...( s.spam || {} ),
				config: { ...( s.spam?.config || {} ), [ key ]: val },
			},
		} ) );

	if ( isLoading )
		return (
			<div className="ff-page ff-page--loading">
				<Spinner />
			</div>
		);

	const activeProviderDef = spamProviders.find(
		( p ) => p.id === spamProvider
	);

	return (
		<PageHeader
			title={ __( 'Settings', 'formspress' ) }
			description={ __( 'Configure FormsPress global settings.', 'formspress' ) }
			hideBack
			right={
				<Button
					variant="primary"
					onClick={ handleSave }
					isBusy={ isSaving }
					disabled={ isSaving }
				>
					{ __( 'Save Settings', 'formspress' ) }
				</Button>
			}
		>
			<div className="ff-page__body">
				<Toast notice={ notice } onRemove={ () => setNotice( null ) } />

				<VStack spacing={ 4 }>
					<Card>
						<CardBody>
							<VStack spacing={ 4 }>
								<Heading level={ 4 }>
									{ __( 'Email Defaults', 'formspress' ) }
								</Heading>
								<TextControl
									label={ __(
										'Default "From" Name',
										'formspress'
									) }
									value={ settings?.default_from_name || '' }
									onChange={ set( 'default_from_name' ) }
									__nextHasNoMarginBottom
									__next40pxDefaultSize
								/>
								<TextControl
									label={ __(
										'Default "From" Email',
										'formspress'
									) }
									type="email"
									value={ settings?.default_from_email || '' }
									onChange={ set( 'default_from_email' ) }
									__nextHasNoMarginBottom
									__next40pxDefaultSize
								/>
							</VStack>
						</CardBody>
					</Card>

					<Card>
						<CardBody>
							<VStack spacing={ 4 }>
								<Heading level={ 4 }>
									{ __( 'Privacy & Data', 'formspress' ) }
								</Heading>
								<ToggleControl
									label={ __(
										'Log IP addresses',
										'formspress'
									) }
									help={ __(
										'Store submitter IP address with each entry.',
										'formspress'
									) }
									checked={ !! settings?.ip_logging }
									onChange={ set( 'ip_logging' ) }
									__nextHasNoMarginBottom
								/>
								<TextControl
									label={ __(
										'Entry retention (days)',
										'formspress'
									) }
									type="number"
									value={ settings?.retention_days ?? 0 }
									onChange={ ( v ) =>
										set( 'retention_days' )(
											parseInt( v, 10 ) || 0
										)
									}
									help={ __(
										'Automatically delete entries older than this many days. 0 = keep forever.',
										'formspress'
									) }
									__nextHasNoMarginBottom
									__next40pxDefaultSize
								/>
							</VStack>
						</CardBody>
					</Card>

					<Card>
						<CardBody>
							<VStack spacing={ 4 }>
								<Heading level={ 4 }>
									{ __( 'Headless API', 'formspress' ) }
								</Heading>
								<ToggleControl
									label={ __(
										'Enable headless mode',
										'formspress'
									) }
									help={ __(
										'Adds CORS headers and accepts ff_pub_<token> bearer auth for public form submissions.',
										'formspress'
									) }
									checked={ !! settings?.headless_mode }
									onChange={ set( 'headless_mode' ) }
									__nextHasNoMarginBottom
								/>
								<TextareaControl
									label={ __(
										'Allowed CORS origins',
										'formspress'
									) }
									help={ __(
										'One origin per line. Use * for any (dev only).',
										'formspress'
									) }
									value={ settings?.cors_origins ?? '*' }
									onChange={ set( 'cors_origins' ) }
									rows={ 4 }
									placeholder="https://app.example.com"
									__nextHasNoMarginBottom
								/>
								<p
									style={ {
										margin: 0,
										color: '#757575',
										fontSize: 12,
									} }
								>
									{ __(
										'See docs/HEADLESS.md for the full reference.',
										'formspress'
									) }
								</p>
							</VStack>
						</CardBody>
					</Card>

					<Card>
						<CardBody>
							<VStack spacing={ 4 }>
								<Heading level={ 4 }>
									{ __( 'Anti-spam', 'formspress' ) }
								</Heading>
								<SelectControl
									label={ __(
										'Active provider',
										'formspress'
									) }
									value={ spamProvider }
									options={ [
										{
											value: 'none',
											label: __(
												'None (honeypot only)',
												'formspress'
											),
										},
										...spamProviders.map( ( p ) => ( {
											value: p.id,
											label: p.label,
										} ) ),
									] }
									onChange={ setSpamProvider }
									help={ activeProviderDef?.description }
									__nextHasNoMarginBottom
									__next40pxDefaultSize
								/>
								{ activeProviderDef?.settings?.map( ( f ) => (
									<SettingField
										key={ f.key }
										field={ f }
										value={ spamConfig[ f.key ] }
										onChange={ setSpamConfig( f.key ) }
									/>
								) ) }
							</VStack>
						</CardBody>
					</Card>
				</VStack>
			</div>
		</PageHeader>
	);
};

export default SettingsPage;
