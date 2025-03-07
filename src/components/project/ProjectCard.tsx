import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useThemeStore } from '../../store/theme';
import { Project } from '../../types';
import { Card, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';

interface ProjectCardProps {
  project: Project;
}

export const ProjectCard: React.FC<ProjectCardProps> = ({ project }) => {
  const navigate = useNavigate();
  const { isDarkMode } = useThemeStore();
  
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };
  
  const handleClone = (e: React.MouseEvent) => {
    e.stopPropagation();
    // In a real app, this would clone the project
    console.log('Cloning project:', project.id);
  };
  
  const handleDetails = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigate('/office');
  };
  
  return (
    <motion.div variants={{
      hidden: { opacity: 0, y: 20 },
      show: { opacity: 1, y: 0 }
    }}>
      <Card 
        interactive 
        onClick={() => navigate('/office')} 
        className="h-full hover:shadow-md transition-shadow duration-300 overflow-hidden"
      >
        <div className="flex flex-col h-full">
          <div className="relative h-36 overflow-hidden">
            <img
              src={project.thumbnail}
              alt={project.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent"></div>
          </div>
          
          <CardContent className="p-3">
            <div className="flex items-center justify-between mb-1">
              <h3 className={`text-base font-semibold ${isDarkMode ? 'text-gray-100' : 'text-gray-900'} truncate`}>{project.title}</h3>
            </div>
            
            <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'} text-xs line-clamp-2 mb-2 h-8`}>{project.description}</p>
            
            <div className={`flex justify-between items-center mt-auto pt-2 border-t ${isDarkMode ? 'border-gray-700' : 'border-gray-100'}`}>
              <div className="flex items-center text-green-600 text-sm">
                <TrendingUp size={14} className={`mr-1 ${isDarkMode ? 'text-green-400' : 'text-green-600'}`} />
                <span className={`font-medium ${isDarkMode ? 'text-green-400' : 'text-green-600'}`}>{formatCurrency(project.revenue)}</span>
              </div>
              <div className="flex space-x-2">
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleClone}
                  className="py-1 px-2 text-xs"
                >
                  Clone
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDetails}
                  className="py-1 px-2 text-xs"
                >
                  Details
                </Button>
              </div>
            </div>
          </CardContent>
        </div>
      </Card>
    </motion.div>
  );
};