import { Viewport } from 'next';

import './workspace-layout.styles.css';
import { LayoutProps } from '@app/layout';
import { NavBar } from '@components/nav-bar/nav-bar';
import { isLoggedIn } from '@lib/actions/authentication-actions';

export const viewport: Viewport = {
    // themeColor: '#4265a7'
};

const WorkspaceLayout = async ({ children }: LayoutProps) => {
    await isLoggedIn();

    return (
        <main>
            <NavBar />
            {children}
        </main>
    );
};

export default WorkspaceLayout;
