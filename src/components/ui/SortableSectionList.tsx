import React from 'react';
import { useTranslation } from 'react-i18next';
import { View, Text, TouchableOpacity } from 'react-native';
import { User, Briefcase, Code, ArrowUp, ArrowDown, Eye, EyeOff } from 'lucide-react-native';
import { PortfolioSection } from '@/domain/portfolio/types';
import { useThemeColor } from '@/theme/colors';


interface SortableSectionListProps {
  sections: PortfolioSection[];
  onReorder: (sections: PortfolioSection[]) => void;
  onToggleVisibility: (sectionId: string) => void;
}

const SECTION_META: Record<string, { label: string; icon: any }> = {
  hero: { label: 'hero', icon: User },
  projects: { label: 'projects', icon: Briefcase },
  skills: { label: 'skills', icon: Code },
  career: { label: 'career', icon: Briefcase },
  contact: { label: 'contact', icon: User },
};

export function SortableSectionList({ sections, onReorder, onToggleVisibility }: SortableSectionListProps) {
  const { t } = useTranslation();
  const items = [...sections].sort((a, b) => a.order - b.order);

  const moveItem = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === items.length - 1) return;

    const newItems = [...items];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    
    // Swap
    const temp = newItems[index];
    newItems[index] = newItems[targetIndex];
    newItems[targetIndex] = temp;

    // Update orders
    const reordered = newItems.map((item, idx) => ({
      ...item,
      order: idx,
    }));
    
    onReorder(reordered);
  };

  return (
    <View className="w-full">
      {items.map((section, index) => {
        const meta = SECTION_META[section.id] || { label: section.id, icon: User };
        const Icon = meta.icon;

        return (
          <View
            key={section.id}
            className="flex-row items-center bg-surface p-3 rounded mb-2 border border-border shadow-sm"
          >
            <View className="flex-col mr-2">
              <TouchableOpacity
                onPress={() => moveItem(index, 'up')}
                disabled={index === 0}
                className="p-1 opacity-70 hover:opacity-100 disabled:opacity-30"
              >
                <ArrowUp color={useThemeColor('--text-muted')} size={14} />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => moveItem(index, 'down')}
                disabled={index === items.length - 1}
                className="p-1 opacity-70 hover:opacity-100 disabled:opacity-30"
              >
                <ArrowDown color={useThemeColor('--text-muted')} size={14} />
              </TouchableOpacity>
            </View>
            <Icon color={useThemeColor('--text')} size={16} className="mr-3" />
            <Text className={`text-text flex-1 ${!section.visible ? 'opacity-50' : ''}`}>{t(`sections.${meta.label}`)}</Text>
            <TouchableOpacity onPress={() => onToggleVisibility(section.id)} className="p-2 bg-input-background hover:bg-surface-elevated rounded">
              {section.visible ? (
                <Eye color={useThemeColor('--text-secondary')} size={14} />
              ) : (
                <EyeOff color={useThemeColor('--text-muted')} size={14} />
              )}
            </TouchableOpacity>
          </View>
        );
      })}
    </View>
  );
}
