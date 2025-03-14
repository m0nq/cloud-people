'use client';

import { ReactNode } from 'react';
import { motion } from 'framer-motion';

import { ThemeToggle } from '@components/theme/theme-toggle';
import { ThemeProvider } from '@components/theme/theme-provider';
import { AuthenticationButton } from '@components/utils/auth-button/auth-button';
import { SocialLoginButton } from '@components/utils/social-login/social-login-button';
import { loginOrSignUp } from '@lib/actions/authentication-actions';

import './login.styles.css';

export const LoginClient = (): ReactNode => {
    return (
        <ThemeProvider>
            <div className="login-container">
                {/* Theme toggle button */}
                <div className="theme-toggle">
                    <ThemeToggle />
                </div>

                {/* Left side with background color and logo */}
                <div className="banner">
                    <div className="banner-content">
                        <svg width="292" height="189" viewBox="0 0 292 189" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path fillRule="evenodd" clipRule="evenodd" fill="white"
                                d="M291.628 119.176C291.628 151.492 269.326 178.599 239.273 185.944C237.599 186.535 235.867 187.109 234.08 187.666L234.563 187.502L234.452 187.428C233.215 187.928 231.863 188.203 230.447 188.203C224.543 188.203 219.757 183.417 219.757 177.513C219.757 177.469 219.757 177.425 219.758 177.38V136.591C219.758 127.746 212.588 120.577 203.744 120.577C194.9 120.577 187.73 127.746 187.73 136.591V170.263H187.727C187.728 170.333 187.729 170.403 187.729 170.474C187.729 176.378 182.943 181.164 177.039 181.164C171.135 181.164 166.349 176.378 166.349 170.474C166.349 170.403 166.35 170.333 166.351 170.263H166.35V121.659C166.35 110.64 157.417 101.707 146.398 101.707C135.379 101.707 126.446 110.64 126.446 121.659V170.263H126.443C126.444 170.333 126.445 170.403 126.445 170.474C126.445 176.378 121.658 181.164 115.755 181.164C109.851 181.164 105.065 176.378 105.065 170.474C105.065 170.402 105.065 170.33 105.067 170.259V136.591C105.067 127.746 97.8971 120.577 89.053 120.577C80.2088 120.577 73.0392 127.746 73.0392 136.591V177.799L73.0334 177.803C72.8796 183.573 68.1541 188.203 62.3473 188.203C61.2816 188.203 60.2523 188.047 59.2811 187.757L58.9625 187.987C56.8028 187.33 54.7216 186.648 52.7236 185.944C22.6722 178.597 0.371094 151.491 0.371094 119.176C0.371094 83.1618 28.0709 53.6169 63.328 50.6844C78.6571 20.6028 109.922 0 145.999 0C182.076 0 213.341 20.6027 228.671 50.6843C263.928 53.6164 291.628 83.1614 291.628 119.176ZM89.1741 115.068C100.26 115.068 109.248 106.081 109.248 94.9944C109.248 83.9081 100.26 74.9209 89.1741 74.9209C78.0878 74.9209 69.1007 83.9081 69.1007 94.9944C69.1007 106.081 78.0878 115.068 89.1741 115.068ZM172.949 67.9795C172.949 82.864 160.882 94.9303 145.998 94.9303C131.113 94.9303 119.047 82.864 119.047 67.9795C119.047 53.095 131.113 41.0287 145.998 41.0287C160.882 41.0287 172.949 53.095 172.949 67.9795ZM202.822 115.068C213.908 115.068 222.895 106.081 222.895 94.9944C222.895 83.9081 213.908 74.9209 202.822 74.9209C191.735 74.9209 182.748 83.9081 182.748 94.9944C182.748 106.081 191.735 115.068 202.822 115.068Z" />
                        </svg>
                        <h1 className="banner-title">Cloud People</h1>
                    </div>
                </div>

                {/* Right side with login form */}
                <div className="form-area">
                    <motion.div initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                        className="form-container">
                        <div className="form-header">
                            <h2 className="title">Welcome to The Rebellion</h2>
                            <p className="subtitle">
                                Enter your credentials to access your dashboard
                            </p>
                        </div>

                        {/* Social login buttons */}
                        <div className="social-login-container">
                            <div className="social-buttons">
                                <SocialLoginButton provider="google" className="social-button">
                                    <svg
                                        className="social-icon"
                                        width="20"
                                        height="20"
                                        viewBox="0 0 24 24"
                                        xmlns="http://www.w3.org/2000/svg">
                                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                            fill="#4285F4" />
                                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                            fill="#34A853" />
                                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                                            fill="#FBBC05" />
                                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                                            fill="#EA4335" />
                                    </svg>
                                    Google
                                </SocialLoginButton>
                                {/* Commented out as currently only login with google is implemented */}
                                {/* <SocialLoginButton provider="apple" className="social-button">
                                     <svg width="20"
                                     height="19"
                                     viewBox="0 0 20 19"
                                     fill="none"
                                     xmlns="http://www.w3.org/2000/svg">
                                     <g clipPath="url(#clip0_1311_3819)">
                                     <path d="M17.752 14.807C17.4647 15.4708 17.1246 16.0818 16.7305 16.6436C16.1934 17.4094 15.7536 17.9395 15.4146 18.2339C14.8892 18.7171 14.3263 18.9646 13.7234 18.9787C13.2907 18.9787 12.7688 18.8555 12.1613 18.6057C11.5518 18.3571 10.9916 18.2339 10.4795 18.2339C9.94232 18.2339 9.36624 18.3571 8.75005 18.6057C8.13292 18.8555 7.63577 18.9857 7.25566 18.9986C6.67759 19.0232 6.10139 18.7687 5.52625 18.2339C5.15916 17.9137 4.70001 17.3649 4.14997 16.5873C3.55981 15.757 3.07463 14.7941 2.69452 13.6963C2.28744 12.5106 2.08337 11.3625 2.08337 10.2509C2.08337 8.97756 2.35851 7.87935 2.90961 6.95905C3.34273 6.21983 3.91893 5.63671 4.64008 5.20864C5.36124 4.78057 6.14045 4.56242 6.97959 4.54847C7.43874 4.54847 8.04086 4.69049 8.7891 4.96962C9.53524 5.24969 10.0143 5.39171 10.2244 5.39171C10.3814 5.39171 10.9136 5.22564 11.8159 4.89456C12.6691 4.58752 13.3892 4.46039 13.9791 4.51047C15.5776 4.63948 16.7786 5.26963 17.5773 6.4049C16.1476 7.27113 15.4404 8.4844 15.4545 10.0408C15.4674 11.2532 15.9072 12.262 16.7715 13.063C17.1633 13.4348 17.6007 13.7221 18.0874 13.9262C17.9819 14.2323 17.8705 14.5255 17.752 14.807ZM14.0858 0.380322C14.0858 1.33054 13.7387 2.21775 13.0467 3.03895C12.2117 4.01519 11.2017 4.57931 10.1064 4.4903C10.0924 4.3763 10.0843 4.25632 10.0843 4.13025C10.0843 3.21804 10.4815 2.2418 11.1867 1.44359C11.5387 1.03944 11.9865 0.703394 12.5295 0.435326C13.0714 0.171257 13.5839 0.0252216 14.0659 0.000213623C14.08 0.127243 14.0858 0.25428 14.0858 0.38031V0.380322Z"
                                     fill="#BCBCBC" />
                                     </g>
                                     <defs>
                                     <clipPath id="clip0_1311_3819">
                                     <rect width="19"
                                     height="19"
                                     fill="white"
                                     transform="translate(0.5)" />
                                     </clipPath>
                                     </defs>
                                     </svg>
                                     Apple
                                     </SocialLoginButton>
                                     <SocialLoginButton provider="twitter" className="social-button">
                                     <RiTwitterXLine className="social-icon" />
                                     </SocialLoginButton> */}
                            </div>
                        </div>

                        {/* Divider */}
                        <div className="divider">
                            <div className="divider-line">
                                {/* <div className={`w-full border-t ${isDarkMode ? 'border-gray-700' : 'border-gray-300'}`}></div> */}
                                <div className="line" />
                            </div>
                            <div className="divider-text">
                                {/* <span className={`px-2 ${isDarkMode ? 'bg-gray-900 text-gray-400' : 'bg-white text-gray-500'}`}> */}
                                <span className="text">Or continue with email</span>
                            </div>
                        </div>

                        <form className="login-form">
                            {false && (
                                <div className="error-message">
                                    <div className="error-content">
                                        <div className="error-text">
                                            {/* <h3 className={`text-sm font-medium text-red-800`}>{error}</h3> */}
                                            <h3 className={`text-sm font-medium text-red-800`}>
                                                Error message...
                                            </h3>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div className="form-fields">
                                <div className="input-group">
                                    <label htmlFor="email" className="input-label">
                                        Email address
                                    </label>
                                    <input
                                        id="email"
                                        name="email"
                                        type="email"
                                        autoComplete="email"
                                        className="input"
                                    />
                                </div>

                                {/* <div className="input-group">
                                        <label htmlFor="password" className="input-label">
                                            Password
                                        </label>
                                        <input id="password"
                                            name="password"
                                            type="password"
                                            autoComplete="current-password"
                                            className="input" />
                                    </div> */}
                            </div>

                            <AuthenticationButton className="submit-button"
                                formAction={loginOrSignUp}
                                buttonType="submit" />

                            {/* <div classname="text-center mt-4">
                                    <p classname={`text-sm text-gray-600`}>
                                        for demo purposes, any email and password will work
                                    </p> */}
                            {/* </div> */}
                        </form>
                    </motion.div>
                </div>
            </div>
        </ThemeProvider>
    );
};
