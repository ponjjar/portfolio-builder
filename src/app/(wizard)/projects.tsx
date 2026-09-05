import { GitHubImportModal } from "@/components/github/GitHubImportModal";
import { GitHubProcessingModal } from "@/components/github/GitHubProcessingModal";
import { BottomNav } from "@/components/layout/bottom-nav";
import { WizardScreen } from "@/components/layout/wizard-screen";
import { Button } from "@/components/ui/button";
import { ProjectListItem } from "@/components/wizard/ProjectListItem";
import { Project } from "@/domain/portfolio/types";
import { getIncompleteProjects } from "@/domain/portfolio/validation";
import { convertToProject } from "@/services/github/github-adapter";
import {
  GitHubRepoDetails,
  GitHubRepositorySummary,
} from "@/services/github/github.schemas";
import { usePortfolioStore } from "@/store";
import {
  getNextWizardStep,
  getPreviousWizardStep,
  getWizardRoute,
} from "@/utils/wizard";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Code2, Folder, Plus } from "lucide-react-native";
import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { Text, View } from "react-native";
import { useThemeColor } from '@/theme/colors';


export default function ProjectsScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { returnTo } = useLocalSearchParams<{ returnTo?: string }>();
  const { session, addProject, updateProject, removeProject, aggregateSkills } =
    usePortfolioStore();
  const projects = session.projects;

  const [isImportModalVisible, setIsImportModalVisible] = React.useState(false);
  const [isProcessingModalVisible, setIsProcessingModalVisible] =
    React.useState(false);
  const [reposToProcess, setReposToProcess] = React.useState<
    GitHubRepositorySummary[]
  >([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  
  const [expandedProjectId, setExpandedProjectId] = useState<string | null>(null);

  const handleNext = () => {
    const selectedProjects = projects.filter((p) => p.selected);
    if (selectedProjects.length === 0) {
      setErrorMsg("Adicione pelo menos um projeto.");
      return;
    }

    const incompleteIds = getIncompleteProjects(session);
    if (incompleteIds.length > 0) {
      setErrorMsg(
        "Alguns projetos precisam de título ou descrição. Preencha os campos ou remova-os.",
      );
      return;
    }

    setErrorMsg(null);
    if (returnTo === "editor") {
      router.push("/(wizard)/editor");
    } else {
      router.push(getWizardRoute(getNextWizardStep("projects")!));
    }
  };

  const handleBack = () => {
    if (returnTo === "editor") {
      router.push("/(wizard)/editor");
    } else {
      router.push(getWizardRoute(getPreviousWizardStep("projects")!));
    }
  };

  const handleAddManual = () => {
    const newProject: Project = {
      id: `proj_${Date.now()}`,
      title: "New Project",
      description: "",
      shortDescription: "",
      source: { type: "manual" },
      links: {},
      technologies: [],
      selected: true,
      featured: false,
      order: projects.length,
    };
    addProject(newProject);
    setExpandedProjectId(newProject.id); // Expand the new project immediately
  };

  const handleStartImport = (repos: GitHubRepositorySummary[]) => {
    setIsImportModalVisible(false);
    setReposToProcess(repos);
    setIsProcessingModalVisible(true);
  };

  const handleFinishProcessing = (details: GitHubRepoDetails[]) => {
    setIsProcessingModalVisible(false);

    const startOrder = projects.length;
    details.forEach((detail, index) => {
      const newProject = convertToProject(detail, projects, startOrder + index);
      addProject(newProject);
    });

    aggregateSkills();
  };

  return (
    <>
      <WizardScreen
        step={2}
        title={t("projects.title")}
        subtitle={t("projects.subtitle")}
        bottomNav={<BottomNav onNext={handleNext} onBack={handleBack} nextLabel={returnTo === "editor" ? "Salvar e Voltar" : "Continuar"} />}
      >
        <View className="flex-row justify-between items-center mb-8">
          <View className="bg-surface-elevated border border-border px-3 py-1 rounded-full">
            <Text className="text-text-secondary text-sm font-medium">{projects.length} {projects.length === 1 ? 'projeto' : 'projetos'}</Text>
          </View>

          <View className="flex-row gap-4">
            <Button
              variant="default"
              onPress={() => setIsImportModalVisible(true)}
            >
              <View className="flex-row items-center">
                <Code2
                  color={useThemeColor('--primary-foreground')}
                  size={18}
                  className="mr-2"
                />
                <Text className="text-primary-foreground font-bold">
                  {t("projects.import_github")}
                </Text>
              </View>
            </Button>

            <Button variant="outline" onPress={handleAddManual}>
              <View className="flex-row items-center">
                <Plus color={useThemeColor('--text')} size={18} className="mr-2" />
                <Text className="text-text font-bold">
                  {t("projects.add_project")}
                </Text>
              </View>
            </Button>
          </View>
        </View>

        <View className="w-full h-[1px] bg-border mb-6" />

        {projects.length === 0 ? (
          <View className="border border-border border-dashed rounded-lg p-10 items-center justify-center bg-surface-elevated">
            <Folder
              color={useThemeColor('--text-secondary')}
              size={48}
              className="mb-4"
            />
            <Text className="text-text-secondary text-center mb-6 max-w-sm leading-relaxed">
              {t("projects.empty_state")}
            </Text>
            <Button variant="outline" onPress={handleAddManual}>
              {t("projects.add_project")}
            </Button>
          </View>
        ) : (
          <View>
            {projects.map((p) => (
              <ProjectListItem
                key={p.id}
                project={p}
                isExpanded={expandedProjectId === p.id}
                onToggleExpand={() => setExpandedProjectId(expandedProjectId === p.id ? null : p.id)}
                onUpdate={updateProject}
                onDelete={(id) => {
                  removeProject(id);
                  if (expandedProjectId === id) setExpandedProjectId(null);
                }}
              />
            ))}
          </View>
        )}

        {errorMsg && (
          <View className="mb-6 bg-[#ef444420] border border-[#ef444440] p-4 rounded-lg flex-row items-center">
            <Text className="text-red-400 flex-1">{errorMsg}</Text>
          </View>
        )}
      </WizardScreen>

      <GitHubImportModal
        visible={isImportModalVisible}
        onClose={() => setIsImportModalVisible(false)}
        onImport={handleStartImport}
      />

      <GitHubProcessingModal
        visible={isProcessingModalVisible}
        reposToProcess={reposToProcess}
        onComplete={handleFinishProcessing}
        onCancel={() => setIsProcessingModalVisible(false)}
      />
    </>
  );
}
