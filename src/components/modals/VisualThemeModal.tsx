import React from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { useThemeColor } from '@/theme/colors';

export interface VisualThemeConfig {
  preset: 'minimal' | 'dark' | 'amoled' | 'lava' | 'cosmic-glow' | 'soft-purple-glow' | 'grid-stars' | 'clean-light' | 'neon-orbit';
  accent: string;
  backgroundEffects: {
    glows: {
      enabled: boolean;
      intensity: 'low' | 'medium' | 'high';
      color: string;
      count: number;
    };
    microStars: {
      enabled: boolean;
      density: 'low' | 'medium' | 'high';
      opacity: number;
    };
  };
}

interface VisualThemeModalProps {
  visible: boolean;
  onClose: () => void;
  config: VisualThemeConfig;
  onUpdate: (config: VisualThemeConfig) => void;
}

const PRESET_IDS = [
  'minimal',
  'dark',
  'clean-light',
  'amoled',
  'cosmic-glow',
  'soft-purple-glow',
  'neon-orbit',
  'lava',
  'grid-stars',
] as const;

const ACCENT_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#FFFFFF', '#000000'];

export function VisualThemeModal({ visible, onClose, config, onUpdate }: VisualThemeModalProps) {
  const { t } = useTranslation();

  const getPresetLabel = (id: typeof PRESET_IDS[number]) => {
    switch (id) {
      case 'minimal': return t('visual_theme.presets.minimal');
      case 'dark': return t('visual_theme.presets.dark');
      case 'clean-light': return t('visual_theme.presets.clean_light');
      case 'amoled': return t('visual_theme.presets.amoled');
      case 'cosmic-glow': return t('visual_theme.presets.cosmic_glow');
      case 'soft-purple-glow': return t('visual_theme.presets.soft_purple');
      case 'neon-orbit': return t('visual_theme.presets.neon_orbit');
      case 'lava': return t('visual_theme.presets.lava');
      case 'grid-stars': return t('visual_theme.presets.grid_stars');
    }
  };

  const getIntensityLabel = (intensity: 'low' | 'medium' | 'high') => {
    switch (intensity) {
      case 'low': return t('visual_theme.intensity_low');
      case 'medium': return t('visual_theme.intensity_medium');
      case 'high': return t('visual_theme.intensity_high');
    }
  };

  const getDensityLabel = (density: 'low' | 'medium' | 'high') => {
    switch (density) {
      case 'low': return t('visual_theme.density_low');
      case 'medium': return t('visual_theme.density_medium');
      case 'high': return t('visual_theme.density_high');
    }
  };

  const ToggleRow = ({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) => (
    <TouchableOpacity 
      className="flex-row items-center justify-between py-3 border-b border-border"
      onPress={() => onChange(!value)}
    >
      <Text className="text-text font-bold">{label}</Text>
      <View className={`w-10 h-6 rounded-full p-1 justify-center ${value ? 'bg-primary' : 'bg-input-background border border-border'}`}>
        <View className={`w-4 h-4 rounded-full bg-white shadow-sm ${value ? 'ml-auto' : ''}`} />
      </View>
    </TouchableOpacity>
  );

  return (
    <Modal variant="popover"
      visible={visible}
      onClose={onClose}
      title={t('visual_theme.modal_title')}
      size="md"
      footer={
        <Button variant="default" className="w-full" onPress={onClose}>
          <Text className="text-primary-foreground font-bold">{t('common.done')}</Text>
        </Button>
      }
    >
      <ScrollView className="py-2">
        <Text className="text-text font-bold text-sm mb-3">{t('visual_theme.preset_title')}</Text>
        <View className="flex-row flex-wrap gap-2 mb-6">
          {PRESET_IDS.map(id => (
            <TouchableOpacity
              key={id}
              onPress={() => onUpdate({ ...config, preset: id })}
              className={`px-3 py-2 rounded-full border ${config.preset === id ? 'border-primary bg-primary/20' : 'border-border bg-surface'}`}
            >
              <Text className={config.preset === id ? 'text-primary font-bold text-xs' : 'text-text text-xs'}>
                {getPresetLabel(id)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text className="text-text font-bold text-sm mb-3">{t('visual_theme.accent_color')}</Text>
        <View className="flex-row flex-wrap gap-2 mb-6">
          {ACCENT_COLORS.map(color => (
            <TouchableOpacity
              key={color}
              onPress={() => onUpdate({ ...config, accent: color })}
              className="w-10 h-10 rounded-full border-2 items-center justify-center"
              style={{ 
                backgroundColor: color, 
                borderColor: config.accent === color ? useThemeColor('--text') : 'transparent' 
              }}
            >
              {config.accent === color && <View className="w-3 h-3 rounded-full bg-background/50" />}
            </TouchableOpacity>
          ))}
        </View>

        <Text className="text-text font-bold text-sm mt-4 mb-2">{t('visual_theme.background_effects')}</Text>
        <View className="bg-surface rounded-xl border border-border overflow-hidden mb-6">
          <View className="px-4">
            <ToggleRow 
              label={t('visual_theme.glows_label')} 
              value={config.backgroundEffects.glows.enabled} 
              onChange={(v) => onUpdate({ ...config, backgroundEffects: { ...config.backgroundEffects, glows: { ...config.backgroundEffects.glows, enabled: v } } })} 
            />
          </View>
          {config.backgroundEffects.glows.enabled && (
            <View className="p-4 bg-input-background border-b border-border">
              <Text className="text-text-secondary text-xs mb-2 uppercase tracking-wider font-bold">{t('visual_theme.glow_intensity')}</Text>
              <View className="flex-row gap-2 mb-4">
                {(['low', 'medium', 'high'] as const).map(intensity => (
                  <TouchableOpacity 
                    key={intensity}
                    onPress={() => onUpdate({ ...config, backgroundEffects: { ...config.backgroundEffects, glows: { ...config.backgroundEffects.glows, intensity } } })}
                    className={`flex-1 py-1.5 rounded items-center border ${config.backgroundEffects.glows.intensity === intensity ? 'border-primary bg-primary/20' : 'border-border bg-surface'}`}
                  >
                    <Text className={config.backgroundEffects.glows.intensity === intensity ? 'text-primary font-bold text-xs' : 'text-text text-xs'}>
                      {getIntensityLabel(intensity)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          <View className="px-4">
            <ToggleRow 
              label={t('visual_theme.stars_label')} 
              value={config.backgroundEffects.microStars.enabled} 
              onChange={(v) => onUpdate({ ...config, backgroundEffects: { ...config.backgroundEffects, microStars: { ...config.backgroundEffects.microStars, enabled: v } } })} 
            />
          </View>
          {config.backgroundEffects.microStars.enabled && (
            <View className="p-4 bg-input-background">
              <Text className="text-text-secondary text-xs mb-2 uppercase tracking-wider font-bold">{t('visual_theme.stars_density')}</Text>
              <View className="flex-row gap-2">
                {(['low', 'medium', 'high'] as const).map(density => (
                  <TouchableOpacity 
                    key={density}
                    onPress={() => onUpdate({ ...config, backgroundEffects: { ...config.backgroundEffects, microStars: { ...config.backgroundEffects.microStars, density } } })}
                    className={`flex-1 py-1.5 rounded items-center border ${config.backgroundEffects.microStars.density === density ? 'border-primary bg-primary/20' : 'border-border bg-surface'}`}
                  >
                    <Text className={config.backgroundEffects.microStars.density === density ? 'text-primary font-bold text-xs' : 'text-text text-xs'}>
                      {getDensityLabel(density)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}
        </View>

      </ScrollView>
    </Modal>
  );
}
