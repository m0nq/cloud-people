import React from 'react';
import { MessageSquare, Copy, FileCode } from 'lucide-react';
import { StartOptionCard } from './StartOptionCard';
import { useThemeStore } from '../../store/theme';

interface StartOptionsProps {
  onPromptStart: () => void;
  onTemplateStart: () => void;
  onScratchStart: () => void;
}

export const StartOptions: React.FC<StartOptionsProps> = ({
  onPromptStart,
  onTemplateStart,
  onScratchStart
}) => {
  const { isDarkMode } = useThemeStore();

  const options = [
    {
      title: 'Prompt',
      description: 'Describe what you want to build and let AI create a flow for you.',
      icon: <MessageSquare size={80} />,
      onClick: onPromptStart,
      bgColorClass: isDarkMode ? 'bg-blue-900/30' : 'bg-blue-50',
      iconColorClass: isDarkMode ? 'text-blue-400' : 'text-blue-500'
    },
    {
      title: 'From Template',
      description: 'Start with a pre-built template and customize it to your needs.',
      icon: <Copy size={80} />,
      onClick: onTemplateStart,
      bgColorClass: isDarkMode ? 'bg-purple-900/30' : 'bg-purple-50',
      iconColorClass: isDarkMode ? 'text-purple-400' : 'text-purple-500'
    },
    {
      title: 'From Scratch',
      description: 'Build your flow from scratch with complete creative freedom.',
      icon: <FileCode size={80} />,
      onClick: onScratchStart,
      bgColorClass: isDarkMode ? 'bg-green-900/30' : 'bg-green-50',
      iconColorClass: isDarkMode ? 'text-green-400' : 'text-green-500'
    }
  ];

  return (
    <div className="absolute inset-0 flex items-center justify-center bg-opacity-50 bg-gray-900 z-10">
      <div className="grid grid-cols-3 gap-8 p-8 max-w-5xl">
        {options.map((option, index) => (
          <StartOptionCard
            key={index}
            title={option.title}
            description={option.description}
            icon={option.icon}
            onClick={option.onClick}
            bgColorClass={option.bgColorClass}
            iconColorClass={option.iconColorClass}
          />
        ))}
      </div>
    </div>
  );
};