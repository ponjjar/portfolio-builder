import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { useTranslation } from 'react-i18next';
import { Upload, FileText, AlertCircle, Briefcase } from 'lucide-react-native';
import * as DocumentPicker from 'expo-document-picker';
import { parseLinkedInExport } from '@/features/import/linkedin-parser';
import { AiClient } from '@/features/ai/ai-client';
import { usePortfolioStore } from '@/store';
import { useTurnstile } from '@/components/ui/TurnstileProvider';
import * as FileSystem from 'expo-file-system/legacy';
import { useThemeColor } from '@/theme/colors';


interface ImportDataModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: (data: { experiences: any[], education: any[] }) => void;
}

export function ImportDataModal({ visible, onClose, onSuccess }: ImportDataModalProps) {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { session } = usePortfolioStore();
  const { getToken } = useTurnstile();

  const handleImportResume = async () => {
    try {
      setError(null);
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/pdf',
        copyToCacheDirectory: true,
      });

      if (result.canceled) return;
      const file = result.assets[0];

      if (file.size && file.size > 3 * 1024 * 1024) {
        setError(t('experience.validation.max_chars', 'File is too large. Maximum 3MB allowed.'));
        return;
      }

      setLoading(true);

      // Convert to base64
      let base64Pdf = '';
      if (file.uri.startsWith('data:')) {
        base64Pdf = file.uri.split(',')[1];
      } else if (typeof window !== 'undefined' && file.file) {
        base64Pdf = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => {
            const result = reader.result as string;
            resolve(result.split(',')[1]);
          };
          reader.onerror = reject;
          reader.readAsDataURL(file.file as any);
        });
      } else {
        base64Pdf = await FileSystem.readAsStringAsync(file.uri, { encoding: FileSystem.EncodingType.Base64 });
      }

      // Extract text
      const turnstileToken = await getToken();
      const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || '';
      const response = await fetch(`${API_BASE_URL}/api/extract-pdf-text`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          ...(turnstileToken ? { 'x-turnstile-token': turnstileToken } : {})
        },
        body: JSON.stringify({ base64Pdf }),
      });

      if (!response.ok) {
        throw new Error('Failed to extract text from PDF');
      }

      const { text } = await response.json();

      if (!text || text.trim().length === 0) {
        throw new Error('No extractable text found in PDF');
      }

      // Try AI parsing
      let parsedData;
      const lang = session.metadata.language || 'en';

      if (session.ai?.provider && session.ai.provider !== 'free' && (session as any).aiConfig) {
        parsedData = await AiClient.fetchExternalResumeParse((session as any).aiConfig, text, lang);
      } else {
        const turnstileToken2 = await getToken();
        const res = await AiClient.parseResume({ text, language: lang, turnstileToken: turnstileToken2 });
        parsedData = res.result;
      }

      if (!parsedData.experiences && !parsedData.education) {
        throw new Error('AI could not identify Experience or Education data.');
      }

      onSuccess({ experiences: parsedData.experiences || [], education: parsedData.education || [] });
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'An error occurred during import.');
    } finally {
      setLoading(false);
    }
  };

  const handleImportLinkedIn = async () => {
    try {
      setError(null);
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/zip', 'text/csv', 'application/csv'],
        copyToCacheDirectory: true,
      });

      if (result.canceled) return;
      const file = result.assets[0];

      setLoading(true);

      let fileContent: string | ArrayBuffer;
      
      // Handle web File object if available (expo-document-picker returns it on web)
      if (typeof window !== 'undefined' && file.file) {
         if (file.mimeType === 'application/zip' || file.name.endsWith('.zip')) {
           fileContent = await file.file.arrayBuffer();
         } else {
           fileContent = await file.file.text();
         }
      } else {
        // Native
        if (file.mimeType === 'application/zip' || file.name.endsWith('.zip')) {
          const base64 = await FileSystem.readAsStringAsync(file.uri, { encoding: FileSystem.EncodingType.Base64 });
          fileContent = base64; // Will pass base64 string directly
        } else {
          fileContent = await FileSystem.readAsStringAsync(file.uri, { encoding: FileSystem.EncodingType.UTF8 });
        }
      }

      const parsedData = await parseLinkedInExport(file.uri, file.mimeType || '', fileContent);
      
      onSuccess({ experiences: parsedData.experiences, education: parsedData.education });
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'An error occurred during LinkedIn import.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} onClose={onClose} title={t('experience.import.title', 'Import Data')} hideCloseButton={loading}>
      <View className="flex-col gap-4">
        {error && (
          <View className="bg-[#ef444420] border border-[#ef444440] p-4 rounded-lg flex-row items-center">
            <AlertCircle color="#ef4444" size={20} className="mr-3" />
            <Text className="text-red-400 flex-1">{error}</Text>
          </View>
        )}

        {loading ? (
          <View className="items-center justify-center p-8">
            <ActivityIndicator size="large" color={useThemeColor('--primary')} />
            <Text className="text-text-secondary mt-4">Processando arquivo...</Text>
          </View>
        ) : (
          <>
            <TouchableOpacity 
              onPress={handleImportResume}
              className="border border-border rounded-xl p-4 flex-row items-center bg-surface hover:bg-surface-elevated transition-colors"
            >
              <View className="w-12 h-12 bg-primary/10 rounded-full items-center justify-center mr-4 border border-primary/20">
                <FileText color={useThemeColor('--primary')} size={24} />
              </View>
              <View className="flex-1">
                <Text className="text-text font-bold text-lg">{t('experience.import.resume', 'Import Resume / CV')}</Text>
                <Text className="text-text-secondary text-sm">PDF (Max 3MB). Requer uso de IA.</Text>
              </View>
              <Upload color={useThemeColor('--text-secondary')} size={20} />
            </TouchableOpacity>

            <TouchableOpacity 
              onPress={handleImportLinkedIn}
              className="border border-border rounded-xl p-4 flex-row items-center bg-surface hover:bg-surface-elevated transition-colors"
            >
              <View className="w-12 h-12 bg-[#0077b5]/10 rounded-full items-center justify-center mr-4 border border-[#0077b5]/20">
                <Briefcase color="#0077b5" size={24} />
              </View>
              <View className="flex-1">
                <Text className="text-text font-bold text-lg">{t('experience.import.linkedin', 'Import LinkedIn data')}</Text>
                <Text className="text-text-secondary text-sm">Arquivo .zip ou .csv exportado do LinkedIn.</Text>
              </View>
              <Upload color={useThemeColor('--text-secondary')} size={20} />
            </TouchableOpacity>
          </>
        )}
      </View>
    </Modal>
  );
}
