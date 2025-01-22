import { NextResponse } from 'next/server';

import { createClient } from '@lib/supabase/server';
import { Config } from '@config/constants';

const { API: { EndPoints } } = Config;

export async function GET(request: Request) {
    const { searchParams, origin } = new URL(request.url);
    const code = searchParams.get('code');
    // if "next" is in param, use it as the redirect URL
    const next = searchParams.get('next') ?? EndPoints.Dashboard;

    if (code) {
        const supabase = await createClient();
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (!error) {
            const forwardedHost = request.headers.get('x-forwarded-host'); // original origin before load balancer
            if (forwardedHost) {
                // Use HTTP for localhost, HTTPS for other environments
                const protocol = forwardedHost.includes('localhost') ? 'http' : 'https';
                return NextResponse.redirect(`${protocol}://${forwardedHost}${next}`);
            } else {
                return NextResponse.redirect(`${origin}${next}`);
            }
        }
    }

    // return the user to an error page with instructions
    return NextResponse.redirect(`${origin}/auth/auth-code-error`);
}
