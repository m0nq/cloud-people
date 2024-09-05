import { ReactNode } from 'react';

import './node.styles.css';

type InitialStateNodeProps = {
    id: string;
    data: {
        label: string;
        styles: string;
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
    // - AI pops up a modal
    return (
        //<button className={`init-node nodrag ${data.styles}`}>
        <button className={`init-node ${data.styles}`}>
            <div className="init-node-label">{data.label}</div>
        </button>
    );
};
