import React from 'react';
import { Text, Pressable } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Globe } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useThemeColor } from '@/theme/colors';


export function LanguageSelector() {
  const { i18n } = useTranslation();

  const toggleLanguage = () => {
    const nextLang = i18n.language.startsWith('pt') ? 'en' : 'pt-BR';
    i18n.changeLanguage(nextLang);
    AsyncStorage.setItem('app_language', nextLang);
  };

  const label = i18n.language.startsWith('pt') ? 'PT-BR' : 'EN-US';

  return (
    <Pressable 
      onPress={toggleLanguage}
      className="flex-row items-center bg-input-background rounded-full px-3 py-1.5 border border-border"
    >
      <Globe color={useThemeColor('--text-secondary')} size={12} className="mr-2" />
      <Text className="text-text-secondary font-bold text-xs uppercase tracking-wider">
        {label}
      </Text>
    </Pressable>
  );
}
