import React from 'react';
import { useTranslation } from 'react-i18next';

import { View, Text, TouchableOpacity } from 'react-native';
import { Modal } from '@/components/ui/modal';
import { Download, FileJson, FileCode, Globe, FolderArchive } from 'lucide-react-native';
import { useThemeColor } from '@/theme/colors';


interface ExportModalProps {
  visible: boolean;
  onClose: () => void;
  onExportHtml: () => void;
  onExportJson: () => void;
  onExportZip: () => void;
  onExportGitHubPages: () => void;
}

export function ExportModal({ 
  visible, 
  onClose, 
  onExportHtml, 
  onExportJson,
  onExportZip,
  onExportGitHubPages
}: ExportModalProps) {
  const { t } = useTranslation();

  return (
    <Modal
      visible={visible}
      onClose={onClose}
      title={t("export.modal_title")}
      size="sm"
    >
      <View className="py-2">
        <Text className="text-text-secondary text-sm mb-6">
          Escolha como deseja levar seu portfólio.
        </Text>

        <View className="gap-4">
          
          {/* HTML Export */}
          <View className="border border-border rounded-lg p-4 bg-input-background">
            <View className="flex-row items-center mb-2">
              <FileCode color={useThemeColor('--text')} size={20} className="mr-2" />
              <Text className="text-text font-bold text-base">{t("export.html_title")}</Text>
            </View>
            <Text className="text-text-secondary text-xs mb-4">
              Baixe um único arquivo pronto para abrir ou publicar.
            </Text>
            <TouchableOpacity 
              onPress={onExportHtml}
              className="bg-primary py-3 rounded items-center flex-row justify-center"
            >
              <Download color={useThemeColor('--primary-foreground')} size={16} className="mr-2" />
              <Text className="text-primary-foreground font-bold text-sm">{t("export.html_btn")}</Text>
            </TouchableOpacity>
          </View>

          {/* ZIP Export */}
          <View className="border border-border rounded-lg p-4 bg-input-background">
            <View className="flex-row items-center mb-2">
              <FolderArchive color={useThemeColor('--text')} size={20} className="mr-2" />
              <Text className="text-text font-bold text-base">{t("export.project_title")}</Text>
            </View>
            <Text className="text-text-secondary text-xs mb-4">
              Baixe os arquivos do seu portfólio para continuar desenvolvendo.
            </Text>
            <TouchableOpacity 
              onPress={onExportZip}
              className="bg-transparent border border-border py-3 rounded items-center flex-row justify-center"
            >
              <Download color={useThemeColor('--text')} size={16} className="mr-2" />
              <Text className="text-text font-bold text-sm">{t("export.project_btn")}</Text>
            </TouchableOpacity>
          </View>

          {/* GitHub Pages */}
          <View className="border border-border rounded-lg p-4 bg-input-background">
            <View className="flex-row items-center mb-2">
              <Globe color={useThemeColor('--text')} size={20} className="mr-2" />
              <Text className="text-text font-bold text-base">{t("export.github_title")}</Text>
            </View>
            <Text className="text-text-secondary text-xs mb-4">
              Prepare seu portfólio para publicar gratuitamente no GitHub Pages.
            </Text>
            <TouchableOpacity 
              onPress={onExportGitHubPages}
              className="bg-transparent border border-border py-3 rounded items-center flex-row justify-center"
            >
              <Globe color={useThemeColor('--text')} size={16} className="mr-2" />
              <Text className="text-text font-bold text-sm">{t("export.github_btn")}</Text>
            </TouchableOpacity>
          </View>

          {/* Session JSON */}
          <View className="border border-border rounded-lg p-4 bg-input-background">
            <View className="flex-row items-center mb-2">
              <FileJson color={useThemeColor('--text')} size={20} className="mr-2" />
              <Text className="text-text font-bold text-base">{t("export.session_title")}</Text>
            </View>
            <Text className="text-text-secondary text-xs mb-4">
              Salve seus dados para continuar editando depois.
            </Text>
            <TouchableOpacity 
              onPress={onExportJson}
              className="bg-transparent border border-border py-3 rounded items-center flex-row justify-center"
            >
              <Download color={useThemeColor('--text')} size={16} className="mr-2" />
              <Text className="text-text font-bold text-sm">{t("export.session_btn")}</Text>
            </TouchableOpacity>
          </View>

        </View>
      </View>
    </Modal>
  );
}
