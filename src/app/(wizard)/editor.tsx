import { useTranslation } from 'react-i18next';
import { CustomOrbitBuilderModal } from '@/components/modals/CustomOrbitBuilderModal';
import { ExportModal } from '@/components/modals/ExportModal';
import { HeaderConfigModal } from '@/components/modals/HeaderConfigModal';
import { OrbitItem, ProfileCenterOrbitModal } from '@/components/modals/ProfileCenterOrbitModal';
import { ProfileLayoutModal } from '@/components/modals/ProfileLayoutModal';
import { ProjectLayoutModal } from '@/components/modals/ProjectLayoutModal';
import { VisualThemeModal } from '@/components/modals/VisualThemeModal';
import { CareerLayoutModal } from '@/components/modals/CareerLayoutModal';
import { SkillsLayoutModal } from '@/components/modals/SkillsLayoutModal';
import { Button } from '@/components/ui/button';
import { SortableSectionList } from '@/components/ui/SortableSectionList';
import { SECTION_REGISTRY } from '@/domain/portfolio/registry';
import { getFirstIncompleteStep } from '@/domain/portfolio/validation';
import { usePortfolioStore } from '@/store';
import { renderMinimalTemplate } from '@/templates/minimal';
import { buildPortfolioViewModel } from '@/templates/viewModel';
import { exportGitHubPagesReady, exportHtml, exportSessionJson, exportZip } from '@/utils/export';
import { useRouter } from 'expo-router';
import { ArrowLeft, Briefcase, Download, Eye, Laptop, LayoutTemplate, MonitorSmartphone, Palette, Settings, Smartphone, User } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { Platform, ScrollView, Text, TouchableOpacity, useWindowDimensions, View } from 'react-native';
import { PortfolioPreview } from '@/components/ui/PortfolioPreview';
import { useThemeColor } from '@/theme/colors';
import { useTheme } from '@/theme/ThemeContext';


