import { ReactNode } from 'react';
import { Handle } from '@xyflow/react';
import { Position } from '@xyflow/react';

import './automation.styles.css';
import { AgentCard } from '@components/agents/agent-card';

export const AutomationNode = ({ data, isConnectable }: any): ReactNode => {

    return (
        <div className="automation-node">
            <AgentCard />
            {/* progress bar */}
            {/* optional handles to connect bottom and top if nodes: are related? run in parallel? are dependent on each other? */}
            {/* possible styled handle extension as button or further detailed information */}
            <Handle type="target" position={Position.Left} id="a" isConnectable={isConnectable} />
            <Handle type="source" position={Position.Right} id="b" isConnectable={isConnectable} />
        </div>
    );
};
