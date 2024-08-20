'use client';
import { useEffect } from 'react';

import './workspace-layout.styles.css';

// TODO: design error page
const WorkspaceError = ({ error, reset }: { error: Error, reset: () => void }) => {
    useEffect(() => {
        // Optionally log the error tot an error reporting service
        console.error(error);
    }, [error]);

    return (
        <div className="error-container">
            <h2 className="text-center">Something went wrong!</h2>
            <button className="retry-button" onClick={() => reset()}>Try again?</button>
        </div>
    );
};

export default WorkspaceError;
