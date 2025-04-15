import { Handle, Position } from '@xyflow/react';
import { type NodeProps } from '@xyflow/react'; 
import { type ReactNode } from 'react';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { HiOutlinePencilAlt } from 'react-icons/hi';
import { HiOutlineCheck } from 'react-icons/hi';

// Extend Record<string, unknown> to satisfy Node<T> constraint.
export interface ConditionNodeData extends Record<string, unknown> {
  ifCondition: string;
  thenAction: string;
}

// Define props explicitly to bypass potential generic issues
interface ExplicitConditionNodeProps {
  id: string;
  data: ConditionNodeData;
  selected?: boolean;
  type?: string;
  isConnectable?: boolean;
  xPos?: number; // Optional based on React Flow version/usage
  yPos?: number; // Optional based on React Flow version/usage
  dragging?: boolean;
  zIndex?: number;
  targetPosition?: Position;
  sourcePosition?: Position;
  // Add other props from NodeProps if needed
}

// Use the explicit props interface
export const ConditionNode = ({ data }: ExplicitConditionNodeProps): ReactNode => {
  const [isEditing, setIsEditing] = useState(false);
  const [ifCondition, setIfCondition] = useState(data.ifCondition || '');
  const [thenAction, setThenAction] = useState(data.thenAction || '');

  const handleSave = () => {
    // Here you would update the node data in your store
    // This is just updating the local state for now
    data.ifCondition = ifCondition;
    data.thenAction = thenAction;
    setIsEditing(false);
  };

  return (
    <motion.div
      className="condition-node"
      initial={{ scale: 0.8 }}
      animate={{ scale: 1 }}
      transition={{ duration: 0.3 }}
    >
      <div className="condition-node-header">
        <h3>Condition</h3>
        <button
          className="condition-node-edit-button"
          onClick={() => setIsEditing(!isEditing)}
          title={isEditing ? "Save" : "Edit"}
        >
          {isEditing ? (
            <HiOutlineCheck className="edit-icon" onClick={handleSave} />
          ) : (
            <HiOutlinePencilAlt className="edit-icon" />
          )}
        </button>
      </div>
      <div className="condition-node-content">
        {isEditing ? (
          <div className="condition-node-form">
            <div className="condition-node-field">
              <label htmlFor="if-condition">IF this</label>
              <textarea
                id="if-condition"
                value={ifCondition}
                onChange={(e) => setIfCondition(e.target.value)}
                placeholder="Enter condition..."
                autoFocus
              />
            </div>
            <div className="condition-node-field">
              <label htmlFor="then-action">THEN that</label>
              <textarea
                id="then-action"
                value={thenAction}
                onChange={(e) => setThenAction(e.target.value)}
                placeholder="Enter action..."
              />
            </div>
          </div>
        ) : (
          <div className="condition-node-display">
            <div className="condition-node-field">
              <h4>IF this</h4>
              <p>{ifCondition || "No condition set"}</p>
            </div>
            <div className="condition-node-field">
              <h4>THEN that</h4>
              <p>{thenAction || "No action set"}</p>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
};
