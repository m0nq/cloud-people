import Link from 'next/link';

import './login.styles.css';
import { AuthenticationButton } from '@components/utils/auth-button/auth-button';
import { loginOrSignUp } from '@lib/actions/supabase-actions';

const LoginPage = ({ searchParams }: { searchParams: { message: string } }) => (
    <div className="login-container">
        <div className="banner">
            <svg width="292" height="189" viewBox="0 0 292 189" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path fillRule="evenodd" clipRule="evenodd" fill="white"
                    d="M291.628 119.176C291.628 151.492 269.326 178.599 239.273 185.944C237.599 186.535 235.867 187.109 234.08 187.666L234.563 187.502L234.452 187.428C233.215 187.928 231.863 188.203 230.447 188.203C224.543 188.203 219.757 183.417 219.757 177.513C219.757 177.469 219.757 177.425 219.758 177.38V136.591C219.758 127.746 212.588 120.577 203.744 120.577C194.9 120.577 187.73 127.746 187.73 136.591V170.263H187.727C187.728 170.333 187.729 170.403 187.729 170.474C187.729 176.378 182.943 181.164 177.039 181.164C171.135 181.164 166.349 176.378 166.349 170.474C166.349 170.403 166.35 170.333 166.351 170.263H166.35V121.659C166.35 110.64 157.417 101.707 146.398 101.707C135.379 101.707 126.446 110.64 126.446 121.659V170.263H126.443C126.444 170.333 126.445 170.403 126.445 170.474C126.445 176.378 121.658 181.164 115.755 181.164C109.851 181.164 105.065 176.378 105.065 170.474C105.065 170.402 105.065 170.33 105.067 170.259V136.591C105.067 127.746 97.8971 120.577 89.053 120.577C80.2088 120.577 73.0392 127.746 73.0392 136.591V177.799L73.0334 177.803C72.8796 183.573 68.1541 188.203 62.3473 188.203C61.2816 188.203 60.2523 188.047 59.2811 187.757L58.9625 187.987C56.8028 187.33 54.7216 186.648 52.7236 185.944C22.6722 178.597 0.371094 151.491 0.371094 119.176C0.371094 83.1618 28.0709 53.6169 63.328 50.6844C78.6571 20.6028 109.922 0 145.999 0C182.076 0 213.341 20.6027 228.671 50.6843C263.928 53.6164 291.628 83.1614 291.628 119.176ZM89.1741 115.068C100.26 115.068 109.248 106.081 109.248 94.9944C109.248 83.9081 100.26 74.9209 89.1741 74.9209C78.0878 74.9209 69.1007 83.9081 69.1007 94.9944C69.1007 106.081 78.0878 115.068 89.1741 115.068ZM172.949 67.9795C172.949 82.864 160.882 94.9303 145.998 94.9303C131.113 94.9303 119.047 82.864 119.047 67.9795C119.047 53.095 131.113 41.0287 145.998 41.0287C160.882 41.0287 172.949 53.095 172.949 67.9795ZM202.822 115.068C213.908 115.068 222.895 106.081 222.895 94.9944C222.895 83.9081 213.908 74.9209 202.822 74.9209C191.735 74.9209 182.748 83.9081 182.748 94.9944C182.748 106.081 191.735 115.068 202.822 115.068Z" />
            </svg>
            <h1 className="font-head">Cloud People</h1>
        </div>
        <div className="form-area">
            <div className="login-form-wrapper">
                <h2>Running your business from the clouds</h2>
                <form className="login-form">
                    <input className="input" placeholder="Email" id="email" name="email" type="email" required />
                    <div className="agreement-wrapper">
                        <input className="checkbox" type="checkbox" id="agreement" />
                        <label htmlFor="agreement" className="agreement-label">
                            I agree to DopeSass <Link href="#">Terms of Service</Link> and{' '}
                            <Link href="#">Privacy Policy</Link>
                        </label>
                    </div>
                    <AuthenticationButton className="submit-button" formAction={loginOrSignUp} buttonType="submit" />
                </form>
                {searchParams?.message && <p className="display-message">{searchParams.message}</p>}
            </div>
        </div>
    </div>
);

export default LoginPage;
