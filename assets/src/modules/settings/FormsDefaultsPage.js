import {
	Card,
	CardBody,
	ToggleControl,
	TextControl,
	__experimentalVStack as VStack,
	__experimentalHeading as Heading,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import SettingsShell from './SettingsShell';
import useSettings from './useSettings';

const FormsDefaultsPage = () => {
	const state = useSettings();
	const { settings, set } = state;

	return (
		<SettingsShell
			title={ __( 'Forms defaults', 'flowforms' ) }
			description={ __(
				'Default behaviour applied to every new form.',
				'flowforms'
			) }
			{ ...state }
			onSave={ () => state.save() }
		>
			<Card>
				<CardBody>
					<VStack spacing={ 4 }>
						<Heading level={ 3 }>
							{ __( 'Submissions', 'flowforms' ) }
						</Heading>
						<ToggleControl
							label={ __( 'Log IP addresses', 'flowforms' ) }
							help={ __(
								'Store submitter IP with each entry. Required for some spam providers.',
								'flowforms'
							) }
							checked={ !! settings?.ip_logging }
							onChange={ set( 'ip_logging' ) }
							__nextHasNoMarginBottom
						/>
						<ToggleControl
							label={ __(
								'Save partial submissions',
								'flowforms'
							) }
							help={ __(
								'Allow visitors to save and resume later via magic link.',
								'flowforms'
							) }
							checked={ !! settings?.allow_save_resume }
							onChange={ set( 'allow_save_resume' ) }
							__nextHasNoMarginBottom
						/>
						<TextControl
							label={ __(
								'Entry retention (days)',
								'flowforms'
							) }
							type="number"
							value={ settings?.retention_days ?? 0 }
							onChange={ ( v ) =>
								set( 'retention_days' )(
									parseInt( v, 10 ) || 0
								)
							}
							help={ __(
								'Delete entries older than this. 0 = never.',
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

export default FormsDefaultsPage;
