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
import { FiBriefcase } from 'react-icons/fi';
import { FiMoreVertical } from 'react-icons/fi';
import { FiUsers } from 'react-icons/fi';
import { SortableContext } from '@dnd-kit/sortable';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { verticalListSortingStrategy } from '@dnd-kit/sortable';

import './dashboard.styles.css';
import { useProjectsStore } from '@stores/projects-store';
import type { Project } from '@stores/projects-store';
import { useCategoriesStore } from '@stores/categories-store';
import type { Category } from '@stores/categories-store';
import { Card } from '@components/card';
import { CompanyCard } from '@components/cards/company-card/company-card';
import { LoadingSpinner } from '@components/spinners/loading-spinner';
import { DraggableCategory } from './components/draggable-category';
import { InteractiveHeader } from './components/interactive-header';

type ScrollRefs = Record<number, HTMLDivElement | null>;

type ScrollHandler = (categoryId: number) => void;

type CategoryProjectsGetter = (categoryType: string) => Project[];

const Dashboard = () => {
    const { projects, loading, fetchProjects, error } = useProjectsStore();
    const { categories, reorderCategories } = useCategoriesStore();
    const scrollContainerRefs = useRef<ScrollRefs>({});

    useEffect(() => {
        void fetchProjects().catch(console.error);
    }, [fetchProjects]);

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

    const getCategoryProjects = useMemo<CategoryProjectsGetter>(() => {
            return (categoryType: string) => {
                switch (categoryType) {
                    case 'recent':
                        return projects.slice(0, 3);
                    case 'top':
                        return [...projects].sort((a, b) => b.revenue - a.revenue).slice(0, 5);
                    case 'templates':
                        return projects.filter(project => ['6', '7', '8', '9', '10'].includes(project.id));
                    case 'all':
                    default:
                        return projects;
                }
            };
        },
        [projects]
    );

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
            reorderCategories(Number(active.id), Number(over.id));
        }
    }, [reorderCategories]);

    const getScrollContainerRef = useCallback((categoryId: number) => (el: HTMLDivElement | null) => {
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
            <div className="error-container">
                Error loading dashboard: {error.message}
            </div>
        );
    }

    return (
        <div className="dashboard-container">
            <InteractiveHeader />

            <div className="dashboard-content">
                <div className="dashboard-section">
                    <div className="section-header">
                        <h1 className="section-title">Dashboard</h1>
                    </div>

                    <CompanyCard name="Cool Coffee Mugs. llc"
                        logoUrl="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80" />

                    <Card className="dashboard-card">
                        <div className="card-grid">
                            <div className="profile-container">
                                <div className="profile-header">
                                    <div className="profile-image-container">
                                        <Image src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80"
                                            alt="Manager"
                                            width={256}
                                            height={256}
                                            className="profile-image" />
                                    </div>
                                    <h2 className="profile-name">
                                        Manager Mike
                                    </h2>
                                </div>
                                <div className="task-container">
                                    <div className="task-label">
                                        Current Task:
                                    </div>
                                    <div className="task-name">
                                        Name of task
                                    </div>
                                </div>
                                <div className="action-buttons">
                                    <button className="action-button watch-button">
                                        Watch
                                    </button>
                                    <button className="action-button meeting-button">
                                        Meeting
                                    </button>
                                </div>
                            </div>

                            <div className="stats-container">
                                <div className="stats-header">
                                    <div className="stats-label">
                                        Net Profit
                                    </div>
                                    <button className="stats-options-button">
                                        <FiMoreVertical size={16} className="text-[rgb(var(--muted-foreground))]" />
                                    </button>
                                </div>
                                <div className="profit-display">
                                    <div className="profit-content">
                                        <div className="profit-amount">$25,215</div>
                                        <div className="profit-period">All Time</div>
                                    </div>
                                </div>
                                <div className="expense-list">
                                    <div className="expense-item">
                                        <div className="expense-info">
                                            <FiBriefcase size={16} className="expense-icon text-[rgb(var(--foreground))]" />
                                            <span className="expense-name">Business Expenses</span>
                                        </div>
                                        <div className="expense-amount">-$5,154.50</div>
                                    </div>
                                    <div className="expense-item">
                                        <div className="expense-info">
                                            <FiUsers size={16} className="expense-icon text-[rgb(var(--foreground))]" />
                                            <span className="expense-name">Taxes</span>
                                        </div>
                                        <div className="expense-amount">-$1,140.50</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </Card>

                    {loading ? (
                        <div className="loading-container">
                            <LoadingSpinner />
                        </div>
                    ) : (
                        <motion.div variants={container}
                            initial="hidden"
                            animate="show"
                            className="categories-container">
                            <DndContext sensors={sensors}
                                collisionDetection={closestCenter}
                                onDragEnd={handleDragEnd}>
                                <SortableContext items={categories.map(cat => cat.id)}
                                    strategy={verticalListSortingStrategy}>
                                    {categories.map((category) => {
                                        const categoryProjects = getCategoryProjects(category.type);

                                        return (
                                            <div key={category.id} className="draggable-category">
                                                <DraggableCategory
                                                    id={category.id}
                                                    projects={categoryProjects}
                                                    title={category.title}
                                                    onScrollLeft={() => handleScrollLeft(category.id)}
                                                    onScrollRight={() => handleScrollRight(category.id)}
                                                    scrollContainerRef={getScrollContainerRef(category.id)} />
                                            </div>
                                        );
                                    })}
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
