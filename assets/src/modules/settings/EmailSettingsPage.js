import {
	Card,
	CardBody,
	TextControl,
	__experimentalVStack as VStack,
	__experimentalHeading as Heading,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import SettingsShell from './SettingsShell';
import useSettings from './useSettings';

const EmailSettingsPage = () => {
	const state = useSettings();
	const { settings, set } = state;

	return (
		<SettingsShell
			title={ __( 'Email', 'flowforms' ) }
			description={ __(
				'Default sender identity for notification and confirmation emails.',
				'flowforms'
			) }
			{ ...state }
			onSave={ () => state.save() }
		>
			<Card>
				<CardBody>
					<VStack spacing={ 4 }>
						<Heading level={ 3 }>
							{ __( 'Default sender', 'flowforms' ) }
						</Heading>
						<TextControl
							label={ __( 'From name', 'flowforms' ) }
							value={ settings?.default_from_name || '' }
							onChange={ set( 'default_from_name' ) }
							__nextHasNoMarginBottom
							__next40pxDefaultSize
						/>
						<TextControl
							label={ __( 'From email', 'flowforms' ) }
							type="email"
							value={ settings?.default_from_email || '' }
							onChange={ set( 'default_from_email' ) }
							__nextHasNoMarginBottom
							__next40pxDefaultSize
						/>
						<TextControl
							label={ __( 'Reply-to', 'flowforms' ) }
							type="email"
							value={ settings?.default_reply_to || '' }
							onChange={ set( 'default_reply_to' ) }
							help={ __(
								'Optional. Falls back to the From email when empty.',
								'flowforms'
							) }
							__nextHasNoMarginBottom
							__next40pxDefaultSize
						/>
					</VStack>
				</CardBody>
			</Card>
		</SettingsShell>
	);
};

export default EmailSettingsPage;
