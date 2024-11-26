import { useState } from 'react';
import { ReactNode } from 'react';

import './sandbox-controller.styles.css';

export const SandboxController = (): ReactNode => {
    const [activeMode, setActiveMode] = useState<'sandbox' | 'live'>('sandbox');

    return (
        <div className="sandbox-controller">
            <button className={`${activeMode === 'sandbox' ? 'active' : ''}`}
                onClick={() => setActiveMode('sandbox')}>
                Sandbox
            </button>
            <button className={`${activeMode === 'live' ? 'active' : ''}`}
                onClick={() => setActiveMode('live')}>
                Live
            </button>
            <button className="menu-trigger" onClick={() => {{/* TODO: Implement submenu toggle */}}}>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path fill="currentColor"
                        d="M8 4a2 2 0 100-4 2 2 0 000 4zM8 10a2 2 0 100-4 2 2 0 000 4zM8 16a2 2 0 100-4 2 2 0 000 4z" />
                </svg>
            </button>
        </div>
    );
};
