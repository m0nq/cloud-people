import { redirect } from 'next/navigation';
import { isLoggedIn } from '@lib/actions/supabase-actions';

const HomePage = async () => {
    await isLoggedIn();

    redirect('/dashboard');
};

export default HomePage;
