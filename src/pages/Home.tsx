import React, { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { 
  ArrowRight, 
  List, 
  Book, 
  Pause, 
  Settings2, 
  TrendingUp, 
  Users, 
  Briefcase, 
  Clock, 
  ChevronRight, 
  MoreVertical 
} from 'lucide-react';
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
import { Card } from '../components/ui/Card';

const Home: React.FC = () => {
  const { projects, loading, fetchProjects } = useProjectsStore();
  const { categories, reorderCategories } = useCategoriesStore();
  const { isDarkMode } = useThemeStore();
  const navigate = useNavigate();
  const scrollContainerRefs = useRef<Record<string, HTMLDivElement | null>>({});
  
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
  
  const getCategoryProjects = (category: Category) => {
    switch (category.type) {
      case 'recent':
        return projects.slice(0, 3);
      case 'top':
        return [...projects].sort((a, b) => b.revenue - a.revenue).slice(0, 5);
      case 'templates':
        return projects.filter(project => ['6', '7', '8', '9', '10'].includes(project.id));
      case 'all':
      default:
        return projects;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };
  
  return (
    <div className="space-y-12 pb-12 relative">
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
        <div className="space-y-6">
          <div className="py-2">
            <h1 className={`text-2xl font-bold ${isDarkMode ? 'text-gray-100' : 'text-gray-900'}`}>Dashboard</h1>
          </div>

          <Card className={`max-w-3xl ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center space-x-2">
                <img 
                  src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80"
                  alt="Company Logo"
                  className="w-6 h-6 rounded"
                />
                <span className={`text-sm font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                  Cool Coffee Mugs. llc
                </span>
              </div>
              <div className="flex items-center space-x-4">
                <button className={`p-2 rounded-lg ${isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}>
                  <Book size={20} className={isDarkMode ? 'text-gray-400' : 'text-gray-600'} />
                </button>
                <button className={`p-2 rounded-lg ${isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}>
                  <Pause size={20} className={isDarkMode ? 'text-gray-400' : 'text-gray-600'} />
                </button>
                <button className={`p-2 rounded-lg ${isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}>
                  <Settings2 size={20} className={isDarkMode ? 'text-gray-400' : 'text-gray-600'} />
                </button>
                <Button variant="primary" size="sm">
                  Open
                </Button>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-6">
              <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-10 h-10 rounded-full overflow-hidden">
                    <img 
                      src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80"
                      alt="Manager"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <h2 className={`text-lg font-semibold ${isDarkMode ? 'text-gray-100' : 'text-gray-900'}`}>
                    Manager Mike
                  </h2>
                </div>
                <div className={`p-3 rounded-lg ${isDarkMode ? 'bg-gray-600/50' : 'bg-white'} mb-4`}>
                  <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    Current Task:
                  </div>
                  <div className={`${isDarkMode ? 'text-gray-300' : 'text-gray-900'}`}>
                    Name of task
                  </div>
                </div>
                <div className="flex space-x-2">
                  <button className={`flex-1 py-2 px-4 rounded-md ${isDarkMode ? 'bg-gray-600/50 text-gray-300 hover:bg-gray-600' : 'bg-white text-gray-700 hover:bg-gray-100'} transition-colors`}>
                    Watch
                  </button>
                  <button className="flex-1 py-2 px-4 rounded-md bg-emerald-400 text-white hover:bg-emerald-500 transition-colors">
                    Meeting
                  </button>
                </div>
              </div>

              <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
                <div className="flex items-center justify-between mb-4">
                  <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    Net Profit
                  </div>
                  <button className={`p-1 rounded-lg ${isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}>
                    <MoreVertical size={16} className={isDarkMode ? 'text-gray-400' : 'text-gray-600'} />
                  </button>
                </div>
                <div className="p-4 rounded-lg bg-indigo-600 mb-4">
                  <div className="flex items-center justify-between">
                    <div className="text-2xl font-bold text-white">$25,215</div>
                    <div className="text-sm text-indigo-200">All Time</div>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Briefcase size={16} className={isDarkMode ? 'text-gray-400' : 'text-gray-600'} />
                      <span className={isDarkMode ? 'text-gray-300' : 'text-gray-900'}>Business Expenses</span>
                    </div>
                    <div className="text-red-500">-$5,154.50</div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Users size={16} className={isDarkMode ? 'text-gray-400' : 'text-gray-600'} />
                      <span className={isDarkMode ? 'text-gray-300' : 'text-gray-900'}>Taxes</span>
                    </div>
                    <div className="text-red-500">-$1,140.50</div>
                  </div>
                </div>
              </div>
            </div>
          </Card>
      
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

export default Home;

export { Home };