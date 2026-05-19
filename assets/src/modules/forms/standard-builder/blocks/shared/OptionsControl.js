import {
	BaseControl,
	Button,
	TextControl,
	Flex,
	FlexItem,
} from '@wordpress/components';
import { useInstanceId } from '@wordpress/compose';
import { closeSmall, plus } from '@wordpress/icons';
import { __ } from '@wordpress/i18n';

const OptionsControl = ( { options = [], onChange } ) => {
	const id = useInstanceId( OptionsControl, 'formspress-options-control' );
	const update = ( index, key, value ) => {
		const next = options.map( ( opt, i ) =>
			i === index ? { ...opt, [ key ]: value } : opt
		);
		onChange( next );
	};

	const remove = ( index ) => {
		onChange( options.filter( ( _, i ) => i !== index ) );
	};

	const add = () => {
		const n = options.length + 1;
		onChange( [
			...options,
			{ label: `Option ${ n }`, value: `option-${ n }` },
		] );
	};

	return (
		<BaseControl
			id={ id }
			label={ __( 'Options', 'flowforms' ) }
			__nextHasNoMarginBottom
		>
			<div style={ { display: 'flex', flexDirection: 'column', gap: 8 } }>
				{ options.map( ( opt, index ) => (
					<Flex key={ index } align="center" gap={ 2 }>
						<FlexItem isBlock>
							<TextControl
								value={ opt.label || '' }
								onChange={ ( v ) =>
									update( index, 'label', v )
								}
								placeholder={ __( 'Label', 'flowforms' ) }
								hideLabelFromVision
								label={ __( 'Label', 'flowforms' ) }
								__nextHasNoMarginBottom
								__next40pxDefaultSize
							/>
						</FlexItem>
						<FlexItem isBlock>
							<TextControl
								value={ opt.value || '' }
								onChange={ ( v ) =>
									update( index, 'value', v )
								}
								placeholder={ __( 'Value', 'flowforms' ) }
								hideLabelFromVision
								label={ __( 'Value', 'flowforms' ) }
								__nextHasNoMarginBottom
								__next40pxDefaultSize
							/>
						</FlexItem>
						<FlexItem>
							<Button
								icon={ closeSmall }
								label={ __( 'Remove option', 'flowforms' ) }
								onClick={ () => remove( index ) }
								size="small"
							/>
						</FlexItem>
					</Flex>
				) ) }
				<Button
					icon={ plus }
					variant="secondary"
					onClick={ add }
					__next40pxDefaultSize
				>
					{ __( 'Add option', 'flowforms' ) }
				</Button>
			</div>
		</BaseControl>
	);
};

export default OptionsControl;
