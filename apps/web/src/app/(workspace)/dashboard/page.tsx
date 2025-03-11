'use client';

import { useRef } from 'react';
import { useEffect } from 'react';
import { useMemo } from 'react';
import { useCallback } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { closestCenter } from '@dnd-kit/core';
import { DndContext } from '@dnd-kit/core';
import { DragEndEvent } from '@dnd-kit/core';
import { KeyboardSensor } from '@dnd-kit/core';
import { PointerSensor } from '@dnd-kit/core';
import { useSensor } from '@dnd-kit/core';
import { useSensors } from '@dnd-kit/core';

import { SortableContext } from '@dnd-kit/sortable';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { verticalListSortingStrategy } from '@dnd-kit/sortable';

import './dashboard.styles.css';
import { useProjectsStore } from '@stores/projects-store';
import type { Project } from '@stores/projects-store';
import { useCategoriesStore } from '@stores/categories-store';
import type { Category } from '@stores/categories-store';

import { Button } from '@components/utils/button/button';
import { Card } from '@components/card';
import { CompanyCard } from '@components/cards/company-card/company-card';
import { LoadingSpinner } from '@components/spinners/loading-spinner';

import { FiBriefcase } from 'react-icons/fi';
import { FiMoreVertical } from 'react-icons/fi';
import { FiUsers } from 'react-icons/fi';

import { DraggableCategory } from './components/draggable-category';
import { InteractiveHeader } from './interactive-header';

type DashboardProps = {
    className?: string;
    initialProjects?: Project[];
    initialCategories?: Category[];
};

type ScrollRefs = Record<string, HTMLDivElement | null>;

type ScrollHandler = (categoryId: string) => void;

type CategoryProjectsGetter = (categoryId: string) => Project[];

const Dashboard: React.FC<DashboardProps> = ({ initialProjects, initialCategories }) => {
    const { projects, loading, fetchProjects, error } = useProjectsStore();
    const { categories, reorderCategories } = useCategoriesStore();
    const scrollContainerRefs = useRef<ScrollRefs>({});

    useEffect(() => {
        if (!initialProjects) {
            void fetchProjects().catch(console.error);
        }
    }, [fetchProjects, initialProjects]);

    const handleScrollLeft = useCallback<ScrollHandler>((categoryId) => {
        const container = scrollContainerRefs.current[categoryId];
        if (container) {
            container.scrollBy({ left: -300, behavior: 'smooth' });
        }
    }, []);

    const handleScrollRight = useCallback<ScrollHandler>((categoryId) => {
        const container = scrollContainerRefs.current[categoryId];
        if (container) {
            container.scrollBy({ left: 300, behavior: 'smooth' });
        }
    }, []);

    const getCategoryProjects = useMemo<CategoryProjectsGetter>(() =>
            (categoryId: string) => projects.filter(project => project.categoryId === categoryId)
        , [projects]);

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

    const handleDragEnd = useCallback((event: DragEndEvent) => {
        const { active, over } = event;

        if (over && active.id !== over.id) {
            const oldIndex = categories.findIndex(cat => cat.id === active.id);
            const newIndex = categories.findIndex(cat => cat.id === over.id);
            reorderCategories(oldIndex, newIndex);
        }
    }, [categories, reorderCategories]);

    const getScrollContainerRef = useCallback((categoryId: string) => (el: HTMLDivElement | null) => {
        scrollContainerRefs.current[categoryId] = el;
    }, []);

    const container = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1
            }
        }
    };

    if (error) {
        return (
            <div className="p-8 text-center text-red-600">
                Error loading dashboard: {error.message}
            </div>
        );
    }

    return (
        <div className="dashboard-container">
            <InteractiveHeader />

            <div className="space-y-8">
                <div className="space-y-4">
                    <div className="py-2">
                        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
                    </div>

                    <CompanyCard name="Cool Coffee Mugs. llc"
                        logoUrl="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80" />

                    {/* <Card className={`max-w-3xl ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}> */}
                    <Card className={`max-w-3xl bg-white`}>
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
                            <LoadingSpinner />
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
                                        <DraggableCategory key={category.id}
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
