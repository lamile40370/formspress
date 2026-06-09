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
			title={ __( 'Headless API', 'formspress' ) }
			description={ __(
				'CORS + public-token bearer auth for decoupled frontends.',
				'formspress'
			) }
			{ ...state }
			onSave={ () => state.save() }
		>
			<Card>
				<CardBody>
					<VStack spacing={ 4 }>
						<Heading level={ 3 }>
							{ __( 'Headless mode', 'formspress' ) }
						</Heading>
						<ToggleControl
							label={ __(
								'Enable headless submission',
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
						<ToggleControl
							label={ __( 'Require public submission token', 'formspress' ) }
							help={ __(
								'Reject anonymous REST submissions unless they include a valid per-form ff_pub token.',
								'formspress'
							) }
							checked={ !! settings?.headless_require_token }
							onChange={ set( 'headless_require_token' ) }
							__nextHasNoMarginBottom
						/>
						<TextareaControl
							label={ __( 'Allowed CORS origins', 'formspress' ) }
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
						<Text variant="muted" size="small">
							{ __( 'Full reference:', 'formspress' ) }{ ' ' }
							<ExternalLink href="https://flowforms.test/docs/headless">
								{ __( 'Headless API guide', 'formspress' ) }
							</ExternalLink>
						</Text>
					</VStack>
				</CardBody>
			</Card>
		</SettingsShell>
	);
};

export default HeadlessSettingsPage;
