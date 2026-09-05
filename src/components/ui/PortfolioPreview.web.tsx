import React from 'react';
import { useWindowDimensions } from 'react-native';

interface PortfolioPreviewProps {
  htmlContent: string;
  viewport: 'desktop' | 'mobile';
  isMobile: boolean;
}

export function PortfolioPreview({ htmlContent, viewport, isMobile }: PortfolioPreviewProps) {
  const { width } = useWindowDimensions();
  
  return (
    <iframe
      srcDoc={htmlContent}
      style={{
        width: viewport === 'desktop' && isMobile ? '1280px' : '100%',
        height: viewport === 'desktop' && isMobile ? `${(1 / (width / 1280)) * 100}%` : '100%',
        border: 'none',
        transform: viewport === 'desktop' && isMobile ? `scale(${width / 1280})` : 'none',
        transformOrigin: 'top left'
      }}
      sandbox="allow-scripts allow-same-origin"
    />
  );
}
