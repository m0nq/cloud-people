import React, { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, List } from 'lucide-react';
import { 
  DndContext, 
  closestCenter, 
  KeyboardSensor, 
  PointerSensor, 
  useSensor, 
  useSensors,
  DragEndEvent
} from '@dnd-kit/core';
import { 
  SortableContext, 
  sortableKeyboardCoordinates, 
  verticalListSortingStrategy 
} from '@dnd-kit/sortable';
import { useProjectsStore } from '../store/projects';
import { useCategoriesStore, Category } from '../store/categories';
import { useThemeStore } from '../store/theme';
import { Button } from '../components/ui/Button';
import { useNavigate } from 'react-router-dom';
import { ProjectCard } from '../components/project/ProjectCard';
import { DraggableCategory } from '../components/ui/DraggableCategory';

export const Home: React.FC = () => {
  const { projects, loading, fetchProjects } = useProjectsStore();
  const { categories, reorderCategories } = useCategoriesStore();
  const { isDarkMode } = useThemeStore();
  const navigate = useNavigate();
  const scrollContainerRefs = useRef<Record<string, HTMLDivElement | null>>({});
  
  // Set up DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );
  
  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);
  
  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };
  
  const scrollLeft = (categoryId: string) => {
    if (scrollContainerRefs.current[categoryId]) {
      scrollContainerRefs.current[categoryId]?.scrollBy({ left: -300, behavior: 'smooth' });
    }
  };
  
  const scrollRight = (categoryId: string) => {
    if (scrollContainerRefs.current[categoryId]) {
      scrollContainerRefs.current[categoryId]?.scrollBy({ left: 300, behavior: 'smooth' });
    }
  };
  
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (over && active.id !== over.id) {
      reorderCategories(active.id as string, over.id as string);
    }
  };
  
  // Get projects for each category
  const getCategoryProjects = (category: Category) => {
    switch (category.type) {
      case 'recent':
        return projects.slice(0, 3);
      case 'top':
        return [...projects].sort((a, b) => b.revenue - a.revenue).slice(0, 5);
      case 'templates':
        // For templates, let's use projects 6-10 as an example
        return projects.filter(project => ['6', '7', '8', '9', '10'].includes(project.id));
      case 'all':
      default:
        return projects;
    }
  };
  
  return (
    <div className="space-y-12 pb-12 relative">
      {/* Fixed action buttons at the top right - now in a row */}
      <div className="fixed top-20 right-6 z-10 flex flex-row space-x-4">
        <Button
          variant="primary"
          size="lg"
          onClick={() => navigate('/office')}
          rightIcon={<ArrowRight size={20} />}
          className="shadow-lg"
        >
          Start New Project
        </Button>
        <Button
          variant="secondary"
          size="lg"
          leftIcon={<List size={20} />}
          onClick={() => {
            const allProjectsElement = document.getElementById('all-projects-section');
            if (allProjectsElement) {
              allProjectsElement.scrollIntoView({ behavior: 'smooth' });
            }
          }}
          className="shadow-lg"
        >
          All Projects
        </Button>
      </div>
      
      <div className="space-y-12">
        <div className="space-y-4">
          <div className="py-2">
            <h1 className={`text-2xl font-bold ${isDarkMode ? 'text-gray-100' : 'text-gray-900'}`}>Dashboard</h1>
          </div>
      
          {loading ? (
            <div className="flex justify-center py-12">
              <svg className={`animate-spin h-8 w-8 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            </div>
          ) : (
            <motion.div
              variants={container}
              initial="hidden"
              animate="show"
              className="space-y-12"
            >
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={categories.map(cat => cat.id)}
                  strategy={verticalListSortingStrategy}
                >
                  {categories.map((category) => {
                    const categoryProjects = getCategoryProjects(category);
                    
                    return (
                      <div key={category.id} className="space-y-4">
                        <DraggableCategory
                          id={category.id}
                          title={category.title}
                          onScrollLeft={() => scrollLeft(category.id)}
                          onScrollRight={() => scrollRight(category.id)}
                        />
                        
                        <div 
                          ref={(el) => scrollContainerRefs.current[category.id] = el}
                          className="flex overflow-x-auto pb-4 space-x-4 scrollbar-hide"
                          style={{ 
                            scrollbarWidth: 'none', 
                            msOverflowStyle: 'none',
                            WebkitOverflowScrolling: 'touch'
                          }}
                        >
                          {categoryProjects.map((project) => (
                            <div key={project.id} className="flex-shrink-0 w-[320px]">
                              <ProjectCard project={project} />
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </SortableContext>
              </DndContext>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
};