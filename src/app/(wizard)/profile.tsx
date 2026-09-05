import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { WizardScreen } from '@/components/layout/wizard-screen';
import { BottomNav } from '@/components/layout/bottom-nav';
import { getNextWizardStep, getWizardRoute } from '@/utils/wizard';

import { FormField } from '@/components/ui/form-field';
import { ImagePickerField } from '@/components/ui/image-picker-field';
import { Code2, Briefcase, Plus, Trash2 } from 'lucide-react-native';
import { usePortfolioStore } from '@/store';
import { useTranslation } from 'react-i18next';
import { useThemeColor } from '@/theme/colors';


export default function ProfileScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { returnTo } = useLocalSearchParams<{ returnTo?: string }>();
  const { session, updateProfile, updateSocialLinks } = usePortfolioStore();
  const profile = session.profile;
  const socialLinks = session.socialLinks;

  const [errors, setErrors] = React.useState<{ name?: string, headline?: string, bio?: string }>({});
  const [linkErrors, setLinkErrors] = React.useState<{ github?: string, linkedin?: string, custom?: string }>({});

  const getSocialLink = (type: string) => socialLinks.find(l => l.type === type)?.url || '';

  const setSocialLink = (type: 'github' | 'linkedin', url: string) => {
    let finalUrl = url.trim();
    if (finalUrl && !finalUrl.startsWith('http')) {
      if (type === 'github') {
        finalUrl = `https://github.com/${finalUrl}`;
      } else if (type === 'linkedin') {
        finalUrl = `https://linkedin.com/in/${finalUrl}`;
      }
    }

    const existing = [...socialLinks];
    const index = existing.findIndex(l => l.type === type);
    if (index >= 0) {
      if (!finalUrl) {
        existing.splice(index, 1);
      } else {
        existing[index].url = finalUrl;
      }
    } else if (finalUrl) {
      existing.push({ type, label: type === 'github' ? 'GitHub' : 'LinkedIn', url: finalUrl });
    }
    updateSocialLinks(existing);
  };

  const customLinks = socialLinks.filter(l => l.type !== 'github' && l.type !== 'linkedin');

  const addCustomLink = () => {
    if (customLinks.length >= 5) return;
    const newLink = { type: `custom-${Date.now()}`, label: '', url: '' };
    updateSocialLinks([...socialLinks, newLink]);
  };

  const removeCustomLink = (type: string) => {
    updateSocialLinks(socialLinks.filter(l => l.type !== type));
  };

  const updateCustomLink = (type: string, updates: Partial<{ label: string, url: string }>) => {
    updateSocialLinks(socialLinks.map(l => l.type === type ? { ...l, ...updates } : l));
  };

  const handleNext = () => {
    const newErrors: typeof errors = {};
    const newLinkErrors: typeof linkErrors = {};

    if (!profile.name.trim()) newErrors.name = 'Informe seu nome para continuar.';
    if (!profile.headline.trim()) newErrors.headline = 'Adicione um título profissional.';
    if (!profile.bio.trim()) newErrors.bio = 'Escreva uma breve apresentação.';

    const githubUrl = getSocialLink('github');
    if (githubUrl && (!githubUrl.startsWith('http') || !githubUrl.toLowerCase().includes('github.com'))) {
      newLinkErrors.github = 'Insira um link válido do GitHub.';
    }

    const linkedinUrl = getSocialLink('linkedin');
    if (linkedinUrl && (!linkedinUrl.startsWith('http') || !linkedinUrl.toLowerCase().includes('linkedin.com'))) {
      newLinkErrors.linkedin = 'Insira um link válido do LinkedIn.';
    }

    let hasInvalidCustom = false;
    for (const link of customLinks) {
      if ((link.label && !link.url) || (!link.label && link.url)) {
        hasInvalidCustom = true;
      }
      if (link.url && !link.url.startsWith('http')) {
        hasInvalidCustom = true;
      }
    }
    
    if (hasInvalidCustom) {
      newLinkErrors.custom = 'Preencha o nome e um link válido (http://...) para os links adicionais.';
    }

    if (Object.keys(newErrors).length > 0 || Object.keys(newLinkErrors).length > 0) {
      setErrors(newErrors);
      setLinkErrors(newLinkErrors);
      return;
    }

    setErrors({});
    setLinkErrors({});
    if (returnTo === 'editor') {
      router.push('/(wizard)/editor');
    } else {
      router.push(getWizardRoute(getNextWizardStep('profile')!));
    }
  };

  const renderMainLinks = () => (
    <>
      <Text className="text-[11px] font-bold text-text-secondary uppercase mb-6 tracking-wide">
        {t('profile.main_links')}
      </Text>
      
      <FormField 
        label="GitHub"
        placeholder="https://github.com/..." 
        value={getSocialLink('github')}
        onChangeText={(text) => {
          setSocialLink('github', text);
          if (linkErrors.github) setLinkErrors(e => ({ ...e, github: undefined }));
        }}
        leadingIcon={<Code2 color={useThemeColor('--text-secondary')} size={18} />}
        error={linkErrors.github}
      />
      
      <FormField 
        label="LinkedIn"
        placeholder="https://linkedin.com/in/..." 
        value={getSocialLink('linkedin')}
        onChangeText={(text) => {
          setSocialLink('linkedin', text);
          if (linkErrors.linkedin) setLinkErrors(e => ({ ...e, linkedin: undefined }));
        }}
        leadingIcon={<Briefcase color={useThemeColor('--text-secondary')} size={18} />}
        error={linkErrors.linkedin}
      />
    </>
  );

  return (
    <WizardScreen 
      step={1} 
      title={t('profile.title')} 
      subtitle={t('profile.subtitle')}
      bottomNav={<BottomNav onNext={handleNext} nextLabel={returnTo === 'editor' ? 'Salvar e Voltar' : 'Continuar'} />}
    >
      <View className="flex-col md:flex-row md:gap-16">
        
        {/* Left Column: Avatar & Main Links (Desktop) */}
        <View className="md:w-[280px] shrink-0">
          <View className="mb-10">
            <ImagePickerField 
              value={profile.avatar?.value}
              isUrl={profile.avatar?.type === 'url'}
              onChange={(value, isUrl) => {
                if (value) {
                  updateProfile({ avatar: { type: isUrl ? 'url' : 'embedded', value } });
                } else {
                  updateProfile({ avatar: undefined });
                }
              }}
            />
          </View>

          {/* DESKTOP ONLY: Main Links under avatar */}
          <View className="hidden md:flex flex-col mt-2">
            {renderMainLinks()}
          </View>
        </View>

        {/* Right Column: Main Profile Info & Other Links */}
        <View className="flex-1 w-full max-w-[520px]">
          <View className="mb-4">
            <FormField 
              label={t('profile.name_label')}
              placeholder={t('profile.name_placeholder')}
              value={profile.name}
              onChangeText={(text) => {
                updateProfile({ name: text });
                if (errors.name) setErrors(e => ({ ...e, name: undefined }));
              }}
              error={errors.name}
            />
            
            <FormField 
              label={t('profile.headline_label')}
              placeholder={t('profile.headline_placeholder')}
              value={profile.headline}
              onChangeText={(text) => {
                updateProfile({ headline: text });
                if (errors.headline) setErrors(e => ({ ...e, headline: undefined }));
              }}
              error={errors.headline}
            />
            
            <FormField 
              variant="textarea"
              label={t('profile.about_label')}
              placeholder={t('profile.about_placeholder')}
              value={profile.bio}
              onChangeText={(text) => {
                updateProfile({ bio: text });
                if (errors.bio) setErrors(e => ({ ...e, bio: undefined }));
              }}
              error={errors.bio}
              maxLength={500}
              showCounter
            />
          </View>
          
          {/* MOBILE ONLY: Main Links under profile info */}
          <View className="flex md:hidden flex-col mb-8 mt-2">
            {renderMainLinks()}
          </View>

          {/* Outros Links (Right Column) */}
          <View className="mt-4 md:mt-2">
            <View className="border-t border-border pt-6 md:border-t-0 md:pt-0">
              <View className="flex-row justify-between items-center mb-6">
                <Text className="text-[11px] font-bold text-text-secondary uppercase tracking-wide">
                  {t('profile.other_links')}
                </Text>
                {customLinks.length < 5 && (
                  <Pressable onPress={addCustomLink} className="flex-row items-center gap-1.5 bg-surface-elevated px-3 py-1.5 rounded-full border border-border transition-colors hover:bg-border/30">
                    <Plus size={14} color={useThemeColor('--text')} />
                    <Text className="text-[12px] font-medium text-text">{t('common.add')}</Text>
                  </Pressable>
                )}
              </View>

              {customLinks.map((link) => (
                <View key={link.type} className="flex-row gap-3 mb-2 items-start">
                  <View className="flex-1">
                    <FormField
                      label={t('profile.site_name')}
                      placeholder={t('profile.site_name_placeholder')}
                      value={link.label}
                      onChangeText={(text) => {
                        updateCustomLink(link.type, { label: text });
                        if (linkErrors.custom) setLinkErrors(e => ({ ...e, custom: undefined }));
                      }}
                    />
                  </View>
                  <View className="flex-1">
                    <FormField
                      label={t('profile.access_link')}
                      placeholder={t('profile.access_link_placeholder')}
                      value={link.url}
                      onChangeText={(text) => {
                        updateCustomLink(link.type, { url: text });
                        if (linkErrors.custom) setLinkErrors(e => ({ ...e, custom: undefined }));
                      }}
                    />
                  </View>
                  <Pressable 
                    onPress={() => removeCustomLink(link.type)}
                    className="w-10 h-[58px] items-center justify-center rounded-[12px] border border-transparent hover:bg-red-500/10 cursor-pointer"
                  >
                    <Trash2 size={18} color="#ef4444" />
                  </Pressable>
                </View>
              ))}

              {linkErrors.custom && (
                <Text className="text-red-500 text-[13px] font-medium mt-1">{linkErrors.custom}</Text>
              )}
            </View>
          </View>
        </View>

      </View>
    </WizardScreen>
  );
}

