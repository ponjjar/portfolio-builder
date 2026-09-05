import { Easing, LinearTransition, FadeIn, FadeOut, SlideInRight, SlideOutLeft, SlideInLeft, SlideOutRight, ZoomIn, ZoomOut, FadeInDown, FadeOutDown } from 'react-native-reanimated';

// Durations
export const ANIMATION_DURATIONS = {
  fast: 160,
  normal: 220,
  expand: 280,
};

// Easing
export const EASINGS = {
  smoothOut: Easing.bezier(0.25, 0.1, 0.25, 1),
};

// Layout Transition (Expand/Collapse Cards)
// Using timing instead of spring to prevent "exaggerated spring" as requested.
export const smoothLayout = LinearTransition.duration(ANIMATION_DURATIONS.expand).easing(EASINGS.smoothOut);

// Card Entrance (New item / import)
export const cardEntrance = FadeInDown.duration(ANIMATION_DURATIONS.normal).easing(EASINGS.smoothOut);

// Card Exit (Delete)
export const cardExit = FadeOut.duration(ANIMATION_DURATIONS.fast);

// Tab Transitions
export const slideOutLeft = SlideOutLeft.duration(ANIMATION_DURATIONS.normal).easing(EASINGS.smoothOut);
export const slideInRight = SlideInRight.duration(ANIMATION_DURATIONS.normal).easing(EASINGS.smoothOut);

export const slideOutRight = SlideOutRight.duration(ANIMATION_DURATIONS.normal).easing(EASINGS.smoothOut);
export const slideInLeft = SlideInLeft.duration(ANIMATION_DURATIONS.normal).easing(EASINGS.smoothOut);

// Absolute slide outs for layout preservation
import { withTiming } from 'react-native-reanimated';

export const slideOutLeftAbsolute = () => {
  'worklet';
  return {
    animations: {
      transform: [{ translateX: withTiming(-30, { duration: ANIMATION_DURATIONS.normal }) }],
      opacity: withTiming(0, { duration: ANIMATION_DURATIONS.normal }),
    },
    initialValues: {
      position: 'absolute' as const,
      width: '100%' as any,
      top: 0,
      left: 0,
      transform: [{ translateX: 0 }],
      opacity: 1,
    },
  };
};

export const slideOutRightAbsolute = () => {
  'worklet';
  return {
    animations: {
      transform: [{ translateX: withTiming(30, { duration: ANIMATION_DURATIONS.normal }) }],
      opacity: withTiming(0, { duration: ANIMATION_DURATIONS.normal }),
    },
    initialValues: {
      position: 'absolute' as const,
      width: '100%' as any,
      top: 0,
      left: 0,
      transform: [{ translateX: 0 }],
      opacity: 1,
    },
  };
};
