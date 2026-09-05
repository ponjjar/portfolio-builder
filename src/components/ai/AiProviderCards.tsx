import React from 'react';
import { View, Text } from 'react-native';
import { Button } from '@/components/ui/button';
import { Sparkles, Brain, FastForward } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { AiMode } from '@/features/ai/types';
import { usePortfolioStore } from '@/store';
import { getManagedAiUsage } from '@/store';
import { Alert } from 'react-native';
import { useThemeColor } from '@/theme/colors';


interface AiProviderCardsProps {
  onSelectMode: (mode: AiMode) => void;
  onOpenExternalModal: () => void;
  onSkip: () => void;
}

export function AiProviderCards({ onSelectMode, onOpenExternalModal, onSkip }: AiProviderCardsProps) {
  const { t } = useTranslation();
  const { session } = usePortfolioStore();
  const { managedUsed, managedRemaining } = getManagedAiUsage(session);

  const handleSelectFree = () => {
    if (managedRemaining <= 0) {
      Alert.alert(
        t('ai.limit_reached_title', 'Limite de projetos atingido'),
        t('ai.limit_reached_msg', `A IA integrada permite manter até 10 projetos gerados nesta sessão.\n\nVocê possui apenas ${managedRemaining} gerações disponíveis.\n\nExclua uma geração existente, reduza a seleção ou utilize uma IA externa sem limite de projetos.`),
        [
          { text: t('common.cancel', 'Voltar à seleção'), style: 'cancel' },
          { text: t('ai.use_external', 'Usar IA externa'), onPress: onOpenExternalModal }
        ]
      );
      return;
    }
    onSelectMode('free');
  };

  return (
    <View className="flex-col md:flex-row gap-6">
      {/* Option 1 */}
      <View className="flex-1 border border-border rounded-xl p-6 bg-surface relative">
        <View className="absolute -top-3 left-6 bg-primary px-3 py-1 rounded-full">
          <Text className="text-primary-foreground text-[10px] font-bold tracking-widest uppercase">
            {t('ai.recommended')}
          </Text>
        </View>
        
        <View className="flex-row items-center mb-4 mt-2">
          <Brain color={useThemeColor('--text')} size={24} className="mr-3" />
          <Text className="text-text text-xl font-bold">{t('ai.use_my_ai')}</Text>
        </View>
        
        <Text className="text-text-secondary text-sm mb-6 leading-relaxed">
          {t('ai.use_my_ai_desc')}
        </Text>
        
        <View className="border-l-2 border-border-strong pl-4 mb-8">
          <Text className="text-text-secondary text-xs leading-relaxed">
            {t('ai.use_my_ai_info')}
          </Text>
        </View>
        
        <View className="mt-auto">
          <Button className="w-full" onPress={onOpenExternalModal}>
            {t('ai.start_external_btn', 'Configurar IA Externa')}
          </Button>
        </View>
      </View>

      {/* Option 2 */}
      <View className="flex-1 border border-border rounded-xl p-6 bg-transparent">
        <View className="flex-row items-center mb-4">
          <Sparkles color={useThemeColor('--text')} size={24} className="mr-3" />
          <Text className="text-text text-xl font-bold">{t('ai.free_ai')}</Text>
        </View>
        
        <Text className="text-text-secondary text-sm mb-6 leading-relaxed">
          {t('ai.free_ai_desc')}
        </Text>
        
        <Text className="text-text-secondary text-xs mb-4">
          {t('ai.free_ai_info')}
        </Text>
        
        <View className="bg-primary/10 px-3 py-2 rounded-md mb-6 border border-primary/20">
          <Text className="text-primary font-bold text-xs mb-1">
            {t('ai.integrated_usage', `Uso da IA integrada: ${managedUsed} de 10 projetos`)}
          </Text>
          <Text className="text-primary text-xs">
            {t('ai.integrated_remaining', `${managedRemaining} gerações disponíveis`)}
          </Text>
        </View>

        <View className="mt-auto">
          <Button 
            variant="outline" 
            className="w-full border-[#333]" 
            onPress={handleSelectFree}
            disabled={managedRemaining <= 0}
          >
            {t('ai.generate_ai_btn')}
          </Button>
        </View>
      </View>

      {/* Option 3 */}
      <View className="flex-1 border border-border rounded-xl p-6 bg-transparent">
        <View className="flex-row items-center mb-4">
          <FastForward color={useThemeColor('--text')} size={24} className="mr-3" />
          <Text className="text-text text-xl font-bold">{t('ai.no_ai')}</Text>
        </View>
        
        <Text className="text-text-secondary text-sm mb-8 leading-relaxed">
          {t('ai.no_ai_desc')}
        </Text>
        
        <View className="mt-auto">
          <Button variant="outline" className="w-full border-border-strong" onPress={onSkip}>
            <Text className="text-text text-center font-bold">{t('ai.no_ai_btn')}</Text>
          </Button>
        </View>
      </View>
    </View>
  );
}
