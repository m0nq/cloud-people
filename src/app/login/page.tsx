import { AuthenticationButton } from '@components/auth-button/auth-button';
import { loginOrSignUp } from '@lib/actions/supabase-actions';

const LoginPage = ({ searchParams }: { searchParams: { message: string } }) => (
    <>
        <form>
            <label htmlFor="email">Email:</label>
            <input id="email" name="email" type="email" required />
            <AuthenticationButton formAction={loginOrSignUp} buttonType="submit" />
        </form>
        {searchParams?.message && (
            <p className="mt-4 p-4 bg-foreground/10 text-foreground text-center">
                {searchParams.message}
            </p>
        )}
    </>
);

export default LoginPage;
