import Slider, { type SliderProps } from '@mui/material/Slider';

export type AppSliderProps = SliderProps;

/**
 * App-level slider with defaults suited to compact toolbars and filters.
 */
export default function AppSlider({ size = 'small', ...rest }: SliderProps) {
  return <Slider size={size} {...rest} />;
}
