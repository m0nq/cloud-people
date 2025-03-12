import { create } from 'zustand';

export interface Category {
    id: string;
    title: string;
    type: 'recent' | 'top' | 'all' | 'templates';
}

interface CategoriesState {
    categories: Category[];
    reorderCategories: (activeId: string, overId: string) => void;
}

export const useCategoriesStore = create<CategoriesState>((set) => ({
  categories: [
    { id: 'recent', title: 'Recent Projects', type: 'recent' },
    { id: 'top', title: 'Tutorials', type: 'top' },
    { id: 'all', title: 'All Projects', type: 'all' },
    { id: 'templates', title: 'Templates', type: 'templates' },
  ],
  setCategories: (categories) => set({ categories }),
  reorderCategories: (activeId: string, overId: string) => {
    set((state) => {
      const oldIndex = state.categories.findIndex((cat) => cat.id === activeId);
      const newIndex = state.categories.findIndex((cat) => cat.id === overId);
      
      if (oldIndex === -1 || newIndex === -1) return state;
      
      const newCategories = [...state.categories];
      const [movedCategory] = newCategories.splice(oldIndex, 1);
      newCategories.splice(newIndex, 0, movedCategory);
      
      return { categories: newCategories };
    });
  },
}));
