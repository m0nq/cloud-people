'use client';

import { useTransition } from 'react';
import { useState } from 'react';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { PiShoppingCartThin } from 'react-icons/pi';
import { PiSignOutLight } from 'react-icons/pi';
import { FiBarChart2 } from 'react-icons/fi';
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
        iconElement: (fillColor: string) => <FiHome fill={fillColor} />
    },
    {
        name: 'Canvas',
        link: EndPoints.Sandbox,
        iconElement: (fillColor: string) => <NetworkIcon fillColor={fillColor} />
    },
    {
        name: 'Store',
        link: EndPoints.Store,
        iconElement: (fillColor: string) => <PiShoppingCartThin fill={fillColor} />
    },
    {
        name: 'Ranking',
        link: EndPoints.Community,
        iconElement: (fillColor: string) => <FiBarChart2 fill={fillColor} />
    },
    {
        name: 'Earn',
        link: EndPoints.Community,
        iconElement: (fillColor: string) => <FiDollarSign fill={fillColor} />
    },
    {
        name: 'Keys',
        link: EndPoints.Community,
        iconElement: (fillColor: string) => <LuKey fill={fillColor} />
    }
];

const secondaryLinks = [
    // TODO: keep until we decide we don't need these
    // {
    //     name: 'Message',
    //     link: EndPoints.Message,
    //     iconElement: (fillColor: string) => <MessageIcon fillColor={fillColor} />
    // },
    // {
    //     name: 'Forum',
    //     link: EndPoints.Forum,
    //     iconElement: (fillColor: string) => <PiYoutubeLogoLight fill={fillColor} />
    // },
    // {
    //     name: 'Info',
    //     link: EndPoints.Info,
    //     iconElement: (fillColor: string) => <PiQuestionLight fill={fillColor} />
    // },
    {
        name: 'Profile',
        link: EndPoints.Profile,
        iconElement: () => <Image src={profileImage} alt="Profile picture" width={25} />
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
        <div className="nav-bar"
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}>
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
                                    {iconElement(isActive ? '#1e40af' : 'currentColor')}
                                    {isActive && (
                                        <motion.div
                                            layoutId="navbar-indicator"
                                            className="nav-indicator"
                                            initial={false} />
                                    )}
                                </Link>

                                {/* Tooltip that appears on hover */}
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
                                    {iconElement(isActive ? '#1e40af' : 'currentColor')}
                                    {isActive && (
                                        <motion.div
                                            layoutId="navbar-indicator-secondary"
                                            className="nav-indicator"
                                            initial={false} />
                                    )}
                                </Link>

                                {/* Tooltip that appears on hover */}
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
                            <PiSignOutLight />
                        </button>

                        {/* Logout tooltip */}
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
