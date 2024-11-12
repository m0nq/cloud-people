import { redirect } from 'next/navigation';

import { isLoggedIn } from '@lib/actions/authentication-actions';
import { Config } from '@config/constants';

const { API: { EndPoints } } = Config;

const HomePage = async () => {
    await isLoggedIn();

    redirect(EndPoints.Dashboard);
};

export default HomePage;
