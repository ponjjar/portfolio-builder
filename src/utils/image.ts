import * as ImagePicker from 'expo-image-picker';

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

  // Request permissions
  const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (status !== 'granted') {
    alert('Sorry, we need camera roll permissions to make this work!');
    return null;
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
    
    // Warn if it's still too large
    if (sizeInKb > 924) {
      alert(`The selected image is still too large (${Math.round(sizeInKb)}KB) even after compression. Max is 924KB. Please choose a smaller image.`);
      return null;
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
