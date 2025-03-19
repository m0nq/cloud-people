import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

// Define the Researcher interface
export interface Researcher {
    id: string;
    name: string;
    role: string;
    avatar: string;
    coreSkill: string;
    tools: string[];
    trainingHours: number;
    accuracy: number;
}

// Define the store interface
interface MarketplaceStore {
    // State
    researchers: Researcher[];
    filteredResearchers: Researcher[];
    cart: Researcher[];
    activeTab: 'agents' | 'business';
    searchTerm: string;
    selectedCategory: string | null;
    
    // Actions
    setActiveTab: (tab: 'agents' | 'business') => void;
    setSearchTerm: (term: string) => void;
    setSelectedCategory: (category: string | null) => void;
    addToCart: (researcher: Researcher) => void;
    removeFromCart: (researcherId: string) => void;
    filterResearchers: () => void;
}

// Mock data based on the design
const mockResearchers: Researcher[] = [
    {
        id: '1',
        name: 'Becca',
        role: 'Researcher',
        avatar: '/avatars/becca.jpg',
        coreSkill: 'TikTok Trend Analysis',
        tools: ['tiktok', 'chart', 'document'],
        trainingHours: 342,
        accuracy: 83
    },
    {
        id: '2',
        name: 'Marcus',
        role: 'Researcher',
        avatar: '/avatars/marcus.jpg',
        coreSkill: 'Investment Analysis',
        tools: ['chart', 'document'],
        trainingHours: 520,
        accuracy: 91
    },
    {
        id: '3',
        name: 'Sophia',
        role: 'Researcher',
        avatar: '/avatars/sophia.jpg',
        coreSkill: 'Project Coordination',
        tools: ['presentation', 'alert'],
        trainingHours: 410,
        accuracy: 87
    },
    {
        id: '4',
        name: 'Aiden',
        role: 'Researcher',
        avatar: '/avatars/aiden.jpg',
        coreSkill: 'Data Storytelling',
        tools: ['chart', 'document', 'presentation'],
        trainingHours: 385,
        accuracy: 89
    },
    {
        id: '5',
        name: 'Elena',
        role: 'Researcher',
        avatar: '/avatars/elena.jpg',
        coreSkill: 'Creative Writing',
        tools: ['document', 'audio'],
        trainingHours: 298,
        accuracy: 85
    },
    {
        id: '6',
        name: 'Jamal',
        role: 'Researcher',
        avatar: '/avatars/jamal.jpg',
        coreSkill: 'SEO Strategy',
        tools: ['chart', 'document', 'alert'],
        trainingHours: 456,
        accuracy: 92
    }
];

export const useMarketplaceStore = create<MarketplaceStore>()(
    devtools(
        (set, get) => ({
            // Initial state
            researchers: mockResearchers,
            filteredResearchers: mockResearchers,
            cart: [],
            activeTab: 'agents',
            searchTerm: '',
            selectedCategory: null,
            
            // Actions
            setActiveTab: (tab) => {
                set({ activeTab: tab });
                get().filterResearchers();
            },
            
            setSearchTerm: (term) => {
                set({ searchTerm: term });
                get().filterResearchers();
            },
            
            setSelectedCategory: (category) => {
                set({ selectedCategory: category });
                get().filterResearchers();
            },
            
            addToCart: (researcher) => {
                const { cart } = get();
                // Check if researcher is already in cart
                if (!cart.some(item => item.id === researcher.id)) {
                    set({ cart: [...cart, researcher] });
                }
            },
            
            removeFromCart: (researcherId) => {
                const { cart } = get();
                set({ cart: cart.filter(item => item.id !== researcherId) });
            },
            
            filterResearchers: () => {
                const { researchers, searchTerm, selectedCategory } = get();
                
                let filtered = researchers;
                
                // Filter by search term
                if (searchTerm) {
                    const term = searchTerm.toLowerCase();
                    filtered = filtered.filter(researcher => 
                        researcher.name.toLowerCase().includes(term) ||
                        researcher.coreSkill.toLowerCase().includes(term)
                    );
                }
                
                // Filter by category
                if (selectedCategory) {
                    filtered = filtered.filter(researcher => 
                        researcher.coreSkill.toLowerCase().includes(selectedCategory.toLowerCase())
                    );
                }
                
                set({ filteredResearchers: filtered });
            }
        }),
        {
            name: 'Marketplace Store',
            enabled: process.env.NODE_ENV === 'development',
            maxAge: process.env.NODE_ENV === 'development' ? 50 : 0
        }
    )
);
