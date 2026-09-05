import React, { useState, useRef, useEffect } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { Button } from '@/components/ui/button';
import { CheckCircle2, XCircle, CircleDashed } from 'lucide-react-native';
import { GitHubRepositorySummary, GitHubRepoDetails } from '@/services/github/github.schemas';
import { fetchRepositoryReadme } from '@/services/github/github-readme';
import { detectTechnologies } from '@/services/github/github-manifests';
import { runWithConcurrency } from '@/utils/promise-concurrency';
import { Modal } from '@/components/ui/modal';
import { useTurnstile } from '@/components/ui/TurnstileProvider';
import { useThemeColor } from '@/theme/colors';


interface GitHubProcessingModalProps {
  visible: boolean;
  reposToProcess: GitHubRepositorySummary[];
  onComplete: (details: GitHubRepoDetails[]) => void;
  onCancel: () => void;
}

type ProcessStatus = 'waiting' | 'processing' | 'completed' | 'error';

interface RepoProcessState {
  repo: GitHubRepositorySummary;
  status: ProcessStatus;
}

export function GitHubProcessingModal({ visible, reposToProcess, onComplete, onCancel }: GitHubProcessingModalProps) {
  const [states, setStates] = useState<RepoProcessState[]>([]);
  const abortControllerRef = useRef<AbortController | null>(null);
  const [completedCount, setCompletedCount] = useState(0);
  const [isDone, setIsDone] = useState(false);
  const { getToken } = useTurnstile();

  const startProcessing = React.useCallback(async () => {
    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;

    try {
      const results = await runWithConcurrency<GitHubRepositorySummary, GitHubRepoDetails | null>(
        reposToProcess,
        3, // Process 3 repos concurrently
        async (repo) => {
          if (signal.aborted) throw new Error('Aborted');

          // Update status to processing
          setStates(prev => prev.map(s => s.repo.id === repo.id ? { ...s, status: 'processing' } : s));

          try {
            const [readme, manifestsResult] = await Promise.all([
              fetchRepositoryReadme(repo, signal, getToken),
              detectTechnologies(repo, signal, getToken)
            ]);

            // Update status to completed
            setStates(prev => prev.map(s => s.repo.id === repo.id ? { ...s, status: 'completed' } : s));
            setCompletedCount(prev => prev + 1);

            return {
              summary: repo,
              readme,
              manifests: manifestsResult.manifests,
              detectedTechnologies: manifestsResult.detectedTechnologies,
            };
          } catch (err: any) {
            if (err.message === 'Aborted') throw err;
            
            // Update status to error but continue other repos
            setStates(prev => prev.map(s => s.repo.id === repo.id ? { ...s, status: 'error' } : s));
            setCompletedCount(prev => prev + 1);
            return null; // Return null on error, will filter out
          }
        }
      );

      if (!signal.aborted) {
        setIsDone(true);
        // Filter out nulls (errors)
        const successfulDetails = results.filter(Boolean) as GitHubRepoDetails[];
        // Call complete after a small delay to show the final checkmarks
        setTimeout(() => {
          onComplete(successfulDetails);
        }, 1000);
      }
    } catch (err: any) {
      if (err.message !== 'Aborted') {
        console.error('Processing error:', err);
      }
    }
  }, [reposToProcess, onComplete]);

  useEffect(() => {
    if (visible && reposToProcess.length > 0) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setStates(reposToProcess.map(repo => ({ repo, status: 'waiting' })));
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setCompletedCount(0);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIsDone(false);
      startProcessing();
    }
    
    return () => {
      // Cleanup if unmounted
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [visible, reposToProcess, startProcessing]);

  const handleCancel = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    onCancel();
  };

  return (
    <Modal
      visible={visible}
      hideCloseButton
      title={isDone ? 'Import Complete' : 'Processing Repositories'}
      size="md"
      footer={
        <Button 
          onPress={handleCancel}
          variant={isDone ? 'default' : 'ghost'}
        >
          {isDone ? 'Done' : 'Cancel'}
        </Button>
      }
    >
      <View className="py-2">
        <Text className="text-text-secondary mb-6 text-sm">
          {isDone 
            ? `Successfully processed ${completedCount} repositories.` 
            : `Analyzing ${completedCount} of ${reposToProcess.length} repositories...`}
        </Text>
        
        <View className="gap-3">
          {states.map(({ repo, status }) => (
            <View key={repo.id} className="flex-row items-center justify-between bg-input-background border border-border rounded-lg p-3">
              <View className="flex-row items-center flex-1 mr-2">
                <Text className="text-text font-bold" numberOfLines={1}>{repo.name}</Text>
              </View>
              {status === 'processing' && <ActivityIndicator size="small" color={useThemeColor('--text')} />}
              {status === 'completed' && <CheckCircle2 color={useThemeColor('--color-success')} size={20} />}
              {status === 'error' && <XCircle color={useThemeColor('--color-error')} size={20} />}
              {status === 'waiting' && <CircleDashed color={useThemeColor('--text-secondary')} size={20} />}
            </View>
          ))}
        </View>
      </View>
    </Modal>
  );
}
