'use client';
import { useCallback } from 'react';
import { ReactFlow } from '@xyflow/react';
import { addEdge } from '@xyflow/react';
import { useNodesState } from '@xyflow/react';
import { useEdgesState } from '@xyflow/react';
import { Connection } from '@xyflow/react';
import { Controls } from '@xyflow/react';
import { Background } from '@xyflow/react';
import { BackgroundVariant } from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { AutomationNode } from './automation-node';

const initialNodes = [
    {
        id: '1',
        position: { x: 0, y: 0 },
        data: { label: '1' },
        type: 'automationNode'
    },
    { id: '2', position: { x: 0, y: 100 }, data: { label: '2' } },
    { id: '3', position: { x: 0, y: 200 }, data: { label: '3' } }
];

const initialEdges = [{ id: 'e1-2', source: '1', target: '2' }];

const nodeTypes = { automationNode: AutomationNode };

const Sandbox = () => {
    const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
    const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

    const onConnect = useCallback((edgeParams: Connection) => {
            setEdges((eds) => addEdge(edgeParams, eds));
        }, [setEdges]
    );

    return (
        <div className="w-full h-full">
            <ReactFlow
                nodeTypes={nodeTypes}
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onConnect={onConnect}
                panOnScroll
                selectionOnDrag>
                <Background variant={BackgroundVariant.Cross} gap={10} size={5} />
                <Controls />
            </ReactFlow>
        </div>
    );
};

export default Sandbox;
