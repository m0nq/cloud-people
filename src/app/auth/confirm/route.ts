import { type EmailOtpType } from '@supabase/supabase-js';
import { type NextRequest } from 'next/server';

import { redirect } from 'next/navigation';
import { createClient } from '@lib/supabase/server';

export const GET = async (request: NextRequest) => {
    const { searchParams } = new URL(request.url);
    const token_hash = searchParams.get('token_hash');
    const type = searchParams.get('type') as EmailOtpType | null;
    const next = searchParams.get('next') ?? '/dashboard';

    if (token_hash && type) {
        const supabase = createClient();

        const { error } = await supabase.auth.verifyOtp({
            type,
            token_hash
        });

        if (error) {
            // redirect the user back to login page
            redirect('/login?message=There was an error logging in. Mind trying again...?');
        }
    }

    // redirect user to specified redirect URL or root of app
    redirect(next);
};
