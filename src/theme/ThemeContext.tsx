import { AmbientBackground } from '@/components/ui/ambient-background';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { Dimensions, Platform, StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

export type ThemeId = 'light' | 'lava' | 'dark' | 'amoled' | 'terminal' | 'ocean';

interface ThemeContextType {
  theme: ThemeId;
  setTheme: (id: ThemeId, x?: number, y?: number) => void;
  isTransitioning: boolean;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: 'dark',
  setTheme: () => { },
  isTransitioning: false,
});

export let currentActiveTheme: ThemeId = 'dark';

export const useTheme = () => useContext(ThemeContext);

const THEME_STORAGE_KEY = 'portfolio-builder:theme:v1';

export const getThemeBackground = (id: ThemeId) => {
  switch (id) {
    case 'light': return '#F7F7F5';
    case 'lava': return '#211515';
    case 'amoled': return '#000000';
    case 'dark':
    default: return '#222222';
  }
};

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const [theme, setThemeState] = useState<ThemeId>('dark');
  const [nextTheme, setNextTheme] = useState<ThemeId | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isReady, setIsReady] = useState(false);

  currentActiveTheme = theme;

  // Transition state for fallback / mobile
  const [origin, setOrigin] = useState({ x: 0, y: 0 });
  const radius = useSharedValue(0);

  useEffect(() => {
    const loadTheme = async () => {
      try {
        const savedTheme = await AsyncStorage.getItem(THEME_STORAGE_KEY);
        if (savedTheme && ['light', 'lava', 'dark', 'amoled'].includes(savedTheme)) {
          setThemeState(savedTheme as ThemeId);
        }
      } catch {
        // Fallback to dark
      } finally {
        setIsReady(true);
      }
    };
    loadTheme();
  }, []);

  const setTheme = (id: ThemeId, x = 0, y = 0) => {
    if (isTransitioning || id === theme) return;

    // Direct change if no coordinates provided
    if (x === 0 && y === 0) {
      setThemeState(id);
      AsyncStorage.setItem(THEME_STORAGE_KEY, id).catch(() => { });
      return;
    }

    // Modern Web: Native GPU View Transition API with radial circle clipPath
    if (
      Platform.OS === 'web' &&
      typeof document !== 'undefined' &&
      typeof (document as any).startViewTransition === 'function'
    ) {
      try {
        const right = window.innerWidth - x;
        const bottom = window.innerHeight - y;
        const maxRadius = Math.hypot(Math.max(x, right), Math.max(y, bottom));


        // Set background to current theme to prevent white flash during snapshot
        document.documentElement.style.backgroundColor = getThemeBackground(theme);


        setIsTransitioning(true);
        const transition = (document as any).startViewTransition(() => {
          // Set background to new theme for the new state
          document.documentElement.style.backgroundColor = getThemeBackground(theme);


          setThemeState(id);
          AsyncStorage.setItem(THEME_STORAGE_KEY, id).catch(() => { });
        });

        transition.ready
          .then(() => {
            document.documentElement.animate(
              {
                clipPath: [
                  `circle(0px at ${x}px ${y}px)`,
                  `circle(${maxRadius}px at ${x}px ${y}px)`,
                ],


              },
              {
                duration: 900,
                easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
                pseudoElement: '::view-transition-new(root)',
              }
            );
          })
          .catch(() => {
            setThemeState(id);
            AsyncStorage.setItem(THEME_STORAGE_KEY, id).catch(() => { });
          })
          .finally(() => {
            setIsTransitioning(false);
          });
        return;
      } catch {
        // Fallback to reanimated overlay if browser errors
      }
    }

    // Universal Fallback (Mobile Native & legacy Web)
    setIsTransitioning(true);
    setNextTheme(id);
    setOrigin({ x, y });

    const { width, height } = Dimensions.get('window');
    const corners = [
      { cx: 0, cy: 0 },
      { cx: width, cy: 0 },
      { cx: 0, cy: height },
      { cx: width, cy: height },
    ];
    let maxDist = 0;
    for (const corner of corners) {
      const dist = Math.sqrt(Math.pow(corner.cx - x, 2) + Math.pow(corner.cy - y, 2));
      if (dist > maxDist) maxDist = dist;
    }

    radius.value = 0;
    radius.value = withTiming(
      maxDist,
      { duration: 550, easing: Easing.bezier(0.22, 1, 0.36, 1) },
      (finished) => {
        if (finished) {
          runOnJS(completeTransition)(id);
        }
      }
    );
  };

  const completeTransition = (id: ThemeId) => {
    setThemeState(id);
    AsyncStorage.setItem(THEME_STORAGE_KEY, id).catch(() => { });

    setTimeout(() => {
      radius.value = 0;
      setNextTheme(null);
      setIsTransitioning(false);
    }, 40);
  };

  const animatedStyle = useAnimatedStyle(() => {
    return {
      width: radius.value * 2,
      height: radius.value * 2,
      borderRadius: radius.value,
      transform: [
        { translateX: -radius.value },
        { translateY: -radius.value },
      ],
    };
  });

  if (!isReady) return null;

  return (
    <ThemeContext.Provider value={{ theme, setTheme, isTransitioning }}>
      <View className={`flex-1 theme-${theme}`}>
        <AmbientBackground theme={theme} />

        {/* Background-layer GPU overlay for circular reveal animation on native/fallback */}
        {nextTheme && (
          <View
            style={[
              StyleSheet.absoluteFill,
              { zIndex: 5, elevation: 5, pointerEvents: 'none' },
            ]}
          >
            <Animated.View
              style={[
                {
                  position: 'absolute',
                  left: origin.x,
                  top: origin.y,
                  backgroundColor: getThemeBackground(nextTheme),
                  opacity: 1,
                },
                animatedStyle,
              ]}
            />
          </View>
        )}

        <View className="flex-1 z-10" style={{ elevation: 10, zIndex: 10 }}>
          {children}
        </View>
      </View>
    </ThemeContext.Provider>
  );
};
