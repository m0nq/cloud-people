# Draggable Dashboard Implementation Plan

## Current State Analysis

### Home.tsx (Source Implementation)

- Uses `@dnd-kit` for drag-and-drop functionality
- Implements draggable categories with grip handles
- Uses `useSortable` hook from `@dnd-kit/sortable` for drag functionality
- Has proper styling for draggable elements and hover states
- Uses `framer-motion` for animations

### Dashboard Page (Target Implementation)

- Already has basic structure with categories and cards
- Has `DndContext` and `SortableContext` set up
- Missing proper draggable implementation in `DraggableCategory` component
- Missing styles for draggable elements
- Missing grip handle UI element

## Implementation Plan

### 1. Update DraggableCategory Component

The current `DraggableCategory` component needs to be updated to use the `useSortable` hook from `@dnd-kit/sortable` and implement the drag handle with proper styling.

**Key Changes:**

- Add `useSortable` hook
- Implement drag handle with grip dots icon
- Add proper styling for dragging states
- Ensure proper accessibility attributes

### 2. Update CSS Styles

Add necessary styles to the `dashboard.styles.css` file following the nested CSS structure and Tailwind conventions.

**Key Styles to Add:**

- Draggable category container styles
- Drag handle styles
- Dragging state styles
- Hover effects
- Transition animations

### 3. Update ProjectCard Component (if needed)

Ensure the ProjectCard component has proper styling and layout to match the design in Home.tsx.

### 4. Fix Scrolling Implementation

Ensure the horizontal scrolling for projects within categories works correctly with proper scroll buttons.

## Technical Requirements

### Dependencies

- Ensure all required dependencies are properly imported:
  - `@dnd-kit/core`
  - `@dnd-kit/sortable`
  - `@dnd-kit/utilities`
  - `framer-motion`

### Component Structure

- Follow the established component structure and naming conventions
- Use proper TypeScript typing
- Follow the global rules for imports and code organization

### CSS Implementation

- Use nested CSS with Tailwind's `@apply` directive
- Follow mobile-first responsive design principles
- Maintain consistent class naming conventions

## Implementation Steps

  1. Update the `DraggableCategory` component to include the drag handle and proper sortable functionality
  2. Add necessary styles to `dashboard.styles.css`
  3. Update the Dashboard page to properly implement the draggable functionality
  4. Test the dragging functionality and fix any issues
