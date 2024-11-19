'use client';
import { ReactElement } from 'react';
import { useState } from 'react';
import { useEffect } from 'react';
import '@xyflow/react/dist/style.css';
import { Controls } from '@xyflow/react';
import { Background } from '@xyflow/react';
import { BackgroundVariant } from '@xyflow/react';
import { Panel } from '@xyflow/react';
import { ControlButton } from '@xyflow/react';
import { ReactFlow } from '@xyflow/react';
import { PiPlayCircleThin } from 'react-icons/pi';
import { PiClipboardLight } from 'react-icons/pi';
import { PiArrowLeftThin } from 'react-icons/pi';
import { PiArrowRightThin } from 'react-icons/pi';
import { CiSearch } from 'react-icons/ci';
import { CiCircleCheck } from 'react-icons/ci';
import { FiUserPlus } from 'react-icons/fi';
import { IoHandRightOutline } from 'react-icons/io5';
import { LuMousePointer } from 'react-icons/lu';

import './sandbox.styles.css';
import { WorkflowRenderer } from '@app/(workspace)/sandbox/workflow-renderer';

const Sandbox = (): ReactElement => {
    const [theme, setTheme] = useState('light');

    useEffect(() => {
        // Check system preference
        if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
            setTheme('dark');
        }

        // Apply theme to html element
        document.documentElement.setAttribute('data-theme', theme);
        // Also add dark class for Tailwind
        if (theme === 'dark') {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    }, [theme]);

    const toggleTheme = () => {
        setTheme(theme === 'light' ? 'dark' : 'light');
    };

    return (
        <WorkflowRenderer>
            {({ ...props }) => (
                <div className="flow-container">
                    <ReactFlow
                        // nodeOrigin={[0.5, 0.5]}
                        // nodeDragThreshold={1}
                        // colorMode="system"
                        // nodesDraggable={false}
                        // className={theme}
                        nodesFocusable
                        autoPanOnConnect
                        panOnScroll
                        selectionOnDrag
                        panOnDrag
                        proOptions={{ hideAttribution: true }}
                        {...props}>
                        <Background variant={BackgroundVariant.Cross} gap={18} size={5} />
                        <Panel className="flow-panel">Sandbox</Panel>
                        <Controls position="top-center"
                            className="flow-controls"
                            showZoom={false}
                            showFitView={false}
                            showInteractive={false}>
                            <ControlButton onClick={() => alert('Something magical just happened. ✨')}>
                                <div className="arrow-icon">
                                    <PiArrowLeftThin
                                        className="icon-button arrow-left"
                                        strokeWidth={2} />
                                    <PiArrowRightThin
                                        className="icon-button arrow-right"
                                        strokeWidth={2} />
                                </div>
                            </ControlButton>
                            <ControlButton onClick={() => alert('Something magical just happened. ✨')}>
                                <LuMousePointer className="icon-button pointer-icon" />
                            </ControlButton>
                            <ControlButton onClick={() => alert('Something magical just happened. ✨')}>
                                <IoHandRightOutline className="icon-button hand-icon" />
                            </ControlButton>
                            <ControlButton onClick={() => alert('Something magical just happened. ✨')}>
                                <FiUserPlus
                                    className="icon-button add-agent-icon"
                                    strokeWidth={1.1}
                                />
                            </ControlButton>
                            <ControlButton onClick={() => alert('Something magical just happened. ✨')}>
                                <svg className="icon-button branches-icon" strokeWidth="1.3" viewBox="4 -4 26 26"
                                    xmlns="http://www.w3.org/2000/svg">
                                    <rect x="16.8995" y="1" width="14" height="14" transform="rotate(45 16.8995 1)"
                                        stroke="#818181" strokeLinecap="round" strokeLinejoin="round" />
                                    <path d="M1 11L7 11" stroke="#818181" strokeLinecap="round"
                                        strokeLinejoin="round" />
                                    <path d="M22 5.65686L26.2426 1.41422" stroke="#818181" strokeLinecap="round"
                                        strokeLinejoin="round" />
                                    <path d="M22 16L26.2426 20.2426" stroke="#818181" strokeLinecap="round"
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
                        <Controls position="top-center" showZoom={false} showFitView={false} showInteractive={false}
                            className="search-button">
                            <ControlButton onClick={() => alert('Something magical just happened. ✨')}>
                                <CiSearch />
                            </ControlButton>
                        </Controls>
                        <Controls position="top-right" className="test-button" showZoom={false} showFitView={false}
                            showInteractive={false}>
                            <ControlButton onClick={() => alert('Something magical just happened. ✨')}>
                                <PiPlayCircleThin />Test
                            </ControlButton>
                        </Controls>
                    </ReactFlow>
                </div>
            )}
        </WorkflowRenderer>
    );
};

export default Sandbox;
