import React from 'react';
import { WebView } from 'react-native-webview';

interface PortfolioPreviewProps {
  htmlContent: string;
  viewport: 'desktop' | 'mobile';
  isMobile: boolean;
}

export function PortfolioPreview({ htmlContent, viewport, isMobile }: PortfolioPreviewProps) {
  // On native Android/iOS, viewport scaling works differently, 
  // WebView handles its own internal layout, but we can configure it if needed.
  return (
    <WebView
      source={{ html: htmlContent }}
      style={{ flex: 1 }}
      originWhitelist={['*']}
      javaScriptEnabled={true}
      domStorageEnabled={true}
      scalesPageToFit={viewport === 'desktop' ? true : false}
    />
  );
}
