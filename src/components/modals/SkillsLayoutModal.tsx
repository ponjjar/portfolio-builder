import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, Switch } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { SkillsLayoutSchema } from '@/domain/portfolio/schema';
import { z } from 'zod';
import { Code, LayoutList, ListTree, Grid, GripHorizontal, Sidebar, FileText } from 'lucide-react-native';
import { useThemeColor } from '@/theme/colors';

type SkillsLayout = z.infer<typeof SkillsLayoutSchema>;

interface SkillsLayoutModalProps {
  visible: boolean;
  onClose: () => void;
  config: SkillsLayout;
  onUpdate: (config: SkillsLayout) => void;
}

export function SkillsLayoutModal({ visible, onClose, config, onUpdate }: SkillsLayoutModalProps) {
  const { t } = useTranslation();

  return (
    <Modal variant="popover"
      visible={visible}
      onClose={onClose}
      title={t('editor.skillsLayout.title', 'Technologies Layout')}
      size="md"
      footer={
        <Button variant="default" className="w-full" onPress={onClose}>
          <Text className="text-primary-foreground font-bold">{t('common.done')}</Text>
        </Button>
      }
    >
      <ScrollView className="py-2">
        {/* Display Style */}
        <Text className="text-text font-bold text-sm mb-3">{t('editor.skillsLayout.displayStyle', 'Display Style')}</Text>
        <View className="gap-3 mb-6">
          <TouchableOpacity 
            onPress={() => onUpdate({ ...config, displayStyle: 'chips' })}
            className={`flex-row items-center p-3 border rounded-xl ${config.displayStyle === 'chips' ? 'border-primary bg-primary/10' : 'border-border bg-surface'}`}
          >
            <View className="w-8 h-8 rounded-full bg-input-background items-center justify-center mr-3">
              <GripHorizontal color={config.displayStyle === 'chips' ? useThemeColor('--primary') : useThemeColor('--text-secondary')} size={16} />
            </View>
            <View>
              <Text className={`font-bold text-sm ${config.displayStyle === 'chips' ? 'text-primary' : 'text-text'}`}>
                {t('editor.skillsLayout.style_chips', 'Chips')}
              </Text>
              <Text className="text-xs text-text-muted mt-0.5">{t('editor.skillsLayout.style_chips_desc', 'Wrapping responsive chips')}</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity 
            onPress={() => onUpdate({ ...config, displayStyle: 'icons' })}
            className={`flex-row items-center p-3 border rounded-xl ${config.displayStyle === 'icons' ? 'border-primary bg-primary/10' : 'border-border bg-surface'}`}
          >
            <View className="w-8 h-8 rounded-full bg-input-background items-center justify-center mr-3">
              <ListTree color={config.displayStyle === 'icons' ? useThemeColor('--primary') : useThemeColor('--text-secondary')} size={16} />
            </View>
            <View>
              <Text className={`font-bold text-sm ${config.displayStyle === 'icons' ? 'text-primary' : 'text-text'}`}>
                {t('editor.skillsLayout.style_icons', 'Icons + Labels')}
              </Text>
              <Text className="text-xs text-text-muted mt-0.5">{t('editor.skillsLayout.style_icons_desc', 'List with technology icons')}</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity 
            onPress={() => onUpdate({ ...config, displayStyle: 'icon-grid' })}
            className={`flex-row items-center p-3 border rounded-xl ${config.displayStyle === 'icon-grid' ? 'border-primary bg-primary/10' : 'border-border bg-surface'}`}
          >
            <View className="w-8 h-8 rounded-full bg-input-background items-center justify-center mr-3">
              <Grid color={config.displayStyle === 'icon-grid' ? useThemeColor('--primary') : useThemeColor('--text-secondary')} size={16} />
            </View>
            <View>
              <Text className={`font-bold text-sm ${config.displayStyle === 'icon-grid' ? 'text-primary' : 'text-text'}`}>
                {t('editor.skillsLayout.style_grid', 'Icon Grid')}
              </Text>
              <Text className="text-xs text-text-muted mt-0.5">{t('editor.skillsLayout.style_grid_desc', 'Centered icons in a responsive grid')}</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity 
            onPress={() => onUpdate({ ...config, displayStyle: 'grouped' })}
            className={`flex-row items-center p-3 border rounded-xl ${config.displayStyle === 'grouped' ? 'border-primary bg-primary/10' : 'border-border bg-surface'}`}
          >
            <View className="w-8 h-8 rounded-full bg-input-background items-center justify-center mr-3">
              <LayoutList color={config.displayStyle === 'grouped' ? useThemeColor('--primary') : useThemeColor('--text-secondary')} size={16} />
            </View>
            <View>
              <Text className={`font-bold text-sm ${config.displayStyle === 'grouped' ? 'text-primary' : 'text-text'}`}>
                {t('editor.skillsLayout.style_grouped', 'Grouped')}
              </Text>
              <Text className="text-xs text-text-muted mt-0.5">{t('editor.skillsLayout.style_grouped_desc', 'Organized by categories')}</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Placement */}
        <Text className="text-text font-bold text-sm mb-3">{t('editor.skillsLayout.placement', 'Placement')}</Text>
        <View className="gap-3 mb-6">
          <TouchableOpacity 
            onPress={() => onUpdate({ ...config, placement: 'section' })}
            className={`flex-row items-center p-3 border rounded-xl ${config.placement === 'section' ? 'border-primary bg-primary/10' : 'border-border bg-surface'}`}
          >
            <View className="w-8 h-8 rounded-full bg-input-background items-center justify-center mr-3">
              <FileText color={config.placement === 'section' ? useThemeColor('--primary') : useThemeColor('--text-secondary')} size={16} />
            </View>
            <View>
              <Text className={`font-bold text-sm ${config.placement === 'section' ? 'text-primary' : 'text-text'}`}>
                {t('editor.skillsLayout.placement_section', 'Standalone Section')}
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity 
            onPress={() => onUpdate({ ...config, placement: 'profile-description-side' })}
            className={`flex-row items-center p-3 border rounded-xl ${config.placement === 'profile-description-side' ? 'border-primary bg-primary/10' : 'border-border bg-surface'}`}
          >
            <View className="w-8 h-8 rounded-full bg-input-background items-center justify-center mr-3">
              <Sidebar color={config.placement === 'profile-description-side' ? useThemeColor('--primary') : useThemeColor('--text-secondary')} size={16} />
            </View>
            <View>
              <Text className={`font-bold text-sm ${config.placement === 'profile-description-side' ? 'text-primary' : 'text-text'}`}>
                {t('editor.skillsLayout.placement_beside', 'Beside Profile Description')}
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Options */}
        <Text className="text-text font-bold text-sm mb-3">{t('editor.options', 'Opções')}</Text>
        <View className="gap-2 mb-6">
          {config.displayStyle === 'grouped' && (
            <TouchableOpacity onPress={() => onUpdate({ ...config, showCategoryTitles: !config.showCategoryTitles })} className="flex-row items-center justify-between p-3 border border-border bg-surface rounded-xl">
              <Text className="text-text">{t('editor.skillsLayout.opt_showCategoryTitles', 'Show Categories')}</Text>
              <Switch value={config.showCategoryTitles} onValueChange={(v) => onUpdate({ ...config, showCategoryTitles: v })} trackColor={{ false: useThemeColor('--border'), true: useThemeColor('--primary') }} />
            </TouchableOpacity>
          )}
          <TouchableOpacity onPress={() => onUpdate({ ...config, showNames: !config.showNames })} className="flex-row items-center justify-between p-3 border border-border bg-surface rounded-xl">
            <Text className="text-text">{t('editor.skillsLayout.opt_showNames', 'Show Names')}</Text>
            <Switch value={config.showNames} onValueChange={(v) => onUpdate({ ...config, showNames: v })} trackColor={{ false: useThemeColor('--border'), true: useThemeColor('--primary') }} />
          </TouchableOpacity>
          {(config.displayStyle === 'icon-grid' || config.displayStyle === 'icons' || config.displayStyle === 'chips' || config.displayStyle === 'grouped') && (
            <TouchableOpacity onPress={() => onUpdate({ ...config, showIcons: !config.showIcons })} className="flex-row items-center justify-between p-3 border border-border bg-surface rounded-xl">
              <Text className="text-text">{t('editor.skillsLayout.opt_showIcons', 'Show Icons')}</Text>
              <Switch value={config.showIcons} onValueChange={(v) => onUpdate({ ...config, showIcons: v })} trackColor={{ false: useThemeColor('--border'), true: useThemeColor('--primary') }} />
            </TouchableOpacity>
          )}
          <TouchableOpacity onPress={() => onUpdate({ ...config, compact: !config.compact })} className="flex-row items-center justify-between p-3 border border-border bg-surface rounded-xl">
            <Text className="text-text">{t('editor.skillsLayout.opt_compact', 'Compact Spacing')}</Text>
            <Switch value={config.compact} onValueChange={(v) => onUpdate({ ...config, compact: v })} trackColor={{ false: useThemeColor('--border'), true: useThemeColor('--primary') }} />
          </TouchableOpacity>
        </View>

      </ScrollView>
    </Modal>
  );
}
