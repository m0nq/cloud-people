'use client';

import { useRef } from 'react';
import { useEffect } from 'react';
import Image from 'next/image';
import { FaPause } from 'react-icons/fa';
import { LuBook } from 'react-icons/lu';
import { VscSettings } from 'react-icons/vsc';
import { motion } from 'framer-motion';
import { FiBriefcase } from 'react-icons/fi';
import { FiMoreVertical } from 'react-icons/fi';
import { FiUsers } from 'react-icons/fi';
import { DndContext } from '@dnd-kit/core';
import { DragEndEvent } from '@dnd-kit/core';
import { closestCenter } from '@dnd-kit/core';
import { KeyboardSensor } from '@dnd-kit/core';
import { PointerSensor } from '@dnd-kit/core';
import { useSensor } from '@dnd-kit/core';
import { useSensors } from '@dnd-kit/core';
import { SortableContext } from '@dnd-kit/sortable';
import { verticalListSortingStrategy } from '@dnd-kit/sortable';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';

import { Button } from '@components/utils/button/button';
import { Card } from '@components/card';
import { InteractiveHeader } from './interactive-header';
import { useProjectsStore } from '@stores/projects-store';
import type { Project } from '@stores/projects-store';
import { useCategoriesStore } from '@stores/categories-store';
import type { Category } from '@stores/categories-store';

interface ProjectCardProps {
    project: Project;
}

interface DraggableCategoryProps {
    category: Category;
    onScrollLeft: (id: string) => void;
    onScrollRight: (id: string) => void;
    scrollContainerRef: (el: HTMLDivElement | null) => void;
    projects: Project[];
}

type DashboardProps = {
    className?: string;
};

const ProjectCard = ({ project }: ProjectCardProps) => (
    <Card className="min-w-[300px] p-4 bg-white shadow-sm">
        <div className="flex items-center space-x-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-gray-200" />
            <div>
                <h3 className="font-medium text-gray-900">{project.name}</h3>
                <p className="text-sm text-gray-500">Last updated {project.lastUpdated}</p>
            </div>
        </div>
        <div className="space-y-3">
            <div className="h-2 bg-gray-200 rounded w-3/4" />
            <div className="h-2 bg-gray-200 rounded w-1/2" />
        </div>
    </Card>
);

const DraggableCategory = ({
    category, onScrollLeft, onScrollRight, scrollContainerRef, projects
}: DraggableCategoryProps) => (
    <motion.div
        layout
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.2 }}
        className="space-y-4">
        <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">{category.name}</h2>
            <div className="flex space-x-2">
                <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => onScrollLeft(category.id)}
                    icon={<FiMoreVertical className="rotate-90" />}
                />
                <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => onScrollRight(category.id)}
                    icon={<FiMoreVertical className="-rotate-90" />}
                />
            </div>
        </div>
        <div
            ref={scrollContainerRef}
            className="flex space-x-4 overflow-x-auto pb-4 hide-scrollbar"
        >
            {projects.map((project) => (
                <ProjectCard key={project.id} project={project} />
            ))}
        </div>
    </motion.div>
);

