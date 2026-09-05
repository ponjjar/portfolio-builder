import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Button } from '@/components/ui/button';
import { CheckSquare, Square } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { usePortfolioStore } from '@/store';
import { useThemeColor } from '@/theme/colors';


interface AiProjectLimitModalProps {
  selectedProjectIds: string[];
  onToggleSelection: (id: string) => void;
  onConfirm: () => void;
}

export function AiProjectLimitModal({ selectedProjectIds, onToggleSelection, onConfirm }: AiProjectLimitModalProps) {
  const { t } = useTranslation();
  const { session } = usePortfolioStore();
  
  // Only projects that were originally marked as selected in the portfolio
  const availableProjects = session.projects.filter(p => p.selected);

  const handleToggle = (id: string) => {
    if (!selectedProjectIds.includes(id) && selectedProjectIds.length >= 10) {
      Alert.alert(
        t('ai.limit_reached_title', 'Limite atingido'),
        t('ai.limit_reached_desc', 'Você pode selecionar no máximo 10 projetos usando a IA gratuita. Desmarque um projeto para escolher outro.')
      );
      return;
    }
    onToggleSelection(id);
  };

  return (
    <View className="flex-1 bg-surface border border-border rounded-xl overflow-hidden flex flex-col max-h-[80vh]">
      <View className="p-6 border-b border-border bg-surface-elevated">
        <Text className="text-xl font-bold text-text mb-2">
          {t('ai.limit_title', 'Limite de 10 projetos')}
        </Text>
        <Text className="text-sm text-text-secondary">
          {t('ai.limit_desc', 'A IA gratuita pode resumir até 10 projetos por vez. Escolha quais projetos deseja processar.')}
        </Text>
        
        <View className="mt-4 bg-primary/10 py-2 px-4 rounded-lg flex-row items-center justify-between">
          <Text className="text-primary font-bold">
            {t('ai.selected_count', '{{count}} de 10 projetos selecionados', { count: selectedProjectIds.length })}
          </Text>
        </View>
      </View>

      <ScrollView className="flex-1 p-4">
        {availableProjects.map(project => {
          const isSelected = selectedProjectIds.includes(project.id);
          return (
            <TouchableOpacity
              key={project.id}
              activeOpacity={0.7}
              onPress={() => handleToggle(project.id)}
              className={`p-4 rounded-lg mb-3 border flex-row items-start ${
                isSelected ? 'border-primary bg-primary/5' : 'border-border bg-transparent'
              }`}
            >
              <View className="mt-1 mr-3">
                {isSelected ? (
                  <CheckSquare color={useThemeColor('--primary')} size={20} />
                ) : (
                  <Square color={useThemeColor('--text-secondary')} size={20} />
                )}
              </View>
              <View className="flex-1">
                <Text className="text-text font-bold mb-1">{project.title}</Text>
                {project.githubMetadata?.primaryLanguage && (
                  <Text className="text-xs text-text-muted mb-2 font-mono">
                    {project.githubMetadata.primaryLanguage}
                  </Text>
                )}
                <Text className="text-sm text-text-secondary" numberOfLines={2}>
                  {project.description || t('ai.no_description', 'Sem descrição original')}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <View className="p-4 border-t border-border bg-surface">
        <Button 
          onPress={onConfirm} 
          disabled={selectedProjectIds.length === 0}
          className="w-full"
        >
          {t('common.continue', 'Continuar')}
        </Button>
      </View>
    </View>
  );
}
