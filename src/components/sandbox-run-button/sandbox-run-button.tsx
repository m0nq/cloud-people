import { ReactNode } from 'react';
import { PiPlayCircleThin } from 'react-icons/pi';

import { Button } from '@components/utils/button/button';
import { useSandboxStore } from '@stores/sandbox-store';

import './sandbox-run-button.styles.css';

export const SandboxRunButton = (): ReactNode => {
    const { mode } = useSandboxStore();
    const buttonLabel = mode === 'sandbox' ? 'Test' : 'Run';

    return (
        <Button variant="primary"
            className="test-button"
            onClick={() => alert('Something magical just happened ✨')}
            icon={<PiPlayCircleThin size={48} />}>
            <span className="test-button-label">{buttonLabel}</span>
        </Button>
    );
};
