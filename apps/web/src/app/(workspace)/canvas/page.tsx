'use client';
import { ReactNode } from 'react';
import { useState } from 'react';
import { Profiler } from 'react';
import '@xyflow/react/dist/style.css';
import { Panel } from '@xyflow/react';
import { ReactFlow } from '@xyflow/react';
import { LuMousePointer } from 'react-icons/lu';
import { LuClock4 } from 'react-icons/lu';
import { IoHandRightOutline } from 'react-icons/io5';
import { FiUserPlus } from 'react-icons/fi';
import { PiClipboardLight } from 'react-icons/pi';
import { CiCircleCheck } from 'react-icons/ci';
import { CiSearch } from 'react-icons/ci';
import { TbCalendarTime } from 'react-icons/tb';
import { HiOutlinePencilAlt } from 'react-icons/hi';

import './canvas.styles.css';
import { WorkflowRenderer } from './workflow-renderer';
import { CanvasController } from '@components/canvas-controller/canvas-controller';
import { CanvasRunButton } from '@components/canvas-run-button/canvas-run-button';
import { BranchesIcon } from '@components/icons/branches-icon';
import { DatePicker } from '@components/calendar/date-picker';

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
const ConditionalProfiler = ({ id, children }: { id: string; children: ReactNode }): ReactNode => {
    if (process.env.NODE_ENV === 'development') {
        return <Profiler id={id} onRender={onRenderCallback}>{children}</Profiler>;
    }
    return children;
};

const Canvas = (): ReactNode => {
    const [isCalendarOpen, setIsCalendarOpen] = useState(false);

    const handleDateSelect = (dates: Date) => {
        console.log('Selected date:', dates);
        // Add your date handling logic here
    };

    return (
        <ConditionalProfiler id="WorkflowContainer">
            <WorkflowRenderer>
                {({ ...props }): ReactNode => (
                    <div className="flow-container">
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
                            <Panel className="flow-panel">
                                <CanvasController />
                                <CanvasRunButton />
                            </Panel>
                            <Panel className="flow-controls">
                                <button onClick={() => alert('Something magical just happened. ✨')}>
                                    <LuMousePointer className="icon-button" strokeWidth={1.5} />
                                </button>
                                <button onClick={() => alert('Something magical just happened. ✨')}>
                                    <IoHandRightOutline className="icon-button" strokeWidth={1.5} />
                                </button>
                                <button onClick={() => alert('Something magical just happened. ✨')}>
                                    <FiUserPlus className="icon-button" strokeWidth={1.5} />
                                </button>
                                <button onClick={() => setIsCalendarOpen(true)}>
                                    <TbCalendarTime className="icon-button" strokeWidth={1.5} />
                                </button>
                                <button onClick={() => alert('Something magical just happened. ✨')}>
                                    <BranchesIcon className="icon-button" />
                                </button>
                                <button onClick={() => alert('Something magical just happened. ✨')}>
                                    <PiClipboardLight className="icon-button" strokeWidth={1.5} />
                                </button>
                                <button onClick={() => alert('Something magical just happened. ✨')}>
                                    <CiCircleCheck className="icon-button" strokeWidth={0.5} />
                                </button>
                                <button onClick={() => alert('Something magical just happened. ✨')}>
                                    <HiOutlinePencilAlt className="icon-button" strokeWidth={1.5} />
                                </button>
                                <button onClick={() => alert('Something magical just happened. ✨')}>
                                    <CiSearch className="icon-button" strokeWidth={0.5} />
                                </button>
                            </Panel>
                            <Panel className="timing-controls">
                                <button onClick={() => alert('Something magical just happened. ✨')}>
                                    <LuClock4 className="icon-button" strokeWidth={1.5} />
                                </button>
                            </Panel>
                            {isCalendarOpen && (
                                <Panel className="calendar-panel">
                                    <DatePicker isOpen={isCalendarOpen} onClose={() => setIsCalendarOpen(false)} onDateSelect={handleDateSelect} />
                                </Panel>
                            )}
                        </ReactFlow>
                    </div>
                )}
            </WorkflowRenderer>
        </ConditionalProfiler>
    );
};

export default Canvas;
