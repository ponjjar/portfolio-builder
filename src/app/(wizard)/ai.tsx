import { View, ScrollView, Alert, Text, TouchableOpacity } from "react-native";
import { Button } from "@/components/ui/button";
import { useRouter } from "expo-router";
import { WizardScreen } from "@/components/layout/wizard-screen";
import { BottomNav } from "@/components/layout/bottom-nav";
import {
  getNextWizardStep,
  getPreviousWizardStep,
  getWizardRoute,
} from "@/utils/wizard";
import { useTranslation } from "react-i18next";
import { useAiGeneration } from "@/features/ai/hooks/useAiGeneration";
import { AiProviderCards } from "@/components/ai/AiProviderCards";
import { AiProjectLimitModal } from "@/components/ai/AiProjectLimitModal";
import { AiGenerationProgress } from "@/components/ai/AiGenerationProgress";
import { AiProjectReviewCard } from "@/components/ai/AiProjectReviewCard";
import { AiProfessionalDescriptionReview } from "@/components/ai/AiProfessionalDescriptionReview";
import { AiExternalConfigModal, ExternalAiConfig } from "@/components/ai/AiExternalConfigModal";
import { AiLanguageSelector } from "@/components/ai/AiLanguageSelector";
import { Sparkles, Globe } from "lucide-react-native";
import { useState, useMemo } from "react";
import { usePortfolioStore } from "@/store";
import { useThemeColor } from '@/theme/colors';


