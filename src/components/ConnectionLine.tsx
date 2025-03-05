import React from 'react';
import { motion } from 'framer-motion';

interface Point {
  x: number;
  y: number;
}

interface ConnectionLineProps {
  start: Point;
  end: Point;
  style?: {
    color?: string;
    width?: number;
    dashArray?: string;
  };
  label?: string;
  isActive?: boolean;
  onClick?: () => void;
}

export const ConnectionLine: React.FC<ConnectionLineProps> = ({
  start,
  end,
  style = {},
  label,
  isActive = false,
  onClick
}) => {
  const { color = '#6366f1', width = 2, dashArray = '' } = style;
  
  // Calculate control points for the curve
  const midX = (start.x + end.x) / 2;
  const midY = (start.y + end.y) / 2;
  const controlPoint1 = { x: midX, y: start.y };
  const controlPoint2 = { x: midX, y: end.y };

  // Create the path data for a curved line
  const path = `
    M ${start.x},${start.y}
    C ${controlPoint1.x},${controlPoint1.y}
    ${controlPoint2.x},${controlPoint2.y}
    ${end.x},${end.y}
  `;

  return (
    <motion.g
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClick}
      className="cursor-pointer"
    >
      <path
        d={path}
        fill="none"
        stroke={color}
        strokeWidth={isActive ? width + 2 : width}
        strokeDasharray={dashArray}
        className="transition-all duration-200"
      />
      
      {label && (
        <text
          x={midX}
          y={midY - 10}
          textAnchor="middle"
          fill={color}
          fontSize="12"
          className="pointer-events-none select-none"
        >
          {label}
        </text>
      )}
      
      {/* Arrow head */}
      <marker
        id={`arrowhead-${color.replace('#', '')}`}
        markerWidth="10"
        markerHeight="7"
        refX="9"
        refY="3.5"
        orient="auto"
      >
        <polygon
          points="0 0, 10 3.5, 0 7"
          fill={color}
        />
      </marker>
    </motion.g>
  );
};