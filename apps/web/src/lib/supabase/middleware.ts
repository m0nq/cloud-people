import { User } from '@supabase/supabase-js';
import { createServerClient } from '@supabase/ssr';
import { type NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { Config } from '@config/constants';
import { getEnvConfig } from '@lib/env';

const { API: { EndPoints } } = Config;

// Get service mode from environment
const getServiceMode = () => {
    const env = getEnvConfig();
    // Check for explicit service mode override
    if (env.NEXT_PUBLIC_SERVICE_MODE === 'mock' || env.NEXT_PUBLIC_SERVICE_MODE === 'real') {
        return env.NEXT_PUBLIC_SERVICE_MODE;
    }
    // Default to mock in development, real in production
    return process.env.NODE_ENV === 'development' ? 'mock' : 'real';
};

const hasUserOrLoginPath = (user: User | null, request: NextRequest) => {
    return user || request.nextUrl.pathname.startsWith(EndPoints.Login) || request.nextUrl.pathname.startsWith(EndPoints.Auth);
};

export const updateSession = async (request: NextRequest) => {
    // Skip authentication in mock mode
    if (getServiceMode() === 'mock') {
        // Return a NextResponse that allows access to all routes
        return NextResponse.next();
    }

    let supabaseResponse = NextResponse.next({
        request
    });

    const supabase = createServerClient(process.env.SUPABASE_URL!, process.env.SUPABASE_ANON_KEY!, {
        cookies: {
            getAll() {
                return request.cookies.getAll();
            },
            setAll(cookiesToSet) {
                cookiesToSet.forEach(({ name, value, options }) => {
                    request.cookies.set(name, value);
                });
                supabaseResponse = NextResponse.next({ request });
                cookiesToSet.forEach(({ name, value, options }) => {
                    supabaseResponse.cookies.set(name, value, options);
                });
            }
        }
    });

    // IMPORTANT: Avoid writing any logic between createServerClient and
    // supabase.auth.getUser(). A simple mistake could make it very hard to debug
    // issues with users being randomly logged out.

    const { data: { user } } = await supabase.auth.getUser();

    if (!hasUserOrLoginPath(user, request)) {
        // no user, potentially respond by redirecting the user to the login page
        const url = request.nextUrl.clone();
        url.pathname = EndPoints.Login;
        return NextResponse.redirect(url);
    }

    // IMPORTANT: You *must* return the supabaseResponse object as it is. If you're
    // creating a new response object with NextResponse.next() make sure to:
    // 1. Pass the request in it, like so:
    //    const myNewResponse = NextResponse.next({ request })
    // 2. Copy over the cookies, like so:
    //    myNewResponse.cookies.setAll(supabaseResponse.cookies.getAll())
    // 3. Change the myNewResponse object to fit your needs, but avoid changing
    //    the cookies!
    // 4. Finally:
    //    return myNewResponse
    // If this is not done, you may be causing the browser and server to go out
    // of sync and terminate the user's session prematurely!

    return supabaseResponse;
};
