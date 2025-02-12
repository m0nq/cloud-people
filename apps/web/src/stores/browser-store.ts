import { create } from 'zustand';
import { Browser } from '@playwright/test';
import { BrowserContext } from '@playwright/test';

interface BrowserState {
    browser: Browser | null;
    contexts: Map<string, BrowserContext>;
    setBrowser: (browser: Browser | null) => void;
    setContext: (id: string, context: BrowserContext) => void;
    removeContext: (id: string) => void;
    cleanup: () => void;
}

export const useBrowserStore = create<BrowserState>((set, get) => ({
    browser: null,
    contexts: new Map(),
    setBrowser: (browser) => set({ browser }),
    setContext: (id, context) => {
        const { contexts } = get();
        contexts.set(id, context);
        set({ contexts: new Map(contexts) });
    },
    removeContext: (id) => {
        const { contexts } = get();
        contexts.delete(id);
        set({ contexts: new Map(contexts) });
    },
    cleanup: () => set({ browser: null, contexts: new Map() })
}));
