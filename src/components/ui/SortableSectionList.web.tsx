import React from 'react';
import { View, Text } from 'react-native';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { User, Briefcase, Code, GripVertical, Edit2 } from 'lucide-react-native';
import { PortfolioSection } from '@/domain/portfolio/types';
import { TouchableOpacity } from 'react-native';
import { useThemeColor } from '@/theme/colors';


interface SortableSectionListProps {
  sections: PortfolioSection[];
  onReorder: (sections: PortfolioSection[]) => void;
  onEdit: (sectionId: string) => void;
}

const SECTION_META: Record<string, { label: string; icon: any }> = {
  hero: { label: 'Perfil', icon: User },
  projects: { label: 'Projetos', icon: Briefcase },
  skills: { label: 'Tecnologias', icon: Code },
  experience: { label: 'Experiência', icon: Briefcase },
  education: { label: 'Educação', icon: Briefcase },
  contact: { label: 'Contato', icon: User },
};

function SortableItem({ id, section, onEdit }: { id: string; section: PortfolioSection; onEdit: () => void }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : 1,
    position: 'relative' as const,
  };

  const meta = SECTION_META[section.id] || { label: section.id, icon: User };
  const Icon = meta.icon;

  return (
    <div style={style}>
      <View
        className={`flex-row items-center bg-surface p-3 rounded mb-2 border ${
          isDragging ? 'border-primary shadow-lg' : 'border-border shadow-sm'
        }`}
      >
        <div ref={setNodeRef} {...attributes} {...listeners} style={{ cursor: 'grab', display: 'flex', alignItems: 'center' }}>
          <GripVertical color={useThemeColor('--text-muted')} size={16} className="mr-3" />
        </div>
        <Icon color={useThemeColor('--text')} size={16} className="mr-3" />
        <Text className="text-text flex-1">{meta.label}</Text>
        <TouchableOpacity onPress={onEdit} className="p-2 hover:bg-surface-elevated rounded">
          <Edit2 color={useThemeColor('--text-secondary')} size={14} />
        </TouchableOpacity>
      </View>
    </div>
  );
}

export function SortableSectionList({ sections, onReorder, onEdit }: SortableSectionListProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = sections.findIndex((s) => s.id === active.id);
      const newIndex = sections.findIndex((s) => s.id === over.id);

      const newItems = arrayMove(sections, oldIndex, newIndex);
      // Update order property
      const reordered = newItems.map((item, index) => ({
        ...item,
        order: index,
      }));
      onReorder(reordered);
    }
  };

  const items = [...sections].sort((a, b) => a.order - b.order);

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={items.map((s) => s.id)} strategy={verticalListSortingStrategy}>
        <div style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
          {items.map((section) => (
            <SortableItem key={section.id} id={section.id} section={section} onEdit={() => onEdit(section.id)} />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}
