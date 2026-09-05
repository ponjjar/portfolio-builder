import { Button } from '@/components/ui/button';
import { FormField } from '@/components/ui/form-field';
import { Modal } from '@/components/ui/modal';
import { GitHubNotFoundError, GitHubRateLimitError, normalizeGitHubUsername } from '@/services/github/github-client';
import { fetchAllPublicRepositories, fetchGitHubUser } from '@/services/github/github-repositories';
import { extractReadmeImages, ImageCandidate } from '@/services/github/github-readme';
import { GitHubRepositorySummary } from '@/services/github/github.schemas';
import { usePortfolioStore } from '@/store';
import { AlertCircle, CheckCircle2, Circle, Code2, Search, Edit2, ImageIcon } from 'lucide-react-native';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Image, Text, TouchableOpacity, View } from 'react-native';
import { ProjectImageSelectionModal } from '../modals/ProjectImageSelectionModal';
import { useTurnstile } from '@/components/ui/TurnstileProvider';
import { useThemeColor } from '@/theme/colors';


interface GitHubImportModalProps {
  visible: boolean;
  onClose: () => void;
  onImport: (repos: GitHubRepositorySummary[]) => void;
}

export function GitHubImportModal({ visible, onClose, onImport }: GitHubImportModalProps) {
  const { t } = useTranslation();
  const existingProjects = usePortfolioStore((s) => s.session.projects);
  const socialLinks = usePortfolioStore((s) => s.session.socialLinks);

  // Derive initial username directly without cascading effect
  const githubLink = socialLinks.find((link) => link.type === 'github');
  const defaultUsername = githubLink ? normalizeGitHubUsername(githubLink.url) : '';

  const [step, setStep] = useState<'input' | 'loading' | 'select'>('input');
  const [usernameInput, setUsernameInput] = useState(defaultUsername);
  const [repositories, setRepositories] = useState<GitHubRepositorySummary[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'sources' | 'forks' | 'archived'>('all');
  const [error, setError] = useState<string | null>(null);

  // Tracks the image candidates and selected index for each repo
  const [repoImages, setRepoImages] = useState<Record<number, { status: 'loading' | 'done', candidates: ImageCandidate[], selectedCandidateIndex: number | null }>>({});

  // Image editing modal state
  const [editingRepoId, setEditingRepoId] = useState<number | null>(null);

  const { getToken } = useTurnstile();

  const handleClose = () => {
    setStep('input');
    setRepositories([]);
    setSelectedIds(new Set());
    setSearchQuery('');
    setFilter('all');
    setError(null);
    setRepoImages({});
    setEditingRepoId(null);
    onClose();
  };

  const handleSearch = async () => {
    try {
      setStep('loading');
      setError(null);
      
      const userToken = await getToken();
      const username = normalizeGitHubUsername(usernameInput);
      const user = await fetchGitHubUser(username, undefined, userToken);
      
      const reposToken = await getToken();
      const repos = await fetchAllPublicRepositories(user.login, undefined, undefined, reposToken);
      
      setRepositories(repos);
      setStep('select');
    } catch (err: any) {
      setStep('input');
      const isDev = process.env.NODE_ENV === 'development' || (typeof __DEV__ !== 'undefined' && __DEV__);
      if (err instanceof GitHubNotFoundError) {
        setError(t('github.user_not_found'));
      } else if (err instanceof GitHubRateLimitError || err.name === 'GitHubRateLimitError') {
        setError(t(isDev ? 'github.rate_limit_exceeded_dev' : 'github.rate_limit_exceeded'));
      } else {
        setError(t('github.fetch_error'));
      }
    }
  };

  const handleConfirmImport = () => {
    const toImport = repositories.filter(r => selectedIds.has(r.id)).map(r => {
      const imgState = repoImages[r.id];
      if (imgState && imgState.status === 'done' && imgState.selectedCandidateIndex !== null && imgState.selectedCandidateIndex >= 0) {
        const candidate = imgState.candidates[imgState.selectedCandidateIndex];
        return {
          ...r,
          selectedImage: {
            type: 'url' as const,
            value: candidate.url,
            source: 'github-readme',
            width: candidate.width,
            height: candidate.height,
          }
        };
      } else if (imgState && imgState.status === 'done' && r.selectedImage) {
        return r;
      }
      return r;
    });
    onImport(toImport);
  };

  const extractImagesForRepo = async (repo: GitHubRepositorySummary) => {
    if (repoImages[repo.id]) return;
    
    setRepoImages(prev => ({ ...prev, [repo.id]: { status: 'loading', candidates: [], selectedCandidateIndex: null } }));
    
    const candidates = await extractReadmeImages(repo, getToken);
    
    setRepoImages(prev => ({
      ...prev,
      [repo.id]: {
        status: 'done',
        candidates,
        selectedCandidateIndex: candidates.length > 0 ? 0 : null
      }
    }));
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredRepos.length) {
      setSelectedIds(new Set());
    } else {
      const newSet = new Set<number>();
      filteredRepos.forEach(r => {
        newSet.add(r.id);
        extractImagesForRepo(r);
      });
      setSelectedIds(newSet);
    }
  };

  const toggleSelect = (repo: GitHubRepositorySummary) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(repo.id)) {
      newSet.delete(repo.id);
    } else {
      newSet.add(repo.id);
      extractImagesForRepo(repo);
    }
    setSelectedIds(newSet);
  };

  const filteredRepos = repositories.filter(repo => {
    if (searchQuery && !repo.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    if (filter === 'sources' && repo.isFork) return false;
    if (filter === 'forks' && !repo.isFork) return false;
    if (filter === 'archived' && !repo.isArchived) return false;
    return true;
  });

  const renderFooter = () => {
    if (step !== 'select') return null;
    const isSingle = selectedIds.size === 1;
    return (
      <View className="flex-1 flex-row items-center justify-between w-full">
        <Text className="text-text-secondary text-sm">
          {t(isSingle ? 'github.selected_count' : 'github.selected_count_plural', { count: selectedIds.size })}
        </Text>
        <Button
          onPress={handleConfirmImport}
          disabled={selectedIds.size === 0}
          className="px-6"
        >
          <Text className="text-primary-foreground font-bold">
            {t(isSingle ? 'github.import_btn' : 'github.import_btn_plural', { count: selectedIds.size })}
          </Text>
        </Button>
      </View>
    );
  };

  const editingRepo = editingRepoId ? repositories.find(r => r.id === editingRepoId) : null;
  const editingRepoImageState = editingRepo ? repoImages[editingRepo.id] : null;

  return (
    <>
      <Modal visible={visible} onClose={handleClose} title={t('github.modal_title')} size="lg" footer={renderFooter()}>
        <View className="flex-1">
          {step === 'input' && (
            <View className="flex-1 py-6 justify-center">
              <View className="mb-6 items-center">
                <Code2 color={useThemeColor('--text')} size={48} className="mb-4" />
                <Text className="text-text font-bold text-xl mb-2 text-center">{t('github.confirm_user')}</Text>
              </View>

              <FormField
                label={t('github.username_label')}
                placeholder={t('github.username_placeholder')}
                value={usernameInput}
                onChangeText={setUsernameInput}
                onSubmitEditing={handleSearch}
                autoCapitalize="none"
                autoCorrect={false}
                leadingIcon={<Code2 color={useThemeColor('--text-secondary')} size={16} />}
              />

              {error && (
                <View className="bg-red-500/10 p-4 rounded mb-4 flex-row items-center">
                  <AlertCircle color="#ef4444" size={20} className="mr-2" />
                  <Text className="text-red-500 flex-1">{error}</Text>
                </View>
              )}

              <Button onPress={handleSearch} disabled={!usernameInput.trim()}>
                <Text className="text-primary-foreground font-bold">{t('github.search_btn')}</Text>
              </Button>
            </View>
          )}

          {step === 'loading' && (
            <View className="flex-1 p-6 items-center justify-center">
              <ActivityIndicator size="large" color={useThemeColor('--text')} className="mb-4" />
              <Text className="text-text text-lg font-bold">{t('github.searching')}</Text>
            </View>
          )}

          {step === 'select' && (
            <View className="flex-1">
              <View className="pb-4 border-b border-border">
                <FormField
                  placeholder={t('github.filter_placeholder')}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  autoCapitalize="none"
                  autoCorrect={false}
                  leadingIcon={<Search color={useThemeColor('--text-secondary')} size={16} />}
                />

                <View className="flex-row gap-2 mt-4">
                  {(['all', 'sources', 'forks', 'archived'] as const).map(f => (
                    <TouchableOpacity
                      key={f}
                      onPress={() => setFilter(f)}
                      className={`px-3 py-1.5 rounded-full border ${filter === f ? 'bg-primary border-primary' : 'bg-transparent border-border'
                        }`}
                    >
                      <Text className={`text-xs capitalize ${filter === f ? 'text-primary-foreground font-bold' : 'text-text-secondary'}`}>
                        {f}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View className="flex-row items-center justify-between py-3 border-b border-border">
                <TouchableOpacity onPress={toggleSelectAll} className="flex-row items-center">
                  {selectedIds.size === filteredRepos.length && filteredRepos.length > 0 ? (
                    <CheckCircle2 color="#10b981" size={20} className="mr-2" />
                  ) : (
                    <Circle color="#666" size={20} className="mr-2" />
                  )}
                  <Text className="text-text font-bold">{t('github.choose_projects', { count: filteredRepos.length })}</Text>
                </TouchableOpacity>

                <TouchableOpacity onPress={() => setSelectedIds(new Set())}>
                  <Text className="text-text-secondary">{t('github.clear')}</Text>
                </TouchableOpacity>
              </View>

              <View className="pt-4">
                {filteredRepos.length === 0 ? (
                  <View className="py-10 items-center justify-center">
                    <Text className="text-text-secondary text-center">{t('github.no_repos_found')}</Text>
                  </View>
                ) : (
                  filteredRepos.map(repo => {
                    const isSelected = selectedIds.has(repo.id);
                    const isAlreadyImported = existingProjects.some(
                      p => p.source.type === 'github' && p.source.repository.url === repo.htmlUrl
                    );
                    const imgState = repoImages[repo.id];
                    let currentImage: string | null = null;
                    if (repo.selectedImage?.value) {
                      currentImage = repo.selectedImage.value;
                    } else if (imgState?.status === 'done' && imgState.selectedCandidateIndex !== null && imgState.selectedCandidateIndex >= 0) {
                      currentImage = imgState.candidates[imgState.selectedCandidateIndex].url;
                    }

                    return (
                      <View
                        key={repo.id}
                        className={`flex-row items-center p-3 mb-3 rounded border ${isSelected ? 'border-primary bg-primary/5' : 'border-border bg-surface'
                          } ${isAlreadyImported ? 'opacity-50' : ''}`}
                      >
                        <TouchableOpacity 
                          onPress={() => toggleSelect(repo)}
                          disabled={isAlreadyImported}
                          className="mr-3 p-1"
                        >
                          {isSelected ? (
                            <CheckCircle2 color="#10b981" size={20} />
                          ) : (
                            <Circle color="#666" size={20} />
                          )}
                        </TouchableOpacity>

                        {/* Thumbnail */}
                        <View className="w-12 h-12 rounded bg-input-background overflow-hidden mr-3 items-center justify-center border border-border/50">
                          {imgState?.status === 'loading' ? (
                            <ActivityIndicator size="small" color={useThemeColor('--text-secondary')} />
                          ) : currentImage ? (
                            <Image 
                              source={{ uri: currentImage }} 
                              style={{ width: '100%', height: '100%' }} 
                              resizeMode="cover" 
                            />
                          ) : (
                            <ImageIcon color={useThemeColor('--text-muted')} size={16} />
                          )}
                        </View>

                        <View className="flex-1 justify-center">
                          <View className="flex-row items-center flex-wrap mb-0.5">
                            <Text className="text-text font-bold text-base mr-2">{repo.name}</Text>
                            {isAlreadyImported && (
                              <View className="bg-green-500/20 px-1.5 py-0.5 rounded mr-2">
                                <Text className="text-green-500 text-[9px] font-bold">{t('github.imported_badge')}</Text>
                              </View>
                            )}
                            {repo.isFork && (
                              <View className="bg-surface-elevated px-1.5 py-0.5 rounded mr-2">
                                <Text className="text-text-secondary text-[9px] font-bold">FORK</Text>
                              </View>
                            )}
                            {repo.isArchived && (
                              <View className="bg-yellow-500/20 px-1.5 py-0.5 rounded mr-2">
                                <Text className="text-yellow-500 text-[9px] font-bold">{t('github.archived_badge', { defaultValue: 'ARCHIVED' })}</Text>
                              </View>
                            )}
                          </View>

                          <View className="flex-row items-center flex-wrap gap-x-2 gap-y-1">
                            {repo.language && (
                              <Text className="text-xs text-blue-400">{repo.language}</Text>
                            )}
                            <Text className="text-[10px] text-text-secondary" numberOfLines={1} style={{ maxWidth: 200 }}>
                              {repo.description || t('github.no_description')}
                            </Text>
                          </View>
                        </View>

                        {isSelected && imgState?.status === 'done' && (
                          <TouchableOpacity 
                            onPress={() => setEditingRepoId(repo.id)}
                            className="p-2 ml-2 bg-surface-elevated rounded-full"
                          >
                            <Edit2 color={useThemeColor('--text-secondary')} size={16} />
                          </TouchableOpacity>
                        )}
                      </View>
                    );
                  })
                )}
              </View>
            </View>
          )}
        </View>
      </Modal>

      {editingRepo && editingRepoImageState && (
        <ProjectImageSelectionModal
          visible={true}
          onClose={() => setEditingRepoId(null)}
          projectName={editingRepo.name}
          candidates={editingRepoImageState.candidates}
          onConfirm={(image) => {
            if (image && image.source === 'manual') {
              const updatedRepo = { ...editingRepo, selectedImage: image };
              
              setRepoImages(prev => ({
                ...prev,
                [editingRepo.id]: {
                  status: 'done',
                  candidates: prev[editingRepo.id]?.candidates || [],
                  selectedCandidateIndex: null
                }
              }));
              
              setRepositories(repos => repos.map(r => r.id === updatedRepo.id ? updatedRepo : r));
              
            } else if (image) {
              const idx = editingRepoImageState.candidates.findIndex(c => c.url === image.value);
              setRepoImages(prev => ({
                ...prev,
                [editingRepo.id]: {
                  status: 'done',
                  candidates: prev[editingRepo.id]?.candidates || [],
                  selectedCandidateIndex: idx >= 0 ? idx : null
                }
              }));
              const updatedRepo = { ...editingRepo, selectedImage: undefined };
              setRepositories(repos => repos.map(r => r.id === updatedRepo.id ? updatedRepo : r));
            } else {
              setRepoImages(prev => ({
                ...prev,
                [editingRepo.id]: {
                  status: 'done',
                  candidates: prev[editingRepo.id]?.candidates || [],
                  selectedCandidateIndex: null
                }
              }));
              
              const updatedRepo = { ...editingRepo, selectedImage: undefined };
              setRepositories(repos => repos.map(r => r.id === updatedRepo.id ? updatedRepo : r));
            }
            setEditingRepoId(null);
          }}
        />
      )}
    </>
  );
}
