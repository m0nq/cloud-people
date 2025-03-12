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
                className="h-full hover:shadow-md transition-shadow duration-300 overflow-hidden">
                <div className="flex flex-col h-full">
                    <div className="relative h-36 overflow-hidden">
                        <Image src={project.thumbnail}
                            alt={project.title}
                            width={800}
                            height={144}
                            className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                    </div>

                    <CardContent className="p-3">
                        <div className="flex items-center justify-between mb-1">
                            {/*<h3 className={`text-base font-semibold ${isDarkMode ? 'text-gray-100' : 'text-gray-900'} truncate`}>{project.title}</h3>*/}
                            <h3 className={`text-base font-semibold text-gray-900 truncate`}>{project.title}</h3>
                        </div>

                        {/*<p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'} text-xs line-clamp-2 mb-2 h-8`}>{project.description}</p>*/}
                        <p className={`text-gray-600 text-xs line-clamp-2 mb-2 h-8`}>{project.description}</p>

                        {/*<div className={`flex justify-between items-center mt-auto pt-2 border-t ${isDarkMode ? 'border-gray-700' : 'border-gray-100'}`}>*/}
                        <div className={`flex justify-between items-center mt-auto pt-2 border-t border-gray-100`}>
                            <div className="flex items-center text-green-600 text-sm">
                                {/*<FiTrendingUp size={14} className={`mr-1 ${isDarkMode ? 'text-green-400' : 'text-green-600'}`} />*/}
                                <FiTrendingUp size={14} className={`mr-1 text-green-600`} />
                                {/*<span className={`font-medium ${isDarkMode ? 'text-green-400' : 'text-green-600'}`}>{formatCurrency(project.revenue)}</span>*/}
                                <span className={`font-medium text-green-600`}>{formatCurrency(project.revenue)}</span>
                            </div>
                            <div className="flex space-x-2">
                                <button onClick={handleClone}
                                    className="py-1.5 px-2.5 text-xs text-white font-semibold rounded-md bg-blue-700  hover:bg-blue-800">
                                    Clone
                                </button>
                                <Link href="/sandbox"
                                    className="py-1.5 px-2.5 text-xs text-gray-600 font-semibold rounded-md border border-solid">
                                    Details
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
