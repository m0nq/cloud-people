import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@lib/supabase/server';
import { Provider } from '@supabase/supabase-js';

export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData();
        const provider = formData.get('provider') as Provider;

        if (!provider) {
            return NextResponse.json(
                { error: 'Provider is required' },
                { status: 400 }
            );
        }

        // Get the origin from the request headers
        const origin = request.headers.get('origin') ?? 'http://localhost:3000';
        const redirectTo = `${origin}/auth/callback`;
        const supabase = await createClient();

        const { data, error } = await supabase.auth.signInWithOAuth({
            provider,
            options: {
                redirectTo
            }
        });

        if (error) {
            console.error('OAuth error:', error);
            return NextResponse.json(
                { error: error.message },
                { status: 500 }
            );
        }

        if (data.url) {
            return NextResponse.json({ url: data.url });
        }

        return NextResponse.json(
            { error: 'No URL returned from OAuth provider' },
            { status: 500 }
        );
    } catch (error) {
        console.error('Error in OAuth route:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
