import React from 'react';
import { motion } from 'framer-motion';
import { X, Type, Edit2, Trash2, EyeOff, Eye } from 'lucide-react';
import { useThemeStore } from '../../store/theme';
import { Button } from './Button';

interface ConnectionControlsProps {
  selectedEdge: any;
  onStyleChange: (style: any) => void;
  onLabelChange: (label: string) => void;
  onDelete: () => void;
  onHideConnections: () => void;
  areConnectionsHidden: boolean;
  onClose: () => void;
}

export const ConnectionControls: React.FC<ConnectionControlsProps> = ({
  selectedEdge,
  onStyleChange,
  onLabelChange,
  onDelete,
  onHideConnections,
  areConnectionsHidden,
  onClose,
}) => {
  const { isDarkMode } = useThemeStore();
  const [label, setLabel] = React.useState(selectedEdge?.data?.label || '');
  const [lineStyle, setLineStyle] = React.useState({
    strokeWidth: selectedEdge?.style?.strokeWidth || 2,
    strokeDasharray: selectedEdge?.style?.strokeDasharray || 'none',
    stroke: selectedEdge?.style?.stroke || '#6b7280',
  });

  const handleStyleChange = (updates: Partial<typeof lineStyle>) => {
    const newStyle = { ...lineStyle, ...updates };
    setLineStyle(newStyle);
    onStyleChange(newStyle);
  };

  const handleLabelChange = (newLabel: string) => {
    setLabel(newLabel);
    onLabelChange(newLabel);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className={`fixed bottom-24 left-1/2 transform -translate-x-1/2 p-4 rounded-lg shadow-lg ${
        isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
      } border z-50`}
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className={`text-sm font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-900'}`}>
          Connection Controls
        </h3>
        <button
          onClick={onClose}
          className={`p-1 rounded-md ${
            isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
          } transition-colors`}
        >
          <X size={16} />
        </button>
      </div>

      <div className="space-y-4">
        {/* Label input */}
        <div className="flex items-center space-x-2">
          <Type size={16} className={isDarkMode ? 'text-gray-400' : 'text-gray-500'} />
          <input
            type="text"
            value={label}
            onChange={(e) => handleLabelChange(e.target.value)}
            placeholder="Connection label"
            className={`flex-1 px-2 py-1 text-sm rounded-md ${
              isDarkMode
                ? 'bg-gray-700 border-gray-600 text-gray-200'
                : 'bg-white border-gray-300 text-gray-900'
            } border focus:outline-none focus:ring-2 focus:ring-blue-500`}
          />
        </div>

        {/* Line style controls */}
        <div className="grid grid-cols-3 gap-2">
          {/* Line thickness */}
          <select
            value={lineStyle.strokeWidth}
            onChange={(e) => handleStyleChange({ strokeWidth: Number(e.target.value) })}
            className={`px-2 py-1 text-sm rounded-md ${
              isDarkMode
                ? 'bg-gray-700 border-gray-600 text-gray-200'
                : 'bg-white border-gray-300 text-gray-900'
            } border focus:outline-none focus:ring-2 focus:ring-blue-500`}
          >
            <option value={1}>Thin</option>
            <option value={2}>Medium</option>
            <option value={3}>Thick</option>
          </select>

          {/* Line style */}
          <select
            value={lineStyle.strokeDasharray}
            onChange={(e) => handleStyleChange({ strokeDasharray: e.target.value })}
            className={`px-2 py-1 text-sm rounded-md ${
              isDarkMode
                ? 'bg-gray-700 border-gray-600 text-gray-200'
                : 'bg-white border-gray-300 text-gray-900'
            } border focus:outline-none focus:ring-2 focus:ring-blue-500`}
          >
            <option value="none">Solid</option>
            <option value="5,5">Dashed</option>
            <option value="2,2">Dotted</option>
          </select>

          {/* Line color */}
          <input
            type="color"
            value={lineStyle.stroke}
            onChange={(e) => handleStyleChange({ stroke: e.target.value })}
            className="w-full h-8 rounded-md cursor-pointer"
          />
        </div>

        {/* Action buttons */}
        <div className="flex justify-between">
          <Button
            variant="outline"
            size="sm"
            onClick={onHideConnections}
            leftIcon={areConnectionsHidden ? <Eye size={16} /> : <EyeOff size={16} />}
          >
            {areConnectionsHidden ? 'Show' : 'Hide'} Connections
          </Button>
          <Button
            variant="danger"
            size="sm"
            onClick={onDelete}
            leftIcon={<Trash2 size={16} />}
          >
            Delete
          </Button>
        </div>
      </div>
    </motion.div>
  );
};