export default function AiScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { session } = usePortfolioStore();
  
  const [showExternalModal, setShowExternalModal] = useState(false);
  const [activeTabLocale, setActiveTabLocale] = useState<string | null>(null);
  const [isApplying, setIsApplying] = useState(false);

  const {
    step,
    mode,
    missingPairs,
    selectedPairs,
    projectDrafts,
    profileDrafts,
    selectMode,
    toggleProjectSelection,
    confirmProjectLimit,
    generateProfileSuggestion,
    cancelFlow,
    startExternalGeneration,
  } = useAiGeneration();

  const handleExternalConfigContinue = (config: ExternalAiConfig) => {
    setShowExternalModal(false);
    startExternalGeneration(config);
  };

  const handleNext = () => {
    if (step === "complete") {
      router.push(getWizardRoute(getNextWizardStep("ai")!));
    } else {
      router.push(getWizardRoute(getNextWizardStep("ai")!));
    }
  };

  const handleBack = () => {
    if (step !== "idle" && step !== "complete") {
      Alert.alert(
        t("ai.cancel_flow_title", "Cancelar geração?"),
        t(
          "ai.cancel_flow_desc",
          "As descrições originais serão mantidas. Você tem certeza?",
        ),
        [
          { text: t("common.cancel", "Não"), style: "cancel" },
          {
            text: t("common.confirm", "Sim, cancelar"),
            style: "destructive",
            onPress: cancelFlow,
          },
        ],
      );
    } else {
      router.push(getWizardRoute(getPreviousWizardStep("ai")!));
    }
  };

  const applyChanges = async () => {
    setIsApplying(true);
    // Move approved AI reviews to original state
    usePortfolioStore.getState().finalizeAiChanges();
    // Save to storage
 
    setIsApplying(false);
    handleNext(); // advance wizard
  };

  // Setup tabs
  const supportedLocales = session.languageSettings.supportedLanguages;
  const currentTab = activeTabLocale || supportedLocales[0] || 'pt';

  const projectsInCurrentTab = useMemo(() => {
    return session.projects.filter(p => p.aiReviewsByLocale && p.aiReviewsByLocale[currentTab]);
  }, [session.projects, currentTab]);

  return (
    <WizardScreen
      step={4}
      title={t("ai.title")}
      subtitle={t("ai.subtitle")}
      bottomNav={
        (step !== "generating-projects" && step !== "generating-profile") ? (
          <BottomNav
            onNext={
              step === "complete" || step === "idle" || step === "review-projects" || step === "review-profile"
                ? step === "review-projects" 
                  ? generateProfileSuggestion 
                  : step === "review-profile"
                    ? applyChanges
                    : handleNext 
                : undefined
            }
            onBack={step === "idle" || step === "complete" ? handleBack : undefined}
            nextLabel={
              step === "review-projects"
                ? t("ai.generate_profile_btn", "Continuar para o perfil")
                : step === "review-profile"
                  ? t("ai.apply_and_continue", "Aplicar e continuar")
                  : t("common.continue", "Continuar")
            }
            isNextDisabled={step === "review-profile" && isApplying}
            isNextLoading={isApplying}
          />
        ) : undefined
      }
    >
      <ScrollView
        className="flex-1 w-full"
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        {step === "idle" && (
          <View>
            <AiLanguageSelector />
            <AiProviderCards 
              onSelectMode={selectMode} 
              onOpenExternalModal={() => setShowExternalModal(true)}
              onSkip={handleNext} 
            />
          </View>
        )}

        {step === "project-limit" && (
          <AiProjectLimitModal
            selectedProjectIds={selectedPairs.map(p => p.projectId)} // Legacy comp, passing just ids might need fix if we select specific pairs
            onToggleSelection={(id) => toggleProjectSelection(id, currentTab)}
            onConfirm={confirmProjectLimit}
          />
        )}

        {step === "generating-projects" && (
          <AiGenerationProgress drafts={projectDrafts} />
        )}

        {step === "review-projects" && (
          <View className="gap-6">
            <View className="flex-row items-center justify-between">
              <Text className="text-xl font-bold text-text">
                {t("ai.review_projects_title", "Resumos dos projetos")}
              </Text>
            </View>
            
            {/* Tabs */}
            {supportedLocales.length > 1 && (
              <View className="flex-row border-b border-border">
                {supportedLocales.map(loc => {
                  const isActive = loc === currentTab;
                  return (
                    <TouchableOpacity
                      key={loc}
                      onPress={() => setActiveTabLocale(loc)}
                      className={`px-4 py-3 border-b-2 flex-row items-center gap-2 ${isActive ? 'border-primary' : 'border-transparent'}`}
                    >
                      <Globe size={16} color={isActive ? useThemeColor('--primary') : useThemeColor('--text-secondary')} />
                      <Text className={`font-bold uppercase ${isActive ? 'text-primary' : 'text-text-secondary'}`}>
                        {loc}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}

            {projectsInCurrentTab.length === 0 ? (
              <Text className="text-text-secondary italic">
                Nenhum resumo gerado para este idioma.
              </Text>
            ) : (
              projectsInCurrentTab.map((project) => (
                <AiProjectReviewCard
                  key={`${project.id}-${currentTab}`}
                  project={project}
                  locale={currentTab}
                />
              ))
            )}


          </View>
        )}

        {step === "generating-profile" && (
          <AiGenerationProgress profileDraft={Object.values(profileDrafts)[0]} isProfileStage />
        )}

        {step === "review-profile" && (
          <View className="gap-6">
            <Text className="text-xl font-bold text-text">
              {t("ai.review_profile_title", "Perfil profissional")}
            </Text>

            {/* Tabs for Profile Review */}
            {supportedLocales.length > 1 && (
              <View className="flex-row border-b border-border">
                {supportedLocales.map(loc => {
                  const isActive = loc === currentTab;
                  return (
                    <TouchableOpacity
                      key={loc}
                      onPress={() => setActiveTabLocale(loc)}
                      className={`px-4 py-3 border-b-2 flex-row items-center gap-2 ${isActive ? 'border-primary' : 'border-transparent'}`}
                    >
                      <Globe size={16} color={isActive ? useThemeColor('--primary') : useThemeColor('--text-secondary')} />
                      <Text className={`font-bold uppercase ${isActive ? 'text-primary' : 'text-text-secondary'}`}>
                        {loc}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}

            {profileDrafts[currentTab] ? (
              <AiProfessionalDescriptionReview locale={currentTab} />
            ) : (
              <Text className="text-text-secondary italic">Sem sugestão de perfil para este idioma.</Text>
            )}


          </View>
        )}

        {step === "complete" && (
          <View className="bg-primary/10 border border-primary/20 p-6 rounded-xl flex-col items-center justify-center py-12">
            <Sparkles color={useThemeColor('--primary')} size={48} className="mb-4" />
            <Text className="text-2xl font-bold text-text text-center mb-2">
              {t("ai.success_title", "Tudo pronto!")}
            </Text>
            <Text className="text-text-secondary text-center max-w-md">
              {t(
                "ai.success_desc",
                "Os resumos úteis e a descrição profissional (se aprovada) foram aplicados com sucesso ao seu portfólio.",
              )}
            </Text>
            <Button className="mt-8 px-8" onPress={handleNext}>
              {t("ai.go_to_next_step", "Ir para a próxima etapa")}
            </Button>
          </View>
        )}

        <AiExternalConfigModal 
          visible={showExternalModal} 
          onClose={() => setShowExternalModal(false)}
          onContinue={handleExternalConfigContinue}
        />
      </ScrollView>
    </WizardScreen>
  );
}
