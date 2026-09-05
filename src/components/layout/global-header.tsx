import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { X } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { LanguageSelector } from '@/components/ui/language-selector';
import { ThemeSelector } from '@/components/ui/ThemeSelector';
import { useThemeColor } from '@/theme/colors';


export function GlobalHeader() {
  const { t } = useTranslation();
  const router = useRouter();

  const handleClose = () => {
    router.replace('/');
  };

  return (
    <SafeAreaView edges={['top']} className="w-full pt-4 pb-4 px-6 bg-background border-b border-border z-50">
      <View className="w-full mx-auto flex-row items-center justify-between">
        <Text className="text-text font-bold tracking-[0.2em] uppercase text-sm">
          {t('common.portfolio_builder')}
        </Text>
        <View className="flex-row gap-2 relative">
          <ThemeSelector />
          <LanguageSelector />
          <TouchableOpacity 
            onPress={handleClose}
            className="w-10 h-10 items-center justify-center rounded-full bg-surface border border-border"
            accessibilityLabel={t('common.close')}
          >
            <X size={18} color={useThemeColor('--text')} />
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}
