'use client';

import { ReactNode } from 'react';

import { motion } from 'framer-motion';

import './login.styles.css';
import { ThemeToggle } from './theme-toggle';
import { LoginForm } from './login-form';

export default function LoginPage({ searchParams }: { searchParams: { message: string } }): ReactNode {
    const { message } = searchParams;

    return (
    // <div className={`flex min-h-screen ${isDarkMode ? 'bg-gray-900' : ''}`}>
    <div className={`flex min-h-screen`}>
      {/* Theme toggle button */}
      <div className="absolute top-4 right-4 z-10">
        <ThemeToggle />
      </div>
      
      {/* Left side with background color and logo */}
      <div className="hidden md:flex md:w-1/2 bg-[#56E8CD] flex-col items-center justify-center fixed left-0 top-0 h-full">
        <div className="flex flex-col items-center">
          <svg xmlns="http://www.w3.org/2000/svg" width="200" height="140" viewBox="0 0 67 44" fill="none" className="mb-4">
            <path fillRule="evenodd" clipRule="evenodd" d="M66.0155 27.6498C66.0155 34.9354 60.9873 41.0467 54.2119 42.7026C53.8347 42.8356 53.4443 42.965 53.0414 43.0906L53.1504 43.0537L53.1255 43.037C52.8467 43.1497 52.542 43.2118 52.2228 43.2118C50.8918 43.2118 49.8127 42.1328 49.8127 40.8017L49.8128 40.7887V31.5758C49.8128 29.5819 48.1964 27.9655 46.2025 27.9655C44.2086 27.9655 42.5922 29.5819 42.5922 31.5758V39.1671H42.5918C42.5921 39.1829 42.5922 39.1988 42.5922 39.2147C42.5922 40.5457 41.5132 41.6248 40.1822 41.6248C38.8512 41.6248 37.7722 40.5457 37.7722 39.2147C37.7722 39.1988 37.7723 39.1829 37.7726 39.1671H37.7721V28.2096C37.7721 25.7253 35.7582 23.7114 33.2739 23.7114C30.7896 23.7114 28.7757 25.7253 28.7757 28.2096V39.1671H28.7753C28.7756 39.1829 28.7757 39.1988 28.7757 39.2147C28.7757 40.5457 27.6967 41.6248 26.3657 41.6248C25.0347 41.6248 23.9557 40.5457 23.9557 39.2147C23.9557 39.1988 23.9558 39.1829 23.9561 39.1671H23.9557V31.5758C23.9557 29.5819 22.3393 27.9655 20.3454 27.9655C18.3515 27.9655 16.7352 29.5819 16.7352 31.5758V40.7987L16.7352 40.8017L16.7352 40.8048V40.8662L16.7343 40.8668C16.6998 42.1678 15.6344 43.2118 14.3251 43.2118C14.0847 43.2118 13.8526 43.1766 13.6335 43.1111L13.5615 43.1632C13.0747 43.015 12.6056 42.8613 12.1552 42.7025C5.37999 41.0464 0.352051 34.9353 0.352051 27.6498C0.352051 19.5304 6.59693 12.8696 14.5456 12.2084C18.0015 5.42659 25.0502 0.781738 33.1837 0.781738C41.3172 0.781738 48.3658 5.42659 51.8218 12.2084C59.7705 12.8695 66.0155 19.5303 66.0155 27.6498ZM20.3728 26.7236C22.8722 26.7236 24.8983 24.6974 24.8983 22.198C24.8983 19.6987 22.8722 17.6725 20.3728 17.6725C17.8734 17.6725 15.8473 19.6987 15.8473 22.198C15.8473 24.6974 17.8734 26.7236 20.3728 26.7236ZM39.2598 16.1076C39.2598 19.4633 36.5394 22.1836 33.1837 22.1836C29.8281 22.1836 27.1077 19.4633 27.1077 16.1076C27.1077 12.7519 29.8281 10.0316 33.1837 10.0316C36.5394 10.0316 39.2598 12.7519 39.2598 16.1076ZM45.9947 26.7236C48.4941 26.7236 50.5202 24.6974 50.5202 22.198C50.5202 19.6987 48.4941 17.6725 45.9947 17.6725C43.4953 17.6725 41.4692 19.6987 41.4692 22.198C41.4692 24.6974 43.4953 26.7236 45.9947 26.7236Z" fill="white"/>
          </svg>
          <h2 className="text-3xl font-bold text-white mb-2">CLOUD PEOPLE</h2>
        </div>
      </div>
      
      {/* Right side with login form */}
      {/* <div className={`w-full md:w-1/2 flex items-center justify-center p-8 md:ml-auto ${isDarkMode ? 'bg-gray-900' : ''}`}> */}
      <div className={`w-full md:w-1/2 flex items-center justify-center p-8 md:ml-auto `}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md" >
          <div className="text-center mb-8">
            {/* <h2 className={`text-3xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'} mb-2`}> */}
            <h2 className={`text-3xl font-bold text-gray-900 mb-2`}>
              Welcome to The Rebellion
            </h2>
            {/* <p className={`${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}> */}
            <p className={`text-gray-600`}>
              Enter your credentials to access your dashboard
            </p>
          </div>
          
          {/* Social login buttons */}
          <div className="mb-6">
            <div className="grid grid-cols-3 gap-3">
              {/* <button type="button" onClick={() => handleSocialLogin('google')} className={`flex justify-center items-center py-2 px-4 border ${ isDarkMode ? 'border-gray-600 bg-gray-800 hover:bg-gray-700 text-white' : 'border-gray-300 bg-white hover:bg-gray-50 text-gray-700' } rounded-md shadow-sm transition-colors duration-200`}> */}
              <button type="button" className={`flex justify-center items-center py-2 px-4 border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 rounded-md shadow-sm transition-colors duration-200`}>
                <svg className="h-5 w-5 mr-2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                </svg>
                Google
              </button>
              {/* <button type="button" onClick={() => handleSocialLogin('apple')} className={`flex justify-center items-center py-2 px-4 border ${ isDarkMode ? 'border-gray-600 bg-gray-800 hover:bg-gray-700 text-white' : 'border-gray-300 bg-white hover:bg-gray-50 text-gray-700' } rounded-md shadow-sm transition-colors duration-200`} */}
              <button type="button" className={`flex justify-center items-center py-2 px-4 border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 rounded-md shadow-sm transition-colors duration-200`}>
                {/* <Apple size={20} className="mr-2" /> */}
                Apple
              </button>
              <button type="button" className={`flex justify-center items-center py-2 px-4 border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 rounded-md shadow-sm transition-colors duration-200`}>
                X
              </button>
            </div>
          </div>
          
          {/* Divider */}
          <div className="relative my-6">
            <div className={`absolute inset-0 flex items-center`}>
              {/* <div className={`w-full border-t ${isDarkMode ? 'border-gray-700' : 'border-gray-300'}`}></div> */}
              <div className={`w-full border-t border-gray-300`}></div>
            </div>
            <div className="relative flex justify-center text-sm">
              {/* <span className={`px-2 ${isDarkMode ? 'bg-gray-900 text-gray-400' : 'bg-white text-gray-500'}`}> */}
              <span className={`px-2 bg-white text-gray-500`}>
                Or continue with email
              </span>
            </div>
          </div>
          
          {/* <form className="space-y-6" onSubmit={handleSubmit}> */}
          <form className="space-y-6">
            {false && (
            //   <div className={`rounded-md ${isDarkMode ? 'bg-red-900' : 'bg-red-50'} p-4`}>
              <div className={`rounded-md bg-red-50 p-4`}>
                <div className="flex">
                  <div className="ml-3">
                    {/* <h3 className={`text-sm font-medium text-red-800`}>{error}</h3> */}
                    <h3 className={`text-sm font-medium text-red-800`}>Error message...</h3>
                  </div>
                </div>
              </div>
            )}
            
            <div className="space-y-4">
              <div>
                {/* <label htmlFor="email" className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} mb-1`}> */}
                <label htmlFor="email" className={`block text-sm font-medium text-gray-700 mb-1`}>
                  Email address
                </label>
                {/* <input id="email" name="email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} className={`appearance-none block w-full px-3 py-2 border ${ isDarkMode ? 'border-gray-600 bg-gray-800 text-white placeholder-gray-500 focus:ring-blue-500 focus:border-blue-500' : 'border-gray-300 bg-white text-gray-900 placeholder-gray-400 focus:ring-blue-500 focus:border-blue-500' } rounded-md shadow-sm focus:outline-none sm:text-sm`} /> */}
                <input id="email" name="email" type="email" autoComplete="email" className={`appearance-none block w-full px-3 py-2 border border-gray-300 bg-white text-gray-900 placeholder-gray-400 focus:ring-blue-500 focus:border-blue-500 rounded-md shadow-sm focus:outline-none sm:text-sm`} />
              </div>
              
              <div>
                {/* <label htmlFor="password" className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} mb-1`}> */}
                <label htmlFor="password" className={`block text-sm font-medium text-gray-700 mb-1`}>
                  Password
                </label>
                {/* <input id="password" name="password" type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} className={`appearance-none block w-full px-3 py-2 border ${ isDarkMode ? 'border-gray-600 bg-gray-800 text-white placeholder-gray-500 focus:ring-blue-500 focus:border-blue-500' : 'border-gray-300 bg-white text-gray-900 placeholder-gray-400 focus:ring-blue-500 focus:border-blue-500' } rounded-md shadow-sm focus:outline-none sm:text-sm`} /> */}
                <input id="password" name="password" type="password" autoComplete="current-password" className={`appearance-none block w-full px-3 py-2 border border-gray-300 bg-white text-gray-900 placeholder-gray-400 focus:ring-blue-500 focus:border-blue-500 rounded-md shadow-sm focus:outline-none sm:text-sm`} />
              </div>
            </div>
            
            <div>
              {/* <button type="submit" disabled={isLoading} className="w-full flex justify-center items-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500" > */}
              <button type="submit" className="w-full flex justify-center items-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500" >
                {/* {isLoading ? ( */}
                {false ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Loading...
                  </>
                ) : (
                //   <>
                    // Sign in <ArrowRight size={16} className="ml-2" />
                //   </>
                    <p>Sign in</p>
                )}
              </button>
            </div>
            
            <div className="text-center mt-4">
              {/* <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}> */}
              <p className={`text-sm text-gray-600`}>
                For demo purposes, any email and password will work
              </p>
            </div>
          </form>
        </motion.div>
      </div>
    </div>
    );
}
