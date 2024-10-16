import { createClient } from '@lib/supabase/server';

const Profile = async () => {

    const supabase = createClient();
    let { data, error } = await supabase
        .from('profiles')
        .select('*');
    const { email, username, first_name, last_name } = data?.[0];

    if (error || !data?.length) {
        return (
            <>
                <div>{error?.message}</div>
            </>
        );
    }

    console.log('profile ->', data[0]);

    return (
        <>
            <div>Welcome! {username || first_name}</div>
            <div>email: {email}</div>
        </>
    );
};

export default Profile;
