import { ReactNode } from 'react';

import './node.styles.css';
import { useGraphStore } from '@stores/workflow-store';
import { AppState } from '@lib/definitions';

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
    const fetchGraph = useGraphStore((state: AppState) => state.fetchGraph)!;
    const createNewWorkflow = useGraphStore((state: AppState) => state.createNewWorkflow)!;

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
        <button className="init-node nodrag" style={{ background: data?.background, color: data?.color }} onClick={handleClick}>
            <div className="init-node-label">{data.label}</div>
        </button>
    );
};

export default InitialStateNode;
