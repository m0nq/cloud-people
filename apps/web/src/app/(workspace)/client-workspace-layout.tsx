'use client';

import { ReactNode } from 'react';

interface ClientWorkspaceLayoutProps {
  children: ReactNode;
}

export const ClientWorkspaceLayout = ({ children }: ClientWorkspaceLayoutProps) => {
  return <main>{children}</main>;
};
