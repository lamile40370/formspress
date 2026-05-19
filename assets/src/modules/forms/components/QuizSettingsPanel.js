/**
 * Form-level Quiz settings panel.
 *
 * Renders inside the form-inspector tab (next to "Submission", "Actions",
 * etc.). When enabled, exposes per-form quiz config:
 *
 *   - enabled               toggle
 *   - show_score_to_user    toggle
 *   - failing_score         number
 *   - time_limit_seconds    number
 *   - result_screens        repeating { id, min_score, max_score, title, message }
 *
 * Per-option scoring is handled inline in the field inspector for choice
 * fields — see `OptionsList` below (also exported).
 */
import {
	Button,
	PanelBody,
	ToggleControl,
	TextControl,
	TextareaControl,
	Notice,
	__experimentalVStack as VStack,
	__experimentalHStack as HStack,
	FlexBlock,
} from '@wordpress/components';
import { __, sprintf } from '@wordpress/i18n';
import { trash, plus } from '@wordpress/icons';

const generateScreenId = () =>
	'screen_' + Math.random().toString( 36 ).slice( 2, 10 );

const QuizSettingsPanel = ( { quiz, onChange } ) => {
	const q = quiz || {};
	const enabled = !! q.enabled;
	const screens = Array.isArray( q.result_screens ) ? q.result_screens : [];

	const set = ( key ) => ( value ) => onChange( { ...q, [ key ]: value } );

	const updateScreen = ( i, patch ) => {
		const next = screens.map( ( s, idx ) =>
			idx === i ? { ...s, ...patch } : s
		);
		onChange( { ...q, result_screens: next } );
	};

	const addScreen = () => {
		onChange( {
			...q,
			result_screens: [
				...screens,
				{
					id: generateScreenId(),
					min_score: 0,
					max_score: 0,
					title: '',
					message: '',
				},
			],
		} );
	};

	const removeScreen = ( i ) => {
		onChange( {
			...q,
			result_screens: screens.filter( ( _, idx ) => idx !== i ),
		} );
	};

	return (
		<PanelBody title={ __( 'Quiz', 'flowforms' ) } initialOpen={ false }>
			<VStack spacing={ 4 }>
				<ToggleControl
					label={ __( 'Enable quiz mode', 'flowforms' ) }
					checked={ enabled }
					onChange={ ( v ) => onChange( { ...q, enabled: v } ) }
					help={ __(
						'Score answers and show a custom result screen on submission.',
						'flowforms'
					) }
					__nextHasNoMarginBottom
				/>

				{ enabled && (
					<>
						<ToggleControl
							label={ __(
								'Show score to the user',
								'flowforms'
							) }
							checked={ q.show_score_to_user !== false }
							onChange={ set( 'show_score_to_user' ) }
							__nextHasNoMarginBottom
						/>
						<TextControl
							type="number"
							label={ __( 'Failing score', 'flowforms' ) }
							value={
								q.failing_score == null
									? ''
									: String( q.failing_score )
							}
							onChange={ ( v ) =>
								set( 'failing_score' )(
									v === '' ? null : parseFloat( v )
								)
							}
							help={ __(
								'Used for pass/fail logic in actions and result screens.',
								'flowforms'
							) }
							__nextHasNoMarginBottom
							__next40pxDefaultSize
						/>
						<TextControl
							type="number"
							label={ __( 'Time limit (seconds)', 'flowforms' ) }
							value={
								q.time_limit_seconds == null
									? ''
									: String( q.time_limit_seconds )
							}
							onChange={ ( v ) =>
								set( 'time_limit_seconds' )(
									v === '' ? null : parseInt( v, 10 )
								)
							}
							help={ __(
								'Optional countdown timer on flow forms.',
								'flowforms'
							) }
							__nextHasNoMarginBottom
							__next40pxDefaultSize
						/>

						<div>
							<p style={ { margin: '0 0 8px', fontWeight: 500 } }>
								{ __( 'Result screens', 'flowforms' ) }
							</p>
							{ screens.length === 0 && (
								<Notice status="info" isDismissible={ false }>
									{ __(
										'No result screens yet. Add one to show different messages by score range.',
										'flowforms'
									) }
								</Notice>
							) }
							<VStack spacing={ 3 }>
								{ screens.map( ( screen, i ) => (
									<div
										key={ screen.id || i }
										style={ {
											border: '1px solid #e0e0e0',
											borderRadius: 4,
											padding: 8,
										} }
									>
										<HStack align="flex-end" spacing={ 2 }>
											<FlexBlock>
												<TextControl
													label={ __(
														'Screen ID',
														'flowforms'
													) }
													value={ screen.id || '' }
													onChange={ ( v ) =>
														updateScreen( i, {
															id: v,
														} )
													}
													__nextHasNoMarginBottom
													__next40pxDefaultSize
												/>
											</FlexBlock>
											<Button
												isDestructive
												size="small"
												icon={ trash }
												onClick={ () =>
													removeScreen( i )
												}
												label={ __(
													'Remove screen',
													'flowforms'
												) }
											/>
										</HStack>
										<HStack spacing={ 2 }>
											<FlexBlock>
												<TextControl
													type="number"
													label={ __(
														'Min score',
														'flowforms'
													) }
													value={ String(
														screen.min_score ?? 0
													) }
													onChange={ ( v ) =>
														updateScreen( i, {
															min_score:
																parseFloat(
																	v
																) || 0,
														} )
													}
													__nextHasNoMarginBottom
													__next40pxDefaultSize
												/>
											</FlexBlock>
											<FlexBlock>
												<TextControl
													type="number"
													label={ __(
														'Max score',
														'flowforms'
													) }
													value={ String(
														screen.max_score ?? 0
													) }
													onChange={ ( v ) =>
														updateScreen( i, {
															max_score:
																parseFloat(
																	v
																) || 0,
														} )
													}
													__nextHasNoMarginBottom
													__next40pxDefaultSize
												/>
											</FlexBlock>
										</HStack>
										<TextControl
											label={ __( 'Title', 'flowforms' ) }
											value={ screen.title || '' }
											onChange={ ( v ) =>
												updateScreen( i, { title: v } )
											}
											__nextHasNoMarginBottom
											__next40pxDefaultSize
										/>
										<TextareaControl
											label={ __(
												'Message',
												'flowforms'
											) }
											value={ screen.message || '' }
											onChange={ ( v ) =>
												updateScreen( i, {
													message: v,
												} )
											}
											rows={ 3 }
											help={ __(
												'Use {score} and {max_score} merge tags.',
												'flowforms'
											) }
											__nextHasNoMarginBottom
										/>
									</div>
								) ) }
								<Button
									variant="secondary"
									icon={ plus }
									onClick={ addScreen }
									__next40pxDefaultSize
								>
									{ __( 'Add result screen', 'flowforms' ) }
								</Button>
							</VStack>
						</div>
					</>
				) }
			</VStack>
		</PanelBody>
	);
};

