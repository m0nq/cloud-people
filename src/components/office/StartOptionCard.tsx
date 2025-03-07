import React from 'react';
import { motion } from 'framer-motion';
import { useThemeStore } from '../../store/theme';

interface StartOptionCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  onClick: () => void;
  bgColorClass: string;
  iconColorClass: string;
}

export const StartOptionCard: React.FC<StartOptionCardProps> = ({
  title,
  description,
  icon,
  onClick,
  bgColorClass,
  iconColorClass
}) => {
  const { isDarkMode } = useThemeStore();

  return (
    <motion.div
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-xl overflow-hidden cursor-pointer transition-all duration-300 hover:shadow-2xl`}
      onClick={onClick}
    >
      <div className={`h-48 flex items-center justify-center ${bgColorClass}`}>
        <div className={iconColorClass}>
          {icon}
        </div>
      </div>
      <div className="p-6">
        <h3 className={`text-xl font-bold mb-2 ${isDarkMode ? 'text-gray-100' : 'text-gray-800'}`}>
          {title}
        </h3>
        <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
          {description}
        </p>
      </div>
    </motion.div>
  );
};