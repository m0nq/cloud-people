import { ReactNode } from 'react';

import { useSandboxStore } from '@stores/sandbox-store';

import './sandbox-controller.styles.css';

export const SandboxController = (): ReactNode => {
    const { mode, setMode } = useSandboxStore();

    return (
        <div className="sandbox-controller">
            <button className={`${mode === 'sandbox' ? 'active' : ''}`} onClick={() => setMode('sandbox')}>
                Sandbox
            </button>
            <button className={`${mode === 'live' ? 'active' : ''}`} onClick={() => setMode('live')}>
                Live
            </button>
            <button className="menu-trigger" onClick={() => alert('Something magical just happened. ✨')}>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path fill="currentColor" d="M8 4a2 2 0 100-4 2 2 0 000 4zM8 10a2 2 0 100-4 2 2 0 000 4zM8 16a2 2 0 100-4 2 2 0 000 4z" />
                </svg>
            </button>
        </div>
    );
};
