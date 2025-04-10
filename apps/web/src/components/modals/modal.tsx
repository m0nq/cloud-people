import { IoMdClose } from 'react-icons/io';
import { useEffect } from 'react';
import { useCallback } from 'react';

import './modal.styles.css';
import { useModalStore } from '@stores/modal-store';
import { useWorkflowStore } from '@stores/workflow';
import { ModalComponents } from './modal-component.type';
import { useShallow } from 'zustand/react/shallow';

const Modal = () => {
    const { isOpen, modalType, closeModal, parentNodeId } = useModalStore(
        useShallow(state => ({
            isOpen: state.isOpen,
            modalType: state.modalType,
            closeModal: state.closeModal,
            parentNodeId: state.parentNodeId
        }))
    );

    const { addNode } = useWorkflowStore(useShallow(state => ({ addNode: state.addNode })));

    const handleSelect = useCallback((agentData) => {
        addNode(agentData);
    },
        [addNode]
    );

    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                closeModal();
            }
        };

        window.addEventListener('keydown', handleEscape);
        return () => window.removeEventListener('keydown', handleEscape);
    }, [closeModal]);

    if (!isOpen || !modalType) {
        return null;
    }

    const ModalComponent = ModalComponents[modalType];
    if (!ModalComponent) {
        console.error(`[Modal Component] Modal type "${modalType}" not found in ModalComponents.`);
        return null;
    }

    return (
        <div className="modal-overlay" onClick={closeModal}>
            <div className="modal-container" onClick={e => e.stopPropagation()}>
                <ModalComponent onSelect={handleSelect} onClose={closeModal} parentNodeId={parentNodeId}>
                    <button onClick={closeModal} className="close-button">
                        <span className="sr-only">Close</span>
                        <IoMdClose fill="#ffffff" size={24} />
                    </button>
                </ModalComponent>
            </div>
        </div>
    );
};

export default Modal;
