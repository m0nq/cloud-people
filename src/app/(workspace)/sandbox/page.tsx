'use client';
import { useCallback } from 'react';
import { ReactFlow } from '@xyflow/react';
import { addEdge } from '@xyflow/react';
import { useNodesState } from '@xyflow/react';
import { useEdgesState } from '@xyflow/react';
import { Controls } from '@xyflow/react';
import { Background } from '@xyflow/react';
import { BackgroundVariant } from '@xyflow/react';
import { Connection } from '@xyflow/react';
import { Panel } from '@xyflow/react';
import { ControlButton } from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import './automation.styles.css';
import { AutomationNode } from './automation-node';
import { AutomationEdge } from '@app/(workspace)/sandbox/automation-edge';
import { EdgeConnections } from '@lib/definitions';

const initialNodes = [
    {
        id: '1',
        position: { x: 500, y: 100 },
        data: { label: '1' },
        type: 'automationNode'
    },
    {
        id: '2',
        position: { x: 900, y: 300 },
        data: { label: '1' },
        type: 'automationNode'
    }
    // {
    //     id: '3',
    //     position: { x: 0, y: 200 },
    //     data: { label: '3' }
    // }
];

const initialEdges = [{ id: 'e1-2', source: '1', target: '2', type: 'automationEdge' }];

const nodeTypes = {
    automationNode: AutomationNode
};

const edgeTypes = {
    automationEdge: AutomationEdge
};

const Sandbox = () => {
    const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
    const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

    const onConnect = useCallback((connection: Connection) => {
            const newEdge = { ...connection, type: 'automationEdge' } as Connection;
            setEdges((currentEdges: EdgeConnections[]) => addEdge(newEdge, currentEdges));
        }, [setEdges]
    );

    return (
        <div className="flow-container">
            <ReactFlow
                nodeTypes={nodeTypes}
                edgeTypes={edgeTypes}
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                // onNodeClick to handle opening node details?
                // onNodeClick={onNodesChange}
                onEdgesChange={onEdgesChange}
                onConnect={onConnect}
                // nodeOrigin={[0, 0]}
                // nodeDragThreshold={1}
                // colorMode="system"
                // nodesDraggable={false}
                nodesFocusable
                autoPanOnConnect
                panOnScroll
                selectionOnDrag>
                <Panel className="flow-panel">Sandbox</Panel>
                <Background variant={BackgroundVariant.Cross} gap={18} size={5} />
                <Controls position="top-center"
                    className="flow-controls"
                    showZoom={false}
                    showFitView={false}
                    showInteractive={false}>
                    <ControlButton onClick={() => alert('Something magical just happened. ✨')}>
                        Button
                    </ControlButton>
                    <ControlButton onClick={() => alert('Something magical just happened. ✨')}>
                        Button
                    </ControlButton>
                    <ControlButton onClick={() => alert('Something magical just happened. ✨')}>
                        Button
                    </ControlButton>
                    <ControlButton onClick={() => alert('Something magical just happened. ✨')}>
                        Button
                    </ControlButton>
                    <ControlButton onClick={() => alert('Something magical just happened. ✨')}>
                        Button
                    </ControlButton>
                    <ControlButton onClick={() => alert('Something magical just happened. ✨')}>
                        Button
                    </ControlButton>
                    <ControlButton onClick={() => alert('Something magical just happened. ✨')}>
                        Button
                    </ControlButton>
                </Controls>
                <Controls position="top-center"
                    showZoom={false}
                    showFitView={false}
                    showInteractive={false}>
                    <ControlButton onClick={() => alert('Something magical just happened. ✨')}>
                        Button
                    </ControlButton>
                </Controls>
                <Controls position="top-right"
                    showZoom={false}
                    showFitView={false}
                    showInteractive={false}>
                    <ControlButton onClick={() => alert('Something magical just happened. ✨')}>
                        Test
                    </ControlButton>
                </Controls>
            </ReactFlow>
        </div>
    );
};

export default Sandbox;
