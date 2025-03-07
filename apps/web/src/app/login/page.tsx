import { ReactNode } from 'react';

import { LoginClient } from './login-client';

interface PageProps {
  searchParams: Promise<{ message: string }>;
}

const LoginPage = async ({ searchParams }: PageProps): Promise<ReactNode> => {
  const { message } = await searchParams;

  return (
    <>
      <LoginClient />
      {message && <p className="display-message">{message}</p> || null}
    </>
  );
}

export default LoginPage;