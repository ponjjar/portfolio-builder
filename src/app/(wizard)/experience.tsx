import { BottomNav } from "@/components/layout/bottom-nav";
import { WizardScreen } from "@/components/layout/wizard-screen";
import { Button } from "@/components/ui/button";
import { ExperienceListItem } from "@/components/wizard/ExperienceListItem";
import { EducationListItem } from "@/components/wizard/EducationListItem";
import { ImportDataModal } from "@/components/modals/ImportDataModal";
import { ReviewImportModal } from "@/components/modals/ReviewImportModal";
import { Experience, Education } from "@/domain/portfolio/types";
import { usePortfolioStore } from "@/store";
import { getNextWizardStep, getPreviousWizardStep, getWizardRoute } from "@/utils/wizard";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Briefcase, GraduationCap, Plus, Download, ArrowUp, ArrowDown } from "lucide-react-native";
import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";

import { Text, View, TouchableOpacity, LayoutChangeEvent } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withTiming, Easing, LinearTransition, FadeInDown } from "react-native-reanimated";
import { smoothLayout, slideInLeft, slideInRight, slideOutLeftAbsolute, slideOutRightAbsolute } from "@/utils/animations";
import { useThemeColor } from '@/theme/colors';


export default function ExperienceScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { 
    session, 
    addExperience, updateExperience, removeExperience, reorderExperiences,
    addEducation, updateEducation, removeEducation, reorderEducation
  } = usePortfolioStore();
  
  const { returnTo } = useLocalSearchParams<{ returnTo?: string }>();
  
  const experiences = session.experiences || [];
  const education = session.education || [];

  const [activeTab, setActiveTab] = useState<'experience' | 'education'>('experience');
  const [expandedExperienceId, setExpandedExperienceId] = useState<string | null>(null);
  const [expandedEducationId, setExpandedEducationId] = useState<string | null>(null);

  // Tab indicator animation state
  const indicatorPosition = useSharedValue(0);
  const indicatorWidth = useSharedValue(0);
  const [expTabLayout, setExpTabLayout] = useState({ x: 0, width: 0 });
  const [eduTabLayout, setEduTabLayout] = useState({ x: 0, width: 0 });

  useEffect(() => {
    if (activeTab === 'experience' && expTabLayout.width > 0) {
      indicatorPosition.value = withTiming(expTabLayout.x, { duration: 250, easing: Easing.bezier(0.25, 0.1, 0.25, 1) });
      indicatorWidth.value = withTiming(expTabLayout.width, { duration: 250, easing: Easing.bezier(0.25, 0.1, 0.25, 1) });
    } else if (activeTab === 'education' && eduTabLayout.width > 0) {
      indicatorPosition.value = withTiming(eduTabLayout.x, { duration: 250, easing: Easing.bezier(0.25, 0.1, 0.25, 1) });
      indicatorWidth.value = withTiming(eduTabLayout.width, { duration: 250, easing: Easing.bezier(0.25, 0.1, 0.25, 1) });
    }
  }, [activeTab, expTabLayout, eduTabLayout]);

  const indicatorStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: indicatorPosition.value }],
      width: indicatorWidth.value,
    };
  });

  const [isImportModalVisible, setIsImportModalVisible] = useState(false);
  const [isReviewModalVisible, setIsReviewModalVisible] = useState(false);
  const [importData, setImportData] = useState<{ experiences: Experience[], education: Education[] } | null>(null);

  const handleNext = () => {
    if (returnTo === 'editor') {
      router.push('/editor');
      return;
    }
    if (activeTab === 'experience') {
      setActiveTab('education');
    } else {
      router.push(getWizardRoute(getNextWizardStep("experience")!));
    }
  };

  const handleBack = () => {
    if (returnTo === 'editor') {
      router.push('/editor');
      return;
    }
    if (activeTab === 'education') {
      setActiveTab('experience');
    } else {
      router.push(getWizardRoute(getPreviousWizardStep("experience")!));
    }
  };

  const handleAddExperience = () => {
    const newExp: Experience = {
      id: `exp_${Date.now()}`,
      company: "",
      title: "",
      current: false,
    };
    addExperience(newExp);
    setExpandedExperienceId(newExp.id);
  };

  const handleAddEducation = () => {
    const newEdu: Education = {
      id: `edu_${Date.now()}`,
      institution: "",
      course: "",
      current: false,
    };
    addEducation(newEdu);
    setExpandedEducationId(newEdu.id);
  };

  const moveExperience = (id: string, direction: 'up' | 'down') => {
    const index = experiences.findIndex(e => e.id === id);
    if ((direction === 'up' && index === 0) || (direction === 'down' && index === experiences.length - 1)) return;
    
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    const newArray = [...experiences];
    const temp = newArray[index];
    newArray[index] = newArray[newIndex];
    newArray[newIndex] = temp;
    reorderExperiences(newArray);
  };

  const moveEducation = (id: string, direction: 'up' | 'down') => {
    const index = education.findIndex(e => e.id === id);
    if ((direction === 'up' && index === 0) || (direction === 'down' && index === education.length - 1)) return;
    
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    const newArray = [...education];
    const temp = newArray[index];
    newArray[index] = newArray[newIndex];
    newArray[newIndex] = temp;
    reorderEducation(newArray);
  };

  return (
    <WizardScreen
      step={2}
      title={t("experience.title")}
      subtitle={t("experience.subtitle")}
      bottomNav={<BottomNav onNext={handleNext} onBack={handleBack} nextLabel={returnTo === 'editor' ? 'Salvar e Voltar' : 'Continuar'} />}
    >
      <View className="flex-row flex-wrap justify-between items-center mb-8 gap-4">
        <View className="flex-row items-center border border-border rounded-lg p-1 bg-surface-elevated relative overflow-hidden">
          {/* Animated Indicator */}
          {expTabLayout.width > 0 && (
            <Animated.View 
              style={[indicatorStyle, { position: 'absolute', height: '100%', left: 0, top: 4, bottom: 4, borderRadius: 6, backgroundColor: useThemeColor('--surface'), borderWidth: 1, borderColor: useThemeColor('--border') }]} 
            />
          )}
          
          <TouchableOpacity
            onPress={() => setActiveTab('experience')}
            onLayout={(e: LayoutChangeEvent) => setExpTabLayout({ x: e.nativeEvent.layout.x, width: e.nativeEvent.layout.width })}
            className={`px-4 py-2 rounded-md z-10`}
          >
            <Text className={`${activeTab === 'experience' ? 'text-text font-bold' : 'text-text-secondary'} text-sm`}>
              {t("experience.tabs.experience")}
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            onPress={() => setActiveTab('education')}
            onLayout={(e: LayoutChangeEvent) => setEduTabLayout({ x: e.nativeEvent.layout.x, width: e.nativeEvent.layout.width })}
            className={`px-4 py-2 rounded-md z-10`}
          >
            <Text className={`${activeTab === 'education' ? 'text-text font-bold' : 'text-text-secondary'} text-sm`}>
              {t("experience.tabs.education")}
            </Text>
          </TouchableOpacity>
        </View>

        <View className="flex-row flex-wrap gap-4">
          <Button variant="default" onPress={() => setIsImportModalVisible(true)}>
            <View className="flex-row items-center">
              <Download color={useThemeColor('--primary-foreground')} size={18} className="mr-2" />
              <Text className="text-primary-foreground font-bold">
                {t("experience.import_data")}
              </Text>
            </View>
          </Button>

          <Button variant="outline" onPress={activeTab === 'experience' ? handleAddExperience : handleAddEducation}>
            <View className="flex-row items-center">
              <Plus color={useThemeColor('--text')} size={18} className="mr-2" />
              <Text className="text-text font-bold">
                {activeTab === 'experience' ? t("experience.add_experience") : t("experience.add_education")}
              </Text>
            </View>
          </Button>
        </View>
      </View>

      <View className="w-full h-[1px] bg-border mb-6" />

      {/* Wrapping tabs in a container that doesn't collapse horizontally to allow absolute positioning if needed, 
          but for Layout animations, just conditional rendering with Animated.View works. */}
      <View className="relative w-full">
        {activeTab === 'experience' && (
          <Animated.View entering={slideInLeft} exiting={slideOutLeftAbsolute} className="w-full">
            {experiences.length === 0 ? (
              <Animated.View entering={FadeInDown.springify()}>
                <View className="border border-border border-dashed rounded-lg p-10 items-center justify-center bg-surface-elevated w-full">
                  <Text className="text-text-secondary text-center mb-6 max-w-sm leading-relaxed">
                    {t("experience.empty_experience")}
                  </Text>
                  <Button variant="outline" onPress={handleAddExperience}>
                    {t("experience.add_experience")}
                  </Button>
                </View>
              </Animated.View>
            ) : (
              <View className="flex-col w-full">
                {experiences.map((exp, index) => (
                  <ExperienceListItem
                    key={exp.id}
                    experience={exp}
                    isExpanded={expandedExperienceId === exp.id}
                    onToggleExpand={() => setExpandedExperienceId(expandedExperienceId === exp.id ? null : exp.id)}
                    onUpdate={updateExperience}
                    onDelete={(id) => {
                      removeExperience(id);
                      if (expandedExperienceId === id) setExpandedExperienceId(null);
                    }}
                    onMoveUp={() => moveExperience(exp.id, 'up')}
                    onMoveDown={() => moveExperience(exp.id, 'down')}
                    isFirst={index === 0}
                    isLast={index === experiences.length - 1}
                  />
                ))}
              </View>
            )}
          </Animated.View>
        )}

        {activeTab === 'education' && (
          <Animated.View entering={slideInRight} exiting={slideOutRightAbsolute} className="w-full">
            {education.length === 0 ? (
              <Animated.View entering={FadeInDown.springify()}>
                <View className="border border-border border-dashed rounded-lg p-10 items-center justify-center bg-surface-elevated w-full">
                  <Text className="text-text-secondary text-center mb-6 max-w-sm leading-relaxed">
                    {t("experience.empty_education")}
                  </Text>
                  <Button variant="outline" onPress={handleAddEducation}>
                    {t("experience.add_education")}
                  </Button>
                </View>
              </Animated.View>
            ) : (
              <View className="flex-col w-full">
                {education.map((edu, index) => (
                  <EducationListItem
                    key={edu.id}
                    education={edu}
                    isExpanded={expandedEducationId === edu.id}
                    onToggleExpand={() => setExpandedEducationId(expandedEducationId === edu.id ? null : edu.id)}
                    onUpdate={updateEducation}
                    onDelete={(id) => {
                      removeEducation(id);
                      if (expandedEducationId === id) setExpandedEducationId(null);
                    }}
                    onMoveUp={() => moveEducation(edu.id, 'up')}
                    onMoveDown={() => moveEducation(edu.id, 'down')}
                    isFirst={index === 0}
                    isLast={index === education.length - 1}
                  />
                ))}
              </View>
            )}
          </Animated.View>
        )}
      </View>

      <ImportDataModal
        visible={isImportModalVisible}
        onClose={() => setIsImportModalVisible(false)}
        onSuccess={(data) => {
          setIsImportModalVisible(false);
          setImportData(data);
          setIsReviewModalVisible(true);
        }}
      />

      <ReviewImportModal
        visible={isReviewModalVisible}
        onClose={() => {
          setIsReviewModalVisible(false);
          setImportData(null);
        }}
        data={importData}
        onConfirm={(data) => {
          data.experiences.forEach(e => addExperience(e));
          data.education.forEach(e => addEducation(e));
          setIsReviewModalVisible(false);
          setImportData(null);
        }}
      />
    </WizardScreen>
  );
}
