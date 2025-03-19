import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

type CanvasMode = 'canvas' | 'live';

interface CanvasState {
    mode: CanvasMode;
    setMode: (mode: CanvasMode) => void;
}

export const useCanvasStore = create<CanvasState>()(
    devtools(set => ({
            mode: 'canvas',
            setMode: mode => set({ mode })
        }),
        {
            name: 'Canvas Store',
            enabled: process.env.NODE_ENV === 'development',
            maxAge: process.env.NODE_ENV === 'development' ? 50 : 0
        })
);
