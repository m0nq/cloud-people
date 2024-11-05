import { HandleProps } from '@xyflow/react';
import { Handle } from '@xyflow/react';
import { ReactNode } from 'react';

type NodeComponentProps = {
    className?: string;
    children?: ReactNode;
    type?: string;
};

export const NodeComponent = {
    Root: ({ children, className, ...props }: NodeComponentProps) => (
        <div className={className} {...props}>
            {children}
        </div>
    ),

    Handle: ({ position, ...props }: HandleProps) => (
        <Handle position={position} {...props} />
    ),

    Content: ({ children, className, ...props }: NodeComponentProps) => (
        <div className={className} {...props}>
            {children}
        </div>
    ),

    Controls: ({ children, className, ...props }: NodeComponentProps) => (
        <div className={className} {...props}>
            {children}
        </div>
    )
};
