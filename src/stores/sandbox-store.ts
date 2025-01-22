import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

type SandboxMode = 'sandbox' | 'live';

interface SandboxState {
    mode: SandboxMode;
    setMode: (mode: SandboxMode) => void;
}

export const useSandboxStore = create<SandboxState>()(
    devtools(set => ({
            mode: 'sandbox',
            setMode: mode => set({ mode })
        }),
        {
            name: 'Sandbox Store',
            enabled: process.env.NODE_ENV === 'development',
            maxAge: process.env.NODE_ENV === 'development' ? 50 : 0
        })
);
