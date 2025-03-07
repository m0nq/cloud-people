import { create } from 'zustand';
import { User } from '../types';

interface UsersState {
  users: User[];
  loading: boolean;
  fetchUsers: () => Promise<void>;
}

export const useUsersStore = create<UsersState>((set) => ({
  users: [],
  loading: false,
  fetchUsers: async () => {
    set({ loading: true });
    
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));
    
    const mockUsers: User[] = [
      {
        id: '1',
        name: 'John Doe',
        email: 'john@example.com',
        avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
        revenue: 28500,
        companies: 3
      },
      {
        id: '2',
        name: 'Jane Smith',
        email: 'jane@example.com',
        avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
        revenue: 42300,
        companies: 5
      },
      {
        id: '3',
        name: 'Robert Johnson',
        email: 'robert@example.com',
        avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
        revenue: 15800,
        companies: 2
      },
      {
        id: '4',
        name: 'Emily Davis',
        email: 'emily@example.com',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
        revenue: 36900,
        companies: 4
      },
      {
        id: '5',
        name: 'Michael Wilson',
        email: 'michael@example.com',
        avatar: 'https://images.unsplash.com/photo-1519244703995-f4e0f30006d5?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
        revenue: 21500,
        companies: 2
      },
      {
        id: '6',
        name: 'Sarah Brown',
        email: 'sarah@example.com',
        avatar: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
        revenue: 48700,
        companies: 6
      },
      {
        id: '7',
        name: 'David Miller',
        email: 'david@example.com',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
        revenue: 19200,
        companies: 2
      },
    ];
    
    // Sort by revenue (highest first)
    mockUsers.sort((a, b) => b.revenue - a.revenue);
    
    set({ users: mockUsers, loading: false });
  },
}));