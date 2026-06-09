import { __ } from '@wordpress/i18n';
import {
	styledGroup,
	heading,
	description,
	fieldText,
	fieldRadio,
	fieldNumber,
	submitButton,
} from './_helpers';

/**
 * RSVP — warm cream card, event-themed. Soft amber accents, friendly
 * voice. Used for weddings, birthdays, small events. Submit button
 * picks up the warm orange tone for a cohesive palette.
 */
export default {
	title: __( 'RSVP', 'formspress' ),
	description: __(
		'Event RSVP — warm cream card with attendance + party-size fields.',
		'formspress'
	),
	keywords: [ 'rsvp', 'event', 'invitation', 'attendance', 'guest' ],
	content: styledGroup( {
		bg: '#fffbeb',
		border: '#fde68a',
		borderWidth: '1px',
		radius: '16px',
		padding: '48px',
		maxWidth: '540px',
		inner: [
			heading( {
				text: __( 'Will you attend?', 'formspress' ),
				size: '30px',
				weight: '700',
				color: '#78350f',
			} ),
			description( {
				text: __(
					'Please let us know by Friday — we cannot wait to celebrate with you!',
					'formspress'
				),
				color: '#92400e',
				size: '15px',
				marginBottom: '24px',
			} ),
			fieldText( {
				label: __( 'Your name', 'formspress' ),
				required: true,
				placeholder: __( 'Jane & John Doe', 'formspress' ),
			} ),
			fieldRadio( {
				label: __( 'Attendance', 'formspress' ),
				required: true,
				options: [
					{
						label: __( "Yes, I'll be there", 'formspress' ),
						value: 'yes',
					},
					{
						label: __( "Sorry, can't make it", 'formspress' ),
						value: 'no',
					},
				],
			} ),
			fieldNumber( {
				label: __( 'Number of guests', 'formspress' ),
				defaultValue: '1',
				min: 1,
				max: 10,
			} ),
			submitButton( {
				text: __( 'Send RSVP', 'formspress' ),
				bg: '#d97706',
				fg: '#ffffff',
			} ),
		].join( '\n' ),
	} ),
};
