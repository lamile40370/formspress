import { useState } from '@wordpress/element';
import {
	Modal,
	Button,
	Notice,
	TextControl,
	ClipboardButton,
	ExternalLink,
	__experimentalText as Text,
	__experimentalVStack as VStack,
	__experimentalHStack as HStack,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';

/**
 * Modal that surfaces every embed option for a form so users can drop
 * it into ANY context — Gutenberg, classic editor, Elementor, Bricks,
 * Divi, Beaver Builder, Oxygen, raw template files — without leaving
 * the form builder.
 *
 * Three options, in order of preference:
 *
 *   1. Gutenberg block — copy the block markup. Most modern stacks
 *      either ARE Gutenberg or accept block markup.
 *   2. Shortcode `[formspress id="X"]` — universal fallback that works
 *      in every page builder via their "shortcode" widget, in the
 *      classic editor, and in raw `do_shortcode()` calls.
 *   3. Direct URL `/formspress/{id}/` — a fullscreen, standalone form
 *      page useful for "Share this link to fill the form" use cases
 *      (think Typeform).
 *
 * Each row uses Gutenberg's native `<ClipboardButton>` so the copy
 * affordance, success state ("Copied!") and a11y all come from WP for
 * free.
 */
const Row = ( { label, value, helpText } ) => {
	const [ copied, setCopied ] = useState( false );
	return (
		<VStack spacing={ 2 }>
			<HStack spacing={ 2 } alignment="bottom">
				<div style={ { flex: 1 } }>
					<TextControl
						__nextHasNoMarginBottom
						__next40pxDefaultSize
						label={ label }
						value={ value }
						readOnly
						onChange={ () => {} }
						onFocus={ ( e ) => e.target.select() }
					/>
				</div>
				<ClipboardButton
					variant="secondary"
					text={ value }
					onCopy={ () => setCopied( true ) }
					onFinishCopy={ () => setCopied( false ) }
				>
					{ copied
						? __( 'Copied!', 'flowforms' )
						: __( 'Copy', 'flowforms' ) }
				</ClipboardButton>
			</HStack>
			{ helpText && (
				<Text variant="muted" size="small">
					{ helpText }
				</Text>
			) }
		</VStack>
	);
};

const EmbedShareModal = ( { form, onClose } ) => {
	const formId = form?.id;
	if ( ! formId ) return null;

	const shortcode = `[formspress id="${ formId }"]`;
	const block = `<!-- wp:formspress/form {"formId":${ formId }} /-->`;
	const siteUrl = ( window.flowFormsData?.siteUrl || '' ).replace(
		/\/$/,
		''
	);
	const directUrl = `${ siteUrl }/formspress/${ formId }/`;
	const isPublic = 'active' === form?.status;

	return (
		<Modal
			title={ __( 'Embed this form', 'flowforms' ) }
			onRequestClose={ onClose }
			size="medium"
		>
			<VStack spacing={ 5 }>
				<Text>
					{ __(
						'Drop this form into any post, page or template — Gutenberg block, shortcode (works with every page builder), or a direct fullscreen link.',
						'flowforms'
					) }
				</Text>

				<Row
					label={ __( 'Shortcode', 'flowforms' ) }
					value={ shortcode }
					helpText={ __(
						'Universal fallback — works in the classic editor and every page builder (Elementor, Bricks, Divi, Beaver Builder, Oxygen…) via their shortcode widget.',
						'flowforms'
					) }
				/>

				<Row
					label={ __( 'Gutenberg block', 'flowforms' ) }
					value={ block }
					helpText={ __(
						'Paste this block-comment into the Gutenberg code editor to insert the form. The visual inserter ("FormsPress Form" block) is the recommended way for normal use.',
						'flowforms'
					) }
				/>

				{ ! isPublic && (
					<Notice status="warning" isDismissible={ false }>
						{ __(
							'This direct link is available as an admin preview while editing, but it becomes public only after the form is published.',
							'flowforms'
						) }
					</Notice>
				) }

				<Row
					label={ __( 'Direct link', 'flowforms' ) }
					value={ directUrl }
					helpText={ __(
						'A standalone fullscreen page hosting this form — great for sharing a link in email or social, without embedding in an existing page.',
						'flowforms'
					) }
				/>

				<HStack justify="flex-end">
					<ExternalLink href={ directUrl }>
						{ __( 'Open the direct link', 'flowforms' ) }
					</ExternalLink>
					<Button variant="primary" onClick={ onClose }>
						{ __( 'Done', 'flowforms' ) }
					</Button>
				</HStack>
			</VStack>
		</Modal>
	);
};

export default EmbedShareModal;
