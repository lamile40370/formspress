import { useEffect, useState } from '@wordpress/element';
import {
	Card,
	CardBody,
	CardFooter,
	Button,
	SelectControl,
	__experimentalVStack as VStack,
	__experimentalHeading as Heading,
	__experimentalText as Text,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import PageHeader from '../../components/PageHeader';
import { get } from '../../api/client';
import { FORMS, formExport } from '../../api/endpoints';

const EntriesExportsPage = () => {
	const [ forms, setForms ] = useState( [] );
	const [ formId, setFormId ] = useState( '' );

	useEffect( () => {
		get( FORMS, { per_page: 100 } )
			.then( ( res ) => setForms( res.data || [] ) )
			.catch( () => setForms( [] ) );
	}, [] );

	const formOptions = [
		{ value: '', label: __( '— Pick a form —', 'flowforms' ) },
		...forms.map( ( f ) => ( { value: String( f.id ), label: f.title } ) ),
	];

	const apiRoot = window.flowFormsData?.apiRoot || '/wp-json/flowforms/v1';
	const nonce = window.flowFormsData?.nonce || '';

	const onDownload = () => {
		if ( ! formId ) return;
		// Hit the export endpoint directly so the browser handles the
		// download dialog instead of buffering bytes in JS.
		const url = `${ apiRoot }${ formExport(
			formId
		) }?_wpnonce=${ encodeURIComponent( nonce ) }`;
		window.location.href = url;
	};

	return (
		<PageHeader
			title={ __( 'Exports', 'flowforms' ) }
			description={ __(
				'Download submissions as CSV for backup, analysis or migration.',
				'flowforms'
			) }
		>
			<div className="ff-page__body">
				<VStack spacing={ 4 }>
					<Card>
						<CardBody>
							<VStack spacing={ 4 }>
								<Heading level={ 3 }>
									{ __( 'CSV export', 'flowforms' ) }
								</Heading>
								<SelectControl
									label={ __( 'Form', 'flowforms' ) }
									value={ formId }
									options={ formOptions }
									onChange={ setFormId }
									__nextHasNoMarginBottom
									__next40pxDefaultSize
								/>
								<Text variant="muted" size="small">
									{ __(
										'The CSV contains one column per field plus submission metadata (date, source URL, IP).',
										'flowforms'
									) }
								</Text>
							</VStack>
						</CardBody>
						<CardFooter>
							<Button
								variant="primary"
								disabled={ ! formId }
								onClick={ onDownload }
							>
								{ __( 'Download CSV', 'flowforms' ) }
							</Button>
						</CardFooter>
					</Card>
				</VStack>
			</div>
		</PageHeader>
	);
};

export default EntriesExportsPage;
