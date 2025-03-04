import { create } from 'zustand';
import { ApiKey } from '../types';

interface ApiKeysState {
  keys: ApiKey[];
  loading: boolean;
  fetchKeys: () => Promise<void>;
  toggleKeyStatus: (id: string) => void;
}

export const useApiKeysStore = create<ApiKeysState>((set, get) => ({
  keys: [],
  loading: false,
  fetchKeys: async () => {
    set({ loading: true });
    
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));
    
    const mockKeys: ApiKey[] = [
      {
        id: '1',
        name: 'Stripe API Key',
        service: 'Stripe',
        status: 'active',
        createdAt: '2023-01-15T10:30:00Z',
        lastUsed: '2023-04-20T14:45:00Z',
      },
      {
        id: '2',
        name: 'AWS Integration',
        service: 'Amazon Web Services',
        status: 'active',
        createdAt: '2023-02-10T09:15:00Z',
        lastUsed: '2023-04-18T11:20:00Z',
      },
      {
        id: '3',
        name: 'Google Analytics',
        service: 'Google',
        status: 'inactive',
        createdAt: '2023-03-05T13:45:00Z',
        lastUsed: null,
      },
      {
        id: '4',
        name: 'SendGrid Email',
        service: 'SendGrid',
        status: 'active',
        createdAt: '2023-01-28T08:20:00Z',
        lastUsed: '2023-04-15T10:15:00Z',
      },
      {
        id: '5',
        name: 'Twilio SMS',
        service: 'Twilio',
        status: 'inactive',
        createdAt: '2023-02-18T11:10:00Z',
        lastUsed: '2023-03-22T09:25:00Z',
      },
    ];
    
    set({ keys: mockKeys, loading: false });
  },
  toggleKeyStatus: (id: string) => {
    set({
      keys: get().keys.map(key => 
        key.id === id 
          ? { ...key, status: key.status === 'active' ? 'inactive' : 'active' } 
          : key
      )
    });
  },
}));