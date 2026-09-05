import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { ArrowUp, ArrowDown } from 'lucide-react-native';
import { useThemeColor } from '@/theme/colors';


export type OrbitItem = 'name' | 'links' | 'headline';

interface ProfileCenterOrbitModalProps {
  visible: boolean;
  onClose: () => void;
  order: OrbitItem[];
  onUpdateOrder: (newOrder: OrbitItem[]) => void;
}

export function ProfileCenterOrbitModal({ visible, onClose, order, onUpdateOrder }: ProfileCenterOrbitModalProps) {
  const { t } = useTranslation();
  const currentOrder: OrbitItem[] = order?.length === 3 ? order : ['name', 'links', 'headline'];

  const itemLabels: Record<OrbitItem, string> = {
    name: t('profile_orbit.item_name'),
    links: t('profile_orbit.item_links'),
    headline: t('profile_orbit.item_headline')
  };

  const moveItem = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === currentOrder.length - 1) return;

    const newOrder = [...currentOrder] as OrbitItem[];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    
    const temp = newOrder[index];
    newOrder[index] = newOrder[targetIndex];
    newOrder[targetIndex] = temp;
    
    onUpdateOrder(newOrder as OrbitItem[]);
  };

  return (
    <Modal
      visible={visible}
      onClose={onClose}
      title={t('profile_orbit.modal_title')}
      size="sm"
      footer={
        <Button variant="default" className="w-full" onPress={onClose}>
          <Text className="text-primary-foreground font-bold">{t('common.done')}</Text>
        </Button>
      }
    >
      <View className="py-2">
        <Text className="text-text-secondary text-sm mb-4">
          {t('profile_orbit.description')}
        </Text>
        
        <View className="border border-border rounded-lg bg-input-background overflow-hidden">
          {currentOrder.map((item, index) => (
            <View 
              key={item}
              className={`flex-row items-center p-3 bg-surface ${
                index < (currentOrder as OrbitItem[]).length - 1 ? 'border-b border-border' : ''
              }`}
            >
              <View className="flex-col mr-3">
                <TouchableOpacity
                  onPress={() => moveItem(index, 'up')}
                  disabled={index === 0}
                  className={`p-1 ${index === 0 ? 'opacity-30' : 'opacity-70 hover:opacity-100'}`}
                >
                  <ArrowUp color={useThemeColor('--text')} size={16} />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => moveItem(index, 'down')}
                  disabled={index === currentOrder.length - 1}
                  className={`p-1 ${index === currentOrder.length - 1 ? 'opacity-30' : 'opacity-70 hover:opacity-100'}`}
                >
                  <ArrowDown color={useThemeColor('--text')} size={16} />
                </TouchableOpacity>
              </View>
              <View className="flex-1">
                <Text className="text-text font-bold">{itemLabels[item] || item}</Text>
                <Text className="text-text-muted text-xs">
                  {index === 0 ? t('profile_orbit.pos_top') : index === 1 ? t('profile_orbit.pos_middle') : t('profile_orbit.pos_bottom')}
                </Text>
              </View>
            </View>
          ))}
        </View>
      </View>
    </Modal>
  );
}
