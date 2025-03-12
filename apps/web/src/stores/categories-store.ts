import { create } from 'zustand';

export interface Category {
    id: number;
    title: string;
    type: 'recent' | 'top' | 'all' | 'templates';
}

interface CategoriesState {
    categories: Category[];
    reorderCategories: (activeId: number, overId: number) => void;
}

export const useCategoriesStore = create<CategoriesState>((set) => ({
  categories: [
    { id: 1, title: 'Recent Projects', type: 'recent' },
    { id: 2, title: 'Tutorials', type: 'top' },
    { id: 3, title: 'All Projects', type: 'all' },
    { id: 4, title: 'Templates', type: 'templates' },
  ],
  setCategories: (categories) => set({ categories }),
  reorderCategories: (activeId: number, overId: number) => {
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
