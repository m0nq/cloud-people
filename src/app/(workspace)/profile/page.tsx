import { createClient } from '@lib/supabase/server';
import { Tables } from '@lib/db-entities.enum';

const Profile = async () => {
    const supabase = await createClient();
    let { data, error } = await supabase
        .from(Tables.Profiles)
        .select('*');

    const { email, username, first_name, last_name } = data && data?.[0];

    console.log('first name is null? ->', first_name === null);

    if (error || !data?.length) {
        return (
            <>
                <div>{error?.message}</div>
            </>
        );
    }

    return (
        <div className="flex flex-col items-center justify-center w-full">
            <div>Welcome!</div>
            <div>Your email {email}</div>
        </div>
    );
};

export default Profile;
