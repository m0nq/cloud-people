import { create } from 'zustand';

type SandboxMode = 'sandbox' | 'live';

interface SandboxState {
    mode: SandboxMode;
    setMode: (mode: SandboxMode) => void;
}

export const useSandboxStore = create<SandboxState>(set => ({
    mode: 'live',
    setMode: mode => set({ mode })
}));
