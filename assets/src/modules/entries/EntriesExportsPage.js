import { useEffect, useState } from '@wordpress/element';
import {
	Button,
	Card,
	CardBody,
	Notice,
	SelectControl,
	Spinner,
} from '@wordpress/components';
import { __, sprintf } from '@wordpress/i18n';
import { download } from '@wordpress/icons';
import PageHeader from '../../components/PageHeader';
import EmptyState from '../../components/EmptyState';
import { get } from '../../api/client';
import { FORMS, formExport } from '../../api/endpoints';

const createCsv = ( rows ) =>
	rows
		.map( ( row ) =>
			row
				.map(
					( cell ) => `"${ String( cell ).replace( /"/g, '""' ) }"`
				)
				.join( ',' )
		)
		.join( '\n' );

const createFilename = ( title ) =>
	`${
		String( title || 'form' )
			.trim()
			.toLowerCase()
			.replace( /[^a-z0-9]+/g, '-' )
			.replace( /^-+|-+$/g, '' ) || 'form'
	}-submissions.csv`;

const EntriesExportsPage = () => {
	const [ forms, setForms ] = useState( [] );
	const [ formId, setFormId ] = useState( '' );
	const [ isLoading, setLoading ] = useState( true );
	const [ isExporting, setExporting ] = useState( false );
	const [ error, setError ] = useState( null );

	useEffect( () => {
		get( FORMS, { per_page: 100 } )
			.then( ( res ) => setForms( res.data || [] ) )
			.catch( () =>
				setError( __( 'Could not load forms.', 'formspress' ) )
			)
			.finally( () => setLoading( false ) );
	}, [] );

	const selectedForm = forms.find( ( form ) => String( form.id ) === formId );
	const selectedEntriesCount = Number( selectedForm?.entries_count || 0 );
	const formOptions = [
		{ value: '', label: __( 'Select a form', 'formspress' ) },
		...forms.map( ( form ) => ( {
			value: String( form.id ),
			label: sprintf(
				/* translators: 1: form title, 2: submissions count. */
				__( '%1$s (%2$d submissions)', 'formspress' ),
				form.title,
				Number( form.entries_count || 0 )
			),
		} ) ),
	];

	const onDownload = async () => {
		if ( ! formId ) {
			return;
		}

		setExporting( true );
		setError( null );
		try {
			const res = await get( formExport( formId ) );
			const csv = createCsv( res.data.rows || [] );
			const blob = new Blob( [ '﻿' + csv ], {
				type: 'text/csv;charset=utf-8;',
			} );
			const url = URL.createObjectURL( blob );
			const link = document.createElement( 'a' );
			link.href = url;
			link.download = createFilename( res.data.form_title );
			link.click();
			URL.revokeObjectURL( url );
		} catch ( e ) {
			setError(
				e.message || __( 'Could not export submissions.', 'formspress' )
			);
		} finally {
			setExporting( false );
		}
	};

	const renderExportPanel = () => (
		<section className="ff-export-panel">
			<div className="ff-export-panel__head">
				<div>
					<h2>{ __( 'CSV export', 'formspress' ) }</h2>
					<p>
						{ __(
							'Export one form at a time with submission metadata included.',
							'formspress'
						) }
					</p>
				</div>
				<span className="ff-export-panel__format">
					{ __( 'CSV', 'formspress' ) }
				</span>
			</div>

			<div className="ff-export-panel__form-row">
				<SelectControl
					label={ __( 'Form', 'formspress' ) }
					value={ formId }
					options={ formOptions }
					onChange={ setFormId }
					__nextHasNoMarginBottom
					__next40pxDefaultSize
				/>
				<Button
					variant="primary"
					icon={ download }
					disabled={ ! formId || isExporting }
					isBusy={ isExporting }
					onClick={ onDownload }
				>
					{ __( 'Download CSV', 'formspress' ) }
				</Button>
			</div>

			<div className="ff-export-panel__summary">
				<div>
					<span>{ __( 'Submissions', 'formspress' ) }</span>
					<strong>
						{ selectedForm ? selectedEntriesCount : '-' }
					</strong>
				</div>
				<div>
					<span>{ __( 'Includes', 'formspress' ) }</span>
					<strong>
						{ __( 'Values, status, IP, source URL', 'formspress' ) }
					</strong>
				</div>
				<div>
					<span>{ __( 'Encoding', 'formspress' ) }</span>
					<strong>{ __( 'UTF-8 CSV', 'formspress' ) }</strong>
				</div>
			</div>

			<p className="ff-export-panel__note">
				{ selectedForm
					? sprintf(
							/* translators: %s: form title. */
							__(
								'Ready to export submissions from %s.',
								'formspress'
							),
							selectedForm.title
					  )
					: __(
							'Select a form to enable the export.',
							'formspress'
					  ) }
			</p>
		</section>
	);

	const renderContent = () => {
		if ( isLoading ) {
			return (
				<div className="ff-export-panel__loading">
					<Spinner />
				</div>
			);
		}

		if ( forms.length === 0 ) {
			return (
				<Card>
					<CardBody>
						<EmptyState
							icon="download"
							title={ __( 'No forms to export', 'formspress' ) }
							description={ __(
								'Create a form and collect submissions before exporting a CSV.',
								'formspress'
							) }
						/>
					</CardBody>
				</Card>
			);
		}

		return renderExportPanel();
	};

	return (
		<PageHeader
			title={ __( 'Exports', 'formspress' ) }
			description={ __(
				'Download submissions as CSV for backup, analysis or migration.',
				'formspress'
			) }
		>
			<div className="ff-page__body">
				{ error && (
					<Notice
						status="error"
						isDismissible
						onRemove={ () => setError( null ) }
					>
						{ error }
					</Notice>
				) }
				{ renderContent() }
			</div>
		</PageHeader>
	);
};

export default EntriesExportsPage;
