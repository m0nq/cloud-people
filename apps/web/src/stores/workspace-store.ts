import { create } from 'zustand';

interface Workspace {
    id: string;
    name: string;
}

interface WorkspaceState {
    currentWorkspace: Workspace | null;
    setCurrentWorkspace: (workspace: Workspace) => void;
}

export const useWorkspaceStore = create<WorkspaceState>((set) => ({
    currentWorkspace: {
        id: '1',
        name: 'Cloud People'
    },
    setCurrentWorkspace: (workspace) => set({ currentWorkspace: workspace })
}));
