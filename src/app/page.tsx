import { redirect } from 'next/navigation';

import { isLoggedIn } from '@lib/actions/authentication-actions';
import { CONFIG } from '@config/constants';

const { API: { ENDPOINTS } } = CONFIG;

const HomePage = async () => {
    await isLoggedIn();

    redirect(ENDPOINTS.Dashboard);
};

export default HomePage;
