import {
	PanelBody,
	TextControl,
	TextareaControl,
	ToggleControl,
	SelectControl,
	ColorPalette,
	FontSizePicker,
	__experimentalToolsPanel as ToolsPanel,
	__experimentalToolsPanelItem as ToolsPanelItem,
	__experimentalText as Text,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';

/**
 * Right inspector — "Form" tab.
 *
 * Strictly form-rendering settings here (what's used by FormRenderer.php
 * on the front-end to compose the form):
 *   - Submission flow
 *   - Field-render settings: layout, field spacing, input padding,
 *     border radius, palette
 *   - Actions, anti-spam, save & resume
 *
 * Block-level styling (background, typography, padding, margin, border,
 * layout of the form container) is NOT duplicated here — the root
 * `core/group` already exposes all of that natively in the Block tab
 * with FSE theme.json-aware controls.
 *
 * The few form-specific options below use native WP components that
 * automatically respect the active theme's palette, font-sizes and
 * spacing scale.
 */
const FormSettings = ( { form, onChange } ) => {
	if ( ! form ) return null;

	const setForm = ( key ) => ( v ) => onChange( { ...form, [ key ]: v } );
	const settings = form.settings || {};
	const setSetting = ( key ) => ( v ) =>
		onChange( { ...form, settings: { ...settings, [ key ]: v } } );
	const style = settings.style || {};
	const setStyle = ( key ) => ( v ) =>
		setSetting( 'style' )( { ...style, [ key ]: v } );
	const resetStyle = ( key ) => () => {
		const next = { ...style };
		delete next[ key ];
		setSetting( 'style' )( next );
	};

	// Theme tokens — same source `core/edit-post` reads from.
	const themePalette = window.flowFormsData?.themePalette || [];
	const themeFontSizes = window.flowFormsData?.themeFontSizes || [];
	const themeSpacing =
		window.flowFormsData?.themeGlobalSettings?.spacing?.spacingSizes || [];

	const spamProviders = window.flowFormsData?.spamProviders || [];
	const spamOptions = [
		{ value: '', label: __( 'Use global setting', 'flowforms' ) },
		{ value: 'none', label: __( 'None (honeypot only)', 'flowforms' ) },
		...spamProviders.map( ( p ) => ( { value: p.id, label: p.label } ) ),
	];

	// Cast spacing values: theme.json sizes are strings like "var(--wp--preset--spacing--20)",
	// our legacy store keeps numbers (px). We accept both — `FormRenderer::build_standard_style`
	// already detects either and emits the right CSS variable.
	const setSpacingValue = ( key ) => ( v ) => setStyle( key )( v );

	return (
		<>
			{ /* ── Summary ───────────────────────────────────────────── */ }
			<PanelBody title={ __( 'Summary', 'flowforms' ) } initialOpen>
				<TextControl
					label={ __( 'Title', 'flowforms' ) }
					value={ form.title || '' }
					onChange={ setForm( 'title' ) }
					__nextHasNoMarginBottom
					__next40pxDefaultSize
				/>
				<ToggleControl
					label={ __( 'Active', 'flowforms' ) }
					help={
						'inactive' === form.status
							? __( 'Submissions are not accepted.', 'flowforms' )
							: __( 'Form accepts submissions.', 'flowforms' )
					}
					checked={ 'inactive' !== form.status }
					onChange={ ( v ) =>
						setForm( 'status' )( v ? 'active' : 'inactive' )
					}
					__nextHasNoMarginBottom
				/>
				<TextareaControl
					label={ __( 'Description', 'flowforms' ) }
					value={ form.description || '' }
					onChange={ setForm( 'description' ) }
					rows={ 3 }
					__nextHasNoMarginBottom
				/>
			</PanelBody>

			{ /* ── Submission ────────────────────────────────────────── */ }
			<PanelBody
				title={ __( 'Submission', 'flowforms' ) }
				initialOpen={ false }
			>
				<TextControl
					label={ __( 'Submit button label', 'flowforms' ) }
					help={ __(
						'Used by legacy rendered forms. Standard forms should include a Submit button block.',
						'flowforms'
					) }
					value={ settings.submit_label || '' }
					onChange={ setSetting( 'submit_label' ) }
					__nextHasNoMarginBottom
					__next40pxDefaultSize
				/>
				<SelectControl
					label={ __( 'After submit', 'flowforms' ) }
					value={ settings.success_action || 'message' }
					options={ [
						{
							value: 'message',
							label: __(
								'Show a confirmation message',
								'flowforms'
							),
						},
						{
							value: 'redirect',
							label: __( 'Redirect to a URL', 'flowforms' ),
						},
					] }
					onChange={ setSetting( 'success_action' ) }
					__nextHasNoMarginBottom
					__next40pxDefaultSize
				/>
				{ 'redirect' === ( settings.success_action || 'message' ) ? (
					<TextControl
						label={ __( 'Redirect URL', 'flowforms' ) }
						type="url"
						value={ settings.redirect_url || '' }
						onChange={ setSetting( 'redirect_url' ) }
						placeholder="https://example.com/thanks"
						__nextHasNoMarginBottom
						__next40pxDefaultSize
					/>
				) : (
					<TextareaControl
						label={ __( 'Success message', 'flowforms' ) }
						value={ settings.success_message || '' }
						onChange={ setSetting( 'success_message' ) }
						rows={ 3 }
						__nextHasNoMarginBottom
					/>
				) }
			</PanelBody>

			{ /* ── Fields rendering (native ToolsPanel like core blocks) ─ */ }
			<ToolsPanel
				label={ __( 'Fields rendering', 'flowforms' ) }
				resetAll={ () => setSetting( 'style' )( {} ) }
			>
				<ToolsPanelItem
					hasValue={ () =>
						!! settings.layout && 'stacked' !== settings.layout
					}
					label={ __( 'Layout', 'flowforms' ) }
					onDeselect={ () => setSetting( 'layout' )( 'stacked' ) }
					isShownByDefault
				>
					<SelectControl
						label={ __( 'Layout', 'flowforms' ) }
						value={ settings.layout || 'stacked' }
						options={ [
							{
								value: 'stacked',
								label: __( 'Stacked', 'flowforms' ),
							},
							{
								value: 'inline',
								label: __( 'Inline', 'flowforms' ),
							},
							{
								value: 'placeholder',
								label: __( 'Placeholder only', 'flowforms' ),
							},
						] }
						onChange={ setSetting( 'layout' ) }
						__nextHasNoMarginBottom
						__next40pxDefaultSize
					/>
				</ToolsPanelItem>

				{ themeFontSizes.length > 0 && (
					<ToolsPanelItem
						hasValue={ () => null != style.font_size }
						label={ __( 'Font size', 'flowforms' ) }
						onDeselect={ resetStyle( 'font_size' ) }
					>
						<FontSizePicker
							value={ style.font_size }
							onChange={ setStyle( 'font_size' ) }
							fontSizes={ themeFontSizes }
							withReset={ false }
							__next40pxDefaultSize
						/>
					</ToolsPanelItem>
				) }

				<ToolsPanelItem
					hasValue={ () => null != style.field_spacing }
					label={ __( 'Field spacing', 'flowforms' ) }
					onDeselect={ resetStyle( 'field_spacing' ) }
					isShownByDefault
				>
					<SpacingInput
						label={ __( 'Field spacing', 'flowforms' ) }
						value={ style.field_spacing }
						onChange={ setSpacingValue( 'field_spacing' ) }
						sizes={ themeSpacing }
					/>
				</ToolsPanelItem>

				<ToolsPanelItem
					hasValue={ () =>
						null != style.input_padding_x ||
						null != style.input_padding_y
					}
					label={ __( 'Input padding', 'flowforms' ) }
					onDeselect={ () => {
						resetStyle( 'input_padding_x' )();
						resetStyle( 'input_padding_y' )();
					} }
				>
					<SpacingInput
						label={ __( 'Padding X', 'flowforms' ) }
						value={ style.input_padding_x }
						onChange={ setSpacingValue( 'input_padding_x' ) }
						sizes={ themeSpacing }
					/>
					<SpacingInput
						label={ __( 'Padding Y', 'flowforms' ) }
						value={ style.input_padding_y }
						onChange={ setSpacingValue( 'input_padding_y' ) }
						sizes={ themeSpacing }
					/>
				</ToolsPanelItem>

				<ToolsPanelItem
					hasValue={ () => null != style.border_radius }
					label={ __( 'Border radius', 'flowforms' ) }
					onDeselect={ resetStyle( 'border_radius' ) }
				>
					<SpacingInput
						label={ __( 'Border radius', 'flowforms' ) }
						value={ style.border_radius }
						onChange={ setSpacingValue( 'border_radius' ) }
						sizes={ themeSpacing }
					/>
				</ToolsPanelItem>

				<ToolsPanelItem
					hasValue={ () => !! style.primary_color }
					label={ __( 'Primary color', 'flowforms' ) }
					onDeselect={ resetStyle( 'primary_color' ) }
				>
					<Text
						size="small"
						style={ { display: 'block', marginBottom: 8 } }
					>
						{ __( 'Primary color', 'flowforms' ) }
					</Text>
					<ColorPalette
						value={ style.primary_color }
						onChange={ setStyle( 'primary_color' ) }
						colors={ themePalette }
						clearable
						__experimentalIsRenderedInSidebar
					/>
				</ToolsPanelItem>

				<ToolsPanelItem
					hasValue={ () => !! style.btn_text_color }
					label={ __( 'Button text color', 'flowforms' ) }
					onDeselect={ resetStyle( 'btn_text_color' ) }
				>
					<Text
						size="small"
						style={ { display: 'block', marginBottom: 8 } }
					>
						{ __( 'Button text color', 'flowforms' ) }
					</Text>
					<ColorPalette
						value={ style.btn_text_color }
						onChange={ setStyle( 'btn_text_color' ) }
						colors={ themePalette }
						clearable
						__experimentalIsRenderedInSidebar
					/>
				</ToolsPanelItem>

				<ToolsPanelItem
					hasValue={ () => !! style.label_color }
					label={ __( 'Label color', 'flowforms' ) }
					onDeselect={ resetStyle( 'label_color' ) }
				>
					<Text
						size="small"
						style={ { display: 'block', marginBottom: 8 } }
					>
						{ __( 'Label color', 'flowforms' ) }
					</Text>
					<ColorPalette
						value={ style.label_color }
						onChange={ setStyle( 'label_color' ) }
						colors={ themePalette }
						clearable
						__experimentalIsRenderedInSidebar
					/>
				</ToolsPanelItem>

				<ToolsPanelItem
					hasValue={ () => !! style.border_color }
					label={ __( 'Input border color', 'flowforms' ) }
					onDeselect={ resetStyle( 'border_color' ) }
				>
					<Text
						size="small"
						style={ { display: 'block', marginBottom: 8 } }
					>
						{ __( 'Input border color', 'flowforms' ) }
					</Text>
					<ColorPalette
						value={ style.border_color }
						onChange={ setStyle( 'border_color' ) }
						colors={ themePalette }
						clearable
						__experimentalIsRenderedInSidebar
					/>
				</ToolsPanelItem>
			</ToolsPanel>

			{ /* ── Anti-spam ─────────────────────────────────────────── */ }
			<PanelBody
				title={ __( 'Anti-spam', 'flowforms' ) }
				initialOpen={ false }
			>
				<ToggleControl
					label={ __( 'Honeypot', 'flowforms' ) }
					help={ __(
						"Hidden field that bots fill in and humans don't.",
						'flowforms'
					) }
					checked={ settings.honeypot !== false }
					onChange={ setSetting( 'honeypot' ) }
					__nextHasNoMarginBottom
				/>
				<SelectControl
					label={ __( 'Spam provider', 'flowforms' ) }
					help={ __(
						'Per-form override of the global anti-spam provider.',
						'flowforms'
					) }
					value={ settings.spam_provider || '' }
					options={ spamOptions }
					onChange={ setSetting( 'spam_provider' ) }
					__nextHasNoMarginBottom
					__next40pxDefaultSize
				/>
			</PanelBody>

			{ /* ── Save & resume ─────────────────────────────────────── */ }
			<PanelBody
				title={ __( 'Save & resume', 'flowforms' ) }
				initialOpen={ false }
			>
				<ToggleControl
					label={ __(
						'Allow visitors to save and resume',
						'flowforms'
					) }
					help={ __(
						'Adds a "Save and resume later" link below the form; submissions are emailed a magic link.',
						'flowforms'
					) }
					checked={ !! settings.enable_save_resume }
					onChange={ setSetting( 'enable_save_resume' ) }
					__nextHasNoMarginBottom
				/>
				{ settings.enable_save_resume && (
					<TextControl
						label={ __( 'Save link label', 'flowforms' ) }
						value={ settings.save_resume_label || '' }
						onChange={ setSetting( 'save_resume_label' ) }
						placeholder={ __(
							'Save and resume later',
							'flowforms'
						) }
						__nextHasNoMarginBottom
						__next40pxDefaultSize
					/>
				) }
			</PanelBody>
		</>
	);
};

/**
 * Spacing input that lets users pick from the theme's spacing scale
 * (presets like 2XS / XS / S / M / L / XL …) when available, or fall
 * back to a free numeric input. Mirrors the native FSE pattern for
 * spacing controls.
 */
const SpacingInput = ( { label, value, onChange, sizes } ) => {
	if ( Array.isArray( sizes ) && sizes.length > 0 ) {
		return (
			<SelectControl
				label={ label }
				value={ String( value ?? '' ) }
				options={ [
					{ value: '', label: __( 'Default', 'flowforms' ) },
					...sizes.map( ( s ) => ( {
						value: s.slug
							? `var(--wp--preset--spacing--${ s.slug })`
							: String( s.size ),
						label: s.name || s.slug,
					} ) ),
				] }
				onChange={ onChange }
				__nextHasNoMarginBottom
				__next40pxDefaultSize
			/>
		);
	}
	return (
		<TextControl
			label={ label }
			type="number"
			value={ value ?? '' }
			onChange={ ( v ) => onChange( v === '' ? undefined : Number( v ) ) }
			min={ 0 }
			max={ 64 }
			__nextHasNoMarginBottom
			__next40pxDefaultSize
		/>
	);
};

export default FormSettings;
