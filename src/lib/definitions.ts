import { ReactNode } from 'react';

export type LayoutProps = {
    params?: any;
    children?: ReactNode;
}

export type EdgeConnections = {
    id: string,
    source: string,
    target: string,
    type: string
}
