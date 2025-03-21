import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

export type TrayType = 'agentSelection' | null;

type TrayStore = {
    isOpen: boolean;
    trayType: TrayType;
    parentNodeId?: string;
    openTray: (params: { type: TrayType; parentNodeId?: string }) => void;
    closeTray: () => void;
};

export const useTrayStore = create<TrayStore>()(
    devtools(
        (set) => ({
            isOpen: false,
            trayType: null,
            parentNodeId: undefined,
            openTray: ({ type, parentNodeId }) => {
                set({ isOpen: true, trayType: type, parentNodeId });
            },
            closeTray: () => {
                set({ isOpen: false, trayType: null, parentNodeId: undefined });
            }
        })
    )
);
