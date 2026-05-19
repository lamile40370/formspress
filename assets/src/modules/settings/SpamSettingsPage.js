import {
	Card,
	CardBody,
	SelectControl,
	TextControl,
	ToggleControl,
	TextareaControl,
	__experimentalVStack as VStack,
	__experimentalHeading as Heading,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import SettingsShell from './SettingsShell';
import useSettings from './useSettings';

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

	return (
		<SettingsShell
			title={ __( 'Spam & security', 'flowforms' ) }
			description={ __(
				'Block bots without burning real submitters.',
				'flowforms'
			) }
			{ ...state }
			onSave={ () => state.save() }
		>
			<Card>
				<CardBody>
					<VStack spacing={ 4 }>
						<Heading level={ 3 }>
							{ __( 'Anti-spam', 'flowforms' ) }
						</Heading>
						<SelectControl
							label={ __( 'Active provider', 'flowforms' ) }
							value={ spamProvider }
							options={ [
								{
									value: 'none',
									label: __(
										'None (honeypot only)',
										'flowforms'
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
						{ activeProviderDef?.settings?.map( ( f ) =>
							renderProviderField(
								f,
								spamConfig[ f.key ],
								setSpamConfig( f.key )
							)
						) }
					</VStack>
				</CardBody>
			</Card>
		</SettingsShell>
	);
};

export default SpamSettingsPage;
