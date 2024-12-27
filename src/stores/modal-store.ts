import { create } from 'zustand';

interface ModalStore {
    isOpen: boolean;
    isFromModal: boolean;
    modalType: string | null;
    modalProps: any;
    parentNodeId: string;
    openModal: ({ parentNodeId, type, isFromModal }: {
        parentNodeId: string;
        type: string;
        isFromModal?: boolean
    }) => void;
    closeModal: () => void;
}

export const useModalStore = create<ModalStore>(set => ({
    isOpen: false,
    isFromModal: false,
    modalType: null,
    modalProps: null,
    parentNodeId: '',
    openModal: ({ type, parentNodeId, isFromModal = false }) => {
        set({
            isOpen: true,
            modalType: type,
            isFromModal,
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
