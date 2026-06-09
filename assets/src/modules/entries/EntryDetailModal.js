import { useState, useEffect } from '@wordpress/element';
import {
	Modal,
	Button,
	Spinner,
	SelectControl,
	__experimentalVStack as VStack,
	__experimentalHStack as HStack,
	__experimentalText as Text,
	__experimentalHeading as Heading,
} from '@wordpress/components';
import { __, sprintf } from '@wordpress/i18n';
import { get, patch } from '../../api/client';
import { entry as entryEndpoint, entryStatus } from '../../api/endpoints';

const STATUS_OPTIONS = [
	{ value: 'read', label: __( 'Read', 'formspress' ) },
	{ value: 'unread', label: __( 'Unread', 'formspress' ) },
	{ value: 'starred', label: __( 'Starred', 'formspress' ) },
	{ value: 'spam', label: __( 'Spam', 'formspress' ) },
	{ value: 'trash', label: __( 'Trash', 'formspress' ) },
];

const EntryDetailModal = ( { entryId, onClose, onStatusChange } ) => {
	const [ entry, setEntry ] = useState( null );
	const [ isLoading, setLoad ] = useState( true );
	const [ status, setStatus ] = useState( '' );
	const [ isSaving, setSaving ] = useState( false );

	useEffect( () => {
		setLoad( true );
		get( entryEndpoint( entryId ) )
			.then( ( res ) => {
				setEntry( res.data );
				setStatus( res.data?.status || 'read' );
			} )
			.finally( () => setLoad( false ) );
	}, [ entryId ] );

	const saveStatus = async () => {
		setSaving( true );
		try {
			await patch( entryStatus( entryId ), { status } );
			onStatusChange?.( entryId, status );
		} catch ( e ) {}
		setSaving( false );
	};

	return (
		<Modal
			title={ sprintf( __( 'Entry #%d', 'formspress' ), entryId ) }
			onRequestClose={ onClose }
			size="medium"
		>
			{ isLoading ? (
				<div style={ { padding: '32px', textAlign: 'center' } }>
					<Spinner />
				</div>
			) : (
				<VStack spacing={ 4 }>
					<HStack spacing={ 4 } style={ { flexWrap: 'wrap' } }>
						<Text variant="muted" size="small">
							{ __( 'Date:', 'formspress' ) }{ ' ' }
							{ new Date( entry?.created_at ).toLocaleString() }
						</Text>
						{ entry?.ip_address && (
							<Text variant="muted" size="small">
								{ __( 'IP:', 'formspress' ) }{ ' ' }
								{ entry.ip_address }
							</Text>
						) }
						{ entry?.source_url && (
							<Text variant="muted" size="small">
								{ __( 'Source:', 'formspress' ) }{ ' ' }
								{ entry.source_url }
							</Text>
						) }
					</HStack>

					<div className="ff-entry-values">
						{ ( entry?.values || [] ).map( ( val ) => (
							<div key={ val.id } className="ff-entry-value">
								<span className="ff-entry-value__label">
									{ val.field_label || val.field_id }
								</span>
								<span className="ff-entry-value__value">
									{ val.field_value || (
										<em style={ { color: '#757575' } }>
											{ __( '(empty)', 'formspress' ) }
										</em>
									) }
								</span>
							</div>
						) ) }
					</div>

					<HStack spacing={ 2 } justify="flex-start">
						<SelectControl
							label={ __( 'Status', 'formspress' ) }
							value={ status }
							options={ STATUS_OPTIONS }
							onChange={ setStatus }
							__nextHasNoMarginBottom
							__next40pxDefaultSize
							style={ { marginBottom: 0 } }
						/>
						<Button
							variant="secondary"
							onClick={ saveStatus }
							isBusy={ isSaving }
							disabled={ isSaving }
							style={ { marginTop: '24px' } }
						>
							{ __( 'Update', 'formspress' ) }
						</Button>
					</HStack>
				</VStack>
			) }
		</Modal>
	);
};

export default EntryDetailModal;
