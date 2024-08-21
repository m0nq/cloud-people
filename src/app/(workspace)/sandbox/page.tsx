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
import { PiPlayCircleThin } from 'react-icons/pi';
import { PiClipboardLight } from 'react-icons/pi';
import { CiSearch } from 'react-icons/ci';
import { CiCircleCheck } from 'react-icons/ci';
import { FiUserPlus } from 'react-icons/fi';
import { IoHandRightOutline } from 'react-icons/io5';

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
                <Background variant={BackgroundVariant.Cross} gap={18} size={5} />
                <Panel className="flow-panel">Sandbox</Panel>
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
                        <IoHandRightOutline className="icon-button hand-icon" />
                    </ControlButton>
                    <ControlButton onClick={() => alert('Something magical just happened. ✨')}>
                        <FiUserPlus className="icon-button add-agent-icon" strokeWidth={1.1} />
                    </ControlButton>
                    <ControlButton onClick={() => alert('Something magical just happened. ✨')}>
                        <svg className="icon-button branches-icon"
                            strokeWidth="1.1"
                            viewBox="4 -4 26 26"
                            xmlns="http://www.w3.org/2000/svg">
                            <rect x="16.8995" y="1" width="14" height="14" transform="rotate(45 16.8995 1)"
                                stroke="#9CA3AF" strokeLinecap="round" strokeLinejoin="round" />
                            <path d="M1 11L7 11" stroke="#9CA3AF" strokeLinecap="round" strokeLinejoin="round" />
                            <path d="M22 5.65686L26.2426 1.41422" stroke="#9CA3AF" strokeLinecap="round"
                                strokeLinejoin="round" />
                            <path d="M22 16L26.2426 20.2426" stroke="#9CA3AF" strokeLinecap="round"
                                strokeLinejoin="round" />
                        </svg>
                    </ControlButton>
                    <ControlButton onClick={() => alert('Something magical just happened. ✨')}>
                        <PiClipboardLight className="icon-button" />
                    </ControlButton>
                    <ControlButton onClick={() => alert('Something magical just happened. ✨')}>
                        <CiCircleCheck className="icon-button" />
                    </ControlButton>
                </Controls>
                <Controls position="top-center"
                    showZoom={false}
                    showFitView={false}
                    showInteractive={false}
                    className="search-button">
                    <ControlButton onClick={() => alert('Something magical just happened. ✨')}>
                        <CiSearch />
                    </ControlButton>
                </Controls>
                <Controls position="top-right"
                    className="test-button"
                    showZoom={false}
                    showFitView={false}
                    showInteractive={false}>
                    <ControlButton onClick={() => alert('Something magical just happened. ✨')}>
                        <PiPlayCircleThin />Test
                    </ControlButton>
                </Controls>
            </ReactFlow>
        </div>
    );
};

export default Sandbox;
