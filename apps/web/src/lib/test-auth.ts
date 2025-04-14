/**
 * Authentication Test Utility
 *
 * This script helps test the authentication system in both real and mock modes.
 * It can be run from the browser console to verify the functionality.
 */

import { toggleServiceMode } from './service-providers';
import { authCheck, signOut } from './actions/authentication-actions';

export async function testAuthentication() {
    console.group('🔐 Authentication Test');

    try {
        // Get current service mode
        const currentMode = localStorage.getItem('serviceProviderMode') || 'real';
        console.log(`Current service mode: ${currentMode}`);

        // Test authentication in current mode
        try {
            const user = await authCheck();
            console.log('✅ Authentication successful', user);
            console.log(`User ID: ${user.id}`);
            console.log(`Email: ${user.email}`);
            console.log(`Name: ${user.user_metadata?.full_name}`);
        } catch (error) {
            console.error('❌ Authentication failed', error);
        }

        // Toggle to the other mode
        const newMode = currentMode === 'real' ? 'mock' : 'real';
        console.log(`Toggling to ${newMode} mode...`);
        toggleServiceMode(newMode);

        // The page will reload, so we won't reach this point
        console.log('If you see this, the page did not reload properly');
    } catch (error) {
        console.error('❌ Test failed', error);
    }

    console.groupEnd();
}

export async function testSignOut() {
    console.group('🚪 Sign Out Test');

    try {
        console.log('Signing out...');
        await signOut();
        console.log('✅ Sign out successful');
        // The page should redirect to login, so we won't reach this point
        console.log('If you see this, the redirect did not work properly');
    } catch (error) {
        console.error('❌ Sign out failed', error);
    }

    console.groupEnd();
}

// Add to window object for easy console access
if (typeof window !== 'undefined') {
    (window as any).testAuth = {
        test: testAuthentication,
        signOut: testSignOut
    };

    console.log('🔐 Auth testing utilities available. Run window.testAuth.test() to test authentication.');
}
