import { ReactNode } from 'react';

import './login.styles.css';
import { LoginClient } from './login-client';

interface PageProps {
  searchParams: Promise<{ message?: string }>;
}

const LoginPage = async ({ searchParams }: PageProps): Promise<ReactNode> => {
  const { message } = await searchParams;

  return (
    <div className="relative">
      <LoginClient />
      {message && (
        <div className="display-message" role="alert">
          {message}
        </div>
      )}
    </div>
  );
}

export default LoginPage;