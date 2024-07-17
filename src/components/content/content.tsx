import { ReactNode } from 'react';

import './content.styles.css';

export const Content = ({ children }: { children?: ReactNode }) => {
    return (
        <>
            <div className="content">
                <div className="content-view-container">
                    <div className="content-view-wrapper">
                        <div className="content-background">
                        </div>
                        <div className="content-area">
                            Content
                            {children}
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};