const Dashboard: React.FC<DashboardProps> = () => {
    const { projects, loading, fetchProjects } = useProjectsStore();
    const { categories, reorderCategories } = useCategoriesStore();
    const scrollContainerRefs = useRef<Record<string, HTMLDivElement | null>>({});

    useEffect(() => {
        void fetchProjects();
    }, [fetchProjects]);

    const handleScrollLeft = (categoryId: string) => {
        const container = scrollContainerRefs.current[categoryId];
        if (container) {
            container.scrollBy({ left: -300, behavior: 'smooth' });
        }
    };

    const handleScrollRight = (categoryId: string) => {
        const container = scrollContainerRefs.current[categoryId];
        if (container) {
            container.scrollBy({ left: 300, behavior: 'smooth' });
        }
    };

    const getCategoryProjects = (categoryId: string): Project[] => {
        return projects.filter(project => project.categoryId === categoryId);
    };

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 5
            }
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates
        })
    );

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;

        if (over && active.id !== over.id) {
            const oldIndex = categories.findIndex(cat => cat.id === active.id);
            const newIndex = categories.findIndex(cat => cat.id === over.id);
            reorderCategories(oldIndex, newIndex);
        }
    };

    const getScrollContainerRef = (categoryId: string) => (el: HTMLDivElement | null) => {
        scrollContainerRefs.current[categoryId] = el;
    };

    const container = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1
            }
        }
    };

    return (
        <div className="p-8 space-y-8 bg-gray-50 min-h-screen">
            <InteractiveHeader />

            <div className="space-y-8">
                <div className="space-y-4">
                    <div className="py-2">
                        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
                    </div>

                    {/*<Card className={`max-w-3xl ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>*/}
                    <Card className="max-w-3xl bg-white shadow-sm rounded-lg overflow-hidden">
                        <div className="flex items-center justify-between p-4 border-b border-gray-200">
                            <div className="flex items-center space-x-2">
                                <Image src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80"
                                    alt="Company Logo"
                                    width={256}
                                    height={256}
                                    className="w-6 h-6 rounded" />
                                {/*<span className={`text-sm font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>*/}
                                <span className={`text-sm font-medium text-gray-700`}>
                                  Cool Coffee Mugs. llc
                                </span>
                            </div>
                            <div className="flex items-center space-x-4">
                                <Button variant="muted"
                                    size="sm"
                                    icon={<LuBook size={20} className="text-gray-600" />} />
                                <Button variant="muted"
                                    size="sm"
                                    icon={<FaPause size={20} className="text-gray-600" />} />
                                <Button variant="muted"
                                    size="sm"
                                    icon={<VscSettings size={20} className="text-gray-600" />} />
                                <Button variant="primary" size="sm">
                                    Open
                                </Button>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6">
                            {/*<div className={`p-4 rounded-lg ${isDarkMode ? 'bg-gray-700/50' : 'bg-gray-50'}`}>*/}
                            <div className="p-4 rounded-lg bg-white shadow-sm border border-gray-100">
                                <div className="flex items-center space-x-3 mb-4">
                                    <div className="w-10 h-10 rounded-full overflow-hidden">
                                        <Image src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80"
                                            alt="Manager"
                                            width={256}
                                            height={256}
                                            className="w-full h-full object-cover" />
                                    </div>
                                    {/*<h2 className={`text-lg font-semibold ${isDarkMode ? 'text-gray-100' : 'text-gray-900'}`}>*/}
                                    <h2 className={`text-lg font-semibold text-gray-900`}>
                                        Manager Mike
                                    </h2>
                                </div>
                                {/*<div className={`p-3 rounded-lg ${isDarkMode ? 'bg-gray-600/50' : 'bg-white'} mb-4`}>*/}
                                <div className="p-3 rounded-lg bg-gray-50 mb-4">
                                    {/*<div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>*/}
                                    <div className={`text-sm text-gray-600`}>
                                        Current Task:
                                    </div>
                                    {/*<div className={`${isDarkMode ? 'text-gray-300' : 'text-gray-900'}`}>*/}
                                    <div className="text-gray-900">
                                        Name of task
                                    </div>
                                </div>
                                <div className="flex space-x-2">
                                    <Button variant="secondary" className="flex-1">
                                        Watch
                                    </Button>
                                    <Button variant="primary" className="flex-1 bg-emerald-500 hover:bg-emerald-600">
                                        Meeting
                                    </Button>
                                </div>
                            </div>

                            {/*<div className={`p-4 rounded-lg ${isDarkMode ? 'bg-gray-700/50' : 'bg-gray-50'}`}>*/}
                            <div className="p-4 rounded-lg bg-white shadow-sm border border-gray-100">
                                <div className="flex items-center justify-between mb-4">
                                    {/*<div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>*/}
                                    <div className={`text-sm text-gray-600`}>
                                        Net Profit
                                    </div>
                                    <Button variant="muted"
                                        size="sm"
                                        icon={<FiMoreVertical size={16} className="text-gray-600" />} />
                                </div>
                                <div className="p-4 rounded-lg bg-blue-600 mb-4">
                                    <div className="flex items-center justify-between">
                                        <div className="text-2xl font-bold text-white">$25,215</div>
                                        <div className="text-sm text-indigo-200">All Time</div>
                                    </div>
                                </div>
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center space-x-2">
                                            <FiBriefcase size={16} className={'text-gray-600'} />
                                            {/*<span className={isDarkMode ? 'text-gray-300' : 'text-gray-900'}>Business Expenses</span>*/}
                                            <span className={'text-gray-900'}>Business Expenses</span>
                                        </div>
                                        <div className="text-red-500">-$5,154.50</div>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center space-x-2">
                                            <FiUsers size={16} className={'text-gray-600'} />
                                            {/*<span className={isDarkMode ? 'text-gray-300' : 'text-gray-900'}>Taxes</span>*/}
                                            <span className={'text-gray-900'}>Taxes</span>
                                        </div>
                                        <div className="text-red-500">-$1,140.50</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </Card>

                    {loading ? (
                        <div className="flex justify-center py-12">
                            <svg className="animate-spin h-8 w-8 text-blue-600"
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 24 24">
                                <circle className="opacity-25"
                                    cx="12"
                                    cy="12"
                                    r="10"
                                    stroke="currentColor"
                                    strokeWidth="4" />
                                <path className="opacity-75"
                                    fill="currentColor"
                                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                            </svg>
                        </div>
                    ) : (
                        <motion.div variants={container}
                            initial="hidden"
                            animate="show"
                            className="space-y-8">
                            <DndContext sensors={sensors}
                                collisionDetection={closestCenter}
                                onDragEnd={handleDragEnd}>
                                <SortableContext items={categories.map(cat => cat.id)}
                                    strategy={verticalListSortingStrategy}>
                                    {categories.map((category) => (
                                        <DraggableCategory
                                            key={category.id}
                                            category={category}
                                            onScrollLeft={handleScrollLeft}
                                            onScrollRight={handleScrollRight}
                                            scrollContainerRef={getScrollContainerRef(category.id)}
                                            projects={getCategoryProjects(category.id)} />
                                    ))}
                                </SortableContext>
                            </DndContext>
                        </motion.div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
