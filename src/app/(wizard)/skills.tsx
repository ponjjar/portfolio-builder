import React, { useState } from 'react';
import { View, ScrollView, Text, TouchableOpacity } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { WizardScreen } from '@/components/layout/wizard-screen';
import { BottomNav } from '@/components/layout/bottom-nav';
import { getNextWizardStep, getPreviousWizardStep, getWizardRoute } from '@/utils/wizard';
import { Info, Check, Plus } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { usePortfolioStore } from '@/store';
import { AddSkillModal } from '@/components/modals/AddSkillModal';
import { isSkillsComplete } from '@/domain/portfolio/validation';
import { useThemeColor } from '@/theme/colors';


const Badge = ({ label, selected = true, onPress }: { label: string, selected?: boolean, onPress?: () => void }) => (
  <TouchableOpacity 
    onPress={onPress}
    className={`flex-row items-center flex-nowrap rounded-full px-4 py-2 border ${selected ? 'bg-primary border-primary' : 'bg-transparent border-border'}`}
  >
    <Text numberOfLines={1} className={`whitespace-nowrap ${selected ? 'text-primary-foreground' : 'text-text-secondary'} font-bold mr-2`}>{label}</Text>
    {selected && <Check color={useThemeColor('--primary-foreground')} size={14} />}
  </TouchableOpacity>
);

export default function SkillsScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { returnTo } = useLocalSearchParams<{ returnTo?: string }>();
  const { session, toggleSkill, setSkills } = usePortfolioStore();
  const skills = session.skills;

  const [isAddModalVisible, setIsAddModalVisible] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleNext = () => {
    if (!isSkillsComplete(session)) {
      setErrorMsg('Selecione pelo menos uma tecnologia.');
      return;
    }

    setErrorMsg(null);
    if (returnTo === 'editor') {
      router.push('/(wizard)/editor');
    } else {
      router.push(getWizardRoute(getNextWizardStep('skills')!));
    }
  };

  const handleBack = () => {
    if (returnTo === 'editor') {
      router.push('/(wizard)/editor');
    } else {
      router.push(getWizardRoute(getPreviousWizardStep('skills')!));
    }
  };

  const handleAddSkill = (name: string, category: any) => {
    const newSkill = {
      id: `skill_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      name,
      category,
      selected: true,
      sources: []
    };
    setSkills([...skills, newSkill]);
  };

  const selectedCount = skills.filter(s => s.selected).length;
  
  // Group skills by category
  const skillsByCategory = skills.reduce((acc, skill) => {
    const cat = skill.category || 'Other';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(skill);
    return acc;
  }, {} as Record<string, typeof skills>);
  
  // Sort categories alphabetically
  const categories = Object.keys(skillsByCategory).sort();

  return (
    <>
      <WizardScreen 
        step={3} 
        title={t('skills.title')} 
        subtitle={t('skills.subtitle')}
        bottomNav={<BottomNav onNext={handleNext} onBack={handleBack} nextLabel={returnTo === 'editor' ? 'Salvar e Voltar' : 'Continuar'} />}
      >
        <View className="flex-row items-center mb-6">
            <View className="border border-border bg-input-background px-4 py-2 rounded flex-row items-center">
              <Text className="text-text-secondary text-xs">
                {selectedCount} tecnologia(s) selecionada(s)
              </Text>
            </View>
          </View>
          
          <View className="bg-surface border border-border p-4 rounded mb-8 flex-row items-center">
            <Info color={useThemeColor('--text-secondary')} size={18} className="mr-3" />
            <Text className="text-text-secondary text-sm flex-1">
              {t('skills.info_message')}
            </Text>
          </View>

          {errorMsg && (
            <View className="mb-6 bg-[#ef444420] border border-[#ef444440] p-4 rounded-lg flex-row items-center">
              <Text className="text-red-400 flex-1">{errorMsg}</Text>
            </View>
          )}

          {categories.map((cat) => (
            <View key={cat} className="mb-8">
              <Text className="text-[10px] font-bold text-text-secondary tracking-widest uppercase mb-4">
                {cat}
              </Text>
              <View className="flex-row flex-wrap gap-3">
                {skillsByCategory[cat].map(skill => (
                  <Badge 
                    key={skill.id} 
                    label={skill.name} 
                    selected={skill.selected} 
                    onPress={() => toggleSkill(skill.id)}
                  />
                ))}
              </View>
              <View className="w-full h-[1px] bg-border mt-6" />
            </View>
          ))}
          
          <View className="mt-4 items-start">
            <TouchableOpacity 
              onPress={() => setIsAddModalVisible(true)}
              className="flex-row items-center rounded-full px-6 py-3 border border-border border-dashed bg-input-background"
            >
              <Plus color={useThemeColor('--text-secondary')} size={16} className="mr-2" />
              <Text className="text-text-secondary font-bold text-sm">{t('skills.add_technology')}</Text>
            </TouchableOpacity>
          </View>
    </WizardScreen>

      <AddSkillModal
        visible={isAddModalVisible}
        onClose={() => setIsAddModalVisible(false)}
        onAdd={handleAddSkill}
        existingSkills={skills.map(s => s.name)}
      />
    </>
  );
}
