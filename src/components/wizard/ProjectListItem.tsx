import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Alert, Image } from 'react-native';
import { Project } from '@/domain/portfolio/types';
import { Trash2, Edit2, ChevronDown, ChevronUp, CheckCircle2, AlertCircle, Bot, Code2 } from 'lucide-react-native';
import { FormField } from '@/components/ui/form-field';
import { ImagePickerField } from '@/components/ui/image-picker-field';
import { Button } from '@/components/ui/button';
import { useTranslation } from 'react-i18next';
import { useThemeColor } from '@/theme/colors';


interface ProjectListItemProps {
  project: Project;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onUpdate: (id: string, updates: Partial<Project>) => void;
  onDelete: (id: string) => void;
}

export function ProjectListItem({ project, isExpanded, onToggleExpand, onUpdate, onDelete }: ProjectListItemProps) {
  const { t } = useTranslation();

  const isComplete = project.title && project.description && project.shortDescription;
  
  const aiLocales = Object.keys(project.aiReviewsByLocale || {});
  const hasAi = aiLocales.length > 0;

  const handleDelete = () => {
    Alert.alert(
      t('projects.delete_title', 'Excluir Projeto'),
      t('projects.delete_desc', `Tem certeza que deseja excluir "${project.title}"? Isso removerá o projeto e quaisquer gerações de IA associadas, liberando sua cota.`),
      [
        { text: t('common.cancel', 'Cancelar'), style: 'cancel' },
        { text: t('common.delete', 'Excluir'), style: 'destructive', onPress: () => onDelete(project.id) }
      ]
    );
  };

  if (!isExpanded) {
    return (
      <TouchableOpacity 
        onPress={onToggleExpand}
        className="border border-border rounded-xl p-4 mb-4 bg-surface hover:bg-surface-elevated transition-colors"
      >
        <View className="flex-row items-start gap-4">
          {project.image?.value && (
            <Image 
              source={{ uri: project.image.value }} 
              className="w-16 h-16 rounded-lg bg-surface-elevated"
              resizeMode="cover"
            />
          )}

          <View className="flex-1 justify-center">
            <View className="flex-row items-center gap-2 mb-1">
              <Text className="text-text font-bold text-lg" numberOfLines={1}>{project.title || 'Projeto sem nome'}</Text>
              {project.source.type === 'github' ? <Code2 size={14} color={useThemeColor('--text-secondary')} /> : null}
            </View>
            
            <Text className="text-text-secondary text-sm mb-2" numberOfLines={2}>
              {project.shortDescription || project.description || 'Sem descrição.'}
            </Text>
            
            <View className="flex-row flex-wrap gap-2 items-center">
              {/* Badges */}
              <View className="flex-row items-center gap-1 bg-surface-elevated px-2 py-1 rounded">
                {isComplete ? <CheckCircle2 size={12} color="#10b981" /> : <AlertCircle size={12} color="#f59e0b" />}
                <Text className="text-text-secondary text-xs">{isComplete ? 'Completo' : 'Incompleto'}</Text>
              </View>

              {hasAi && (
                <View className="flex-row items-center gap-1 bg-primary/10 border border-primary/20 px-2 py-1 rounded">
                  <Bot size={12} color={useThemeColor('--primary')} />
                  <Text className="text-primary text-xs">IA: {aiLocales.length} idioma(s)</Text>
                </View>
              )}

              {project.technologies.slice(0, 3).map(tech => (
                <View key={tech} className="bg-input-background px-2 py-1 rounded border border-border">
                  <Text className="text-text-secondary text-xs">{tech}</Text>
                </View>
              ))}
              {project.technologies.length > 3 && (
                <Text className="text-text-secondary text-xs">+{project.technologies.length - 3}</Text>
              )}
            </View>
          </View>

          <View className="flex-row gap-2">
            <TouchableOpacity onPress={onToggleExpand} className="p-2 bg-surface-elevated rounded-full">
              <Edit2 size={16} color={useThemeColor('--text-secondary')} />
            </TouchableOpacity>
            <TouchableOpacity onPress={handleDelete} className="p-2 bg-[#ef444420] rounded-full">
              <Trash2 size={16} color="#ef4444" />
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <View className="border border-border rounded-xl p-6 mb-6 bg-surface">
      <View className="flex-row justify-between items-center mb-6">
        <View className="flex-row items-center gap-2">
          <Text className="text-text font-bold text-xl">{project.title || 'Novo Projeto'}</Text>
          <View className="flex-row items-center gap-1 bg-surface-elevated px-2 py-1 rounded ml-2">
            <Text className="text-text-secondary text-xs">{project.source.type === 'github' ? 'GitHub' : 'Manual'}</Text>
          </View>
        </View>
        <TouchableOpacity onPress={() => onDelete(project.id)} className="p-2 bg-[#ef444420] rounded-full">
          <Trash2 color="#ef4444" size={16} />
        </TouchableOpacity>
      </View>

      <View className="flex-col md:flex-row gap-6">
        {/* Coluna 1: Infos Principais e Tecnologias */}
        <View className="flex-1 gap-4">
          <View>
            <Text className="text-text font-bold text-base mb-2">Informações Principais</Text>
            
            <FormField
              label="Nome do Projeto"
              value={project.title}
              onChangeText={(text) => onUpdate(project.id, { title: text })}
              placeholder="Ex: Portfolium"
            />

            <FormField
              label="Link (Demo ou Repositório)"
              placeholder="https://..."
              value={project.links?.demo || ""}
              onChangeText={(text) => onUpdate(project.id, { links: { ...project.links, demo: text } })}
            />

            <FormField
              label="Resumo"
              placeholder="Uma frase curta usada nos cards do portfólio."
              value={project.shortDescription}
              onChangeText={(text) => onUpdate(project.id, { shortDescription: text })}
            />

            <FormField
              variant="textarea"
              label="Descrição completa"
              placeholder="Explique o objetivo, funcionamento e principais resultados do projeto."
              value={project.description}
              onChangeText={(text) => onUpdate(project.id, { description: text })}
            />
          </View>

          <View>
            <Text className="text-text font-bold text-base mb-2">Tecnologias</Text>
            {project.technologies.length > 0 ? (
              <View className="flex-row flex-wrap gap-2 mb-2">
                {project.technologies.map((t) => (
                  <View key={t} className="flex-row items-center border border-border rounded px-3 py-1.5 bg-input-background">
                    <Text className="text-text-secondary text-xs mr-2">{t}</Text>
                    <TouchableOpacity onPress={() => onUpdate(project.id, { technologies: project.technologies.filter(tech => tech !== t) })}>
                      <Text className="text-red-400 text-xs font-bold">✕</Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            ) : (
              <Text className="text-text-secondary text-sm italic mb-2">Nenhuma tecnologia adicionada.</Text>
            )}
            <FormField
              placeholder="Adicionar tecnologia (ex: React) e pressione Enter"
              onSubmitEditing={(e) => {
                const text = e.nativeEvent.text.trim();
                if (text && !project.technologies.includes(text)) {
                  onUpdate(project.id, { technologies: [...project.technologies, text] });
                }
              }}
              blurOnSubmit={false}
            />
          </View>
        </View>

        {/* Coluna 2: Imagem */}
        <View className="w-full md:w-1/3">
          <Text className="text-text font-bold text-base mb-2">Imagem do Projeto</Text>
          <View className="max-h-64">
            <ImagePickerField
              label=""
              value={project.image?.value}
              isUrl={project.image?.type === "url"}
              cropShape="rect"
              showGuide={true}
              onChange={(value, isUrl) => {
                if (value) {
                  onUpdate(project.id, { image: { type: isUrl ? "url" : "embedded", value } });
                } else {
                  onUpdate(project.id, { image: undefined });
                }
              }}
            />
          </View>
        </View>
      </View>

      <View className="flex-row flex-wrap justify-between items-center mt-8 pt-4 border-t border-border gap-4">
        <View className="flex-row items-center gap-2 flex-shrink flex-1 min-w-[200px]">
          <CheckCircle2 size={16} color={useThemeColor('--text-secondary')} />
          <Text className="text-text-secondary flex-shrink">Alterações salvas automaticamente</Text>
        </View>
        <Button variant="outline" onPress={onToggleExpand}>
          <View className="flex-row items-center gap-2">
            <Text className="text-text">Recolher</Text>
            <ChevronUp size={16} color={useThemeColor('--text')} />
          </View>
        </Button>
      </View>
    </View>
  );
}
