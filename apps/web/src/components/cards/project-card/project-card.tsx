'use client';

import { memo } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

import { Card } from '@components/card';
import { CardContent } from '@components/card';
import type { Project } from '@stores/projects-store';
import { formatCurrency } from '@utils/date/format';
import { FiTrendingUp } from 'react-icons/fi';
import Link from 'next/link';

import './project-card.styles.css';

interface ProjectCardProps {
    project: Project;
}

/**
 * A card component that displays project information including name and last updated time.
 * Uses relative time formatting for the last updated timestamp.
 */
const ProjectCardComponent = ({ project }: ProjectCardProps) => {
    const router = useRouter();

    // Ensure project has required properties
    if (!project?.title || !project?.updatedAt) {
        console.error('[ProjectCard] Invalid project data:', project);
        return null;
    }

    const handleClone = (e: React.MouseEvent) => {
        e.stopPropagation();
        // In a real app, this would clone the project
        console.log('Cloning project:', project.id);
    };

    return (
        <motion.div variants={{
            hidden: { opacity: 0, y: 20 },
            show: { opacity: 1, y: 0 }
        }}>
            <Card interactive
                onClick={() => router.push('/sandbox')}
                className="project-card-container">
                <div className="project-card-inner">
                    <div className="project-card-image">
                        <Image src={project.thumbnail}
                            alt={project.title}
                            width={800}
                            height={144}
                            className="project-card-thumbnail" />
                        <div className="project-card-overlay"></div>
                    </div>
                    <CardContent className="project-card-content">
                        <div className="project-card-header">
                            <h3 className="project-card-title">{project.title}</h3>
                        </div>

                        <p className="project-card-description">{project.description}</p>

                        <div className="project-card-footer">
                            <div className="project-card-revenue">
                                <FiTrendingUp size={14} className="project-card-revenue-icon" />
                                <span className="project-card-revenue-amount">{formatCurrency(project.revenue)}</span>
                            </div>
                            <div className="project-card-actions">
                                <button onClick={handleClone}
                                    className="project-card-action-button"
                                    aria-label="Clone Project">
                                    Clone
                                </button>
                                <Link href="/sandbox" 
                                    className="project-card-action-link"
                                    onClick={(e) => e.stopPropagation()}>
                                    View
                                </Link>
                            </div>
                        </div>
                    </CardContent>
                </div>
            </Card>
        </motion.div>
    );
};

// Create a memoized version of the component with a proper display name
export const ProjectCard = memo(ProjectCardComponent);

// Set the display name explicitly
ProjectCard.displayName = 'ProjectCard';
