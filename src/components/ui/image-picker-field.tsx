import { Button } from '@/components/ui/button';
import { FormField } from '@/components/ui/form-field';
import { pickAndProcessImage } from '@/utils/image';
import { Edit2, ImageIcon, Link as LinkIcon, Trash2 } from 'lucide-react-native';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Image, Text, View } from 'react-native';
import { useThemeColor } from '@/theme/colors';


export interface ImagePickerFieldProps {
  label?: string;
  value?: string;
  isUrl?: boolean;
  onChange: (value: string | null, isUrl: boolean) => void;
  maxFileSizeKb?: number;
  cropShape?: 'rect' | 'round';
  showGuide?: boolean;
}

export function ImagePickerField({ label, value, isUrl, onChange, maxFileSizeKb = 500, cropShape = 'round', showGuide = false }: ImagePickerFieldProps) {
  const { t } = useTranslation();
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [tempUrl, setTempUrl] = useState(isUrl ? value || '' : '');

  const handlePickFile = async () => {
    const result = await pickAndProcessImage({ maxFileSizeKb });
    if (result && result.base64) {
      onChange(result.base64, false);
      setShowUrlInput(false);
    }
  };

  const handleUrlSubmit = () => {
    if (tempUrl.trim()) {
      onChange(tempUrl.trim(), true);
    }
    setShowUrlInput(false);
  };

  const handleRemove = () => {
    onChange(null, false);
    setTempUrl('');
    setShowUrlInput(false);
  };

  // RENDER: FILLED AVATAR STATE
  if (value && !showUrlInput) {
    return (
      <View className="mb-8 items-center">
        <View className={`w-[180px] md:w-[220px] aspect-square ${cropShape === "rect" ? "" : "rounded-full"} overflow-hidden mb-5 bg-surface border border-border shadow-sm`}>
          <Image source={{ uri: value }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
        </View>
        <View className="flex-row justify-center gap-3 w-full">
          <Button variant="default" size="sm" onPress={handlePickFile} className="flex-1 max-w-[140px]">
            <Edit2 color={useThemeColor('--primary-foreground')} size={14} />
            <Text className="text-primary-foreground font-bold text-xs shrink">Alterar</Text>
          </Button>
          <Button variant="outline" size="sm" onPress={handleRemove} className="flex-1 max-w-[140px] border-border">
            <Trash2 color={useThemeColor('--text-secondary')} size={14} />
            <Text className="text-text-secondary font-bold text-xs shrink">Remover</Text>
          </Button>
        </View>
      </View>
    );
  }

  // RENDER: URL INPUT STATE
  if (showUrlInput) {
    return (
      <View className="mb-8">
        {label && (
          <Text className="text-[11px] font-bold text-text-secondary uppercase mb-2 tracking-wide">
            {label}
          </Text>
        )}
        <View className="border border-border bg-surface p-4 rounded-xl shadow-sm">
          <FormField
            placeholder="https://..."
            value={tempUrl}
            onChangeText={setTempUrl}
            leadingIcon={<LinkIcon color={useThemeColor('--text-secondary')} size={16} />}
            autoFocus
          />
          <View className="flex-row gap-3 mt-2">
            <Button variant="ghost" size="sm" className="flex-1" onPress={() => setShowUrlInput(false)}>
              <Text className="text-text font-bold text-sm">{t('common.cancel')}</Text>
            </Button>
            <Button variant="default" size="sm" className="flex-1" onPress={handleUrlSubmit}>
              <Text className="text-primary-foreground font-bold text-sm">{t('image_picker.save_url')}</Text>
            </Button>
          </View>
        </View>
      </View>
    );
  }

  // RENDER: EMPTY STATE (NO DRAG)
  return (
    <View className="mb-8">
      {label && (
        <Text className="text-[11px] font-bold text-text-secondary uppercase mb-2 tracking-wide">
          {label}
        </Text>
      )}

      <View className="border-2 border-dashed rounded-xl overflow-hidden transition-colors border-border bg-input-background">
        <View className="p-8 items-center justify-center min-h-[220px]">
          <View className="flex-col md:flex-row flex-wrap justify-center gap-3 w-full max-w-[280px]">
            <Button variant="outline" onPress={handlePickFile} className="flex-1 w-full bg-surface">
              <ImageIcon color={useThemeColor('--text')} size={14} />
              <Text className="text-text font-bold text-xs shrink">{t('image_picker.choose_file')}</Text>
            </Button>
            <Button variant="outline" onPress={() => setShowUrlInput(true)} className="flex-1 w-full bg-surface">
              <LinkIcon color={useThemeColor('--text')} size={14} />
              <Text className="text-text font-bold text-xs shrink">{t('image_picker.use_url')}</Text>
            </Button>
          </View>
        </View>
      </View>
    </View>
  );
}
