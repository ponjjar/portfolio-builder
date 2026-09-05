import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { useTranslation } from 'react-i18next';
import { Experience, Education } from '@/domain/portfolio/types';
import { CheckSquare, Square, AlertTriangle } from 'lucide-react-native';
import { usePortfolioStore } from '@/store';
import { useThemeColor } from '@/theme/colors';


interface ReviewImportModalProps {
  visible: boolean;
  onClose: () => void;
  data: { experiences: Experience[], education: Education[] } | null;
  onConfirm: (data: { experiences: Experience[], education: Education[] }) => void;
}

export function ReviewImportModal({ visible, onClose, data, onConfirm }: ReviewImportModalProps) {
  const { t } = useTranslation();
  const { session } = usePortfolioStore();
  const [selectedExperiences, setSelectedExperiences] = useState<Set<string>>(new Set());
  const [selectedEducation, setSelectedEducation] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState<'experience' | 'education'>('experience');

  useEffect(() => {
    if (visible && data) {
      // By default select all, except those that look like obvious duplicates
      const newExp = new Set<string>();
      const newEdu = new Set<string>();
      
      const currentExps = session.experiences || [];
      const currentEdus = session.education || [];

      data.experiences.forEach(e => {
        const isDuplicate = currentExps.some(ce => ce.company === e.company && ce.title === e.title && ce.startDate === e.startDate);
        if (!isDuplicate) newExp.add(e.id);
      });

      data.education.forEach(e => {
        const isDuplicate = currentEdus.some(ce => ce.institution === e.institution && ce.course === e.course && ce.startDate === e.startDate);
        if (!isDuplicate) newEdu.add(e.id);
      });

      setSelectedExperiences(newExp);
      setSelectedEducation(newEdu);
      setActiveTab(data.experiences.length > 0 ? 'experience' : 'education');
    }
  }, [visible, data, session]);

  if (!data) return null;

  const handleConfirm = () => {
    const exps = data.experiences.filter(e => selectedExperiences.has(e.id));
    const edus = data.education.filter(e => selectedEducation.has(e.id));
    onConfirm({ experiences: exps, education: edus });
  };

  const toggleExp = (id: string) => {
    const next = new Set(selectedExperiences);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedExperiences(next);
  };

  const toggleEdu = (id: string) => {
    const next = new Set(selectedEducation);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedEducation(next);
  };

  const toggleAll = () => {
    if (activeTab === 'experience') {
      if (selectedExperiences.size === data.experiences.length) {
        setSelectedExperiences(new Set());
      } else {
        setSelectedExperiences(new Set(data.experiences.map(e => e.id)));
      }
    } else {
      if (selectedEducation.size === data.education.length) {
        setSelectedEducation(new Set());
      } else {
        setSelectedEducation(new Set(data.education.map(e => e.id)));
      }
    }
  };

  const currentExps = session.experiences || [];
  const currentEdus = session.education || [];

  return (
    <Modal visible={visible} onClose={onClose} title={t('experience.import.review_title', 'Revisar Dados Importados')} hideCloseButton={false}>
      <View className="flex-row items-center border border-border rounded-lg p-1 bg-surface-elevated mb-4">
        <TouchableOpacity
          onPress={() => setActiveTab('experience')}
          className={`flex-1 px-4 py-2 rounded-md items-center ${activeTab === 'experience' ? 'bg-surface border border-border' : 'bg-transparent'}`}
        >
          <Text className={`${activeTab === 'experience' ? 'text-text font-bold' : 'text-text-secondary'} text-sm`}>
            {t("experience.tabs.experience")} ({data.experiences.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setActiveTab('education')}
          className={`flex-1 px-4 py-2 rounded-md items-center ${activeTab === 'education' ? 'bg-surface border border-border' : 'bg-transparent'}`}
        >
          <Text className={`${activeTab === 'education' ? 'text-text font-bold' : 'text-text-secondary'} text-sm`}>
            {t("experience.tabs.education")} ({data.education.length})
          </Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity onPress={toggleAll} className="mb-4 flex-row items-center justify-end px-2">
        <Text className="text-primary font-bold mr-2 text-sm">{t('experience.import.select_all', 'Selecionar Todos')}</Text>
        {activeTab === 'experience' ? (
           selectedExperiences.size === data.experiences.length ? <CheckSquare size={16} color={useThemeColor('--primary')} /> : <Square size={16} color={useThemeColor('--primary')} />
        ) : (
           selectedEducation.size === data.education.length ? <CheckSquare size={16} color={useThemeColor('--primary')} /> : <Square size={16} color={useThemeColor('--primary')} />
        )}
      </TouchableOpacity>

      <ScrollView className="max-h-[300px] mb-4 border border-border rounded-lg bg-surface">
        {activeTab === 'experience' && data.experiences.map(exp => {
          const isSelected = selectedExperiences.has(exp.id);
          const isDuplicate = currentExps.some(ce => ce.company === exp.company && ce.title === exp.title && ce.startDate === exp.startDate);
          
          return (
            <TouchableOpacity key={exp.id} onPress={() => toggleExp(exp.id)} className={`flex-row p-4 border-b border-border items-center ${isSelected ? 'bg-primary/5' : ''}`}>
              <View className="mr-3">
                {isSelected ? <CheckSquare color={useThemeColor('--primary')} size={20} /> : <Square color={useThemeColor('--text-muted')} size={20} />}
              </View>
              <View className="flex-1">
                <Text className="text-text font-bold" numberOfLines={1}>{exp.company}</Text>
                <Text className="text-text-secondary text-sm" numberOfLines={1}>{exp.title}</Text>
                <Text className="text-text-muted text-xs mt-1">{exp.startDate} - {exp.current ? 'Present' : exp.endDate}</Text>
              </View>
              {isDuplicate && (
                <View className="ml-2 flex-row items-center bg-[#f59e0b20] px-2 py-1 rounded">
                  <AlertTriangle size={12} color="#f59e0b" />
                  <Text className="text-[#f59e0b] text-xs ml-1">Duplicata</Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}

        {activeTab === 'education' && data.education.map(edu => {
          const isSelected = selectedEducation.has(edu.id);
          const isDuplicate = currentEdus.some(ce => ce.institution === edu.institution && ce.course === edu.course && ce.startDate === edu.startDate);
          
          return (
            <TouchableOpacity key={edu.id} onPress={() => toggleEdu(edu.id)} className={`flex-row p-4 border-b border-border items-center ${isSelected ? 'bg-primary/5' : ''}`}>
              <View className="mr-3">
                {isSelected ? <CheckSquare color={useThemeColor('--primary')} size={20} /> : <Square color={useThemeColor('--text-muted')} size={20} />}
              </View>
              <View className="flex-1">
                <Text className="text-text font-bold" numberOfLines={1}>{edu.institution}</Text>
                <Text className="text-text-secondary text-sm" numberOfLines={1}>{edu.course}</Text>
                <Text className="text-text-muted text-xs mt-1">{edu.startDate} - {edu.current ? 'Present' : edu.endDate}</Text>
              </View>
              {isDuplicate && (
                <View className="ml-2 flex-row items-center bg-[#f59e0b20] px-2 py-1 rounded">
                  <AlertTriangle size={12} color="#f59e0b" />
                  <Text className="text-[#f59e0b] text-xs ml-1">Duplicata</Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}

        {((activeTab === 'experience' && data.experiences.length === 0) || (activeTab === 'education' && data.education.length === 0)) && (
          <View className="p-8 items-center justify-center">
            <Text className="text-text-secondary text-center">Nenhum dado encontrado para esta aba.</Text>
          </View>
        )}
      </ScrollView>

      <View className="flex-row justify-end gap-3 mt-4">
        <Button variant="outline" onPress={onClose}>
          {t('common.cancel')}
        </Button>
        <Button variant="default" onPress={handleConfirm}>
          {t('experience.import.apply', 'Aplicar ao Portfólio')}
        </Button>
      </View>
    </Modal>
  );
}
