import { createClient } from '@lib/supabase/server';

const Profile = async () => {

    const supabase = createClient();
    let { data, error } = await supabase
        .from('profiles')
        .select('*');

    console.log('profile ->', data);

    // const { email, username, first_name, last_name } = data && data?.[0];

    // if (error || !data?.length) {
    //     return (
    //         <>
    //             <div>{error?.message}</div>
    //         </>
    //     );
    // }

    return (
        <div className="flex flex-col items-center justify-center w-full">
            <div>Welcome!</div>
            <div>Your email will be displayed here soon... 😅</div>
        </div>
    );
};

export default Profile;
