import { create } from 'zustand';

interface AgentCacheStore {
    lastFetchTime: number;
    invalidateCache: () => void;
}

export const useAgentCacheStore = create<AgentCacheStore>((set) => ({
    lastFetchTime: 0,
    invalidateCache: () => set({ lastFetchTime: 0 })
}));