/**
 * Per-option score inputs. Drop into the choice-field inspector while
 * `form.settings.quiz.enabled` is on; falls back to the existing options
 * list otherwise.
 */
export const QuizOptionsList = ( { options = [], onChange } ) => {
	/**
	 * Normalize either string or { value, score } back to a uniform shape
	 * so the editor never has to handle two cases simultaneously.
	 */
	const normalized = options.map( ( o ) =>
		typeof o === 'string'
			? { value: o, score: 0 }
			: { value: o.value || '', score: Number( o.score || 0 ) }
	);

	const update = ( i, patch ) => {
		const next = normalized.map( ( o, idx ) =>
			idx === i ? { ...o, ...patch } : o
		);
		onChange( next );
	};
	const remove = ( i ) =>
		onChange( normalized.filter( ( _, idx ) => idx !== i ) );
	const add = () => onChange( [ ...normalized, { value: '', score: 0 } ] );

	return (
		<VStack spacing={ 2 }>
			{ normalized.map( ( opt, i ) => (
				<HStack key={ i } spacing={ 2 } align="flex-end">
					<FlexBlock>
						<TextControl
							label={ sprintf(
								__( 'Option %d', 'flowforms' ),
								i + 1
							) }
							value={ opt.value }
							onChange={ ( v ) => update( i, { value: v } ) }
							__nextHasNoMarginBottom
							__next40pxDefaultSize
						/>
					</FlexBlock>
					<div style={ { width: 80 } }>
						<TextControl
							type="number"
							label={ __( 'Score', 'flowforms' ) }
							value={ String( opt.score ) }
							onChange={ ( v ) =>
								update( i, { score: parseFloat( v ) || 0 } )
							}
							__nextHasNoMarginBottom
							__next40pxDefaultSize
						/>
					</div>
					<Button
						isDestructive
						size="small"
						icon={ trash }
						onClick={ () => remove( i ) }
					/>
				</HStack>
			) ) }
			<Button
				variant="secondary"
				size="small"
				icon={ plus }
				onClick={ add }
			>
				{ __( 'Add option', 'flowforms' ) }
			</Button>
		</VStack>
	);
};

export default QuizSettingsPanel;
