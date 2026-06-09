import {
	Card,
	CardBody,
	ExternalLink,
	__experimentalVStack as VStack,
	__experimentalHeading as Heading,
	__experimentalText as Text,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import PageHeader from '../../components/PageHeader';

/**
 * Front-door for the GDPR machinery already shipped in the Privacy module:
 *   - wp_privacy_personal_data_exporters → DataExporter
 *   - wp_privacy_personal_data_erasers   → DataEraser
 *
 * We don't re-implement the WP tooling here — we just point users at the
 * native screens with one-click links + explain what FormsPress does.
 */
const PrivacyPage = () => {
	const adminUrl = window.flowFormsData?.adminUrl || '/wp-admin/';

	return (
		<PageHeader
			title={ __( 'Data privacy', 'formspress' ) }
			description={ __(
				"FormsPress is wired into WordPress's native GDPR tools — exports and erasure requests work out of the box.",
				'formspress'
			) }
		>
			<div className="ff-page__body">
				<VStack spacing={ 4 }>
					<Card>
						<CardBody>
							<VStack spacing={ 2 }>
								<Heading level={ 3 }>
									{ __(
										'Export personal data',
										'formspress'
									) }
								</Heading>
								<Text size="small">
									{ __(
										'Generates a downloadable ZIP containing every form submission tied to a given email address. Submitter data is included with field labels and original values.',
										'formspress'
									) }
								</Text>
								<ExternalLink
									href={ `${ adminUrl }export-personal-data.php` }
								>
									{ __(
										'Open WordPress export tool',
										'formspress'
									) }
								</ExternalLink>
							</VStack>
						</CardBody>
					</Card>

					<Card>
						<CardBody>
							<VStack spacing={ 2 }>
								<Heading level={ 3 }>
									{ __( 'Erase personal data', 'formspress' ) }
								</Heading>
								<Text size="small">
									{ __(
										'By default we anonymise instead of hard-deleting so analytics keep working: IP, user agent and personal field values are scrubbed. Set the filter "flowforms_privacy_erase_strategy" to "delete" if you need full row deletion.',
										'formspress'
									) }
								</Text>
								<ExternalLink
									href={ `${ adminUrl }erase-personal-data.php` }
								>
									{ __(
										'Open WordPress erase tool',
										'formspress'
									) }
								</ExternalLink>
							</VStack>
						</CardBody>
					</Card>

					<Card>
						<CardBody>
							<VStack spacing={ 2 }>
								<Heading level={ 3 }>
									{ __(
										'Suggested privacy policy text',
										'formspress'
									) }
								</Heading>
								<Text size="small">
									{ __(
										'FormsPress also contributes a ready-made section to the WordPress Privacy Policy editor explaining what data we collect on submissions. You can copy it into your own policy from there.',
										'formspress'
									) }
								</Text>
								<ExternalLink
									href={ `${ adminUrl }options-privacy.php?tab=policyguide` }
								>
									{ __(
										'Open privacy policy guide',
										'formspress'
									) }
								</ExternalLink>
							</VStack>
						</CardBody>
					</Card>
				</VStack>
			</div>
		</PageHeader>
	);
};

export default PrivacyPage;
