import {
	Button,
	__experimentalVStack as VStack,
	__experimentalHeading as Heading,
	__experimentalText as Text,
} from '@wordpress/components';

const EmptyState = ( { icon, title, description, action, actionLabel } ) => (
	<VStack
		alignment="center"
		spacing={ 4 }
		style={ { padding: '64px 32px', textAlign: 'center' } }
	>
		{ icon && (
			<span
				className={ `dashicons dashicons-${ icon }` }
				style={ {
					fontSize: '48px',
					width: '48px',
					height: '48px',
					color: '#c3c4c7',
				} }
			/>
		) }
		<Heading level={ 4 }>{ title }</Heading>
		{ description && <Text variant="muted">{ description }</Text> }
		{ action && actionLabel && (
			<Button variant="primary" onClick={ action }>
				{ actionLabel }
			</Button>
		) }
	</VStack>
);

export default EmptyState;
