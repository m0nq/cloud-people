import { redirect } from 'next/navigation';

import { isLoggedIn } from '@lib/actions/authentication-actions';
import { validateEnv } from '@lib/env';

const HomePage = async () => {
    validateEnv();
    await isLoggedIn();

    redirect('/dashboard');
};

export default HomePage;
