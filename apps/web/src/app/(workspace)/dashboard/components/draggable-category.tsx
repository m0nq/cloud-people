'use client';

import { motion } from 'framer-motion';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { RiDraggable } from 'react-icons/ri';
import { FaChevronLeft } from 'react-icons/fa';
import { FaChevronRight } from 'react-icons/fa';

import '../dashboard.styles.css';
import { ProjectCard } from '@components/cards/project-card/project-card';
import type { Project } from '@stores/projects-store';

interface DraggableCategoryProps {
    id: number;
    title: string;
    onScrollLeft: (id: number) => void;
    onScrollRight: (id: number) => void;
    scrollContainerRef: (el: HTMLDivElement | null) => void;
    projects: Project[];
}

/**
 * A draggable category component that displays a list of projects
 * with horizontal scrolling controls.
 */
export const DraggableCategory = ({
    id,
    title,
    onScrollLeft,
    onScrollRight,
    scrollContainerRef,
    projects
}: DraggableCategoryProps) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 10 : 1,
        opacity: isDragging ? 0.8 : 1
    };

    return (
        <motion.div
            ref={setNodeRef}
            style={style}
            layout
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
            className={`draggable-category-container ${isDragging ? 'is-dragging' : ''}`}>
            <div className="category-header">
                <div className="title-container">
                    <div {...attributes}
                        {...listeners}
                        className="drag-handle"
                        title="Drag to reorder">
                        <RiDraggable size={18} />
                    </div>
                    <h2 className="category-title">{title}</h2>
                </div>
                <div className="scroll-controls">
                    <button onClick={() => onScrollLeft(id)} aria-label="Scroll Left"
                        className="scroll-left-button">
                        <FaChevronLeft size={12} />
                        Prev
                    </button>
                    <button onClick={() => onScrollRight(id)} aria-label="Scroll Right"
                        className="scroll-right-button">
                        Next
                        <FaChevronRight size={12} />
                    </button>
                </div>
            </div>
            <div ref={scrollContainerRef}
                className="projects-container"
                role="list"
                aria-label={`${title} Projects`}>
                {projects.map(project => (
                    <div key={project.id} className="dashboard-project-card-wrapper">
                        <ProjectCard key={project.id} project={project} />
                    </div>
                ))}
            </div>
        </motion.div>
    );
};
