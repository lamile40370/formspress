import { useEffect, useState } from '@wordpress/element';
import {
	Button,
	Spinner,
	TextControl,
	Card,
	CardBody,
	__experimentalVStack as VStack,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { get, post, put } from '../../api/client';
import PageHeader from '../../components/PageHeader';
import Toast from '../../components/Toast';
import EmailDesigner from '../forms/components/EmailDesigner';

const ENDPOINT = '/email-templates';

const EmailTemplateEditor = () => {
	const { id } = useParams();
	const navigate = useNavigate();
	const location = useLocation();
	const basePath = location.pathname.startsWith( '/tools/email-templates' )
		? '/tools/email-templates'
		: '/email-templates';
	const isNew = ! id;
	const [ tpl, setTpl ] = useState( { name: '', subject: '', body: '' } );
	const [ loading, setLoading ] = useState( ! isNew );
	const [ saving, setSaving ] = useState( false );
	const [ notice, setNotice ] = useState( null );

	useEffect( () => {
		if ( isNew ) return;
		get( `${ ENDPOINT }/${ id }` )
			.then( ( res ) => setTpl( res.data ) )
			.finally( () => setLoading( false ) );
	}, [ id, isNew ] );

	const handleSave = async () => {
		setSaving( true );
		try {
			if ( isNew ) {
				const res = await post( ENDPOINT, tpl );
				setNotice( {
					type: 'success',
					message: __( 'Template created.', 'flowforms' ),
				} );
				if ( res?.data?.id )
					navigate( `${ basePath }/${ res.data.id }`, {
						replace: true,
					} );
			} else {
				await put( `${ ENDPOINT }/${ id }`, tpl );
				setNotice( {
					type: 'success',
					message: __( 'Template saved.', 'flowforms' ),
				} );
			}
		} catch ( e ) {
			setNotice( {
				type: 'error',
				message: e.message || __( 'Save failed.', 'flowforms' ),
			} );
		} finally {
			setSaving( false );
		}
	};

	const set = ( key ) => ( v ) => setTpl( ( s ) => ( { ...s, [ key ]: v } ) );

	if ( loading )
		return (
			<div className="ff-page ff-page--loading">
				<Spinner />
			</div>
		);

	return (
		<PageHeader
			title={ isNew ? __( 'New Email Template', 'flowforms' ) : tpl.name }
			right={
				<Button
					variant="primary"
					onClick={ handleSave }
					isBusy={ saving }
					disabled={ saving }
				>
					{ __( 'Save', 'flowforms' ) }
				</Button>
			}
		>
			<div className="ff-page__body">
				<Toast notice={ notice } onRemove={ () => setNotice( null ) } />

				<VStack spacing={ 4 }>
					<Card>
						<CardBody>
							<VStack spacing={ 3 }>
								<TextControl
									__nextHasNoMarginBottom
									__next40pxDefaultSize
									label={ __( 'Template name', 'flowforms' ) }
									value={ tpl.name || '' }
									onChange={ set( 'name' ) }
								/>
								<TextControl
									__nextHasNoMarginBottom
									__next40pxDefaultSize
									label={ __(
										'Default subject',
										'flowforms'
									) }
									value={ tpl.subject || '' }
									onChange={ set( 'subject' ) }
								/>
							</VStack>
						</CardBody>
					</Card>

					<EmailDesigner
						value={ tpl.body || '' }
						onChange={ set( 'body' ) }
						form={ { fields: [] } }
						/* This page IS a template editor — the header
						 * Save button is the single save action. Hide
						 * the inline "Load template" / "Save as
						 * template" affordances so we don't ship two
						 * competing save flows. */
						showTemplateActions={ false }
					/>
				</VStack>
			</div>
		</PageHeader>
	);
};

export default EmailTemplateEditor;
