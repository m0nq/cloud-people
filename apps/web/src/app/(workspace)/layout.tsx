import { ReactNode } from 'react';

import './workspace-layout.styles.css';
import { LayoutProps } from '@app/layout';
import { NavBar } from '@components/nav-bar/nav-bar';
import { isLoggedIn } from '@lib/actions/authentication-actions';

const WorkspaceLayout = async ({ children }: LayoutProps): Promise<ReactNode> => {
    await isLoggedIn();

    return (
        <main>
            <NavBar />
            {children}
        </main>
    );
};

export default WorkspaceLayout;
