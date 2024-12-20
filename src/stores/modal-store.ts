import { create } from 'zustand';

interface ModalStore {
    isOpen: boolean;
    modalType: string | null;
    modalProps: any;
    parentNodeId: string;
    openModal: ({ parentNodeId, type }: { parentNodeId: string; type: string }) => void;
    closeModal: () => void;
}

export const useModalStore = create<ModalStore>(set => ({
    isOpen: false,
    modalType: null,
    modalProps: null,
    parentNodeId: '',
    openModal: ({ type, parentNodeId }) => {
        set({
            isOpen: true,
            modalType: type,
            parentNodeId,
            modalProps: {}
        });
    },
    closeModal: () => {
        set({
            isOpen: false,
            modalType: null,
            modalProps: null,
            parentNodeId: ''
        });
    }
}));
