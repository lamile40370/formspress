import { __experimentalText as Text } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { useMemo } from '@wordpress/element';

/**
 * Visual style-variation picker — same shape as the FSE Site Editor's
 * "Browse styles" gallery. Each card shows the variation's actual
 * background + foreground + typography + a couple of palette swatches.
 *
 * Data source: `flowFormsData.fseThemeVariations`, populated by PHP
 * via `WP_Theme_JSON_Resolver::get_style_variations( 'theme' )`. Those
 * are the **real** variations shipped with the active FSE theme —
 * exactly what the Site Editor would show under Styles → Browse styles.
 */

/** Pick the first color whose slug matches one of the given candidates. */
const colorBySlug = ( palette, slugs ) => {
	for ( const slug of slugs ) {
		const found = palette.find(
			( c ) => c.slug === slug || c.name?.toLowerCase() === slug
		);
		if ( found?.color ) return found.color;
	}
	return null;
};

const VariationCard = ( { variation, isSelected, isDefault, onSelect } ) => {
	const palette = variation?.palette || [];
	const bg =
		colorBySlug( palette, [ 'background', 'base', 'base-2', 'surface' ] ) ||
		'#ffffff';
	const text =
		colorBySlug( palette, [
			'foreground',
			'contrast',
			'text',
			'primary',
		] ) || '#1e1e1e';
	const accent =
		colorBySlug( palette, [
			'accent',
			'accent-1',
			'accent-2',
			'primary',
		] ) || text;
	const swatch =
		colorBySlug( palette, [ 'secondary', 'tertiary', 'accent-3' ] ) ||
		accent;

	const fontFamily = variation?.fontFamily || 'inherit';
	const title =
		variation?.title ||
		( isDefault ? __( 'Default', 'formspress' ) : variation?.slug );

	return (
		<button
			type="button"
			className={ `ff-std-variation-card${
				isSelected ? ' is-selected' : ''
			}` }
			onClick={ onSelect }
			aria-pressed={ isSelected }
			title={ title }
		>
			<div
				className="ff-std-variation-card__preview"
				style={ {
					background: bg,
					color: text,
					borderColor: text + '22',
				} }
			>
				<span
					className="ff-std-variation-card__aa"
					style={ { fontFamily } }
				>
					Aa
				</span>
				<span
					className="ff-std-variation-card__dots"
					aria-hidden="true"
				>
					<span style={ { background: text } } />
					<span style={ { background: accent } } />
					<span style={ { background: swatch } } />
				</span>
			</div>
			<Text className="ff-std-variation-card__label" size={ 12 }>
				{ title }
			</Text>
		</button>
	);
};

const StyleVariationsBrowser = ( { value, onChange } ) => {
	const variations = window.flowFormsData?.fseThemeVariations || [];

	// Always-on "Default" card first so users can reset.
	const all = useMemo(
		() => [
			{
				slug: '',
				title: __( 'Default', 'formspress' ),
				palette: [],
				fontFamily: '',
				isDefault: true,
			},
			...variations,
		],
		[ variations ]
	);

	if ( all.length <= 1 ) {
		return (
			<div className="ff-std-variations">
				<Text
					variant="muted"
					size="small"
					style={ { display: 'block' } }
				>
					{ __(
						'Your active theme does not ship any FSE style variations. Switch to a modern FSE theme (Twenty Twenty-Four, Twenty Twenty-Five, etc.) to unlock this.',
						'formspress'
					) }
				</Text>
			</div>
		);
	}

	return (
		<div className="ff-std-variations">
			<Text
				variant="muted"
				size="small"
				style={ { display: 'block', marginBottom: 12 } }
			>
				{ __(
					'Apply a variation from your active FSE theme. The form inherits its palette, typography, spacing and layout tokens.',
					'formspress'
				) }
			</Text>
			<div className="ff-std-variations__grid">
				{ all.map( ( v ) => (
					<VariationCard
						key={ v.slug || 'default' }
						variation={ v }
						isDefault={ !! v.isDefault }
						isSelected={ ( value || '' ) === ( v.slug || '' ) }
						onSelect={ () => onChange( v.slug || '' ) }
					/>
				) ) }
			</div>
		</div>
	);
};

export default StyleVariationsBrowser;
