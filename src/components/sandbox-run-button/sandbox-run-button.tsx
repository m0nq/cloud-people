import { ReactNode } from 'react';
import { PiPlayCircleThin } from 'react-icons/pi';

import './sandbox-run-button.styles.css';

export const SandboxRunButton = (): ReactNode => {
    return (
        <>
            <button className="test-button">
                <PiPlayCircleThin size={40} />
                Test
            </button>
        </>
    );
};
