'use client';

import { ReactNode } from 'react';

import { useCanvasStore } from '@stores/canvas-store';
import { CanvasDataFlow } from '@components/canvas-data-flow/canvas-data-flow';
import { CanvasController } from '@components/canvas-controller/canvas-controller';

type CanvasViewProps = {
  children: ReactNode;
};

/**
 * Canvas View component that conditionally renders the appropriate view based on the canvas mode
 */
export const CanvasView = ({ children }: CanvasViewProps): ReactNode => {
  const { mode } = useCanvasStore();
  const isDevelopment = process.env.NODE_ENV === 'development';

  return (
    <div className="canvas-view-container relative w-full h-full">
      <div className="absolute top-4 left-20 z-10">
        <CanvasController />
      </div>

      {isDevelopment && mode === 'dataflow' ? (
        <CanvasDataFlow />
      ) : (
        <div className="w-full h-full">{children}</div>
      )}
    </div>
  );
};
