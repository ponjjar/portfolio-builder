import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Platform, ScrollView, Text, View, useWindowDimensions } from 'react-native';
// @ts-ignore
// eslint-disable-next-line import/no-unresolved
import { Button } from '@/components/ui/button';
import { LanguageSelector } from '@/components/ui/language-selector';
import TestimonialV2 from '@/components/ui/testimonial-v2';
import { ThemeSelector } from '@/components/ui/ThemeSelector';
import { usePortfolioStore } from '@/store';
import { useTheme } from '@/theme/ThemeContext';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import { ArrowDown, ArrowRight, Code2, Database, FileCode2, FileText, Layout, Lock, Upload } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useThemeColor } from '@/theme/colors';


export default function WelcomeScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { importSession } = usePortfolioStore();
  const { theme } = useTheme();
  const [isDragging, setIsDragging] = useState(false);
  const [importing, setImporting] = useState(false);
  const { height } = useWindowDimensions();

  const isLight = theme === 'light';

  const processJsonContent = React.useCallback((content: string) => {
    try {
      const data = JSON.parse(content);
      const success = importSession(data);
      if (success) {
        alert(t('welcome.import_success'));
        router.push('/(wizard)/profile');
      } else {
        alert(t('welcome.import_invalid'));
      }
    } catch {
      alert(t('welcome.import_error'));
    }
    setImporting(false);
  }, [importSession, router, t]);

  const handlePickFile = async () => {
    try {
      setImporting(true);
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/json',
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];

        if (Platform.OS === 'web' && asset.file) {
          const content = await asset.file.text();
          processJsonContent(content);
        } else {
          const content = await FileSystem.readAsStringAsync(asset.uri);
          processJsonContent(content);
        }
      } else {
        setImporting(false);
      }
    } catch {
      alert(t('welcome.pick_error'));
      setImporting(false);
    }
  };

  useEffect(() => {
    if (Platform.OS !== 'web') return;

    const handleDragOver = (e: DragEvent) => {
      e.preventDefault();
      setIsDragging(true);
    };

    const handleDragLeave = (e: DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
    };

    const handleDrop = async (e: DragEvent) => {
      e.preventDefault();
      setIsDragging(false);

      if (e.dataTransfer?.files && e.dataTransfer.files.length > 0) {
        const file = e.dataTransfer.files[0];
        if (file.type === 'application/json' || file.name.endsWith('.json')) {
          setImporting(true);
          const content = await file.text();
          processJsonContent(content);
        } else {
          alert(t('welcome.drop_json_only'));
        }
      }
    };

    window.addEventListener('dragover', handleDragOver);
    window.addEventListener('dragleave', handleDragLeave);
    window.addEventListener('drop', handleDrop);

    return () => {
      window.removeEventListener('dragover', handleDragOver);
      window.removeEventListener('dragleave', handleDragLeave);
      window.removeEventListener('drop', handleDrop);
    };
  }, [processJsonContent, t]);

  return (
    <View className="flex-1 bg-background">
      {/* Absolute Overlays */}
      {isDragging && (
        <View className="absolute inset-0 z-50 bg-[#000000cc] border-4 border-dashed border-[#ffffff44] items-center justify-center">
          <Upload size={64} color={useThemeColor('--text')} className="mb-4" />
          <Text className="text-text text-3xl font-bold text-center">{t('welcome.drop_here')}</Text>
        </View>
      )}

      <View className="absolute top-6 right-6 z-50 flex-row gap-2">
        <ThemeSelector />
        <LanguageSelector />
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ flexGrow: 1 }}
        showsVerticalScrollIndicator={false}
        pagingEnabled={true}
        snapToInterval={Platform.OS === 'web' ? (typeof window !== 'undefined' ? window.innerHeight : 0) : undefined}
        snapToAlignment="start"
        decelerationRate="fast"
      >
        {/* SECTION 1: HERO */}
        <View className="w-full justify-center items-center relative overflow-hidden" style={{ minHeight: height }}>
          <View className="absolute inset-0 z-0 bg-background">
            <TestimonialV2 />
          </View>

          {/* Overlay to blur/fade the background behind text */}
          <View className="absolute inset-0 z-10 bg-black/50 backdrop-blur-sm" />

          <View className="z-20 items-center px-4 md:px-6 w-full max-w-4xl mt-0 md:mt-12">
            <Text className="text-white/80 tracking-[0.15em] uppercase text-[12px] md:text-xs font-bold mb-4 md:mb-6 drop-shadow-md">
              {t('welcome.subtitleSlogan')}
            </Text>

            <Text className="text-white text-5xl md:text-6xl lg:text-8xl font-black text-center mb-4 md:mb-6 leading-[1.1] tracking-tight drop-shadow-lg">
              {t('welcome.title')}
            </Text>

            <Text className="text-white text-base md:text-xl lg:text-2xl text-center mb-0 md:mb-12 px-2 md:px-4 max-w-2xl font-light drop-shadow-md">
              {t('welcome.subtitle')}
            </Text>
          </View>

          {/* Fixed Buttons at the bottom for mobile / desktop */}
          <View className="absolute bottom-24 md:bottom-28 z-30 flex-row justify-between md:justify-center items-center w-full px-6 gap-2 md:gap-4 max-w-4xl">
            <Button
              onPress={() => router.push('/(wizard)/profile')}
              className="flex-1 md:flex-none md:w-auto h-12 md:h-14 bg-primary rounded-full px-2 md:px-8"
            >
              <View className="flex-row items-center justify-center">
                <Text className="text-primary-foreground font-bold mr-1 md:mr-2 text-sm md:text-base">{t('welcome.start')}</Text>
                <ArrowRight size={16} color={useThemeColor('--primary-foreground')} />
              </View>
            </Button>

            <Button
              onPress={handlePickFile}
              isLoading={importing}
              style={{
                backgroundColor: isLight ? '#ffffff' : '#000000',
                borderColor: isLight ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.2)',
                borderWidth: 1,
              }}
              className="flex-1 md:flex-none md:w-auto h-12 md:h-14 rounded-full px-2 md:px-8"
            >
              <View className="flex-row items-center justify-center">
                <Upload size={16} color={isLight ? '#000000' : '#ffffff'} className="mr-1 md:mr-2" />
                <Text style={{ color: isLight ? '#000000' : '#ffffff' }} className="font-bold text-sm md:text-base">
                  {t('welcome.import_session')}
                </Text>
              </View>
            </Button>
          </View>

          <View className="absolute bottom-6 md:bottom-10 z-20 items-center animate-bounce">
            <Text className="text-white text-[10px] md:text-xs mb-1 md:mb-2 tracking-widest uppercase font-bold drop-shadow-md">
              {t('common.scroll_to_discover')}
            </Text>
            <ArrowDown size={16} color="#ffffff" />
          </View>
        </View>

        {/* SECTION 2: THE HUB (BASE) */}
        <View className="w-full justify-center items-center px-4 md:px-6 py-12 md:py-24 bg-surface" style={{ minHeight: height }}>
          <View className="max-w-4xl w-full">
            <View className="items-center mb-8 md:mb-16">
              <View className="w-12 h-12 md:w-16 md:h-16 rounded-2xl bg-primary/10 items-center justify-center mb-4 md:mb-6">
                <Database size={24} color={useThemeColor('--primary')} />
              </View>
              <Text className="text-text text-3xl md:text-6xl font-bold text-center mb-3 md:mb-4">
                {t('welcome.hub_title')}
              </Text>
              <Text className="text-text-secondary text-base md:text-xl text-center max-w-2xl px-2">
                {t('welcome.hub_desc')}
              </Text>
            </View>

            <View className="flex-row flex-wrap justify-center gap-2 md:gap-4 px-2">
              {[
                t('welcome.tags.profile'), 
                t('welcome.tags.projects'), 
                t('welcome.tags.technologies'), 
                t('welcome.tags.experiences'), 
                t('welcome.tags.links'), 
                t('welcome.tags.social')
              ].map(tag => (
                <View key={tag} className="px-4 py-2 md:px-6 md:py-3 rounded-full border border-border bg-background">
                  <Text className="text-text font-bold text-sm md:text-base">{tag}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>

        {/* SECTION 3: RESULTADOS (FIBONACCI) */}
        <View className="w-full justify-center items-center px-4 md:px-6 py-12 md:py-24 bg-background" style={{ minHeight: height }}>
          <View className="max-w-6xl w-full flex-1">
            <View className="mb-6 md:mb-16 mt-4 md:mt-0">
              <Text className="text-text text-3xl md:text-6xl font-bold mb-2 md:mb-4">
                {t('welcome.results_title')}
              </Text>
              <Text className="text-text-secondary text-base md:text-xl max-w-2xl">
                {t('welcome.results_desc')}
              </Text>
            </View>

            <ScrollView className="flex-1 w-full" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 }}>
              <View className="flex-col md:flex-row gap-4 md:gap-6">
                <View className="flex-1 bg-surface border border-border rounded-3xl p-6 md:p-8 min-h-[200px] md:min-h-[300px]">
                  <Layout size={24} color={useThemeColor('--text')} className="mb-4 md:mb-6" />
                  <Text className="text-text text-xl md:text-2xl font-bold mb-2 md:mb-3">{t('welcome.result_portfolio')}</Text>
                  <Text className="text-text-secondary leading-relaxed text-sm md:text-base">{t('welcome.result_portfolio_desc')}</Text>
                </View>

                <View className="flex-1 flex-col gap-4 md:gap-6">
                  <View className="flex-1 bg-surface border border-border rounded-3xl p-6 md:p-8">
                    <Code2 size={24} color={useThemeColor('--text')} className="mb-4 md:mb-6" />
                    <Text className="text-text text-xl md:text-2xl font-bold mb-2 md:mb-3">{t('welcome.result_readme')}</Text>
                    <Text className="text-text-secondary leading-relaxed text-sm md:text-base">{t('welcome.result_readme_desc')}</Text>
                  </View>

                  <View className="flex-1 bg-surface border border-border rounded-3xl p-6 md:p-8">
                    <FileText size={24} color={useThemeColor('--text')} className="mb-4 md:mb-6" />
                    <Text className="text-text text-xl md:text-2xl font-bold mb-2 md:mb-3">{t('welcome.result_cv')}</Text>
                    <Text className="text-text-secondary leading-relaxed text-sm md:text-base">{t('welcome.result_cv_desc')}</Text>
                  </View>
                </View>
              </View>
            </ScrollView>
          </View>
        </View>

        {/* SECTION 4: INTEGRAÇÕES */}
        <View className="w-full justify-center items-center px-4 md:px-6 py-12 md:py-24 bg-surface" style={{ minHeight: height }}>
          <View className="max-w-4xl w-full items-center">
            <View className="w-12 h-12 md:w-16 md:h-16 rounded-2xl bg-[#10b981]/10 items-center justify-center mb-4 md:mb-6">
              <Code2 size={24} color="#10b981" />
            </View>
            <Text className="text-text text-3xl md:text-6xl font-bold text-center mb-3 md:mb-4">
              {t('welcome.integrations_title')}
            </Text>
            <Text className="text-text-secondary text-base md:text-xl text-center max-w-2xl mb-8 md:mb-16">
              {t('welcome.integrations_desc')}
            </Text>
            <View className="w-full max-w-2xl h-48 md:h-64 bg-background border border-border rounded-3xl items-center justify-center px-4">
              <FileCode2 size={40} color={useThemeColor('--border-strong')} />
              <Text className="text-text-secondary mt-3 md:mt-4 text-center">{t('welcome.integrations_github')}</Text>
            </View>
          </View>
        </View>

        {/* SECTION 5: PRIVACIDADE & FINAL */}
        <View className="w-full justify-center items-center px-4 md:px-6 py-12 md:py-24 bg-background" style={{ minHeight: height }}>
          <View className="max-w-4xl w-full items-center text-center">
            <View className="w-12 h-12 md:w-16 md:h-16 rounded-2xl bg-blue-500/10 items-center justify-center mb-4 md:mb-6">
              <Lock size={24} color="#3b82f6" />
            </View>
            <Text className="text-text text-3xl md:text-6xl font-bold text-center mb-3 md:mb-4">
              {t('welcome.privacy_title')}
            </Text>
            <Text className="text-text-secondary text-base md:text-xl text-center max-w-2xl mb-8 md:mb-16">
              {t('welcome.privacy_desc')}
            </Text>

            <View className="w-full p-6 md:p-12 bg-surface border border-border rounded-3xl items-center mb-6 md:mb-8">
              <Text className="text-text text-xl md:text-3xl font-bold mb-6 md:mb-8 text-center">{t('welcome.ready_to_start')}</Text>
              <Button
                onPress={() => router.push('/(wizard)/profile')}
                className="w-full md:w-auto h-12 md:h-14 px-8 md:px-12 bg-primary rounded-full"
              >
                <Text className="text-primary-foreground font-bold text-base md:text-lg">{t('welcome.start')}</Text>
              </Button>
            </View>

            <Text className="text-text-secondary text-[10px] md:text-xs text-center max-w-sm px-2">
              {t('welcome.terms')}
            </Text>
          </View>
        </View>

      </ScrollView>
    </View>
  );
}
