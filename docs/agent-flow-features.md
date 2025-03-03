# Agent Flow Designer Feature Documentation

## Overview

This document outlines the recent enhancements made to the Agent Flow Designer in the Office page. These features improve the user experience by adding new functionality for agent management, scheduling, and interaction.

## New Features

### 1. Agent Card Enhancements

#### Open Button
- Added an "Open" button to agent cards on the canvas
- Button appears in the top-right corner of each agent card
- Clicking the button triggers a detailed view of the agent (currently shows an alert)
- Visual styling adapts to dark/light mode

```jsx
<button 
  onClick={handleOpenClick}
  className={`absolute top-2 right-2 p-1 rounded-md ${
    isDarkMode 
      ? 'bg-gray-700 hover:bg-gray-600 text-gray-300' 
      : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
  } transition-colors`}
  title="Open agent details"
>
  <ExternalLink size={14} />
</button>
```

### 2. Schedule Node

Added a new node type for scheduling tasks:

- **Features**:
  - Date picker
  - Time picker
  - Recurrence toggle
  - Real-time data updates
  - Distinct visual styling with indigo accent color

- **Implementation**:
  - Created a new `ScheduleNode` component
  - Added to the node types registry
  - Implemented data persistence through React state
  - Added to the node type dropdown in the toolbar

```jsx
const ScheduleNode = ({ data, selected }: any) => {
  const { isDarkMode } = useThemeStore();
  const [date, setDate] = useState(data.date || '');
  const [time, setTime] = useState(data.time || '');
  const [isRecurring, setIsRecurring] = useState(data.isRecurring || false);
  
  // Update node data when inputs change
  useEffect(() => {
    if (data.onDataChange) {
      data.onDataChange({ date, time, isRecurring });
    }
  }, [date, time, isRecurring, data]);
  
  // Component rendering...
};
```

### 3. Sliding Agents Panel

Replaced the static sidebar with a dynamic sliding panel:

- **Features**:
  - Animated entrance/exit using Framer Motion
  - Toggle visibility through toolbar button
  - Improved space utilization
  - Close button for easy dismissal

- **Implementation**:
  - Used `AnimatePresence` from Framer Motion for smooth transitions
  - Positioned as an absolute overlay rather than a fixed sidebar
  - Maintained all existing functionality (search, filtering, drag-and-drop)

```jsx
<AnimatePresence>
  {showAgentsSidebar && (
    <motion.div
      initial={{ x: '100%', opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: '100%', opacity: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className={`absolute top-0 right-0 h-full w-72 ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border-l p-4 overflow-y-auto z-10`}
    >
      {/* Panel content */}
    </motion.div>
  )}
</AnimatePresence>
```

### 4. Toolbar Integration

Enhanced the toolbar with context-aware functionality:

- **Features**:
  - "Add Agent" button that toggles the agents panel
  - "Schedule" button that adds a schedule node to the canvas
  - Context-aware display (only shows in Office view)

- **Implementation**:
  - Added unique IDs to toolbar buttons
  - Used event listeners to connect toolbar actions to flow functions
  - Added route-based conditional rendering

```jsx
// In Toolbar.tsx
const tools = [
  // Other tools...
  { icon: <Users size={20} />, label: 'Add Agent', id: 'add-agent-button' },
  { icon: <Calendar size={20} />, label: 'Schedule', id: 'schedule-button' },
  // Other tools...
];

// In Office.tsx
useEffect(() => {
  const addAgentButton = document.getElementById('add-agent-button');
  const scheduleButton = document.getElementById('schedule-button');
  
  if (addAgentButton) {
    addAgentButton.addEventListener('click', toggleAgentsSidebar);
  }
  
  if (scheduleButton) {
    scheduleButton.addEventListener('click', addScheduleNode);
  }
  
  // Cleanup...
}, []);
```

## Layout Changes

- Removed padding from the main content area to maximize space for the flow designer
- Made the toolbar context-aware (only appears in the Office view)
- Improved the relative positioning of elements for better overlay management

## Code Structure Changes

### New Components
- Added `ScheduleNode` component for date/time scheduling
- Enhanced `AgentNode` with open functionality

### Modified Components
- Updated `Toolbar` to include IDs and context-awareness
- Modified `Layout` to optimize space usage

### New Functions
- `toggleAgentsSidebar`: Controls the visibility of the agents panel
- `addScheduleNode`: Creates and adds a schedule node to the canvas
- `handleOpenClick`: Handles the open button click on agent cards

## Dependencies

No new dependencies were added for these features. The implementation leverages existing libraries:

- **Framer Motion**: Used for animations in the sliding panel
- **Lucide React**: Provided icons for the new buttons (Calendar, ExternalLink)
- **React Flow**: Core functionality for the flow designer
- **Zustand**: State management for the application

## Future Considerations

1. **Agent Details View**: Implement a full details panel when clicking the "Open" button
2. **Recurring Schedule Options**: Expand the schedule node with more recurrence options
3. **Toolbar Customization**: Allow users to customize which tools appear in their toolbar
4. **Persistent Layouts**: Save and restore the canvas layout between sessions