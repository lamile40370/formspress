import { useState } from '@wordpress/element';
import {
	Card,
	CardBody,
	CardFooter,
	Button,
	FormFileUpload,
	__experimentalVStack as VStack,
	__experimentalHStack as HStack,
	__experimentalHeading as Heading,
	__experimentalText as Text,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import PageHeader from '../../components/PageHeader';
import Toast from '../../components/Toast';
import { get, post } from '../../api/client';
import { FORMS } from '../../api/endpoints';

const ImportExportPage = () => {
	const [ notice, setNotice ] = useState( null );
	const [ busy, setBusy ] = useState( false );

	const onExport = async () => {
		setBusy( true );
		try {
			const res = await get( FORMS, { per_page: 999, include_full: 1 } );
			const blob = new Blob(
				[
					JSON.stringify(
						{
							version: 1,
							exported_at: new Date().toISOString(),
							forms: res.data || [],
						},
						null,
						2
					),
				],
				{ type: 'application/json' }
			);
			const url = URL.createObjectURL( blob );
			const a = document.createElement( 'a' );
			a.href = url;
			a.download = `formspress-export-${ Date.now() }.json`;
			a.click();
			URL.revokeObjectURL( url );
			setNotice( {
				type: 'success',
				message: __( 'Export started.', 'flowforms' ),
			} );
		} catch ( e ) {
			setNotice( {
				type: 'error',
				message: e.message || __( 'Could not export.', 'flowforms' ),
			} );
		} finally {
			setBusy( false );
		}
	};

	const onImport = async ( files ) => {
		const file = files?.[ 0 ];
		if ( ! file ) return;
		setBusy( true );
		try {
			const text = await file.text();
			const parsed = JSON.parse( text );
			if ( ! Array.isArray( parsed?.forms ) ) {
				throw new Error(
					__(
						'Invalid export file — missing "forms" array.',
						'flowforms'
					)
				);
			}
			let ok = 0;
			for ( const f of parsed.forms ) {
				try {
					await post( FORMS, f );
					ok++;
				} catch ( _e ) {
					// Skip on individual failure — surface aggregate at end.
				}
			}
			setNotice( {
				type: 'success',
				message: __( 'Imported %d form(s).', 'flowforms' ).replace(
					'%d',
					String( ok )
				),
			} );
		} catch ( e ) {
			setNotice( {
				type: 'error',
				message: e.message || __( 'Could not import.', 'flowforms' ),
			} );
		} finally {
			setBusy( false );
		}
	};

	return (
		<PageHeader
			title={ __( 'Import / Export', 'flowforms' ) }
			description={ __(
				'Move forms between sites with a JSON file — fields, settings, actions and conditions are preserved.',
				'flowforms'
			) }
		>
			<div className="ff-page__body">
				<VStack spacing={ 4 }>
					<Toast
						notice={ notice }
						onRemove={ () => setNotice( null ) }
					/>

					<Card>
						<CardBody>
							<VStack spacing={ 2 }>
								<Heading level={ 3 }>
									{ __( 'Export', 'flowforms' ) }
								</Heading>
								<Text size="small" variant="muted">
									{ __(
										'Download every form on this site as a single JSON file.',
										'flowforms'
									) }
								</Text>
							</VStack>
						</CardBody>
						<CardFooter>
							<Button
								variant="primary"
								isBusy={ busy }
								onClick={ onExport }
							>
								{ __( 'Download JSON', 'flowforms' ) }
							</Button>
						</CardFooter>
					</Card>

					<Card>
						<CardBody>
							<VStack spacing={ 2 }>
								<Heading level={ 3 }>
									{ __( 'Import', 'flowforms' ) }
								</Heading>
								<Text size="small" variant="muted">
									{ __(
										'Upload a JSON file produced by Export above. Forms are created as new — no overwrites.',
										'flowforms'
									) }
								</Text>
							</VStack>
						</CardBody>
						<CardFooter>
							<HStack justify="flex-start">
								<FormFileUpload
									accept="application/json"
									onChange={ ( e ) =>
										onImport( e.target.files )
									}
								>
									<Button variant="secondary" isBusy={ busy }>
										{ __( 'Pick a file', 'flowforms' ) }
									</Button>
								</FormFileUpload>
							</HStack>
						</CardFooter>
					</Card>
				</VStack>
			</div>
		</PageHeader>
	);
};

export default ImportExportPage;
