import {
	PanelBody,
	TextControl,
	TextareaControl,
	ToggleControl,
	SelectControl,
	FontSizePicker,
	__experimentalToolsPanel as ToolsPanel,
	__experimentalToolsPanelItem as ToolsPanelItem,
} from '@wordpress/components';
import { PanelColorSettings } from '@wordpress/block-editor';
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
	const themeFontSizes = window.flowFormsData?.themeFontSizes || [];
	const themeSpacing =
		window.flowFormsData?.themeGlobalSettings?.spacing?.spacingSizes || [];

	const spamProviders = window.flowFormsData?.spamProviders || [];
	const spamOptions = [
		{ value: '', label: __( 'Use global setting', 'formspress' ) },
		{ value: 'none', label: __( 'None (honeypot only)', 'formspress' ) },
		...spamProviders.map( ( p ) => ( { value: p.id, label: p.label } ) ),
	];

	// Cast spacing values: theme.json sizes are strings like "var(--wp--preset--spacing--20)",
	// our legacy store keeps numbers (px). We accept both — `FormRenderer::build_standard_style`
	// already detects either and emits the right CSS variable.
	const setSpacingValue = ( key ) => ( v ) => setStyle( key )( v );

	return (
		<>
			{ /* ── Summary ───────────────────────────────────────────── */ }
			<PanelBody title={ __( 'Summary', 'formspress' ) } initialOpen>
				<TextControl
					label={ __( 'Title', 'formspress' ) }
					value={ form.title || '' }
					onChange={ setForm( 'title' ) }
					__nextHasNoMarginBottom
					__next40pxDefaultSize
				/>
				<ToggleControl
					label={ __( 'Active', 'formspress' ) }
					help={
						'inactive' === form.status
							? __( 'Submissions are not accepted.', 'formspress' )
							: __( 'Form accepts submissions.', 'formspress' )
					}
					checked={ 'inactive' !== form.status }
					onChange={ ( v ) =>
						setForm( 'status' )( v ? 'active' : 'inactive' )
					}
					__nextHasNoMarginBottom
				/>
				<TextareaControl
					label={ __( 'Description', 'formspress' ) }
					value={ form.description || '' }
					onChange={ setForm( 'description' ) }
					rows={ 3 }
					__nextHasNoMarginBottom
				/>
			</PanelBody>

			{ /* ── Submission ────────────────────────────────────────── */ }
			<PanelBody
				title={ __( 'Submission', 'formspress' ) }
				initialOpen={ false }
			>
				<TextControl
					label={ __( 'Submit button label', 'formspress' ) }
					help={ __(
						'Used by legacy rendered forms. Standard forms should include a Submit button block.',
						'formspress'
					) }
					value={ settings.submit_label || '' }
					onChange={ setSetting( 'submit_label' ) }
					__nextHasNoMarginBottom
					__next40pxDefaultSize
				/>
				<SelectControl
					label={ __( 'After submit', 'formspress' ) }
					value={ settings.success_action || 'message' }
					options={ [
						{
							value: 'message',
							label: __(
								'Show a confirmation message',
								'formspress'
							),
						},
						{
							value: 'redirect',
							label: __( 'Redirect to a URL', 'formspress' ),
						},
					] }
					onChange={ setSetting( 'success_action' ) }
					__nextHasNoMarginBottom
					__next40pxDefaultSize
				/>
				{ 'redirect' === ( settings.success_action || 'message' ) ? (
					<TextControl
						label={ __( 'Redirect URL', 'formspress' ) }
						type="url"
						value={ settings.redirect_url || '' }
						onChange={ setSetting( 'redirect_url' ) }
						placeholder="https://example.com/thanks"
						__nextHasNoMarginBottom
						__next40pxDefaultSize
					/>
				) : (
					<TextareaControl
						label={ __( 'Success message', 'formspress' ) }
						value={ settings.success_message || '' }
						onChange={ setSetting( 'success_message' ) }
						rows={ 3 }
						__nextHasNoMarginBottom
					/>
				) }
			</PanelBody>

			<PanelBody
				title={ __( 'Pagination', 'formspress' ) }
				initialOpen={ false }
			>
				<TextControl
					label={ __( 'Previous button label', 'formspress' ) }
					value={ settings.prev_label || '' }
					placeholder={ __( 'Previous', 'formspress' ) }
					onChange={ setSetting( 'prev_label' ) }
					__nextHasNoMarginBottom
					__next40pxDefaultSize
				/>
				<TextControl
					label={ __( 'Next button label', 'formspress' ) }
					value={ settings.next_label || '' }
					placeholder={ __( 'Next', 'formspress' ) }
					onChange={ setSetting( 'next_label' ) }
					__nextHasNoMarginBottom
					__next40pxDefaultSize
				/>
			</PanelBody>

			<PanelColorSettings
				title={ __( 'Pagination colors', 'formspress' ) }
				initialOpen={ false }
				colorSettings={ [
					{
						label: __( 'Progress', 'formspress' ),
						value: style.progress_fill_color,
						onChange: setStyle( 'progress_fill_color' ),
						clearable: true,
					},
					{
						label: __( 'Progress track', 'formspress' ),
						value: style.progress_track_color,
						onChange: setStyle( 'progress_track_color' ),
						clearable: true,
					},
					{
						label: __( 'Step text', 'formspress' ),
						value: style.step_text_color,
						onChange: setStyle( 'step_text_color' ),
						clearable: true,
					},
				] }
				__experimentalIsRenderedInSidebar
				enableAlpha
			/>

			<PanelColorSettings
				title={ __( 'Pagination buttons', 'formspress' ) }
				initialOpen={ false }
				colorSettings={ [
					{
						label: __( 'Next background', 'formspress' ),
						value: style.next_bg_color,
						onChange: setStyle( 'next_bg_color' ),
						clearable: true,
					},
					{
						label: __( 'Next text', 'formspress' ),
						value: style.next_text_color,
						onChange: setStyle( 'next_text_color' ),
						clearable: true,
					},
					{
						label: __( 'Next border', 'formspress' ),
						value: style.next_border_color,
						onChange: setStyle( 'next_border_color' ),
						clearable: true,
					},
					{
						label: __( 'Previous background', 'formspress' ),
						value: style.prev_bg_color,
						onChange: setStyle( 'prev_bg_color' ),
						clearable: true,
					},
					{
						label: __( 'Previous text', 'formspress' ),
						value: style.prev_text_color,
						onChange: setStyle( 'prev_text_color' ),
						clearable: true,
					},
					{
						label: __( 'Previous border', 'formspress' ),
						value: style.prev_border_color,
						onChange: setStyle( 'prev_border_color' ),
						clearable: true,
					},
				] }
				__experimentalIsRenderedInSidebar
				enableAlpha
			/>

			{ /* ── Fields rendering (native ToolsPanel like core blocks) ─ */ }
			<ToolsPanel
				label={ __( 'Fields rendering', 'formspress' ) }
				resetAll={ () => setSetting( 'style' )( {} ) }
			>
				<ToolsPanelItem
					hasValue={ () =>
						!! settings.layout && 'stacked' !== settings.layout
					}
					label={ __( 'Layout', 'formspress' ) }
					onDeselect={ () => setSetting( 'layout' )( 'stacked' ) }
					isShownByDefault
				>
					<SelectControl
						label={ __( 'Layout', 'formspress' ) }
						value={ settings.layout || 'stacked' }
						options={ [
							{
								value: 'stacked',
								label: __( 'Stacked', 'formspress' ),
							},
							{
								value: 'inline',
								label: __( 'Inline', 'formspress' ),
							},
							{
								value: 'placeholder',
								label: __( 'Placeholder only', 'formspress' ),
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
						label={ __( 'Font size', 'formspress' ) }
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
					label={ __( 'Field spacing', 'formspress' ) }
					onDeselect={ resetStyle( 'field_spacing' ) }
					isShownByDefault
				>
					<SpacingInput
						label={ __( 'Field spacing', 'formspress' ) }
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
					label={ __( 'Input padding', 'formspress' ) }
					onDeselect={ () => {
						resetStyle( 'input_padding_x' )();
						resetStyle( 'input_padding_y' )();
					} }
				>
					<SpacingInput
						label={ __( 'Padding X', 'formspress' ) }
						value={ style.input_padding_x }
						onChange={ setSpacingValue( 'input_padding_x' ) }
						sizes={ themeSpacing }
					/>
					<SpacingInput
						label={ __( 'Padding Y', 'formspress' ) }
						value={ style.input_padding_y }
						onChange={ setSpacingValue( 'input_padding_y' ) }
						sizes={ themeSpacing }
					/>
				</ToolsPanelItem>

				<ToolsPanelItem
					hasValue={ () => null != style.border_radius }
					label={ __( 'Border radius', 'formspress' ) }
					onDeselect={ resetStyle( 'border_radius' ) }
				>
					<SpacingInput
						label={ __( 'Border radius', 'formspress' ) }
						value={ style.border_radius }
						onChange={ setSpacingValue( 'border_radius' ) }
						sizes={ themeSpacing }
					/>
				</ToolsPanelItem>

			</ToolsPanel>

			<PanelColorSettings
				title={ __( 'Field colors', 'formspress' ) }
				initialOpen={ false }
				colorSettings={ [
					{
						label: __( 'Primary', 'formspress' ),
						value: style.primary_color,
						onChange: setStyle( 'primary_color' ),
						clearable: true,
					},
					{
						label: __( 'Button text', 'formspress' ),
						value: style.btn_text_color,
						onChange: setStyle( 'btn_text_color' ),
						clearable: true,
					},
					{
						label: __( 'Label', 'formspress' ),
						value: style.label_color,
						onChange: setStyle( 'label_color' ),
						clearable: true,
					},
					{
						label: __( 'Input border', 'formspress' ),
						value: style.border_color,
						onChange: setStyle( 'border_color' ),
						clearable: true,
					},
				] }
				__experimentalIsRenderedInSidebar
				enableAlpha
			/>

			{ /* ── Anti-spam ─────────────────────────────────────────── */ }
			<PanelBody
				title={ __( 'Anti-spam', 'formspress' ) }
				initialOpen={ false }
			>
				<ToggleControl
					label={ __( 'Honeypot', 'formspress' ) }
					help={ __(
						"Hidden field that bots fill in and humans don't.",
						'formspress'
					) }
					checked={ settings.honeypot !== false }
					onChange={ setSetting( 'honeypot' ) }
					__nextHasNoMarginBottom
				/>
				<SelectControl
					label={ __( 'Spam provider', 'formspress' ) }
					help={ __(
						'Per-form override of the global anti-spam provider.',
						'formspress'
					) }
					value={ settings.spam_provider || '' }
					options={ spamOptions }
					onChange={ setSetting( 'spam_provider' ) }
					__nextHasNoMarginBottom
					__next40pxDefaultSize
				/>
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
					{ value: '', label: __( 'Default', 'formspress' ) },
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
