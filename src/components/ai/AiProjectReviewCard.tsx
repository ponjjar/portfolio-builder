import React from 'react';
import { View, Text, Alert, TouchableOpacity } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Project } from '@/domain/portfolio/types';
import { usePortfolioStore } from '@/store';
import { Check, X, Bot, Trash2 } from 'lucide-react-native';
import { useThemeColor } from '@/theme/colors';


interface AiProjectReviewCardProps {
  project: Project;
  locale: string;
}

export function AiProjectReviewCard({ project, locale }: AiProjectReviewCardProps) {
  const { t } = useTranslation();
  const { approveProjectAiReview, rejectProjectAiReview, deleteProjectAiReview } = usePortfolioStore();
  
  const aiReview = project.aiReviewsByLocale?.[locale];
  if (!aiReview) return null;

  const isPending = aiReview.status === 'pending';
  const isApproved = aiReview.status === 'approved' || isPending; // Consider pending as approved by default visually if we auto-approve
  const isRejected = aiReview.status === 'rejected';

  const handleSelectOriginal = () => rejectProjectAiReview(project.id, locale);
  const handleSelectSuggestion = () => approveProjectAiReview(project.id, locale);
  
  const handleDelete = () => {
    Alert.alert(
      t('ai.delete_generation_title', 'Excluir texto gerado?'),
      t('ai.delete_generation_msg', 'Esta ação removerá a resposta da IA e permitirá gerar um novo texto para este projeto e idioma.'),
      [
        { text: t('common.cancel', 'Cancelar'), style: 'cancel' },
        { 
          text: t('common.delete', 'Excluir'), 
          style: 'destructive',
          onPress: () => deleteProjectAiReview(project.id, locale)
        }
      ]
    );
  };

  return (
    <View className="border border-border rounded-xl mb-6 overflow-hidden bg-surface">
      {/* Header */}
      <View className="flex-row items-center justify-between p-4 border-b border-border bg-surface-elevated">
        <View className="flex-row items-center gap-2 flex-1">
          <Text className="text-lg font-bold text-text" numberOfLines={1}>{project.title}</Text>
          <View className="bg-background border border-border px-2 py-1 rounded flex-row items-center ml-2">
            <Bot color={useThemeColor('--text-secondary')} size={12} className="mr-1" />
            <Text className="text-[10px] font-bold text-text-secondary uppercase">
              {aiReview.usedProvider}
            </Text>
          </View>
        </View>
        
        <TouchableOpacity onPress={handleDelete} className="p-2">
          <Trash2 size={16} color={useThemeColor('--text-muted')} />
        </TouchableOpacity>
      </View>

      {/* Content: Radio Panels */}
      <View accessibilityRole="radiogroup" className="flex-col md:flex-row divide-y md:divide-y-0 md:divide-x divide-border">
        {/* Original Column */}
        <TouchableOpacity 
          activeOpacity={0.7}
          onPress={handleSelectOriginal}
          accessibilityRole="radio"
          accessibilityState={{ checked: isRejected }}
          data-selected={isRejected}
          className={`ai-choice flex-1 p-4 transition-colors ${
            isRejected ? 'bg-red-500/10 dark:bg-red-500/20' : 'bg-background/50 hover:bg-surface-elevated'
          }`}
        >
          <View className="flex-row items-center justify-between mb-2">
            <Text className={`text-xs font-bold uppercase tracking-wider ${isRejected ? 'text-red-600 dark:text-red-400' : 'text-text-secondary'}`}>
              {t('ai.original_text', 'Texto Original')}
            </Text>
            <View className={`w-5 h-5 rounded-full border items-center justify-center ${isRejected ? 'border-red-600 dark:border-red-400 bg-red-600 dark:bg-red-400' : 'border-border'}`}>
              {isRejected && <X size={12} color="#fff" />}
            </View>
          </View>
          <Text className={`text-sm leading-relaxed ${isRejected ? 'text-text' : 'text-text-secondary'}`}>
            {aiReview.originalDescription || t('ai.no_description', 'Sem descrição original')}
          </Text>
        </TouchableOpacity>

        {/* Suggestion Column */}
        <TouchableOpacity 
          activeOpacity={0.7}
          onPress={handleSelectSuggestion}
          accessibilityRole="radio"
          accessibilityState={{ checked: !isRejected }}
          data-selected={!isRejected}
          className={`ai-choice flex-1 p-4 transition-colors ${
            !isRejected ? 'bg-green-500/10 dark:bg-green-500/20' : 'bg-background/50 hover:bg-surface-elevated'
          }`}
        >
          <View className="flex-row items-center justify-between mb-2">
            <Text className={`text-xs font-bold uppercase tracking-wider ${!isRejected ? 'text-green-600 dark:text-green-400' : 'text-text-secondary'}`}>
              {t('ai.suggestion_label', 'Sugestão da IA')}
            </Text>
            <View className={`w-5 h-5 rounded-full border items-center justify-center ${!isRejected ? 'border-green-600 dark:border-green-400 bg-green-600 dark:bg-green-400' : 'border-border'}`}>
              {!isRejected && <Check size={12} color="#fff" />}
            </View>
          </View>
          <Text className={`text-sm leading-relaxed ${!isRejected ? 'text-text font-medium' : 'text-text-secondary'}`}>
            {aiReview.generatedDescription}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

