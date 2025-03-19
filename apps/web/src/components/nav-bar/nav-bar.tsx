'use client';

import { useTransition } from 'react';
import { useState } from 'react';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { PiShoppingCart } from 'react-icons/pi';
import { PiSignOutLight } from 'react-icons/pi';
import { RiBarChartLine } from 'react-icons/ri';
import { FiDollarSign } from 'react-icons/fi';
import { FiHome } from 'react-icons/fi';
import { LuKey } from 'react-icons/lu';

import { signOut } from '@lib/actions/authentication-actions';
import profileImage from '@public/example-avatar.png';
import { Config } from '@config/constants';
import { NetworkIcon } from '@components/icons/network-icon';
import { LogoIcon } from '@components/icons/logo-icon';
import { ThemeToggle } from '@components/theme/theme-toggle';

import './nav-bar.styles.css';

const { API: { EndPoints } } = Config;

const primaryLinks = [
    {
        name: 'Dashboard',
        link: EndPoints.Dashboard,
        iconElement: (fillColor: string) => <FiHome color={fillColor} size={20} />
    },
    {
        name: 'Canvas',
        link: EndPoints.Canvas,
        iconElement: (fillColor: string) => <NetworkIcon fillColor={fillColor} size={20} />
    },
    {
        name: 'Store',
        link: EndPoints.Store,
        iconElement: (fillColor: string) => <PiShoppingCart color={fillColor} size={20} />
    },
    {
        name: 'Ranking',
        link: EndPoints.Community,
        iconElement: (fillColor: string) => <RiBarChartLine color={fillColor} size={20} />
    },
    {
        name: 'Earn',
        link: EndPoints.Community,
        iconElement: (fillColor: string) => <FiDollarSign color={fillColor} size={20} />
    },
    {
        name: 'Keys',
        link: EndPoints.Community,
        iconElement: (fillColor: string) => <LuKey color={fillColor} size={20} />
    }
];

const secondaryLinks = [
    {
        name: 'Profile',
        link: EndPoints.Profile,
        iconElement: () => <Image src={profileImage} alt="Profile picture" width={40} height={40} />
    }
];

export const NavBar = () => {
    const pathname = usePathname();
    const [isPending, startTransition] = useTransition();
    const [isNavVisible, setIsNavVisible] = useState(false);
    const [hoveredItem, setHoveredItem] = useState<string | null>(null);

    const handleMouseEnter = () => {
        setIsNavVisible(true);
    };

    const handleMouseLeave = () => {
        setIsNavVisible(false);
    };

    return (
        <div className="nav-bar" onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
            <div className={`toggle-button ${isNavVisible ? 'hidden' : ''}`}>
                <LogoIcon width="30" height="20" />
            </div>

            <div className={`navigation-content ${!isNavVisible ? 'hidden' : ''}`}>
                <div className="nav-header">
                    <div className="nav-theme-toggle">
                        <ThemeToggle />
                    </div>
                </div>

                <nav className="nav-primary">
                    {primaryLinks.map(({ name, link, iconElement }) => {
                        const isActive = pathname === link;
                        const isHovered = hoveredItem === name;

                        return (
                            <div key={name}
                                className="nav-item group"
                                onMouseEnter={() => setHoveredItem(name)}
                                onMouseLeave={() => setHoveredItem(null)}>
                                <Link href={link}
                                    className={`nav-link ${isActive ? 'nav-link-active' : 'nav-link-inactive'}`}>
                                    {iconElement(isActive ? 'var(--perry-blue)' : 'currentColor')}
                                    {isActive && (
                                        <motion.div
                                            layoutId="nav-indicator"
                                            className="nav-indicator"
                                            initial={false}
                                            transition={{ type: 'spring', stiffness: 350, damping: 30 }} />
                                    )}
                                </Link>

                                {isHovered && (
                                    <motion.div
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        className="nav-tooltip">
                                        {name}
                                        <div className="nav-tooltip-arrow" />
                                    </motion.div>
                                )}
                            </div>
                        );
                    })}
                </nav>

                <div className="nav-secondary">
                    {secondaryLinks.map(({ name, link, iconElement }) => {
                        const isActive = pathname === link;
                        const isHovered = hoveredItem === name;

                        return (
                            <div key={name}
                                className="nav-item group"
                                onMouseEnter={() => setHoveredItem(name)}
                                onMouseLeave={() => setHoveredItem(null)}>
                                <Link href={link}
                                    className={`nav-link ${isActive ? 'nav-link-active' : 'nav-link-inactive'}`}>
                                    {iconElement()}
                                    {isActive && (
                                        <motion.div
                                            layoutId="nav-indicator-secondary"
                                            className="nav-indicator"
                                            initial={false}
                                            transition={{ type: 'spring', stiffness: 350, damping: 30 }} />
                                    )}
                                </Link>

                                {isHovered && (
                                    <motion.div
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        className="nav-tooltip">
                                        {name}
                                        <div className="nav-tooltip-arrow" />
                                    </motion.div>
                                )}
                            </div>
                        );
                    })}

                    <div className="nav-item group"
                        onMouseEnter={() => setHoveredItem('logout')}
                        onMouseLeave={() => setHoveredItem(null)}>
                        <button onClick={() => startTransition(async () => await signOut())}
                            disabled={isPending}
                            className="nav-logout-button">
                            <PiSignOutLight size={24} />
                        </button>

                        {hoveredItem === 'logout' && (
                            <motion.div
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="nav-logout-tooltip">
                                Logout
                                <div className="nav-tooltip-arrow" />
                            </motion.div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
