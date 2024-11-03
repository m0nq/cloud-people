import { createClient } from '@lib/supabase/server';
import { signOut } from '@lib/actions/authentication-actions';

type AuthButtonProps = {
    formAction: string | ((formData: FormData) => void) | undefined,
    buttonType: 'submit' | 'reset' | 'button' | undefined,
    className?: string,
}

export const AuthenticationButton = async ({ formAction, buttonType, className }: AuthButtonProps) => {
    const supabase = createClient();
    const { data: { user } } = await (await supabase).auth.getUser();

    return user ? (
        <div className="flex items-center gap-4">
            Hey, {user.email}!
            <button formAction={signOut}
                className={className}>
                Logout
            </button>
        </div>
    ) : (
        <button formAction={formAction}
            type={buttonType}
            className={className}>
            Sign up / Login
        </button>
    );
};

