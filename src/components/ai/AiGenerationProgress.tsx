import React from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { useTranslation } from 'react-i18next';
import { ProjectAiDraft, ProfileAiDraft } from '@/features/ai/types';
import { CheckCircle2, AlertTriangle, XCircle, CloudLightning } from 'lucide-react-native';
import { useThemeColor } from '@/theme/colors';


interface AiGenerationProgressProps {
  drafts?: ProjectAiDraft[];
  profileDraft?: ProfileAiDraft;
  isProfileStage?: boolean;
}

export function AiGenerationProgress({ drafts = [], profileDraft, isProfileStage = false }: AiGenerationProgressProps) {
  const { t } = useTranslation();

  if (isProfileStage && profileDraft) {
    const isError = profileDraft.status === 'error';
    return (
      <View className="flex-1 items-center justify-center p-8">
        {!isError ? (
          <>
            <ActivityIndicator size="large" color={useThemeColor('--primary')} className="mb-6" />
            <Text className="text-xl font-bold text-text mb-2 text-center">
              {t('ai.generating_profile_title', 'Criando sugestão de perfil')}
            </Text>
            <Text className="text-text-secondary text-center">
              {t('ai.generating_profile_desc', 'Analisando os projetos aprovados e suas habilidades...')}
            </Text>
          </>
        ) : (
          <>
            <XCircle color={useThemeColor('--destructive')} size={48} className="mb-4" />
            <Text className="text-xl font-bold text-text mb-2 text-center">
              {t('ai.error_profile_title', 'Erro na geração')}
            </Text>
            <Text className="text-text-secondary text-center">
              {t('ai.error_profile_desc', 'Não foi possível gerar a sugestão. A descrição original será mantida.')}
            </Text>
          </>
        )}
      </View>
    );
  }

  const total = drafts.length;
  const completed = drafts.filter(d => d.status === 'completed').length;
  const error = drafts.filter(d => d.status === 'error').length;
  const generating = drafts.filter(d => d.status === 'generating').length;
  const hasFallback = drafts.some(d => d.provider === 'cloudflare');

  return (
    <View className="flex-1 flex-col items-center justify-center p-8 bg-surface rounded-xl border border-border">
      
      {completed + error < total ? (
        <ActivityIndicator size="large" color={useThemeColor('--primary')} className="mb-6" />
      ) : error === total ? (
        <XCircle color={useThemeColor('--destructive')} size={48} className="mb-4" />
      ) : error > 0 ? (
        <AlertTriangle color={useThemeColor('--warning')} size={48} className="mb-4" />
      ) : (
        <CheckCircle2 color={useThemeColor('--success')} size={48} className="mb-4" />
      )}
      
      <Text className="text-xl font-bold text-text mb-2 text-center">
        {completed + error < total 
          ? t('ai.generating_projects_title', 'Resumindo {{current}} de {{total}} projetos', { current: completed + error + generating, total })
          : error === total
            ? t('ai.total_failure_title', 'Não foi possível gerar os resumos')
            : error > 0
              ? t('ai.partial_failure_title', 'Alguns resumos não foram gerados')
              : t('ai.success_generated_title', 'Resumos gerados')
        }
      </Text>
      
      <Text className="text-text-secondary text-center mb-6 max-w-md">
        {completed + error < total 
          ? t('ai.generating_projects_desc', 'Estamos analisando seus projetos. Isso pode levar alguns instantes.')
          : error === total
            ? t('ai.total_failure_desc', 'Nenhuma descrição foi alterada. Tente novamente mais tarde ou utilize sua IA pessoal.')
            : error > 0
              ? t('ai.partial_failure_desc', 'Os projetos com falha manterão suas descrições originais.')
              : t('ai.success_generated_desc', 'Revise os textos e indique quais são úteis antes de continuar.')
        }
      </Text>

      {hasFallback && (
        <View className="bg-warning/10 border border-warning/30 p-3 rounded-lg flex-row items-center max-w-md mt-4">
          <CloudLightning color={useThemeColor('--warning')} size={20} className="mr-3 flex-shrink-0" />
          <Text className="text-warning-foreground text-sm flex-1">
            {t('ai.fallback_alert', 'O serviço principal está temporariamente indisponível. Continuaremos usando o serviço de contingência.')}
          </Text>
        </View>
      )}

      <View className="w-full max-w-md bg-surface-elevated h-2 rounded-full mt-8 overflow-hidden">
        <View 
          className="h-full bg-primary rounded-full transition-all duration-300 ease-out"
          style={{ width: `${((completed + error) / total) * 100}%` }}
        />
      </View>
    </View>
  );
}
