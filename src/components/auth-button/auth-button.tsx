import { createClient } from '@lib/supabase/server';
import { signOut } from '@lib/actions/supabase-actions';

type AuthButtonProps = {
    formAction: string | ((formData: FormData) => void) | undefined,
    buttonType: 'submit' | 'reset' | 'button' | undefined
}

export const AuthenticationButton = async ({ formAction, buttonType }: AuthButtonProps) => {
    const supabase = createClient();

    const { data: { user } } = await supabase.auth.getUser();

    return user ? (
        <div className="flex items-center gap-4">
            Hey, {user.email}!
            <button formAction={signOut}
                className="py-2 px-4 rounded-md no-underline bg-btn-background hover:bg-btn-background-hover">
                Logout
            </button>
        </div>
    ) : (
        <button formAction={formAction}
            type={buttonType}
            className="py-2 px-3 flex rounded-md no-underline bg-btn-background hover:bg-btn-background-hover">
            Login/Sign Up
        </button>
    );
};

