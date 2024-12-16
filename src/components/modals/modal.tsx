import { useEffect } from 'react';

import { useModalStore } from '@stores/modal-store';
import { useGraphStore } from '@stores/workflow-store';
import { ModalComponents } from './modal-component.type';

const Modal = () => {
    const { isOpen, modalType, closeModal, parentNodeId } = useModalStore();
    const { addNode } = useGraphStore();

    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                closeModal();
            }
        };

        window.addEventListener('keydown', handleEscape);
        return () => window.removeEventListener('keydown', handleEscape);
    }, [closeModal]);

    if (!isOpen || !modalType) return null;

    const ModalComponent = ModalComponents[modalType];
    if (!ModalComponent) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="relative bg-white rounded-lg shadow-xl">
                <ModalComponent onSelect={addNode} onClose={closeModal} parentNodeId={parentNodeId} />
            </div>
        </div>
    );
};

export default Modal;
