import { createClient } from '@lib/supabase/server';
import { Tables } from '@lib/db-entities.enum';

const Profile = async () => {
    const supabase = await createClient();
    let { data, error } = await supabase.from(Tables.Profiles).select('*');

    // const { email, username, first_name, last_name } = data && data?.[0];
    const { email, first_name } = data && data?.[0];

    if (error || !data?.length) {
        return (
            <>
                <div className="bg-dark text-color-light">{error?.message}</div>
            </>
        );
    }

    return (
        <div className="flex flex-col items-center justify-center w-full h-full bg-dark text-color-light">
            <div>Welcome!{first_name ?? ''}</div>
            <div>Your email: {email}</div>
        </div>
    );
};

export default Profile;
