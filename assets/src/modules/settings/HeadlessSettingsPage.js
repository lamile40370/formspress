import {
	Card,
	CardBody,
	ToggleControl,
	TextareaControl,
	__experimentalVStack as VStack,
	__experimentalHeading as Heading,
	__experimentalText as Text,
	ExternalLink,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import SettingsShell from './SettingsShell';
import useSettings from './useSettings';

const HeadlessSettingsPage = () => {
	const state = useSettings();
	const { settings, set } = state;

	return (
		<SettingsShell
			title={ __( 'Headless API', 'flowforms' ) }
			description={ __(
				'CORS + public-token bearer auth for decoupled frontends.',
				'flowforms'
			) }
			{ ...state }
			onSave={ () => state.save() }
		>
			<Card>
				<CardBody>
					<VStack spacing={ 4 }>
						<Heading level={ 3 }>
							{ __( 'Headless mode', 'flowforms' ) }
						</Heading>
						<ToggleControl
							label={ __(
								'Enable headless submission',
								'flowforms'
							) }
							help={ __(
								'Adds CORS headers and accepts ff_pub_<token> bearer auth for public form submissions.',
								'flowforms'
							) }
							checked={ !! settings?.headless_mode }
							onChange={ set( 'headless_mode' ) }
							__nextHasNoMarginBottom
						/>
						<TextareaControl
							label={ __( 'Allowed CORS origins', 'flowforms' ) }
							help={ __(
								'One origin per line. Use * for any (dev only).',
								'flowforms'
							) }
							value={ settings?.cors_origins ?? '*' }
							onChange={ set( 'cors_origins' ) }
							rows={ 4 }
							placeholder="https://app.example.com"
							__nextHasNoMarginBottom
						/>
						<Text variant="muted" size="small">
							{ __( 'Full reference:', 'flowforms' ) }{ ' ' }
							<ExternalLink href="https://flowforms.test/docs/headless">
								{ __( 'Headless API guide', 'flowforms' ) }
							</ExternalLink>
						</Text>
					</VStack>
				</CardBody>
			</Card>
		</SettingsShell>
	);
};

export default HeadlessSettingsPage;
