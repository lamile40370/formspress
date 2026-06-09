import {
	Button,
	Card,
	CardBody,
	SelectControl,
	TextareaControl,
	ToggleControl,
	TextControl,
	__experimentalVStack as VStack,
	__experimentalHeading as Heading,
	__experimentalText as Text,
} from '@wordpress/components';
import { __, sprintf } from '@wordpress/i18n';
import SettingsShell from './SettingsShell';
import useSettings from './useSettings';
import Badge from '../../components/Badge';

const RETENTION_PRESETS = [
	{ value: 0, label: __( 'Never', 'formspress' ) },
	{ value: 30, label: __( '30 days', 'formspress' ) },
	{ value: 90, label: __( '90 days', 'formspress' ) },
	{ value: 365, label: __( '1 year', 'formspress' ) },
];

const intValue = ( value ) => {
	const parsed = parseInt( value, 10 );
	return Number.isFinite( parsed ) && parsed > 0 ? parsed : 0;
};

const FormsDefaultsPage = () => {
	const state = useSettings();
	const { settings, set } = state;
	const retentionDays = intValue( settings?.retention_days );
	const submitLabel =
		settings?.default_submit_label || __( 'Submit', 'formspress' );
	const successAction = settings?.default_success_action || 'message';

	const setRetention = ( value ) => set( 'retention_days' )( intValue( value ) );

	return (
		<SettingsShell
			title={ __( 'Forms defaults', 'formspress' ) }
			description={ __(
				'Default behaviour applied to every new form.',
				'formspress'
			) }
			{ ...state }
			onSave={ () => state.save() }
		>
			<div className="ff-forms-defaults">
				<section className="ff-forms-defaults__hero">
					<div>
						<Badge intent="info">
							{ __( 'Applied on creation', 'formspress' ) }
						</Badge>
						<h2>{ __( 'New form baseline', 'formspress' ) }</h2>
						<p>
							{ __(
								'Set the behaviour every blank form and template inherits before each form is customized.',
								'formspress'
							) }
						</p>
					</div>
					<div className="ff-forms-defaults__metrics">
						<div>
							<strong>{ submitLabel }</strong>
							<span>{ __( 'Submit label', 'formspress' ) }</span>
						</div>
						<div>
							<strong>
								{ 'redirect' === successAction
									? __( 'Redirect', 'formspress' )
									: __( 'Message', 'formspress' ) }
							</strong>
							<span>{ __( 'After submit', 'formspress' ) }</span>
						</div>
						<div>
							<strong>
								{ retentionDays
									? sprintf(
											__( '%d days', 'formspress' ),
											retentionDays
									  )
									: __( 'Never', 'formspress' ) }
							</strong>
							<span>{ __( 'Retention', 'formspress' ) }</span>
						</div>
					</div>
				</section>

				<div className="ff-forms-defaults__layout">
					<Card className="ff-forms-defaults__panel ff-forms-defaults__panel--wide">
						<CardBody>
							<VStack spacing={ 4 }>
								<div className="ff-forms-defaults__section-head">
									<div>
										<Heading level={ 3 }>
											{ __(
												'Submission experience',
												'formspress'
											) }
										</Heading>
										<Text variant="muted">
											{ __(
												'Copy and navigation defaults used by newly created forms.',
												'formspress'
											) }
										</Text>
									</div>
									<Badge>{ __( 'Per form editable', 'formspress' ) }</Badge>
								</div>
								<div className="ff-forms-defaults__fields ff-forms-defaults__fields--two">
									<TextControl
										label={ __(
											'Submit button label',
											'formspress'
										) }
										value={ settings?.default_submit_label ?? '' }
										placeholder={ __( 'Submit', 'formspress' ) }
										onChange={ set( 'default_submit_label' ) }
										__nextHasNoMarginBottom
										__next40pxDefaultSize
									/>
									<SelectControl
										label={ __(
											'After submission',
											'formspress'
										) }
										value={ successAction }
										options={ [
											{
												value: 'message',
												label: __(
													'Show a success message',
													'formspress'
												),
											},
											{
												value: 'redirect',
												label: __(
													'Redirect to a URL',
													'formspress'
												),
											},
										] }
										onChange={ set( 'default_success_action' ) }
										__nextHasNoMarginBottom
										__next40pxDefaultSize
									/>
								</div>
								{ 'redirect' === successAction ? (
									<TextControl
										label={ __( 'Redirect URL', 'formspress' ) }
										type="url"
										value={ settings?.default_redirect_url ?? '' }
										placeholder="https://example.com/thanks"
										onChange={ set( 'default_redirect_url' ) }
										help={ __(
											'New forms will redirect here after a successful submission.',
											'formspress'
										) }
										__nextHasNoMarginBottom
										__next40pxDefaultSize
									/>
								) : (
									<TextareaControl
										label={ __(
											'Success message',
											'formspress'
										) }
										value={
											settings?.default_success_message ?? ''
										}
										placeholder={ __(
											'Thank you! Your submission has been received.',
											'formspress'
										) }
										onChange={ set( 'default_success_message' ) }
										rows={ 3 }
										__nextHasNoMarginBottom
									/>
								) }
								<div className="ff-forms-defaults__fields ff-forms-defaults__fields--two">
									<TextControl
										label={ __(
											'Previous step label',
											'formspress'
										) }
										value={ settings?.default_prev_label ?? '' }
										placeholder={ __( 'Back', 'formspress' ) }
										onChange={ set( 'default_prev_label' ) }
										help={ __(
											'Used by multi-step and flow forms.',
											'formspress'
										) }
										__nextHasNoMarginBottom
										__next40pxDefaultSize
									/>
									<TextControl
										label={ __( 'Next step label', 'formspress' ) }
										value={ settings?.default_next_label ?? '' }
										placeholder={ __( 'Next', 'formspress' ) }
										onChange={ set( 'default_next_label' ) }
										help={ __(
											'Used by multi-step and flow forms.',
											'formspress'
										) }
										__nextHasNoMarginBottom
										__next40pxDefaultSize
									/>
								</div>
							</VStack>
						</CardBody>
					</Card>

					<Card className="ff-forms-defaults__panel">
						<CardBody>
							<VStack spacing={ 4 }>
								<div className="ff-forms-defaults__section-head">
									<div>
										<Heading level={ 3 }>
											{ __(
												'Submissions and privacy',
												'formspress'
											) }
										</Heading>
										<Text variant="muted">
											{ __(
												'Control entry metadata and automatic cleanup.',
												'formspress'
											) }
										</Text>
									</div>
								</div>
								<ToggleControl
									label={ __( 'Log IP addresses', 'formspress' ) }
									help={ __(
										'Store submitter IP with each entry. Required for some spam providers.',
										'formspress'
									) }
									checked={ !! settings?.ip_logging }
									onChange={ set( 'ip_logging' ) }
									__nextHasNoMarginBottom
								/>
								<div>
									<TextControl
										label={ __(
											'Entry retention',
											'formspress'
										) }
										type="number"
										min="0"
										value={ retentionDays }
										onChange={ setRetention }
										help={ __(
											'Delete entries older than this many days. 0 keeps entries forever.',
											'formspress'
										) }
										__nextHasNoMarginBottom
										__next40pxDefaultSize
									/>
									<div className="ff-forms-defaults__preset-row">
										{ RETENTION_PRESETS.map( ( preset ) => (
											<Button
												key={ preset.value }
												variant={
													retentionDays === preset.value
														? 'primary'
														: 'secondary'
												}
												onClick={ () =>
													setRetention( preset.value )
												}
											>
												{ preset.label }
											</Button>
										) ) }
									</div>
								</div>
							</VStack>
						</CardBody>
					</Card>
				</div>
			</div>
		</SettingsShell>
	);
};

export default FormsDefaultsPage;
