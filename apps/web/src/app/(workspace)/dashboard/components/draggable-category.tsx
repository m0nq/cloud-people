'use client';

import { motion } from 'framer-motion';
import { FiMoreVertical } from 'react-icons/fi';

import { Button } from '@components/utils/button/button';
import { ProjectCard } from '@components/cards/project-card/project-card';
import type { Project } from '@stores/projects-store';
import type { Category } from '@stores/categories-store';

interface DraggableCategoryProps {
    category: Category;
    onScrollLeft: (id: string) => void;
    onScrollRight: (id: string) => void;
    scrollContainerRef: (el: HTMLDivElement | null) => void;
    projects: Project[];
}

/**
 * A draggable category component that displays a list of projects
 * with horizontal scrolling controls.
 */
export const DraggableCategory = ({
    category,
    onScrollLeft,
    onScrollRight,
    scrollContainerRef,
    projects
}: DraggableCategoryProps) => (
    <motion.div
        layout
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.2 }}
        className="space-y-4"
    >
        <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">{category.name}</h2>
            <div className="flex space-x-2">
                <Button variant="secondary"
                    size="sm"
                    onClick={() => onScrollLeft(category.id)}
                    icon={<FiMoreVertical className="rotate-90" />}
                    aria-label="Scroll Left" />
                <Button variant="secondary" size="sm"
                    onClick={() => onScrollRight(category.id)}
                    icon={<FiMoreVertical className="-rotate-90" />}
                    aria-label="Scroll Right" />
            </div>
        </div>
        <div ref={scrollContainerRef}
            className="flex space-x-4 overflow-x-auto pb-4 hide-scrollbar"
            role="list"
            aria-label={`${category.name} Projects`}>
            {projects.map((project) => (
                <ProjectCard key={project.id} project={project} />
            ))}
        </div>
    </motion.div>
);
