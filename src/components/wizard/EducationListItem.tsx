import React, { useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Education } from '@/domain/portfolio/types';
import { Trash2, Edit2, ChevronUp, GraduationCap } from 'lucide-react-native';
import { FormField } from '@/components/ui/form-field';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import { useTranslation } from 'react-i18next';
import { formatMonthYear } from '@/utils/dateFormatter';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { smoothLayout, cardEntrance, cardExit } from '@/utils/animations';
import { ArrowUp, ArrowDown } from 'lucide-react-native';
import { useThemeColor } from '@/theme/colors';


interface EducationListItemProps {
  education: Education;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onUpdate: (id: string, updates: Partial<Education>) => void;
  onDelete: (id: string) => void;
  onMoveUp?: (id: string) => void;
  onMoveDown?: (id: string) => void;
  isFirst?: boolean;
  isLast?: boolean;
}

export function EducationListItem({ education, isExpanded, onToggleExpand, onUpdate, onDelete, onMoveUp, onMoveDown, isFirst, isLast }: EducationListItemProps) {
  const { t } = useTranslation();
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const handleDelete = () => {
    setShowDeleteModal(true);
  };

  const deleteModal = (
    <Modal
      visible={showDeleteModal}
      onClose={() => setShowDeleteModal(false)}
      title={t('common.delete')}
      size="sm"
      footer={
        <View className="flex-row justify-end gap-2 mt-4">
          <Button variant="outline" onPress={() => setShowDeleteModal(false)}>
            {t('common.cancel')}
          </Button>
          <Button 
            variant="default" 
            onPress={() => {
              setShowDeleteModal(false);
              onDelete(education.id);
            }}
            style={{ backgroundColor: '#ef4444' }}
          >
            <Text style={{ color: 'white', fontWeight: 'bold' }}>{t('common.delete')}</Text>
          </Button>
        </View>
      }
    >
      <Text className="text-text">{t('common.delete_confirm')}</Text>
    </Modal>
  );

  return (
    <Animated.View 
      layout={smoothLayout} 
      entering={cardEntrance}
      exiting={cardExit}
      className="w-full mb-4"
    >
      <View className="border border-border rounded-xl bg-surface hover:bg-surface-elevated transition-colors overflow-hidden w-full">
        {deleteModal}
        
        {!isExpanded ? (
          <Animated.View entering={FadeIn.duration(200)} className="flex-row items-start p-4">
          <TouchableOpacity onPress={onToggleExpand} className="flex-1 flex-row items-start gap-4 mr-4">
            <View className="w-12 h-12 rounded-lg bg-surface-elevated items-center justify-center border border-border">
              <GraduationCap size={20} color={useThemeColor('--text-secondary')} />
            </View>

            <View className="flex-1 justify-center">
              <Text className="text-text font-bold text-base" numberOfLines={1}>{education.institution || '-'}</Text>
              <Text className="text-text-secondary text-sm mb-1" numberOfLines={1}>{education.course || '-'}</Text>
              
              <Text className="text-text-muted text-xs">
                {education.startDate || '?'} — {education.current ? t('experience.fields.currently_studying') : (education.endDate || '?')}
              </Text>
            </View>
          </TouchableOpacity>

          <View className="flex-row gap-2">
            {onMoveUp && onMoveDown && (
              <View className="flex-col justify-center mr-1">
                <TouchableOpacity onPress={() => onMoveUp(education.id)} disabled={isFirst} className={`p-1 ${isFirst ? 'opacity-30' : 'opacity-70'}`}>
                  <ArrowUp size={16} color={useThemeColor('--text-secondary')} />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => onMoveDown(education.id)} disabled={isLast} className={`p-1 ${isLast ? 'opacity-30' : 'opacity-70'}`}>
                  <ArrowDown size={16} color={useThemeColor('--text-secondary')} />
                </TouchableOpacity>
              </View>
            )}
            <TouchableOpacity onPress={onToggleExpand} className="p-2 bg-surface-elevated rounded-full self-center">
              <Edit2 size={16} color={useThemeColor('--text-secondary')} />
            </TouchableOpacity>
            <TouchableOpacity onPress={handleDelete} className="p-2 bg-[#ef444420] rounded-full self-center">
              <Trash2 size={16} color="#ef4444" />
            </TouchableOpacity>
          </View>
        </Animated.View>
      ) : (
        <Animated.View entering={FadeIn.duration(250)} className="bg-surface-elevated">
      <TouchableOpacity 
        onPress={onToggleExpand}
        className="flex-row justify-between items-center p-4 bg-surface border-b border-border"
      >
        <Text className="text-text font-bold">{t('experience.tabs.education')}</Text>
        <ChevronUp size={20} color={useThemeColor('--text-secondary')} />
      </TouchableOpacity>

      <View className="p-4 flex-col gap-4">

        {/* Row 1: Institution and Course */}
        <View className="flex-col sm:flex-row gap-4">
          <View className="flex-1">
            <FormField
              label={t('experience.fields.institution')}
              value={education.institution}
              onChangeText={(institution) => onUpdate(education.id, { institution })}
              placeholder=""
              maxLength={120}
            />
          </View>
          <View className="flex-1">
            <FormField
              label={t('experience.fields.course')}
              value={education.course}
              onChangeText={(course) => onUpdate(education.id, { course })}
              placeholder=""
              maxLength={120}
            />
          </View>
        </View>

        {/* Row 2: Degree and Field */}
        <View className="flex-col sm:flex-row gap-4">
          <View className="flex-1">
            <FormField
              label={t('experience.fields.degree')}
              value={education.degree || ''}
              onChangeText={(degree) => onUpdate(education.id, { degree })}
              placeholder=""
              maxLength={80}
            />
          </View>
          <View className="flex-1">
            <FormField
              label={t('experience.fields.field_of_study')}
              value={education.fieldOfStudy || ''}
              onChangeText={(fieldOfStudy) => onUpdate(education.id, { fieldOfStudy })}
              placeholder=""
              maxLength={120}
            />
          </View>
        </View>

        {/* Row 3: Dates and Current */}
        <View className="flex-col sm:flex-row gap-4 items-start sm:items-end">
          <View className="flex-1 w-full">
            <FormField
              label={t('experience.fields.start_date')}
              value={education.startDate || ''}
              onChangeText={(startDate) => onUpdate(education.id, { startDate: formatMonthYear(startDate) })}
              placeholder="MM/YYYY"
              maxLength={7}
            />
          </View>
          <View className="flex-1 w-full">
            <FormField
              label={t('experience.fields.end_date')}
              value={education.endDate || ''}
              onChangeText={(endDate) => onUpdate(education.id, { endDate: formatMonthYear(endDate) })}
              placeholder="MM/YYYY"
              editable={!education.current}
              maxLength={7}
            />
          </View>
          <View className="flex-1 pb-3 pt-2 sm:pt-0 sm:pb-3 w-full">
            <TouchableOpacity 
              className="flex-row items-center gap-2"
              onPress={() => onUpdate(education.id, { current: !education.current, endDate: !education.current ? null : education.endDate })}
            >
              <View className={`w-5 h-5 rounded border items-center justify-center ${education.current ? 'bg-primary border-primary' : 'border-border'}`}>
                {education.current ? <Text className="text-primary-foreground text-xs">✓</Text> : null}
              </View>
              <Text className="text-text-secondary text-sm font-medium">{t('experience.fields.currently_studying')}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Row 4: Description */}
        <FormField
          label={t('experience.fields.description')}
          value={education.description || ''}
          onChangeText={(description) => onUpdate(education.id, { description })}
          placeholder=""
          multiline
          numberOfLines={4}
          maxLength={800}
        />

        {/* Row 5: URL */}
        <FormField
          label={t('experience.fields.url')}
          value={education.url || ''}
          onChangeText={(url) => onUpdate(education.id, { url })}
          placeholder="https://..."
          maxLength={300}
        />

        <View className="flex-row justify-end mt-2 pt-2 border-t border-border">
          <Button variant="default" onPress={onToggleExpand}>
            {t('common.done')}
          </Button>
        </View>
      </View>
      </Animated.View>
        )}
      </View>
    </Animated.View>
  );
}
