import { ReactNode } from 'react';

import './login.styles.css';
import { LoginClient } from './login-client';

const LoginPage = async ({ searchParams }: { searchParams: Promise<{ message?: string }> }): Promise<ReactNode> => {
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