import { create } from 'zustand';

export interface Category {
    id: string;
    name: string;
}

interface CategoriesState {
    categories: Category[];
    reorderCategories: (oldIndex: number, newIndex: number) => void;
}

export const useCategoriesStore = create<CategoriesState>((set) => ({
    categories: [
        { id: 'recent', name: 'Recent Projects' },
        { id: 'top', name: 'Top Projects' },
        { id: 'templates', name: 'Templates' },
        { id: 'all', name: 'All Projects' }
    ],
    reorderCategories: (oldIndex: number, newIndex: number) => {
        set((state) => {
            const newCategories = [...state.categories];
            const [removed] = newCategories.splice(oldIndex, 1);
            newCategories.splice(newIndex, 0, removed);
            return { categories: newCategories };
        });
    }
}));
