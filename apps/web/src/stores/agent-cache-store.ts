import { create } from 'zustand';
import { AgentData } from '@app-types/agent';

interface AgentCacheStore {
    agents: AgentData[];
    lastFetchTime: number;
    setAgents: (agents: AgentData[]) => void;
    invalidateCache: () => void;
}

export const useAgentCacheStore = create<AgentCacheStore>((set) => ({
    agents: [],
    lastFetchTime: 0,
    setAgents: (agents) => set({ agents, lastFetchTime: Date.now() }),
    invalidateCache: () => set({ lastFetchTime: 0 })
}));
