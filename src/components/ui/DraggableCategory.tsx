import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from './Button';
import { useThemeStore } from '../../store/theme';

interface DraggableCategoryProps {
  id: string;
  title: string;
  onScrollLeft: () => void;
  onScrollRight: () => void;
}

export const DraggableCategory: React.FC<DraggableCategoryProps> = ({
  id,
  title,
  onScrollLeft,
  onScrollRight,
}) => {
  const { isDarkMode } = useThemeStore();
  
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
    opacity: isDragging ? 0.8 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex justify-between items-center py-2 ${
        isDragging 
          ? isDarkMode ? 'bg-gray-700 rounded-lg' : 'bg-gray-100 rounded-lg' 
          : ''
      }`}
      id={id === 'all' ? 'all-projects-section' : undefined}
    >
      <div className="flex items-center">
        <div
          {...attributes}
          {...listeners}
          className={`cursor-grab mr-2 p-1 rounded-md ${
            isDarkMode ? 'hover:bg-gray-700 active:cursor-grabbing' : 'hover:bg-gray-100 active:cursor-grabbing'
          }`}
          title="Drag to reorder"
        >
          <GripVertical size={18} className={isDarkMode ? 'text-gray-400' : 'text-gray-400'} />
        </div>
        <h2 className={`text-xl font-semibold ${isDarkMode ? 'text-gray-100' : 'text-gray-800'}`}>{title}</h2>
      </div>
      <div className="flex space-x-2">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={onScrollLeft}
          leftIcon={<ChevronLeft size={16} />}
        >
          Prev
        </Button>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={onScrollRight}
          rightIcon={<ChevronRight size={16} />}
        >
          Next
        </Button>
      </div>
    </div>
  );
};