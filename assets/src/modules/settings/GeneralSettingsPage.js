import {
	Card,
	CardBody,
	TextControl,
	ToggleControl,
	__experimentalVStack as VStack,
	__experimentalHeading as Heading,
	__experimentalText as Text,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import SettingsShell from './SettingsShell';
import useSettings from './useSettings';

const GeneralSettingsPage = () => {
	const state = useSettings();
	const { settings, set } = state;

	return (
		<SettingsShell
			title={ __( 'General', 'flowforms' ) }
			description={ __(
				'Site-wide FormsPress identity and high-level behaviour.',
				'flowforms'
			) }
			{ ...state }
			onSave={ () => state.save() }
		>
			<Card>
				<CardBody>
					<VStack spacing={ 4 }>
						<Heading level={ 3 }>
							{ __( 'Identity', 'flowforms' ) }
						</Heading>
						<TextControl
							label={ __( 'Plugin display name', 'flowforms' ) }
							help={ __(
								'Shown in admin headers and sidebar.',
								'flowforms'
							) }
							value={ settings?.brand_name || '' }
							onChange={ set( 'brand_name' ) }
							__nextHasNoMarginBottom
							__next40pxDefaultSize
						/>
						<ToggleControl
							label={ __(
								'Show "Powered by FormsPress" footer',
								'flowforms'
							) }
							checked={ !! settings?.show_branding }
							onChange={ set( 'show_branding' ) }
							__nextHasNoMarginBottom
						/>
					</VStack>
				</CardBody>
			</Card>

			<Card>
				<CardBody>
					<VStack spacing={ 2 }>
						<Heading level={ 3 }>
							{ __( 'Telemetry', 'flowforms' ) }
						</Heading>
						<Text variant="muted" size="small">
							{ __(
								'FormsPress does not collect any analytics about your site. The only outbound calls are the ones you configure under Integrations.',
								'flowforms'
							) }
						</Text>
					</VStack>
				</CardBody>
			</Card>
		</SettingsShell>
	);
};

export default GeneralSettingsPage;
