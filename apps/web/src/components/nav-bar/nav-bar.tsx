'use client';

import { useTransition } from 'react';
import { useState } from 'react';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { PiShoppingCartThin } from 'react-icons/pi';
import { PiStackLight } from 'react-icons/pi';
import { PiSignOutLight } from 'react-icons/pi';
import { PiYoutubeLogoLight } from 'react-icons/pi';
import { PiQuestionLight } from 'react-icons/pi';
import { BiMenuAltLeft } from 'react-icons/bi';
import { BsArrowLeftShort } from 'react-icons/bs';

import { signOut } from '@lib/actions/authentication-actions';
import profileImage from '@public/example-avatar.png';
import { Config } from '@config/constants';
import { NetworkIcon } from '@components/icons/network-icon';
import { MessageIcon } from '@components/icons/message-icon';

import './nav-bar.styles.css';

const { API: { EndPoints } } = Config;

const primaryLinks = [
    {
        name: 'Profile',
        link: EndPoints.Profile,
        iconElement: () => <Image src={profileImage} alt="Profile picture" width={25} />
    },
    {
        name: 'Dashboard',
        link: EndPoints.Dashboard,
        iconElement: (fillColor: string) => <PiStackLight fill={fillColor} />
    },
    {
        name: 'Sandbox',
        link: EndPoints.Sandbox,
        iconElement: (fillColor: string) => <NetworkIcon fillColor={fillColor} />
    },
    {
        name: 'Store',
        link: EndPoints.Store,
        iconElement: (fillColor: string) => <PiShoppingCartThin fill={fillColor} />
    },
    {
        name: 'Community',
        link: EndPoints.Community,
        iconElement: (fillColor: string) => <BiMenuAltLeft fill={fillColor} />
    }
];

const secondaryLinks = [
    {
        name: 'Message',
        link: EndPoints.Message,
        iconElement: (fillColor: string) => <MessageIcon fillColor={fillColor} />
    },
    {
        name: 'Forum',
        link: EndPoints.Forum,
        iconElement: (fillColor: string) => <PiYoutubeLogoLight fill={fillColor} />
    },
    {
        name: 'Info',
        link: EndPoints.Info,
        iconElement: (fillColor: string) => <PiQuestionLight fill={fillColor} />
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
                <BsArrowLeftShort />
            </div>

            <div className={`navigation-content ${!isNavVisible ? 'hidden' : ''}`}>
                <div className="nav-header">
                    <Link href="/" className="nav-logo">
                        <svg xmlns="http://www.w3.org/2000/svg" width="30" height="20" viewBox="0 0 67 44" fill="none">
                            <path fillRule="evenodd" clipRule="evenodd" d="M66.0155 27.6498C66.0155 34.9354 60.9873 41.0467 54.2119 42.7026C53.8347 42.8356 53.4443 42.965 53.0414 43.0906L53.1504 43.0537L53.1255 43.037C52.8467 43.1497 52.542 43.2118 52.2228 43.2118C50.8918 43.2118 49.8127 42.1328 49.8127 40.8017L49.8128 40.7887V31.5758C49.8128 29.5819 48.1964 27.9655 46.2025 27.9655C44.2086 27.9655 42.5922 29.5819 42.5922 31.5758V39.1671H42.5918C42.5921 39.1829 42.5922 39.1988 42.5922 39.2147C42.5922 40.5457 41.5132 41.6248 40.1822 41.6248C38.8512 41.6248 37.7722 40.5457 37.7722 39.2147C37.7722 39.1988 37.7723 39.1829 37.7726 39.1671H37.7721V28.2096C37.7721 25.7253 35.7582 23.7114 33.2739 23.7114C30.7896 23.7114 28.7757 25.7253 28.7757 28.2096V39.1671H28.7753C28.7756 39.1829 28.7757 39.1988 28.7757 39.2147C28.7757 40.5457 27.6967 41.6248 26.3657 41.6248C25.0347 41.6248 23.9557 40.5457 23.9557 39.2147C23.9557 39.1988 23.9558 39.1829 23.9561 39.1671H23.9557V31.5758C23.9557 29.5819 22.3393 27.9655 20.3454 27.9655C18.3515 27.9655 16.7352 29.5819 16.7352 31.5758V40.7987L16.7352 40.8017L16.7352 40.8048V40.8662L16.7343 40.8668C16.6998 42.1678 15.6344 43.2118 14.3251 43.2118C14.0847 43.2118 13.8526 43.1766 13.6335 43.1111L13.5615 43.1632C13.0747 43.015 12.6056 42.8613 12.1552 42.7025C5.37999 41.0464 0.352051 34.9353 0.352051 27.6498C0.352051 19.5304 6.59693 12.8696 14.5456 12.2084C18.0015 5.42659 25.0502 0.781738 33.1837 0.781738C41.3172 0.781738 48.3658 5.42659 51.8218 12.2084C59.7705 12.8695 66.0155 19.5303 66.0155 27.6498ZM20.3728 26.7236C22.8722 26.7236 24.8983 24.6974 24.8983 22.198C24.8983 19.6987 22.8722 17.6725 20.3728 17.6725C17.8734 17.6725 15.8473 19.6987 15.8473 22.198C15.8473 24.6974 17.8734 26.7236 20.3728 26.7236ZM39.2598 16.1076C39.2598 19.4633 36.5394 22.1836 33.1837 22.1836C29.8281 22.1836 27.1077 19.4633 27.1077 16.1076C27.1077 12.7519 29.8281 10.0316 33.1837 10.0316C36.5394 10.0316 39.2598 12.7519 39.2598 16.1076ZM45.9947 26.7236C48.4941 26.7236 50.5202 24.6974 50.5202 22.198C50.5202 19.6987 48.4941 17.6725 45.9947 17.6725C43.4953 17.6725 41.4692 19.6987 41.4692 22.198C41.4692 24.6974 43.4953 26.7236 45.9947 26.7236Z" fill="#56E8CD" />
                        </svg>
                    </Link>
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
                                    {iconElement(isActive ? '#1E40AF' : 'currentColor')}
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
                                    {iconElement(isActive ? '#1E40AF' : 'currentColor')}
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
                        <button
                            onClick={() => startTransition(async () => await signOut())}
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
