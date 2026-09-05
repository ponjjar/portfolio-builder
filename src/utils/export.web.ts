import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { Platform } from 'react-native';
import JSZip from 'jszip';
import { PortfolioSession } from '@/domain/portfolio/types';
import { buildPortfolioViewModel } from '@/templates/viewModel';
import { renderMinimalTemplate } from '@/templates/minimal';

// Helper for Web download
const downloadWebFile = (blob: Blob, filename: string) => {
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);
};

// Helper for Native save & share
const shareNativeFile = async (stringContent: string, filename: string, isBase64: boolean = false) => {
  const FS = FileSystem as any;
  const fileUri = `${FS.documentDirectory || FS.cacheDirectory}${filename}`;
  await FS.writeAsStringAsync(fileUri, stringContent, {
    encoding: isBase64 ? FS.EncodingType.Base64 : FS.EncodingType.UTF8,
  });
  
  const canShare = await Sharing.isAvailableAsync();
  if (canShare) {
    await Sharing.shareAsync(fileUri);
  } else {
    alert('Sharing is not available on this device');
  }
};

export const exportHtml = async (session: PortfolioSession) => {
  const viewModel = buildPortfolioViewModel(session);
  const html = renderMinimalTemplate(viewModel);
  
  if (Platform.OS === 'web') {
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    downloadWebFile(blob, 'index.html');
  } else {
    await shareNativeFile(html, 'index.html');
  }
};

export const exportSessionJson = async (session: PortfolioSession) => {
  const json = JSON.stringify(session, null, 2);
  
  if (Platform.OS === 'web') {
    const blob = new Blob([json], { type: 'application/json;charset=utf-8' });
    downloadWebFile(blob, 'portfolio-session.json');
  } else {
    await shareNativeFile(json, 'portfolio-session.json');
  }
};

export const exportZip = async (session: PortfolioSession) => {
  const viewModel = buildPortfolioViewModel(session);
  const html = renderMinimalTemplate(viewModel);
  const json = JSON.stringify(session, null, 2);

  const zip = new JSZip();
  zip.file('index.html', html);
  zip.file('portfolio-session.json', json);
  
  if (Platform.OS === 'web') {
    const content = await zip.generateAsync({ type: 'blob' });
    downloadWebFile(content, 'portfolio.zip');
  } else {
    const base64 = await zip.generateAsync({ type: 'base64' });
    await shareNativeFile(base64, 'portfolio.zip', true);
  }
};

export const exportGitHubPagesReady = async (session: PortfolioSession) => {
  // Essentially same as zip but let's notify the user that they just need to extract to a repo.
  await exportZip(session);
};
