'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

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

    return (
        <ul>
            {navLinks.map(link => (
                <li key={link.name}>
                    <Link href={link.link} className={pathname === link.link ? 'font-bold' : ''}>
                        {link.name}
                    </Link>
                </li>
            ))}
        </ul>
    );
};
