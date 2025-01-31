'use client';
import { ReactNode } from 'react';
import { useState } from 'react';
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

import './sandbox.styles.css';
import { WorkflowRenderer } from './workflow-renderer';
import { SandboxController } from '@components/sandbox-controller/sandbox-controller';
import { SandboxRunButton } from '@components/sandbox-run-button/sandbox-run-button';
import { BranchesIcon } from '@components/icons/branches-icon';
import { DatePicker } from '@components/calendar/date-picker';

const Sandbox = (): ReactNode => {
    const [isCalendarOpen, setIsCalendarOpen] = useState(false);

    const handleDateSelect = (dates: Date) => {
        console.log('Selected date:', dates);
        // Add your date handling logic here
    };

    return (
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
                            <SandboxController />
                            <SandboxRunButton />
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
    );
};

export default Sandbox;
