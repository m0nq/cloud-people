import { ReactNode } from 'react';

import './node.styles.css';
import { useWorkflowStore } from '@stores/workflow';
import type { WorkflowActions } from '@app-types/workflow';

type InitialStateNodeProps = {
    data: {
        id: string;
        label: string;
        background?: string;
        color?: string;
    };
};

const InitialStateNode = ({ data }: InitialStateNodeProps): ReactNode => {
    // when a node is clicked, corresponding nodes will be updated by zustand
    // this needs to be a link or button to update node state with passed in setNodes
    // which, depending on which initial node it is will update to the appropriate state
    // - SfS updates nodes with root automation node
    // - template opens a modal which leads to copy a workflow template (nodes & edges) into the list
    // - AI opens a modal
    const fetchGraph = useWorkflowStore((state: WorkflowActions) => state.fetchGraph)!;
    const createNewWorkflow = useWorkflowStore((state: WorkflowActions) => state.createNewWorkflow)!;

    const handleClick = () => {
        // if data.label is SFS, then transition to empty node building state
        switch (data.id) {
            case 'SFS':
                createNewWorkflow();
                break;
            case 'SFT':
                fetchGraph(data.id);
                break;
            case 'SFA':
                break;
        }
        // otherwise pop up for specific label with details and actions
    };

    return (
        <button className="init-node nodrag"
            style={{ background: data?.background, color: data?.color }}
            onClick={handleClick}>
            <div className="init-node-label">{data.label}</div>
        </button>
    );
};

export default InitialStateNode;
