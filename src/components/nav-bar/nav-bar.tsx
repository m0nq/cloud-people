'use client';
import { useTransition } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';

import { signOut } from '@lib/actions/supabase-actions';


const navLinks = [
    {
        name: 'Profile',
        link: '/profile'
    },
    {
        name: 'Dashboard',
        link: '/dashboard'
    },
    {
        name: 'Sandbox',
        link: '/sandbox'
    },
    {
        name: 'Store',
        link: '/store'
    },
    {
        name: 'Community',
        link: '/community'
    }
];

export const NavBar = () => {
    const pathname = usePathname();
    const [isPending, startTransition] = useTransition();

    return (
        <ul>
            {navLinks.map(link => (
                <li key={link.name}>
                    <Link href={link.link}
                        className={pathname === link.link ? 'font-bold' : ''}>
                        {link.name}
                    </Link>
                </li>
            ))}
            <li key="sign-out">
                <button className=""
                    onClick={() => startTransition(async () => await signOut())}
                    disabled={isPending}>
                    Sign Out
                </button>
            </li>
        </ul>
    );
};
