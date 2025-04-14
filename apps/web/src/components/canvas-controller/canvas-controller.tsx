import { ReactNode } from 'react';

import { useCanvasStore } from '@stores/canvas-store';

import './canvas-controller.styles.css';

export const CanvasController = (): ReactNode => {
    const { mode, setMode } = useCanvasStore();

    return (
        <div className="canvas-controller">
            <button className={`${mode === 'canvas' ? 'active' : ''}`} onClick={() => setMode('canvas')}>
                Canvas
            </button>
            <button className={`${mode === 'dataflow' ? 'active' : ''}`} onClick={() => setMode('dataflow')}>
                Data Flow
            </button>
        </div>
    );
};
