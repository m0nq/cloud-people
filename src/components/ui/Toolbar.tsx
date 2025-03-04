import React from 'react';
import { motion } from 'framer-motion';
import { Send, Hand, UserPlus, Calendar, Zap, CheckCircle, Briefcase, Edit, Search, Users } from 'lucide-react';
import { useThemeStore } from '../../store/theme';
import { useLocation } from 'react-router-dom';

interface ToolbarProps {
  className?: string;
}

export const Toolbar: React.FC<ToolbarProps> = ({ className }) => {
  const { isDarkMode } = useThemeStore();
  const location = useLocation();
  
  // Only show toolbar in the office view
  if (location.pathname !== '/office') {
    return null;
  }
  
  const tools = [
    { icon: <Send size={20} />, label: 'Send' },
    { icon: <Hand size={20} />, label: 'Hand' },
    { icon: <Users size={20} />, label: 'Add Agent', id: 'add-agent-button' },
    { icon: <Calendar size={20} />, label: 'Schedule', id: 'schedule-button' },
    { icon: <Zap size={20} />, label: 'Actions' },
    { icon: <CheckCircle size={20} />, label: 'Tasks' },
    { icon: <Briefcase size={20} />, label: 'Projects' },
    { icon: <Edit size={20} />, label: 'Edit' },
    { icon: <Search size={20} />, label: 'Search' }
  ];
  
  return (
    <motion.div 
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className={`fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50 ${className}`}
    >
      <div className={`flex items-center rounded-full ${isDarkMode ? 'bg-gray-900' : 'bg-gray-900'} shadow-lg border ${isDarkMode ? 'border-gray-700' : 'border-gray-700'} overflow-hidden`}>
        {tools.map((tool, index) => (
          <React.Fragment key={index}>
            <button
              id={tool.id}
              className={`p-4 text-gray-300 hover:text-white transition-colors duration-200 relative group`}
            >
              {tool.icon}
              <span className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 text-xs font-medium text-white bg-gray-800 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap">
                {tool.label}
              </span>
            </button>
            {index < tools.length - 1 && (
              <div className={`h-6 w-px ${isDarkMode ? 'bg-gray-700' : 'bg-gray-700'}`}></div>
            )}
          </React.Fragment>
        ))}
      </div>
    </motion.div>
  );
};