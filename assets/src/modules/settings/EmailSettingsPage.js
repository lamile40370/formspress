import {
	Card,
	CardBody,
	TextControl,
	__experimentalVStack as VStack,
	__experimentalHeading as Heading,
	__experimentalText as Text,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import SettingsShell from './SettingsShell';
import useSettings from './useSettings';
import Badge from '../../components/Badge';

const getEmailDomain = ( email ) => {
	const parts = String( email || '' ).split( '@' );
	return parts.length === 2 && parts[ 1 ] ? parts[ 1 ] : '';
};

const isLikelyEmail = ( email ) =>
	/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test( String( email || '' ) );

const EmailSettingsPage = () => {
	const state = useSettings();
	const { settings, set } = state;
	const fromName = settings?.default_from_name || '';
	const fromEmail = settings?.default_from_email || '';
	const replyTo = settings?.default_reply_to || '';
	const notificationTo = settings?.default_notification_to || '';
	const senderReady = fromName.trim() && isLikelyEmail( fromEmail );
	const fromDomain = getEmailDomain( fromEmail );
	const replyToDisplay = replyTo || fromEmail;
	const notificationToDisplay = notificationTo || fromEmail;

	return (
		<SettingsShell
			title={ __( 'Email', 'formspress' ) }
			description={ __(
				'Default sender identity for notification and confirmation emails.',
				'formspress'
			) }
			{ ...state }
			onSave={ () => state.save() }
		>
			<div className="ff-email-settings">
				<section className="ff-email-settings__hero">
					<div>
						<Badge intent={ senderReady ? 'success' : 'warning' }>
							{ senderReady
								? __( 'Sender ready', 'formspress' )
								: __( 'Needs sender', 'formspress' ) }
						</Badge>
						<h2>{ __( 'Email identity', 'formspress' ) }</h2>
						<p>
							{ __(
								'Define the default headers used by notification and confirmation emails.',
								'formspress'
							) }
						</p>
					</div>
					<div className="ff-email-settings__metrics">
						<div>
							<strong>{ fromName || __( 'Not set', 'formspress' ) }</strong>
							<span>{ __( 'From name', 'formspress' ) }</span>
						</div>
						<div>
							<strong>
								{ fromDomain || __( 'No domain', 'formspress' ) }
							</strong>
							<span>{ __( 'Sending domain', 'formspress' ) }</span>
						</div>
						<div>
							<strong>
								{ replyTo ? __( 'Custom', 'formspress' ) : __( 'From email', 'formspress' ) }
							</strong>
							<span>{ __( 'Reply-to', 'formspress' ) }</span>
						</div>
					</div>
				</section>

				<div className="ff-email-settings__layout">
					<Card className="ff-email-settings__panel ff-email-settings__panel--wide">
						<CardBody>
							<VStack spacing={ 4 }>
								<div className="ff-email-settings__section-head">
									<div>
										<Heading level={ 3 }>
											{ __( 'Sender identity', 'formspress' ) }
										</Heading>
										<Text variant="muted">
											{ __(
												'Used when an email action does not override its own sender.',
												'formspress'
											) }
										</Text>
									</div>
								</div>
								<div className="ff-email-settings__fields ff-email-settings__fields--two">
									<TextControl
										label={ __( 'From name', 'formspress' ) }
										value={ fromName }
										onChange={ set( 'default_from_name' ) }
										placeholder={ __( 'Site name', 'formspress' ) }
										__nextHasNoMarginBottom
										__next40pxDefaultSize
									/>
									<TextControl
										label={ __( 'From email', 'formspress' ) }
										type="email"
										value={ fromEmail }
										onChange={ set( 'default_from_email' ) }
										placeholder="notifications@example.com"
										help={ __(
											'Use an address on a domain authorized by your SMTP provider.',
											'formspress'
										) }
										__nextHasNoMarginBottom
										__next40pxDefaultSize
									/>
								</div>
								<div className="ff-email-settings__fields ff-email-settings__fields--two">
									<TextControl
										label={ __( 'Reply-to', 'formspress' ) }
										type="email"
										value={ replyTo }
										onChange={ set( 'default_reply_to' ) }
										placeholder={ fromEmail || 'support@example.com' }
										help={ __(
											'Optional. Falls back to the From email when empty.',
											'formspress'
										) }
										__nextHasNoMarginBottom
										__next40pxDefaultSize
									/>
									<TextControl
										label={ __(
											'Notification recipient',
											'formspress'
										) }
										type="email"
										value={ notificationTo }
										onChange={ set(
											'default_notification_to'
										) }
										placeholder={ fromEmail || 'admin@example.com' }
										help={ __(
											'Default admin inbox for new email notification actions.',
											'formspress'
										) }
										__nextHasNoMarginBottom
										__next40pxDefaultSize
									/>
								</div>
							</VStack>
						</CardBody>
					</Card>

					<Card className="ff-email-settings__panel">
						<CardBody>
							<VStack spacing={ 4 }>
								<div className="ff-email-settings__section-head">
									<div>
										<Heading level={ 3 }>
											{ __( 'Header preview', 'formspress' ) }
										</Heading>
										<Text variant="muted">
											{ __(
												'What new notification emails will use by default.',
												'formspress'
											) }
										</Text>
									</div>
								</div>
								<div className="ff-email-settings__preview">
									<div>
										<span>{ __( 'From', 'formspress' ) }</span>
										<strong>
											{ fromName || __( 'Site name', 'formspress' ) }
											{ ' <' }
											{ fromEmail || 'notifications@example.com' }
											{ '>' }
										</strong>
									</div>
									<div>
										<span>{ __( 'Reply-To', 'formspress' ) }</span>
										<strong>{ replyToDisplay || 'support@example.com' }</strong>
									</div>
									<div>
										<span>{ __( 'To', 'formspress' ) }</span>
										<strong>{ notificationToDisplay || 'admin@example.com' }</strong>
									</div>
								</div>
							</VStack>
						</CardBody>
					</Card>

					<Card className="ff-email-settings__panel">
						<CardBody>
							<VStack spacing={ 4 }>
								<div className="ff-email-settings__section-head">
									<div>
										<Heading level={ 3 }>
											{ __( 'Deliverability', 'formspress' ) }
										</Heading>
										<Text variant="muted">
											{ __(
												'Quick checks before relying on production notifications.',
												'formspress'
											) }
										</Text>
									</div>
								</div>
								<ul className="ff-email-settings__checklist">
									<li className={ fromDomain ? 'is-ok' : '' }>
										<span />
										{ fromDomain
											? __( 'Sender domain is set.', 'formspress' )
											: __( 'Add a valid From email domain.', 'formspress' ) }
									</li>
									<li className={ senderReady ? 'is-ok' : '' }>
										<span />
										{ senderReady
											? __( 'Default sender is complete.', 'formspress' )
											: __( 'Set both From name and From email.', 'formspress' ) }
									</li>
									<li>
										<span />
										{ __(
											'Configure SPF, DKIM and DMARC in your mail provider.',
											'formspress'
										) }
									</li>
								</ul>
							</VStack>
						</CardBody>
					</Card>
				</div>
			</div>
		</SettingsShell>
	);
};

export default EmailSettingsPage;
