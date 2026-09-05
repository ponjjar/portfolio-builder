import React, { useState, useMemo } from 'react';
import { View, Text, TouchableOpacity, TextInput } from 'react-native';
import { Modal } from '@/components/ui/modal';
import { FormField } from '@/components/ui/form-field';
import { Button } from '@/components/ui/button';
import { Check, Plus, X } from 'lucide-react-native';
import { usePortfolioStore } from '@/store';
import { useThemeColor } from '@/theme/colors';


interface AddSkillModalProps {
  visible: boolean;
  onClose: () => void;
  onAdd: (name: string, category: string) => void;
  existingSkills: string[];
}

const DEFAULT_CATEGORIES = [
  'Frontend',
  'Backend',
  'Mobile',
  'Database',
  'Cloud & Delivery',
  'Testing',
  'AI',
  'Tools',
  'Other'
];

export function AddSkillModal({ visible, onClose, onAdd, existingSkills }: AddSkillModalProps) {
  const customCategories = usePortfolioStore(s => s.session.customSkillCategories);
  const addCustomSkillCategory = usePortfolioStore(s => s.addCustomSkillCategory);

  const allCategories = useMemo(() => {
    const list = [...DEFAULT_CATEGORIES];
    for (const customCat of customCategories) {
      if (!list.some(c => c.toLowerCase() === customCat.toLowerCase())) {
        list.push(customCat);
      }
    }
    return list;
  }, [customCategories]);

  const [name, setName] = useState('');
  const [category, setCategory] = useState(allCategories[0]);
  const [error, setError] = useState<string | null>(null);

  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');

  const handleAdd = () => {
    const trimmedName = name.trim();
    if (!trimmedName) {
      setError('Informe o nome da tecnologia.');
      return;
    }
    
    // Check for duplicates case-insensitive
    const isDuplicate = existingSkills.some(s => s.toLowerCase() === trimmedName.toLowerCase());
    if (isDuplicate) {
      setError('Esta tecnologia já existe na lista.');
      return;
    }

    onAdd(trimmedName, category);
    setName('');
    setCategory(allCategories[0]);
    setError(null);
    setIsAddingCategory(false);
    onClose();
  };

  const handleClose = () => {
    setName('');
    setCategory(allCategories[0]);
    setError(null);
    setIsAddingCategory(false);
    onClose();
  };

  const handleConfirmNewCategory = () => {
    const trimmed = newCategoryName.trim();
    if (trimmed) {
      addCustomSkillCategory(trimmed);
      
      // Look up exactly how it was saved (could be case variation)
      const exactMatch = [...DEFAULT_CATEGORIES, ...customCategories, trimmed].find(
        c => c.toLowerCase() === trimmed.toLowerCase()
      );
      
      setCategory(exactMatch || trimmed);
    }
    setIsAddingCategory(false);
    setNewCategoryName('');
  };

  return (
    <Modal
      visible={visible}
      onClose={handleClose}
      title="Adicionar tecnologia"
      size="md"
      footer={
        <>
          <Button variant="ghost" className="flex-1 mr-2" onPress={handleClose}>
            <Text className="text-text font-bold">Cancelar</Text>
          </Button>
          <Button variant="default" className="flex-1 ml-2" onPress={handleAdd}>
            <Text className="text-primary-foreground font-bold">Adicionar</Text>
          </Button>
        </>
      }
    >
      <View className="py-2">
        <FormField
          label="Nome da Tecnologia"
          placeholder="ex: React, Python, Docker..."
          value={name}
          onChangeText={(text) => {
            setName(text);
            setError(null);
          }}
          onSubmitEditing={handleAdd}
          error={error || undefined}
        />
        

        <Text className="text-[10px] font-bold text-text-secondary tracking-widest uppercase mb-2 mt-2">
          Categoria
        </Text>
        
        <View className="flex-row flex-wrap gap-2 items-center">
          {allCategories.map(cat => (
            <TouchableOpacity
              key={cat}
              onPress={() => {
                setCategory(cat);
                setIsAddingCategory(false);
              }}
              className={`flex-row items-center flex-nowrap px-4 py-2 rounded-full border ${
                category === cat 
                  ? 'bg-primary border-primary' 
                  : 'bg-transparent border-border'
              }`}
            >
              <Text numberOfLines={1} className={`whitespace-nowrap ${category === cat ? 'text-primary-foreground font-bold' : 'text-text-secondary'} text-xs mr-1`}>
                {cat}
              </Text>
              {category === cat && <Check color={useThemeColor('--primary-foreground')} size={12} />}
            </TouchableOpacity>
          ))}

          {isAddingCategory ? (
            <View className="flex-row items-center bg-surface-elevated rounded-full border border-primary pl-4 pr-1 py-1">
              <TextInput
                value={newCategoryName}
                onChangeText={setNewCategoryName}
                placeholder="Nome..."
                placeholderTextColor={useThemeColor('--text-muted')}
                className="text-text text-xs mr-2 py-1 outline-none"
                autoFocus
                onSubmitEditing={handleConfirmNewCategory}
                style={{ minWidth: 80 }}
              />
              <TouchableOpacity onPress={handleConfirmNewCategory} className="p-1 bg-primary rounded-full">
                <Check color={useThemeColor('--primary-foreground')} size={12} />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setIsAddingCategory(false)} className="p-1 ml-1">
                <X color={useThemeColor('--text-secondary')} size={12} />
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              onPress={() => {
                setIsAddingCategory(true);
                setNewCategoryName('');
              }}
              className="flex-row items-center flex-nowrap px-4 py-2 rounded-full border border-dashed border-border hover:bg-surface-elevated transition-colors"
            >
              <Plus color={useThemeColor('--text-secondary')} size={12} className="mr-1.5" />
              <Text className="text-text-secondary font-bold text-xs">Nova categoria</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </Modal>
  );
}
