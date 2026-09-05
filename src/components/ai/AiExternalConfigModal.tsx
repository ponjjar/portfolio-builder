import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert, Modal } from 'react-native';
import { Button } from '@/components/ui/button';
import { X, Eye, EyeOff, Server, Terminal, Box } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useThemeColor } from '@/theme/colors';


export type ExternalAiProvider = 'openai' | 'gemini' | 'ollama' | 'custom';

export interface ExternalAiConfig {
  provider: ExternalAiProvider;
  endpoint: string;
  model: string;
  apiKey?: string;
}

interface AiExternalConfigModalProps {
  visible: boolean;
  onClose: () => void;
  onContinue: (config: ExternalAiConfig) => void;
}

const PRESETS: Record<ExternalAiProvider, Partial<ExternalAiConfig>> = {
  openai: {
    endpoint: 'https://api.openai.com/v1/chat/completions',
    model: 'gpt-4o-mini',
  },
  gemini: {
    endpoint: 'https://generativelanguage.googleapis.com/v1beta',
    model: 'gemini-1.5-flash',
  },
  ollama: {
    endpoint: 'http://localhost:11434/api/chat',
    model: 'llama3',
  },
  custom: {
    endpoint: 'https://',
    model: '',
  }
};

export function AiExternalConfigModal({ visible, onClose, onContinue }: AiExternalConfigModalProps) {
  const { t } = useTranslation();
  const [provider, setProvider] = useState<ExternalAiProvider>('openai');
  const [endpoint, setEndpoint] = useState(PRESETS.openai.endpoint!);
  const [model, setModel] = useState(PRESETS.openai.model!);
  const [apiKey, setApiKey] = useState('');
  const [showKey, setShowKey] = useState(false);

  const selectProvider = (p: ExternalAiProvider) => {
    setProvider(p);
    setEndpoint(PRESETS[p].endpoint || '');
    setModel(PRESETS[p].model || '');
    if (p === 'ollama') {
      setApiKey(''); // Typically no API key for local Ollama
    }
  };

  const validateAndContinue = () => {
    if (!endpoint || endpoint.includes('chatgpt.com') || endpoint.includes('gemini.google.com')) {
      Alert.alert(
        t('ai.invalid_endpoint_title', 'Endpoint inválido'),
        t('ai.invalid_endpoint_msg', 'Este é um link de conversa. Informe o endpoint da API do provedor.')
      );
      return;
    }

    if ((provider === 'openai' || provider === 'gemini') && !apiKey.trim()) {
      Alert.alert(
        t('ai.missing_key_title', 'Chave obrigatória'),
        t('ai.missing_key_msg', 'Informe sua chave de API para continuar.')
      );
      return;
    }
    
    if (!model.trim()) {
       Alert.alert(
        t('ai.missing_model_title', 'Modelo obrigatório'),
        t('ai.missing_model_msg', 'Informe o modelo para continuar.')
      );
      return;
    }

    onContinue({ provider, endpoint, model, apiKey });
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View className="flex-1 bg-background/80 justify-center p-4">
        <View className="bg-surface border border-border rounded-xl p-6 shadow-xl max-w-lg w-full self-center">
          
          <View className="flex-row justify-between items-center mb-4">
            <Text className="text-xl font-bold text-text">{t('ai.external_config_title', 'Configurar IA Externa')}</Text>
            <TouchableOpacity onPress={onClose} className="p-2">
              <X color={useThemeColor('--text-secondary')} size={20} />
            </TouchableOpacity>
          </View>

          <Text className="text-text-secondary text-sm mb-6">
            {t('ai.external_config_desc', 'Use sua própria chave de API para remover o limite de projetos gerenciados.')}
          </Text>

          <View className="flex-row gap-2 mb-6 flex-wrap">
             <TouchableOpacity 
               onPress={() => selectProvider('openai')}
               className={`px-3 py-2 rounded-lg border ${provider === 'openai' ? 'bg-primary/10 border-primary' : 'bg-surface-elevated border-border'}`}
             >
               <Text className={`font-bold text-sm ${provider === 'openai' ? 'text-primary' : 'text-text'}`}>OpenAI</Text>
             </TouchableOpacity>

             <TouchableOpacity 
               onPress={() => selectProvider('gemini')}
               className={`px-3 py-2 rounded-lg border ${provider === 'gemini' ? 'bg-primary/10 border-primary' : 'bg-surface-elevated border-border'}`}
             >
               <Text className={`font-bold text-sm ${provider === 'gemini' ? 'text-primary' : 'text-text'}`}>Gemini</Text>
             </TouchableOpacity>

             <TouchableOpacity 
               onPress={() => selectProvider('ollama')}
               className={`px-3 py-2 rounded-lg border ${provider === 'ollama' ? 'bg-primary/10 border-primary' : 'bg-surface-elevated border-border'}`}
             >
               <Text className={`font-bold text-sm ${provider === 'ollama' ? 'text-primary' : 'text-text'}`}>Ollama</Text>
             </TouchableOpacity>
             
             <TouchableOpacity 
               onPress={() => selectProvider('custom')}
               className={`px-3 py-2 rounded-lg border ${provider === 'custom' ? 'bg-primary/10 border-primary' : 'bg-surface-elevated border-border'}`}
             >
               <Text className={`font-bold text-sm ${provider === 'custom' ? 'text-primary' : 'text-text'}`}>Personalizado</Text>
             </TouchableOpacity>
          </View>

          <View className="gap-4 mb-6">
            <View>
              <Text className="text-sm font-bold text-text mb-1">Endpoint / Base URL</Text>
              <TextInput 
                value={endpoint}
                onChangeText={setEndpoint}
                className="bg-background border border-border rounded-lg p-3 text-text"
                placeholder="https://..."
                placeholderTextColor={useThemeColor('--text-muted')}
              />
            </View>

            <View>
              <Text className="text-sm font-bold text-text mb-1">Modelo</Text>
              <TextInput 
                value={model}
                onChangeText={setModel}
                className="bg-background border border-border rounded-lg p-3 text-text"
                placeholder="gpt-4o-mini"
                placeholderTextColor={useThemeColor('--text-muted')}
              />
            </View>

            {provider !== 'ollama' && (
              <View>
                <Text className="text-sm font-bold text-text mb-1">API Key</Text>
                <View className="flex-row items-center border border-border rounded-lg bg-background pr-3">
                  <TextInput 
                    value={apiKey}
                    onChangeText={setApiKey}
                    secureTextEntry={!showKey}
                    className="flex-1 p-3 text-text"
                    placeholder="sk-..."
                    placeholderTextColor={useThemeColor('--text-muted')}
                  />
                  <TouchableOpacity onPress={() => setShowKey(!showKey)}>
                    {showKey ? <EyeOff color={useThemeColor('--text-secondary')} size={20} /> : <Eye color={useThemeColor('--text-secondary')} size={20} />}
                  </TouchableOpacity>
                </View>
                <Text className="text-xs text-warning mt-2">
                  {t('ai.key_security_notice', 'Sua chave será utilizada somente para esta geração e não será salva no projeto.')}
                </Text>
              </View>
            )}
          </View>

          <View className="flex-row justify-end gap-3 mt-4 border-t border-border pt-4">
            <Button variant="outline" onPress={onClose}>{t('common.cancel', 'Cancelar')}</Button>
            <Button onPress={validateAndContinue}>{t('common.continue', 'Continuar')}</Button>
          </View>
        </View>
      </View>
    </Modal>
  );
}
