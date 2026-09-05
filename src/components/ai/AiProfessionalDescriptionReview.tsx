import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useTranslation } from 'react-i18next';
import { usePortfolioStore } from '@/store';
import { Check, X, Bot } from 'lucide-react-native';
import { useThemeColor } from '@/theme/colors';


interface AiProfessionalDescriptionReviewProps {
  locale: string;
}

export function AiProfessionalDescriptionReview({ locale }: AiProfessionalDescriptionReviewProps) {
  const { t } = useTranslation();
  const { session, approveProfileAiDescription, rejectProfileAiDescription } = usePortfolioStore();

  const profileAiDesc = session.profile.aiDescriptionsByLocale?.[locale];
  
  if (!profileAiDesc) return null;

  const isPending = profileAiDesc.status === 'pending';
  const isApproved = profileAiDesc.status === 'approved' || isPending;
  const isRejected = profileAiDesc.status === 'rejected';

  const handleSelectOriginal = () => rejectProfileAiDescription(locale);
  const handleSelectSuggestion = () => approveProfileAiDescription(locale);

  return (
    <View className="border border-border rounded-xl mb-6 overflow-hidden bg-surface mt-4">
      {/* Header */}
      <View className="flex-row items-center justify-between p-4 border-b border-border bg-surface-elevated">
        <View className="flex-row items-center gap-2 flex-1">
          <Text className="text-lg font-bold text-text" numberOfLines={1}>
            {t('ai.profile_suggestion', 'Sugestão de Perfil')}
          </Text>
          <View className="bg-background border border-border px-2 py-1 rounded flex-row items-center ml-2">
            <Bot color={useThemeColor('--text-secondary')} size={12} className="mr-1" />
            <Text className="text-[10px] font-bold text-text-secondary uppercase">
              AI
            </Text>
          </View>
        </View>
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
            {profileAiDesc.originalText || t('ai.no_original_profile', 'Sem descrição original')}
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
            {profileAiDesc.generatedText}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
