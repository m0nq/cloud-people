import { ReactNode } from 'react';
import { PiPlayCircleThin } from 'react-icons/pi';

import { Button } from '@components/utils/button/button';
import { useCanvasStore } from '@stores/canvas-store';

import './canvas-run-button.styles.css';

export const CanvasRunButton = (): ReactNode => {
    const { mode } = useCanvasStore();
    const buttonLabel = mode === 'canvas' ? 'Test' : 'Run';

    return (
        <Button variant="primary"
            className="test-button"
            onClick={() => alert('Something magical just happened ✨')}
            icon={<PiPlayCircleThin size={48} />}>
            <span className="test-button-label">{buttonLabel}</span>
        </Button>
    );
};
