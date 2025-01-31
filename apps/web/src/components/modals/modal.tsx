import { IoMdClose } from 'react-icons/io';
import { useEffect } from 'react';

import './modal.styles.css';
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
        <div className="modal-overlay" onClick={closeModal}>
            <div className="modal-container" onClick={e => e.stopPropagation()}>
                <ModalComponent onSelect={addNode} onClose={closeModal} parentNodeId={parentNodeId}>
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
