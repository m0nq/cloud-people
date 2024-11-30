import { ReactNode } from 'react';
import { PiPlayCircleThin } from 'react-icons/pi';

import { useSandboxStore } from '@stores/sandbox-store';

import './sandbox-run-button.styles.css';

export const SandboxRunButton = (): ReactNode => {
    const { mode } = useSandboxStore();
    const buttonLabel = mode === 'sandbox' ? 'Test' : 'Run';

    return (
        <>
            <button className="test-button" onClick={() => alert('Something magical just happened ✨')}>
                <PiPlayCircleThin size={48} />
                <span className="test-button-label">{buttonLabel}</span>
            </button>
        </>
    );
};
