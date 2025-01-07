import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

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

export const useModalStore = create<ModalStore>()(
    devtools(
        set => ({
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
        }),
        {
            name: 'Modal Store',
            enabled: process.env.NODE_ENV === 'development',
            maxAge: process.env.NODE_ENV === 'development' ? 50 : 0
        }
    )
);
