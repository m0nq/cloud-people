import { ReactNode } from 'react';

import './node.styles.css';
import { useStore } from '@stores/workflowStore';
import { fetchWorkflowNodes } from '@lib/actions/sandbox-actions';
import { fetchWorkflowEdges } from '@lib/actions/sandbox-actions';

type InitialStateNodeProps = {
    id: string;
    data: {
        label: string;
        background?: string;
        color?: string;
    };
};

export const InitialStateNode = ({
    id,
    data
}: InitialStateNodeProps): ReactNode => {

    // when a node is clicked, corresponding nodes will be updated by zustand
    // this needs to be a link or button to update node state with passed in setNodes
    // which, depending on which initial node it is will update to the appropriate state
    // - SfS updates nodes with root automation node
    // - template opens a modal which leads to copy a workflow template (nodes & edges) into the list
    // - AI opens a modal
    const setNodes = useStore((state) => state.setNodes)!;
    const setEdges = useStore((state) => state.setEdges)!;

    return (
        <button className="init-node nodrag"
            style={{ background: data?.background, color: data?.color }}
            onClick={async () => {
                setNodes(fetchWorkflowNodes());
                setEdges(fetchWorkflowEdges());
            }}>
            <div className="init-node-label">{data.label}</div>
        </button>
    );
};