export default function EditorScreen() {
  const router = useRouter();
  const { session, updateTheme, updateConfig } = usePortfolioStore();
  const { theme } = useTheme();
  const { width } = useWindowDimensions();
  const { t } = useTranslation();

  const isMobile = width < 768;

  // State
  const [viewport, setViewport] = useState<'desktop' | 'mobile'>('desktop');
  const [isExportVisible, setIsExportVisible] = useState(false);
  const [showMobilePreview, setShowMobilePreview] = useState(false);
  const [activeTab, setActiveTab] = useState<'content' | 'structure' | 'settings'>('content');

  // Modals
  const [orbitModalVisible, setOrbitModalVisible] = useState(false);
  const [customOrbitVisible, setCustomOrbitVisible] = useState(false);
  const [profileLayoutModalVisible, setProfileLayoutModalVisible] = useState(false);
  const [projectLayoutModalVisible, setProjectLayoutModalVisible] = useState(false);
  const [headerModalVisible, setHeaderModalVisible] = useState(false);
  const [visualThemeModalVisible, setVisualThemeModalVisible] = useState(false);
  const [careerLayoutModalVisible, setCareerLayoutModalVisible] = useState(false);
  const [skillsLayoutModalVisible, setSkillsLayoutModalVisible] = useState(false);

  // Validation Check on Mount
  useEffect(() => {
    const incompleteStep = getFirstIncompleteStep(session);
    if (incompleteStep) {
      router.replace(`/(wizard)/${incompleteStep}`);
    }
  }, [session, router]);

  const viewModel = buildPortfolioViewModel(session);
  const htmlContent = renderMinimalTemplate(viewModel);

  const handleEditSection = (step: string) => {
    const registryEntry = SECTION_REGISTRY[step as keyof typeof SECTION_REGISTRY];
    const route = registryEntry ? registryEntry.wizardRoute.replace('/(wizard)/', '') : step;
    router.push({ pathname: `/(wizard)/${route}` as any, params: { returnTo: 'editor' } });
  };

  const handleExportHtml = async () => {
    try {
      await exportHtml(session);
      setIsExportVisible(false);
    } catch (e) {
      alert('Erro ao exportar HTML');
    }
  };

  const handleExportJson = async () => {
    try {
      await exportSessionJson(session);
      setIsExportVisible(false);
    } catch (e) {
      alert('Erro ao exportar JSON');
    }
  };

  const handleExportZip = async () => {
    try {
      await exportZip(session);
      setIsExportVisible(false);
    } catch (e) {
      alert('Erro ao exportar ZIP');
    }
  };

  const handleExportGitHubPages = async () => {
    try {
      await exportGitHubPagesReady(session);
      setIsExportVisible(false);
      alert('Extraia o conteúdo do ZIP no seu repositório github.io.');
    } catch (e) {
      alert('Erro ao exportar para GitHub Pages');
    }
  };

  // ----------------------------------------------------
  // SIDEBAR RENDER
  // ----------------------------------------------------
  const renderSidebar = () => (
    <View className={`bg-input-background border-r border-border flex-col ${isMobile ? 'flex-1' : 'w-80'}`}>
      <View className="p-6 pb-4 border-b border-border">
        <Text className="text-text font-bold text-xl mb-1">{t('editor.title')}</Text>
        <Text className="text-text-secondary text-xs">{t('editor.subtitle')}</Text>
      </View>

      <View className="flex-row border-b border-border">
        <TouchableOpacity
          onPress={() => setActiveTab('content')}
          className={`flex-1 p-4 items-center border-b-2 ${activeTab === 'content' ? 'border-primary' : 'border-transparent'}`}
        >
          <Text className={`font-bold ${activeTab === 'content' ? 'text-primary' : 'text-text-secondary'}`}>{t('editor.tabs.content', 'Conteúdo')}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setActiveTab('structure')}
          className={`flex-1 p-4 items-center border-b-2 ${activeTab === 'structure' ? 'border-primary' : 'border-transparent'}`}
        >
          <Text className={`font-bold ${activeTab === 'structure' ? 'text-primary' : 'text-text-secondary'}`}>{t('editor.tabs.structure', 'Estrutura')}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setActiveTab('settings')}
          className={`p-4 items-center border-b-2 ${activeTab === 'settings' ? 'border-primary' : 'border-transparent'}`}
        >
          <Settings color={activeTab === 'settings' ? useThemeColor('--primary') : useThemeColor('--text-secondary')} size={18} />
        </TouchableOpacity>
      </View>

      <ScrollView className="flex-1">
        {activeTab === 'content' && (
          <View className="p-6 gap-3 pb-20">
            <Text className="text-text-secondary text-xs font-bold uppercase tracking-widest mb-2">
              {t('editor.tabs.content', 'Conteúdo')}
            </Text>
            {session.portfolio.sections
              .filter(s => s.visible)
              .filter(s => !(s.id === 'skills' && session.portfolio.layout.profile.embedsTechnologies))
              .map((section) => {
                const reg = SECTION_REGISTRY[section.id as keyof typeof SECTION_REGISTRY];
                if (!reg) return null;
                return (
                  <View
                    key={section.id}
                    className="flex-row items-center justify-between bg-surface p-3 rounded border border-border"
                  >
                    <View className="flex-row items-center">
                      <Text className="text-text font-bold">
                        {t(reg.labelKey)}
                      </Text>
                    </View>
                    <View className="flex-row items-center gap-2">
                      {reg.hasLayoutModal && (
                        <TouchableOpacity onPress={() => {
                          if (section.id === 'hero') setProfileLayoutModalVisible(true);
                          if (section.id === 'projects') setProjectLayoutModalVisible(true);
                          if (section.id === 'career') setCareerLayoutModalVisible(true);
                          if (section.id === 'skills') setSkillsLayoutModalVisible(true);
                        }} className="p-2 bg-input-background rounded hover:bg-surface-elevated">
                          <Settings color={useThemeColor('--text-secondary')} size={14} />
                        </TouchableOpacity>
                      )}
                      <TouchableOpacity onPress={() => handleEditSection(section.id)} className="p-2">
                        <Text className="text-primary text-xs font-bold uppercase">Editar &gt;</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              })}
          </View>
        )}

        {activeTab === 'structure' && (
          <View className="p-6 pb-20">
            <Text className="text-text-secondary text-xs font-bold uppercase tracking-widest mb-4">
              {t('editor.tabs.structure', 'Estrutura')}
            </Text>
            <SortableSectionList
              sections={session.portfolio.sections.filter(s =>
                !(s.id === 'skills' && session.portfolio.layout.profile.embedsTechnologies)
              )}
              onReorder={(sections) => {
                const hiddenSections = session.portfolio.sections.filter(s =>
                  (s.id === 'skills' && session.portfolio.layout.profile.embedsTechnologies)
                );
                updateConfig({ sections: [...sections, ...hiddenSections] });
              }}
              onToggleVisibility={(sectionId) => {
                const updatedSections = session.portfolio.sections.map(s => 
                  s.id === sectionId ? { ...s, visible: !s.visible } : s
                );
                updateConfig({ sections: updatedSections });
              }}
            />
          </View>
        )}

        {activeTab === 'settings' && (
          <View className="p-6 gap-6 pb-20">
            <View>
              <Text className="text-text-secondary text-xs font-bold uppercase tracking-widest mb-4">
                {t('editor.settings', 'Configurações')}
              </Text>
              <View className="gap-2">
                <TouchableOpacity
                  onPress={() => setVisualThemeModalVisible(true)}
                  className="flex-row items-center justify-between bg-surface p-3 rounded border border-border"
                >
                  <View className="flex-row items-center">
                    <Palette color={useThemeColor('--text')} size={16} className="mr-3" />
                    <Text className="text-text font-bold text-sm">{t('editor.visualTheme')}</Text>
                  </View>
                  <Text className="text-text-secondary text-xs">{session.portfolio.visualTheme?.preset || 'dark'} &gt;</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setHeaderModalVisible(true)}
                  className="flex-row items-center justify-between bg-surface p-3 rounded border border-border"
                >
                  <View className="flex-row items-center">
                    <MonitorSmartphone color={useThemeColor('--text')} size={16} className="mr-3" />
                    <Text className="text-text font-bold text-sm">{t('editor.header')}</Text>
                  </View>
                  <Text className="text-text-secondary text-xs">{session.portfolio.layout.header?.enabled ? t('editor.layouts.active') : t('editor.layouts.hidden')} &gt;</Text>
                </TouchableOpacity>
              </View>
            </View>
            <View className="border-t border-border pt-6">
              <Text className="text-text-secondary text-xs font-bold uppercase tracking-widest mb-4">
                {t('editor.options', 'Opções')}
              </Text>
              <TouchableOpacity
                className="flex-row items-center mb-2"
                onPress={() => updateConfig({ animations: { ...session.portfolio.animations, sectionReveal: !session.portfolio.animations.sectionReveal } as any })}
              >
                <View className={`w-4 h-4 rounded border mr-2 items-center justify-center ${session.portfolio.animations.sectionReveal ? 'bg-primary border-primary' : 'border-border bg-input-background'}`}>
                  {session.portfolio.animations.sectionReveal && <View className="w-2 h-2 bg-primary-foreground rounded-sm" />}
                </View>
                <Text className="text-text text-sm">{t('editor.scrollAnimations')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Export / Actions Footer */}
      {!isMobile ? (
        <View className="p-6 border-t border-border">
          <Button onPress={() => setIsExportVisible(true)} className="w-full">
            <Download color={useThemeColor('--primary-foreground')} size={16} />
            {t('editor.exportPortfolio')}
          </Button>
        </View>
      ) : (
        <View className="absolute bottom-6 left-6 right-6">
          <Button onPress={() => setShowMobilePreview(true)} className="w-full shadow-lg h-14">
            <Eye color={useThemeColor('--primary-foreground')} size={18} />
            <Text style={{ color: useThemeColor('--primary-foreground') }} className="font-bold text-lg">Visualizar portfólio</Text>
          </Button>
        </View>
      )}
    </View>
  );

  // ----------------------------------------------------
  // PREVIEW RENDER
  // ----------------------------------------------------
  const renderPreview = () => (
    <View className="flex-1 flex-col bg-background">
      {/* Mobile Top Bar */}
      {isMobile && (
        <View className="h-14 border-b border-border flex-row items-center justify-between px-4 bg-surface">
          <TouchableOpacity onPress={() => setShowMobilePreview(false)} className="flex-row items-center p-2">
            <ArrowLeft color={useThemeColor('--text')} size={18} className="mr-2" />
            <Text className="text-text font-bold">Voltar</Text>
          </TouchableOpacity>
          <Button onPress={() => setIsExportVisible(true)} size="sm">
            <Download color={useThemeColor('--primary-foreground')} size={14} className="mr-1" />
            Exportar
          </Button>
        </View>
      )}

      {/* Preview Toolbar */}
      <View className="h-14 border-b border-border flex-row items-center justify-center bg-input-background z-10">
        <View className="flex-row bg-surface-elevated p-1 rounded-lg">
          <TouchableOpacity
            onPress={() => setViewport('desktop')}
            className={`p-2 rounded ${viewport === 'desktop' ? 'bg-border' : 'bg-transparent'}`}
          >
            <Laptop color={viewport === 'desktop' ? useThemeColor('--text') : useThemeColor('--text-secondary')} size={18} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setViewport('mobile')}
            className={`p-2 rounded ${viewport === 'mobile' ? 'bg-border' : 'bg-transparent'}`}
          >
            <Smartphone color={viewport === 'mobile' ? useThemeColor('--text') : useThemeColor('--text-secondary')} size={18} />
          </TouchableOpacity>
        </View>
      </View>
      {/* Live Preview Content */}
      <View className="flex-1 items-center justify-center overflow-hidden bg-background">
        <View
          className="bg-background shadow-lg transition-all duration-300 ease-in-out"
          style={{
            width: viewport === 'mobile' ?
              isMobile ? "100%" :
                600 : '100%',
            height: '100%',
            maxWidth: viewport === 'desktop' && !isMobile ? 1900 : undefined,
            borderRadius: viewport === 'mobile' ? 32 : (isMobile ? 0 : 8),
            overflow: 'hidden',
            borderWidth: viewport === 'mobile' ? 8 : (isMobile ? 0 : 1),
            borderColor: useThemeColor('--border')
          }}
        >
          <PortfolioPreview
            htmlContent={htmlContent}
            viewport={viewport}
            isMobile={isMobile}
          />
        </View>
      </View>
    </View>
  );

  return (
    <View className="flex-1 flex-row">
      {/* If Desktop: Sidebar | Preview */}
      {/* If Mobile: conditional based on showMobilePreview */}
      {(!isMobile || !showMobilePreview) && renderSidebar()}
      {(!isMobile || showMobilePreview) && renderPreview()}

      {/* Modals */}
      <ExportModal
        visible={isExportVisible}
        onClose={() => setIsExportVisible(false)}
        onExportHtml={handleExportHtml}
        onExportJson={handleExportJson}
        onExportZip={handleExportZip}
        onExportGitHubPages={handleExportGitHubPages}
      />

      <ProfileLayoutModal
        visible={profileLayoutModalVisible}
        onClose={() => setProfileLayoutModalVisible(false)}
        currentVariant={session.portfolio.layout.profile.variant}
        avatarStyle={session.portfolio.layout.profile.avatarStyle as any}
        onSelectVariant={(variant) => {
          updateConfig({ layout: { ...session.portfolio.layout, profile: { ...session.portfolio.layout.profile, variant } } });
        }}
        onUpdateAvatarStyle={(avatarStyle) => {
          updateConfig({ layout: { ...session.portfolio.layout, profile: { ...session.portfolio.layout.profile, avatarStyle } } });
        }}
        onOpenOrbitSettings={() => {
          setProfileLayoutModalVisible(false);
          setOrbitModalVisible(true);
        }}
        onOpenCustomOrbitBuilder={() => {
          setProfileLayoutModalVisible(false);
          setCustomOrbitVisible(true);
        }}
      />

      <ProjectLayoutModal
        visible={projectLayoutModalVisible}
        onClose={() => setProjectLayoutModalVisible(false)}
        config={session.portfolio.layout.projects as any}
        onUpdate={(config) => {
          updateConfig({ layout: { ...session.portfolio.layout, projects: config as any } });
        }}
      />

      <HeaderConfigModal
        visible={headerModalVisible}
        onClose={() => setHeaderModalVisible(false)}
        config={(session.portfolio.layout.header || { enabled: false, showNavigation: true, showName: true, showAvatar: true, namePosition: 'left' }) as any}
        onUpdate={(config) => {
          updateConfig({ layout: { ...session.portfolio.layout, header: config } });
        }}
      />

      <ProfileCenterOrbitModal
        visible={orbitModalVisible}
        onClose={() => setOrbitModalVisible(false)}
        order={session.portfolio.layout.profile.cornerItemsOrder as OrbitItem[]}
        onUpdateOrder={(newOrder) => {
          updateConfig({
            layout: {
              ...session.portfolio.layout,
              profile: { ...session.portfolio.layout.profile, cornerItemsOrder: newOrder }
            }
          });
        }}
      />

      <CareerLayoutModal
        visible={careerLayoutModalVisible}
        onClose={() => setCareerLayoutModalVisible(false)}
        config={session.portfolio.layout.career || {} as any}
        onUpdate={(career) => updateConfig({ layout: { ...session.portfolio.layout, career } })}
      />

      <VisualThemeModal
        visible={visualThemeModalVisible}
        onClose={() => setVisualThemeModalVisible(false)}
        config={session.portfolio.visualTheme as any}
        onUpdate={(config) => {
          updateTheme({ mode: config.preset.includes('light') ? 'light' : 'dark', accent: config.accent });
          updateConfig({ visualTheme: config as any });
        }}
      />

      <SkillsLayoutModal
        visible={skillsLayoutModalVisible}
        onClose={() => setSkillsLayoutModalVisible(false)}
        config={session.portfolio.layout.skills}
        onUpdate={(conf) => updateConfig({ layout: { ...session.portfolio.layout, skills: conf } })}
      />

      <CustomOrbitBuilderModal
        visible={customOrbitVisible}
        onClose={() => setCustomOrbitVisible(false)}
        zones={session.portfolio.layout.profile.zones as any || { center: 'avatar', topLeft: 'name', topRight: 'headline', left: 'links', right: '', topCenter: '', bottomLeft: 'description', bottomRight: 'technologies' }}
        embedsTechnologies={session.portfolio.layout.profile.embedsTechnologies || false}
        onUpdateZones={(zones) => {
          updateConfig({
            layout: {
              ...session.portfolio.layout,
              profile: { ...session.portfolio.layout.profile, zones }
            }
          });
        }}
        onUpdateEmbedsTech={(embedsTechnologies) => {
          updateConfig({
            layout: {
              ...session.portfolio.layout,
              profile: { ...session.portfolio.layout.profile, embedsTechnologies }
            }
          });
        }}
      />
    </View>
  );
}
