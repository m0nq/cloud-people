import { Viewport } from 'next';

import { LayoutProps } from '@lib/definitions';
import { NavBar } from '@components/nav-bar/nav-bar';
import { isLoggedIn } from '@lib/actions/supabase-actions';

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
