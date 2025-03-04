import { create } from 'zustand';
import { StoreItem } from '../types';

interface StoreState {
  items: StoreItem[];
  loading: boolean;
  fetchItems: () => Promise<void>;
}

export const useStoreItemsStore = create<StoreState>((set) => ({
  items: [],
  loading: false,
  fetchItems: async () => {
    set({ loading: true });
    
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));
    
    const mockItems: StoreItem[] = [
      // Agent items
      {
        id: '1',
        name: 'Becca',
        description: 'Social media trend analysis and content creation specialist.',
        price: 49.99,
        image: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80',
        category: 'AI Tools',
        coreSkill: 'TikTok Trend Analysis',
        compatibleApps: ['tiktok', 'sheets', 'docs'],
        trainingHours: 342,
        accuracy: 83
      },
      {
        id: '5',
        name: 'Marcus',
        description: 'Financial analysis and investment strategy optimization.',
        price: 99.99,
        image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80',
        category: 'AI Tools',
        coreSkill: 'Investment Analysis',
        compatibleApps: ['sheets', 'notion', 'slack'],
        trainingHours: 520,
        accuracy: 91
      },
      {
        id: '6',
        name: 'Sophia',
        description: 'Team collaboration and project management specialist.',
        price: 59.99,
        image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80',
        category: 'Collaboration',
        coreSkill: 'Project Coordination',
        compatibleApps: ['slack', 'notion', 'asana'],
        trainingHours: 410,
        accuracy: 87
      },
      {
        id: '7',
        name: 'Aiden',
        description: 'Data visualization and insights generation specialist.',
        price: 79.99,
        image: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80',
        category: 'Visualization',
        coreSkill: 'Data Storytelling',
        compatibleApps: ['tableau', 'sheets', 'powerbi'],
        trainingHours: 385,
        accuracy: 89
      },
      {
        id: '11',
        name: 'Elena',
        description: 'Content creation and copywriting specialist.',
        price: 69.99,
        image: 'https://images.unsplash.com/photo-1534751516642-a1af1ef26a56?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80',
        category: 'AI Tools',
        coreSkill: 'Creative Writing',
        compatibleApps: ['docs', 'notion', 'wordpress'],
        trainingHours: 298,
        accuracy: 85
      },
      {
        id: '12',
        name: 'Jamal',
        description: 'SEO optimization and digital marketing specialist.',
        price: 89.99,
        image: 'https://images.unsplash.com/photo-1531384441138-2736e62e0919?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80',
        category: 'AI Tools',
        coreSkill: 'SEO Strategy',
        compatibleApps: ['analytics', 'sheets', 'ahrefs'],
        trainingHours: 456,
        accuracy: 92
      },
      
      // Business items
      {
        id: '2',
        name: 'E-commerce Integration',
        description: 'Connect your projects with popular e-commerce platforms.',
        price: 79.99,
        image: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80',
        category: 'Integrations',
      },
      {
        id: '3',
        name: 'Financial Module',
        description: 'Specialized modules for financial applications and data processing.',
        price: 29.99,
        image: 'https://images.unsplash.com/photo-1551434678-e076c223a692?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80',
        category: 'Modules',
      },
      {
        id: '4',
        name: 'Premium Templates',
        description: 'Ready-to-use templates for common business workflows.',
        price: 19.99,
        image: 'https://images.unsplash.com/photo-1499750310107-5fef28a66643?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80',
        category: 'Templates',
      },
      {
        id: '8',
        name: 'Security Module',
        description: 'Enhanced security features for your projects.',
        price: 89.99,
        image: 'https://images.unsplash.com/photo-1563986768609-322da13575f3?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80',
        category: 'Security',
      },
      {
        id: '9',
        name: 'CRM Integration',
        description: 'Connect your projects with popular CRM platforms.',
        price: 69.99,
        image: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80',
        category: 'Integrations',
      },
      {
        id: '10',
        name: 'Accounting Module',
        description: 'Comprehensive accounting features for business applications.',
        price: 59.99,
        image: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80',
        category: 'Modules',
      },
    ];
    
    set({ items: mockItems, loading: false });
  },
}));