import { Platform } from 'react-native';
import { ThemeId, currentActiveTheme } from './ThemeContext';

const themeColors: Record<ThemeId, Record<string, string>> = {
  light: {
    '--background': '#F7F7F5',
    '--surface': '#FFFFFF',
    '--surface-elevated': '#FAFAF8',
    '--text': '#111111',
    '--text-secondary': '#686868',
    '--text-muted': '#8A8A8A',
    '--border': '#E2E2DF',
    '--border-strong': '#CBCBC7',
    '--input-background': '#FFFFFF',
    '--primary': '#111111',
    '--primary-foreground': '#FFFFFF',
    '--overlay': 'rgba(0, 0, 0, 0.40)',
    '--placeholder': 'rgba(17, 17, 17, 0.55)',
  },
  dark: {
    '--background': '#202124',
    '--surface': '#292A2D',
    '--surface-elevated': '#303134',
    '--text': '#F1F3F4',
    '--text-secondary': '#BDC1C6',
    '--text-muted': '#9AA0A6',
    '--border': '#3C4043',
    '--border-strong': '#5F6368',
    '--input-background': '#303134',
    '--primary': '#F1F3F4',
    '--primary-foreground': '#202124',
    '--overlay': 'rgba(0, 0, 0, 0.60)',
    '--placeholder': 'rgba(241, 243, 244, 0.55)',
  },
  lava: {
    '--background': '#160D05',
    '--surface': '#211308',
    '--surface-elevated': '#2D1B0B',
    '--text': '#FFF7E8',
    '--text-secondary': '#E8C99A',
    '--text-muted': '#AD8A5F',
    '--border': '#4A2D12',
    '--border-strong': '#724719',
    '--input-background': '#1D1107',
    '--primary': '#FFB020',
    '--primary-foreground': '#1A0D00',
    '--overlay': 'rgba(12, 6, 0, 0.72)',
    '--placeholder': 'rgba(255, 247, 232, 0.48)',
  },
  terminal: {
    '--background': '#071009',
    '--surface': '#0A170D',
    '--surface-elevated': '#102116',
    '--text': '#9CFF9C',
    '--text-secondary': '#70CC76',
    '--text-muted': '#4D9254',
    '--border': '#285D31',
    '--border-strong': '#3D8648',
    '--input-background': '#08130B',
    '--primary': '#6CFF75',
    '--primary-foreground': '#061008',
    '--overlay': 'rgba(0, 8, 2, 0.78)',
    '--placeholder': 'rgba(156, 255, 156, 0.45)',
  },
  ocean: {
    '--background': '#111315',
    '--surface': '#181A1D',
    '--surface-elevated': '#202328',
    '--text': '#F1F3F5',
    '--text-secondary': '#B5BAC1',
    '--text-muted': '#7E858E',
    '--border': '#2A2E34',
    '--border-strong': '#3B424B',
    '--input-background': '#191C20',
    '--primary': '#3478D4',
    '--primary-foreground': '#FFFFFF',
    '--overlay': 'rgba(0, 0, 0, 0.68)',
    '--placeholder': 'rgba(241, 243, 245, 0.46)',
  },
  amoled: {
    '--background': '#000000',
    '--surface': '#0A0A0A',
    '--surface-elevated': '#141414',
    '--text': '#F5F5F5',
    '--text-secondary': '#B8B8B8',
    '--text-muted': '#858585',
    '--border': '#242424',
    '--border-strong': '#3A3A3A',
    '--input-background': '#0A0A0A',
    '--primary': '#FFFFFF',
    '--primary-foreground': '#000000',
    '--overlay': 'rgba(0, 0, 0, 0.80)',
    '--placeholder': 'rgba(245, 245, 245, 0.50)',
  }
};

/**
 * Helper to safely resolve a CSS variable to a hex color on Native, 
 * while keeping the native CSS variable for Web.
 * 
 * NOTE: Named useThemeColor to avoid changing imports, but it's intentionally NOT a hook 
 * so it can be called anywhere safely without triggering React Rules of Hooks violations.
 */
export const useThemeColor = (cssVar: string) => {
  if (Platform.OS === 'web') {
    // On web, keep it as var(--something)
    return cssVar.startsWith('var(') ? cssVar : `var(${cssVar})`;
  }

  // On native, resolve it to hex
  const token = cssVar.replace('var(', '').replace(')', '');
  const colors = themeColors[currentActiveTheme] || themeColors.dark;
  
  return colors[token] || colors['--text'];
};
