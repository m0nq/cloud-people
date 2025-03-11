'use client';

import { memo } from 'react';

import { Card } from '@components/card';
import type { Project } from '@stores/projects-store';
import { formatRelativeTime } from '@utils/date/format';

interface ProjectCardProps {
    project: Project;
    className?: string;
}

/**
 * A card component that displays project information including name and last updated time.
 * Uses relative time formatting for the last updated timestamp.
 */
export const ProjectCard = memo(({ project, className = '' }: ProjectCardProps) => {
    // Ensure project has required properties
    if (!project?.name || !project?.lastUpdated) {
        console.error('[ProjectCard] Invalid project data:', project);
        return null;
    }

    const formattedDate = formatRelativeTime(project.lastUpdated);
    const projectInitial = project.name.charAt(0).toUpperCase();

    return (
        <Card className={`min-w-[300px] p-4 bg-white shadow-sm hover:shadow-md transition-shadow duration-200 ${className}`}>
            <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 text-lg font-medium"
                    aria-hidden="true">
                    {projectInitial}
                </div>
                <div>
                    <h3 className="font-medium text-gray-900">{project.name}</h3>
                    <p className="text-sm text-gray-500" title={project.lastUpdated}>
                        Updated {formattedDate}
                    </p>
                </div>
            </div>
            <div className="space-y-3">
                <div className="h-2 bg-gray-200 rounded w-3/4"
                    role="progressbar"
                    aria-label="Project progress" />
                <div className="h-2 bg-gray-200 rounded w-1/2"
                    role="progressbar"
                    aria-label="Project progress" />
            </div>
        </Card>
    );
});
