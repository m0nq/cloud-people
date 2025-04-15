'use client';
import { ReactNode } from 'react';
import { useState } from 'react';
import { Profiler } from 'react';
import '@xyflow/react/dist/style.css';
import { Panel } from '@xyflow/react';
import { ReactFlow } from '@xyflow/react';
import { Node } from '@xyflow/react';
import { FiUserPlus } from 'react-icons/fi';
import { PiClipboardLight } from 'react-icons/pi';
import { CiSearch } from 'react-icons/ci';
import { TbCalendarTime } from 'react-icons/tb';
import { HiOutlinePencilAlt } from 'react-icons/hi';
import { LinkNodeIcon } from '@components/icons/link-node-icon';
import { Toggle } from '@components/toggle/toggle';

import './canvas.styles.css';
import { WorkflowRenderer } from './workflow-renderer';
import { DatePicker } from '@components/calendar/date-picker';
import { useThemeStore } from '@stores/theme-store';
import { useTrayStore } from '@stores/tray-store';
import { Tray } from '@components/trays/tray';
import { useWorkflowStore } from '@stores/workflow';
import { useWorkspaceStore } from '@stores/workspace-store';
import { NodeType } from '@app-types/workflow/node-types';
import { NodeData } from '@app-types/workflow';

// Profiler callback function to measure render performance
// Only active in development mode
const onRenderCallback = (
    id: string,
    phase: string,
    actualDuration: number,
    baseDuration: number,
    startTime: number,
    commitTime: number
) => {
    // Only log in development mode
    if (process.env.NODE_ENV === 'development') {
        console.log(`Profiler [${id}] - ${phase}:`);
        console.log(`  Actual duration: ${actualDuration.toFixed(2)}ms`);
        console.log(`  Base duration: ${baseDuration.toFixed(2)}ms`);
        console.log(`  Start time: ${startTime.toFixed(2)}ms`);
        console.log(`  Commit time: ${commitTime.toFixed(2)}ms`);
    }
};

// Conditional Profiler component that only profiles in development
const ConditionalProfiler = ({ id, children }: { id: string; children: ReactNode; }): ReactNode => {
    if (process.env.NODE_ENV === 'development') {
        return <Profiler id={id} onRender={onRenderCallback}>{children}</Profiler>;
    }
    return children;
};

const Canvas = (): ReactNode => {
    const { isDarkMode } = useThemeStore();
    const { openTray } = useTrayStore();
    const addNode = useWorkflowStore((state) => state.addNode);
    const { currentWorkspace } = useWorkspaceStore();
    const [featureEnabled, setFeatureEnabled] = useState(true);

    // Function to handle opening the agent selection tray
    const handleOpenAgentTray = () => {
        openTray({ type: 'agent-selection', sourceNodeId: null });
    };

    const handleAddDatePicker = () => {
        const newNode = {
            id: `date-${Date.now()}`,
            type: NodeType.DatePicker,
            data: {
                id: `date-${Date.now()}`,
                type: NodeType.DatePicker,
                label: 'Schedule',
                selectedDate: undefined
            },
            position: { x: Math.random() * 500, y: Math.random() * 300 }
        } as Node<NodeData>;
        addNode(newNode);
    };

    const handleAddStickyNote = () => {
        const newNode: Node<NodeData> = {
            id: `note-${Date.now()}`,
            type: NodeType.StickyNote,
            data: {
                id: `note-${Date.now()}`,
                type: NodeType.StickyNote,
                label: 'Note',
                content: ''
            },
            position: { x: Math.random() * 500, y: Math.random() * 300 }
        };
        addNode(newNode);
    };

    const handleAddCondition = () => {
        const newNode: Node<NodeData> = {
            id: `condition-${Date.now()}`,
            type: NodeType.Condition,
            data: {
                id: `condition-${Date.now()}`,
                type: NodeType.Condition,
                label: 'Condition',
                ifCondition: '',
                thenAction: ''
            },
            position: { x: Math.random() * 500, y: Math.random() * 300 }
        };
        addNode(newNode);
    };

    return (
        <ConditionalProfiler id="WorkflowContainer">
            <WorkflowRenderer>
                {({ ...props }): ReactNode => (
                    <div className={`flow-container ${isDarkMode ? 'dark' : 'light'}`}>
                        <div className="flow-header">
                            <h1>{currentWorkspace?.name || 'Untitled Project'}</h1>
                        </div>
                        <Toggle
                            initialState={featureEnabled}
                            onChange={(isOn) => setFeatureEnabled(isOn)}
                            label="Environment"
                        />
                        <ReactFlow
                            nodeOrigin={[0.5, 0.5]}
                            nodesDraggable
                            nodesFocusable
                            autoPanOnConnect
                            panOnScroll
                            selectionOnDrag
                            panOnDrag
                            proOptions={{ hideAttribution: true }}
                            {...props}>
                            <Panel position="bottom-center" className="flow-controls">
                                <button onClick={handleOpenAgentTray}>
                                    <FiUserPlus className="icon-button" strokeWidth={1.5} />
                                </button>
                                <button
                                    onClick={handleAddDatePicker}
                                    title="Add Schedule"
                                    aria-label="Add Schedule">
                                    <TbCalendarTime className="icon-button" strokeWidth={1.5} />
                                </button>
                                <button
                                    onClick={handleAddStickyNote}
                                    title="Add Note"
                                    aria-label="Add Note"
                                    data-component-name="WorkflowRenderer">
                                    <PiClipboardLight className="icon-button" strokeWidth={1.5} />
                                </button>
                                <button
                                    onClick={handleAddCondition}
                                    title="Add Condition"
                                    aria-label="Add Condition"
                                    data-component-name="WorkflowRenderer">
                                    <LinkNodeIcon className="icon-button" />
                                </button>
                                <button onClick={() => alert('Something magical just happened. ✨')}>
                                    <HiOutlinePencilAlt className="icon-button" strokeWidth={1.5} />
                                </button>
                                <button onClick={() => alert('Something magical just happened. ✨')}>
                                    <CiSearch className="icon-button" strokeWidth={0.5} />
                                </button>
                            </Panel>
                        </ReactFlow>
                        <Tray />
                    </div >
                )}
            </WorkflowRenderer >
        </ConditionalProfiler >
    );
};

export default Canvas;
