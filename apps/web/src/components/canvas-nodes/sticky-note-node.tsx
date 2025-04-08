import { type ReactNode } from 'react';
import { useState } from 'react';
import { type Node } from '@xyflow/react';
import { type NodeProps } from '@xyflow/react';
import { motion, AnimatePresence } from 'framer-motion';
import { HiOutlinePencilAlt } from 'react-icons/hi';
import { IoCheckmarkOutline } from 'react-icons/io5';

import { type StickyNoteNodeData } from '@app-types/workflow';
import { NodeType } from '@app-types/workflow/node-types';
import './node.styles.css';

type Props = {
    data: {
        id: string;
        type: NodeType.StickyNote;
        label: string;
        content: string;
        workflowId?: string;
    };
    selected?: boolean;
    dragging?: boolean;
};

const StickyNoteNode = ({ data }: Props): ReactNode => {
    const [isEditing, setIsEditing] = useState(false);
    const [content, setContent] = useState(data.content || '');

    const handleSave = () => {
        setIsEditing(false);
        // TODO: Save content to backend
    };

    return (
        <motion.div
            className="sticky-note-node nodrag"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ type: "spring", stiffness: 500, damping: 30 }}
        >
            <div className="sticky-note-header">
                <span className="sticky-note-label">{data.label}</span>
                <motion.button
                    className="edit-button"
                    onClick={() => isEditing ? handleSave() : setIsEditing(true)}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                >
                    {isEditing ? (
                        <IoCheckmarkOutline className="icon" />
                    ) : (
                        <HiOutlinePencilAlt className="icon" />
                    )}
                </motion.button>
            </div>
            <AnimatePresence mode="wait">
                {isEditing ? (
                    <motion.textarea
                        key="textarea"
                        className="sticky-note-textarea"
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        placeholder="Write your note here..."
                        autoFocus
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                    />
                ) : (
                    <motion.div
                        key="content"
                        className="sticky-note-content"
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        transition={{ duration: 0.2 }}
                    >
                        {content || 'Empty note...'}
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
};

export default StickyNoteNode;
