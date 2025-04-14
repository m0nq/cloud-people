'use client';

import { useState } from 'react';
import { useUser } from '@contexts/user-context';

interface DevToolbarProps {
    position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
}

export const DevToolbar = ({ position = 'bottom-right' }: DevToolbarProps) => {
    const { usingMockService, toggleServiceMode } = useUser();
    const [isExpanded, setIsExpanded] = useState(false);

    // Only show in development mode
    if (process.env.NODE_ENV !== 'development') {
        return null;
    }

    // Position styles
    const positionStyles = {
        'top-right': 'top-4 right-4',
        'top-left': 'top-4 left-4',
        'bottom-right': 'bottom-4 right-4',
        'bottom-left': 'bottom-4 left-4'
    };

    return (
        <div
            className={`fixed ${positionStyles[position]} z-50 bg-slate-800 text-white rounded-lg shadow-lg overflow-hidden transition-all duration-300 ${isExpanded ? 'w-64' : 'w-12'}`}
        >
            {/* Toggle button */}
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="p-2 w-12 h-12 flex items-center justify-center hover:bg-slate-700"
                title="Development Tools"
            >
                <svg xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                    className="w-6 h-6">
                    <path strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M11.42 15.17L17.25 21A2.652 2.652 0 0021 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.548 2.548 0 11-3.586-3.586l6.837-5.63m5.108-.233c.55-.164 1.163-.188 1.743-.14a4.5 4.5 0 004.486-6.336l-3.276 3.277a3.004 3.004 0 01-2.25-2.25l3.276-3.276a4.5 4.5 0 00-6.336 4.486c.091 1.076-.071 2.264-.904 2.95l-.102.085m-1.745 1.437L5.909 7.5H4.5L2.25 3.75l1.5-1.5L7.5 4.5v1.409l4.26 4.26m-1.745 1.437l1.745-1.437m6.615 8.206L15.75 15.75M4.867 19.125h.008v.008h-.008v-.008z" />
                </svg>
            </button>

            {/* Expanded panel */}
            {isExpanded && (
                <div className="p-4">
                    <h3 className="text-lg font-semibold mb-4">Dev Tools</h3>

                    <div className="space-y-4">
                        {/* Service mode toggle */}
                        <div>
                            <p className="text-sm mb-2">Service Mode:</p>
                            <div className="flex items-center">
                                <span className={`text-xs mr-2 ${usingMockService ? 'opacity-50' : 'font-bold'}`}>Real</span>
                                <button
                                    onClick={toggleServiceMode}
                                    className="relative inline-flex items-center h-6 rounded-full w-11 transition-colors focus:outline-none"
                                    style={{ backgroundColor: usingMockService ? '#4f46e5' : '#6b7280' }}>
                  <span
                      className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform ${usingMockService ? 'translate-x-6' : 'translate-x-1'}`}
                  />
                                </button>
                                <span className={`text-xs ml-2 ${usingMockService ? 'font-bold' : 'opacity-50'}`}>Mock</span>
                            </div>
                        </div>

                        {/* Environment info */}
                        <div>
                            <p className="text-sm mb-1">Environment:</p>
                            <p className="text-xs bg-slate-700 p-1 rounded">{process.env.NODE_ENV}</p>
                        </div>

                        {/* Add more dev tools as needed */}
                    </div>
                </div>
            )}
        </div>
    );
};
