import { ReactNode } from 'react';

export type LayoutProps = {
    params?: any;
    children?: ReactNode;
    dashboard?: ReactNode;
    sandbox?: ReactNode;
    store?: ReactNode;
    profile?: ReactNode;
    community?: ReactNode;
}
