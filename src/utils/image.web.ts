import * as ImagePicker from 'expo-image-picker';
import { Platform } from 'react-native';

export type ProcessedImage = {
  uri: string; // The original or temporary URI
  base64?: string; // Base64 data (if requested)
  type: 'image/jpeg' | 'image/png' | 'image/webp';
  size?: number;
};

interface ImageProcessOptions {
  quality?: number; // 0 to 1
  maxFileSizeKb?: number;
}

export async function pickAndProcessImage(options: ImageProcessOptions = {}): Promise<ProcessedImage | null> {
  const { 
    quality = 0.5, 
    maxFileSizeKb = 500
  } = options;

  // Request permissions if needed
  if (Platform.OS !== 'web') {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      alert('Sorry, we need camera roll permissions to make this work!');
      return null;
    }
  }

  // Use ImagePicker which already has compression capabilities
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: 'images',
    allowsEditing: true,
    aspect: [1, 1], // Always crop to 1:1
    quality: quality, // Compress quality to reduce size
    base64: true, // We need base64 to store in the JSON session
  });

  if (result.canceled || !result.assets || result.assets.length === 0) {
    return null;
  }

  const asset = result.assets[0];
  let finalBase64 = asset.base64;
  
  if (finalBase64) {
    // Check size limit roughly based on base64 length (approx 4/3 of binary size)
    const sizeInKb = (finalBase64.length * 0.75) / 1024;
    
    // Auto-resize if it's too large (over 924 KB)
    if (sizeInKb > 924) {
      if (Platform.OS === 'web') {
        try {
          // Automatic resize via Canvas on Web
          finalBase64 = await new Promise<string>((resolve) => {
            const img = new window.Image();
            img.onload = () => {
              const canvas = document.createElement('canvas');
              // Scale down by 0.7 until it's small enough, or just do a fixed scale
              const scale = Math.sqrt(924 / sizeInKb) * 0.9; // 10% safety margin
              canvas.width = img.width * scale;
              canvas.height = img.height * scale;
              const ctx = canvas.getContext('2d');
              ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
              // Get new base64 (strip the data:image/jpeg;base64, prefix)
              const newBase64 = canvas.toDataURL('image/jpeg', 0.8).split(',')[1];
              resolve(newBase64);
            };
            img.src = `data:image/jpeg;base64,${finalBase64}`;
          });
        } catch (e) {
          console.error("Failed to auto-resize image on web:", e);
        }
      } else {
        alert(`The selected image is still too large (${Math.round(sizeInKb)}KB) even after compression. Max is 924KB. Please choose a smaller image.`);
        return null;
      }
    }
  }

  // Determine mime type from extension or default to jpeg
  let type: 'image/jpeg' | 'image/png' | 'image/webp' = 'image/jpeg';
  if (asset.uri.endsWith('.png')) type = 'image/png';
  if (asset.uri.endsWith('.webp')) type = 'image/webp';

  return {
    uri: asset.uri,
    base64: finalBase64 ? `data:${type};base64,${finalBase64}` : undefined,
    type,
    size: asset.fileSize,
  };
}
