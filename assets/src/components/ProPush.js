import {
	Button,
	Icon,
	__experimentalHStack as HStack,
	__experimentalVStack as VStack,
	__experimentalHeading as Heading,
	__experimentalText as Text,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { external, lock } from '@wordpress/icons';

const DEFAULT_UPGRADE_URL = 'https://example.com/formspress-pro';

const ProPush = ( {
	title,
	description,
	upgradeUrl = DEFAULT_UPGRADE_URL,
	feature = __( 'Pro', 'formspress' ),
} ) => {
	return (
		<div className="ff-pro-push">
			<VStack
				alignment="center"
				spacing={ 4 }
				className="ff-pro-push__inner"
			>
				<Icon icon={ lock } size={ 24 } className="ff-pro-push__icon" />
				<HStack
					alignment="center"
					justify="center"
					spacing={ 3 }
					className="ff-pro-push__title-row"
				>
					<Heading level={ 3 }>{ title }</Heading>
					<span className="ff-pro-push__badge">{ feature }</span>
				</HStack>
				<Text
					variant="muted"
					size="small"
					className="ff-pro-push__description"
				>
					{ description }
				</Text>
				<Button
					variant="primary"
					size="compact"
					href={ upgradeUrl }
					target="_blank"
					rel="noreferrer"
					icon={ external }
					className="ff-pro-push__button"
				>
					{ __( 'Upgrade to Pro', 'formspress' ) }
				</Button>
				<Text
					variant="muted"
					size="small"
					className="ff-pro-push__note"
				>
					{ __(
						'Already have Pro? Make sure the Pro plugin is installed and activated.',
						'formspress'
					) }
				</Text>
			</VStack>
		</div>
	);
};

export default ProPush;
