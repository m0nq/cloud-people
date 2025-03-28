import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

export type TrayType = 'agent-selection' | null;

type TrayStore = {
    isOpen: boolean;
    trayType: TrayType;
    sourceNodeId?: string | null;
    openTray: (params: { type: TrayType; sourceNodeId?: string | null }) => void;
    closeTray: () => void;
};

export const useTrayStore = create<TrayStore>()(
    devtools(
        (set) => ({
            isOpen: false,
            trayType: null,
            sourceNodeId: undefined,
            openTray: ({ type, sourceNodeId }) => {
                set({ isOpen: true, trayType: type, sourceNodeId });
            },
            closeTray: () => {
                set({ isOpen: false, trayType: null, sourceNodeId: undefined });
            }
        })
    )
);
