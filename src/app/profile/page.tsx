import { supabase } from '@lib/actions/supabase';

const Profile = async () => {
    console.log('supabase ->', supabase);

    return (
        <>
            <div>Profile Page</div>
        </>
    );
};

export default Profile;
