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

const initialNodes = [
    { id: '1', position: { x: 0, y: 0 }, data: { label: '1' } },
    { id: '2', position: { x: 0, y: 100 }, data: { label: '2' } }
];

const initialEdges = [{ id: 'e1-2', source: '1', target: '2' }];

// TODO: This isn't displaying for some reason...
const Sandbox = () => {
    const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
    const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

    const onConnect = useCallback(
        (params: Connection) => setEdges((eds) => addEdge(params, eds)),
        [setEdges]
    );

    return (
        <div className="w-full h-full">
            <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onConnect={onConnect}>
                <Background variant={BackgroundVariant.Cross} gap={14} size={5} />
                <Controls />
                {/*<MiniMap />*/}
            </ReactFlow>
        </div>
    );
};

export default Sandbox;
