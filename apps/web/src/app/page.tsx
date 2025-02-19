import { redirect } from 'next/navigation';

import { createClient } from '@lib/supabase/server';
import { Config } from '@config/constants';

const { API: { EndPoints } } = Config;

const HomePage = async (): Promise<void> => {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    redirect(user ? EndPoints.Dashboard : EndPoints.Login);
};

export default HomePage;
