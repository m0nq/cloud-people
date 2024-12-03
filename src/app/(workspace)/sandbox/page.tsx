'use client';
import { ReactNode } from 'react';
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
import { WorkflowRenderer } from '@app/(workspace)/sandbox/workflow-renderer';
import { SandboxController } from '@components/sandbox-controller/sandbox-controller';
import { SandboxRunButton } from '@components/sandbox-run-button/sandbox-run-button';

const Sandbox = (): ReactNode => {
    return (
        <WorkflowRenderer>
            {({ ...props }): ReactNode => (
                <div className="flow-container">
                    <ReactFlow nodeOrigin={[0.5, 0.5]}
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
                            <button onClick={() => alert('Something magical just happened. ✨')}>
                                <TbCalendarTime className="icon-button" strokeWidth={1.5} />
                            </button>
                            <button onClick={() => alert('Something magical just happened. ✨')}>
                                <svg className="icon-button branches-icon" viewBox="4 -4 26 26"
                                    xmlns="http://www.w3.org/2000/svg">
                                    <rect x="16.8995"
                                        y="1"
                                        width="14"
                                        height="14"
                                        transform="rotate(45 16.8995 1)"
                                        stroke="currentColor"
                                        strokeWidth="1.5"
                                        strokeLinecap="round"
                                        strokeLinejoin="round" />
                                    <path d="M1 11L7 11"
                                        stroke="currentColor"
                                        strokeWidth="1.5"
                                        strokeLinecap="round"
                                        strokeLinejoin="round" />
                                    <path d="M22 5.65686L26.2426 1.41422"
                                        stroke="currentColor"
                                        strokeWidth="1.5"
                                        strokeLinecap="round"
                                        strokeLinejoin="round" />
                                    <path d="M22 16L26.2426 20.2426"
                                        stroke="currentColor"
                                        strokeWidth="1.5"
                                        strokeLinecap="round"
                                        strokeLinejoin="round" />
                                </svg>
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
                    </ReactFlow>
                </div>
            )}
        </WorkflowRenderer>
    );
};

export default Sandbox;
