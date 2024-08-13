import { ReactNode } from 'react';
import { Handle } from '@xyflow/react';
import { Position } from '@xyflow/react';

import './automation.styles.css';

export const AutomationNode = ({ data, isConnectable }: any): ReactNode => {
    console.log('data ->', data);
    console.log('isConnectable ->', isConnectable);

    return (
        <div className="automation-node">
            <div className="job-runner-title">
                {/*<Image src={} alt=""/>*/}
                <h3>Rico Researcher</h3>
            </div>
            <div>
                <p>My Objective was:</p>
                <p>I analyze instagram top trends, rank them and build a document sharing evidence for my findings.</p>
            </div>
            {/* possible icons of services used */}
            {/* status */}
            <div>
                <p>Standing by</p>
                <div>
                    <p>Completed on</p>
                    {/* optional completed date */}
                    <p>1/24 @ 11:33</p>
                </div>
            </div>
            {/* progress bar */}
            {/* optional handles to connect bottom and top if nodes: are related? run in parallel? are dependent on each other? */}
            {/* possible styled handle extension as button or further detailed information */}
            <Handle type="target" position={Position.Left} id="a" isConnectable={isConnectable} />
            <Handle type="source" position={Position.Right} id="b" isConnectable={isConnectable} />
        </div>
    );
};
