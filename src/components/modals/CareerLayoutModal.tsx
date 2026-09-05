import React from 'react';
import { useTranslation } from 'react-i18next';
import { View, Text, TouchableOpacity, ScrollView, Switch } from 'react-native';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { Briefcase } from 'lucide-react-native';
import { useThemeColor } from '@/theme/colors';

export interface CareerLayoutConfig {
  layout: 'stacked' | 'side-by-side' | 'tabs';
  sharedEntryStyle: boolean;
  entryStyle: 'timeline' | 'cards' | 'stepper' | 'list';
  experienceStyle: 'timeline' | 'cards' | 'stepper' | 'list';
  educationStyle: 'timeline' | 'cards' | 'stepper' | 'list';
  defaultTab: 'experience' | 'education';
}

interface CareerLayoutModalProps {
  visible: boolean;
  onClose: () => void;
  config: CareerLayoutConfig;
  onUpdate: (config: CareerLayoutConfig) => void;
}

export function CareerLayoutModal({ visible, onClose, config, onUpdate }: CareerLayoutModalProps) {
  const { t } = useTranslation();

  return (
    <Modal variant="popover"
      visible={visible}
      onClose={onClose}
      title={t("editor.careerLayout.title", "Experience & Education Layout")}
      size="md"
      footer={
        <Button variant="default" className="w-full" onPress={onClose}>
          <Text className="text-primary-foreground font-bold">{t("common.done")}</Text>
        </Button>
      }
    >
      <ScrollView className="py-2">
        {/* OVERALL LAYOUT */}
        <Text className="text-text font-bold text-sm mb-3">{t("editor.careerLayout.overallLayout", "Overall Layout")}</Text>
        <View className="flex-row flex-wrap gap-3 mb-6">
          {['stacked', 'side-by-side', 'tabs'].map((mode) => (
            <TouchableOpacity
              key={mode}
              onPress={() => onUpdate({ ...config, layout: mode as any })}
              className={`border rounded-lg p-3 flex-1 min-w-[30%] items-center ${config.layout === mode ? 'border-primary bg-primary/10' : 'border-border bg-surface'}`}
            >
              <Text className={`font-bold text-xs ${config.layout === mode ? 'text-primary' : 'text-text'}`}>
                {t(`editor.layouts.${mode.replace(/-/g, '_')}`, mode)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* DEFAULT TAB IF TABS SELECTED */}
        {config.layout === 'tabs' && (
          <View className="mb-6">
            <Text className="text-text font-bold text-sm mb-3">{t("editor.careerLayout.defaultTab", "Default Tab")}</Text>
            <View className="flex-row border border-border rounded-lg p-1 bg-surface-elevated">
              <TouchableOpacity
                onPress={() => onUpdate({ ...config, defaultTab: 'experience' })}
                className={`flex-1 items-center px-4 py-2 rounded-md ${config.defaultTab === 'experience' ? 'bg-surface border border-border' : 'bg-transparent'}`}
              >
                <Text className={`${config.defaultTab === 'experience' ? 'text-text font-bold' : 'text-text-secondary'} text-sm`}>
                  {t("experience.tabs.experience")}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => onUpdate({ ...config, defaultTab: 'education' })}
                className={`flex-1 items-center px-4 py-2 rounded-md ${config.defaultTab === 'education' ? 'bg-surface border border-border' : 'bg-transparent'}`}
              >
                <Text className={`${config.defaultTab === 'education' ? 'text-text font-bold' : 'text-text-secondary'} text-sm`}>
                  {t("experience.tabs.education")}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* STYLES TOGGLE */}
        <View className="flex-row items-center justify-between mb-4 mt-2">
          <Text className="text-text font-bold text-sm">{t('editor.careerLayout.sharedEntryStyle', 'Use same style for both')}</Text>
          <Switch 
            value={config.sharedEntryStyle}
            onValueChange={(val) => onUpdate({ ...config, sharedEntryStyle: val })}
            trackColor={{ false: useThemeColor('--border'), true: useThemeColor('--primary') }}
            thumbColor={'#fff'}
          />
        </View>

        {/* ENTRY STYLES */}
        {config.sharedEntryStyle ? (
          <>
            <Text className="text-text font-bold text-sm mb-3 mt-2">{t("editor.careerLayout.entryStyle", "Entry Style")}</Text>
            <View className="flex-row flex-wrap gap-3">
              {['timeline', 'cards', 'stepper', 'list'].map((style) => (
                <TouchableOpacity
                  key={style}
                  onPress={() => onUpdate({ ...config, entryStyle: style as any, experienceStyle: style as any, educationStyle: style as any })}
                  className={`border rounded-lg p-3 flex-1 min-w-[45%] items-center ${config.entryStyle === style ? 'border-primary bg-primary/10' : 'border-border bg-surface'}`}
                >
                  <Text className={`font-bold text-xs ${config.entryStyle === style ? 'text-primary' : 'text-text'}`}>
                    {t(`editor.entryStyles.${style}`, style)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </>
        ) : (
          <>
            {/* Experience specific */}
            <Text className="text-text font-bold text-sm mb-3 mt-2">{t("editor.careerLayout.experienceStyle", "Experience Style")}</Text>
            <View className="flex-row flex-wrap gap-3 mb-6">
              {['timeline', 'cards', 'stepper', 'list'].map((style) => (
                <TouchableOpacity
                  key={`exp-${style}`}
                  onPress={() => onUpdate({ ...config, experienceStyle: style as any })}
                  className={`border rounded-lg p-3 flex-1 min-w-[45%] items-center ${config.experienceStyle === style ? 'border-primary bg-primary/10' : 'border-border bg-surface'}`}
                >
                  <Text className={`font-bold text-xs ${config.experienceStyle === style ? 'text-primary' : 'text-text'}`}>
                    {t(`editor.entryStyles.${style}`, style)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Education specific */}
            <Text className="text-text font-bold text-sm mb-3">{t("editor.careerLayout.educationStyle", "Education Style")}</Text>
            <View className="flex-row flex-wrap gap-3">
              {['timeline', 'cards', 'stepper', 'list'].map((style) => (
                <TouchableOpacity
                  key={`edu-${style}`}
                  onPress={() => onUpdate({ ...config, educationStyle: style as any })}
                  className={`border rounded-lg p-3 flex-1 min-w-[45%] items-center ${config.educationStyle === style ? 'border-primary bg-primary/10' : 'border-border bg-surface'}`}
                >
                  <Text className={`font-bold text-xs ${config.educationStyle === style ? 'text-primary' : 'text-text'}`}>
                    {t(`editor.entryStyles.${style}`, style)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </>
        )}
      </ScrollView>
    </Modal>
  );
}
