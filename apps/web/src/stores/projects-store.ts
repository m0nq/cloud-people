import { create } from 'zustand';

export interface Project {
    id: string;
    title: string;
    description: string;
    revenue: number;
    createdAt: string;
    updatedAt: string;
    thumbnail: string;
}

interface ProjectsState {
    projects: Project[];
    loading: boolean;
    error: Error | null;
    fetchProjects: () => Promise<void>;
}

export const useProjectsStore = create<ProjectsState>((set) => ({
    projects: [],
    loading: false,
    error: null,
    fetchProjects: async () => {
        set({ loading: true });
        try {
            // Simulate API call with a 3000ms delay to make loading spinner visible
            await new Promise((resolve) => setTimeout(resolve, 600));

            // TODO: Replace with actual API call
            const mockProjects: Project[] = [
                {
                    id: '1',
                    title: 'E-commerce Platform',
                    description: 'A comprehensive e-commerce solution with payment processing and inventory management.',
                    revenue: 12500,
                    createdAt: '2023-01-15T10:30:00Z',
                    updatedAt: '2023-03-22T14:45:00Z',
                    thumbnail: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80'
                },
                {
                    id: '2',
                    title: 'Analytics Dashboard',
                    description: 'Real-time analytics dashboard for monitoring business metrics and KPIs.',
                    revenue: 8750,
                    createdAt: '2023-02-10T09:15:00Z',
                    updatedAt: '2023-04-05T11:20:00Z',
                    thumbnail: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80'
                },
                {
                    id: '3',
                    title: 'CRM System',
                    description: 'Customer relationship management system with lead tracking and sales pipeline.',
                    revenue: 15200,
                    createdAt: '2023-03-05T13:45:00Z',
                    updatedAt: '2023-04-18T16:30:00Z',
                    thumbnail: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80'
                },
                {
                    id: '4',
                    title: 'Content Management System',
                    description: 'Flexible CMS for managing digital content across multiple platforms.',
                    revenue: 6300,
                    createdAt: '2023-01-28T08:20:00Z',
                    updatedAt: '2023-03-30T10:15:00Z',
                    thumbnail: 'https://images.unsplash.com/photo-1499750310107-5fef28a66643?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80'
                },
                {
                    id: '5',
                    title: 'Booking System',
                    description: 'Online booking and reservation system for service-based businesses.',
                    revenue: 9400,
                    createdAt: '2023-02-18T11:10:00Z',
                    updatedAt: '2023-04-12T09:25:00Z',
                    thumbnail: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80'
                },
                {
                    id: '6',
                    title: 'Learning Management System',
                    description: 'Educational platform for online courses and student progress tracking.',
                    revenue: 11200,
                    createdAt: '2023-01-10T08:15:00Z',
                    updatedAt: '2023-04-02T14:30:00Z',
                    thumbnail: 'https://images.unsplash.com/photo-1501504905252-473c47e087f8?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80'
                },
                {
                    id: '7',
                    title: 'Inventory Management',
                    description: 'Comprehensive inventory tracking and management solution for retailers.',
                    revenue: 7800,
                    createdAt: '2023-02-05T11:45:00Z',
                    updatedAt: '2023-03-28T09:20:00Z',
                    thumbnail: 'https://images.unsplash.com/photo-1553413077-190dd305871c?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80'
                },
                {
                    id: '8',
                    title: 'Project Management Tool',
                    description: 'Task management and team collaboration platform for businesses.',
                    revenue: 13600,
                    createdAt: '2023-01-20T10:00:00Z',
                    updatedAt: '2023-04-15T16:45:00Z',
                    thumbnail: 'https://images.unsplash.com/photo-1531403009284-440f080d1e12?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80'
                },
                {
                    id: '9',
                    title: 'Healthcare Portal',
                    description: 'Patient management and medical records system for healthcare providers.',
                    revenue: 18900,
                    createdAt: '2023-02-15T09:30:00Z',
                    updatedAt: '2023-04-10T13:15:00Z',
                    thumbnail: 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80'
                },
                {
                    id: '10',
                    title: 'Real Estate Platform',
                    description: 'Property listing and management system for real estate agencies.',
                    revenue: 14200,
                    createdAt: '2023-03-01T12:15:00Z',
                    updatedAt: '2023-04-20T10:30:00Z',
                    thumbnail: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80'
                }
            ];
            set({ projects: mockProjects });
        } catch (error) {
            console.error('Error fetching projects:', error);
            set({ error: error instanceof Error ? error : new Error('Failed to fetch projects') });
        } finally {
            set({ loading: false });
        }
    }
}));
