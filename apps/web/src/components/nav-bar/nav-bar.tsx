'use client';
import { useTransition } from 'react';
import { useState } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { PiShoppingCartThin } from 'react-icons/pi';
import { PiStackLight } from 'react-icons/pi';
import { PiSignOutLight } from 'react-icons/pi';
import { PiYoutubeLogoLight } from 'react-icons/pi';
import { PiQuestionLight } from 'react-icons/pi';
import { BiMenuAltLeft } from 'react-icons/bi';
import { BsArrowLeftShort } from 'react-icons/bs';

import './nav-bar.styles.css';
import { signOut } from '@lib/actions/authentication-actions';
import profileImage from '@public/example-avatar.png';
import { Config } from '@config/constants';
import { NetworkIcon } from '@components/icons/network-icon';
import { MessageIcon } from '@components/icons/message-icon';

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

    const handleMouseEnter = () => {
        setIsNavVisible(true);
    };

    const handleMouseLeave = () => {
        setIsNavVisible(false);
    };

    return (
        <div className="nav-bar" onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
            <div className={`toggle-button ${isNavVisible ? 'hidden' : ''}`}>
                <BsArrowLeftShort />
            </div>

            <nav className={`navigation-area ${!isNavVisible ? 'hidden' : ''}`}>
                <div className="navigation-bar-top">
                    <ul className="navigation-primary">
                        {primaryLinks.map(({ iconElement, link, name }) => {
                            const linkedPath = pathname === link;
                            return (
                                <li key={name} className={(linkedPath && 'nav-marker') || ''}>
                                    <Link href={link}>{iconElement((linkedPath && '#502dff') || 'currentColor')}</Link>
                                </li>
                            );
                        })}
                    </ul>
                </div>
                <div className="navigation-bar-bottom">
                    <ul className="navigation-secondary">
                        {secondaryLinks.map(({ iconElement, link, name }) => {
                            const linkedPath = pathname === link;
                            return (
                                <li key={name} className={(linkedPath && 'nav-marker') || ''}>
                                    <Link href={link}>{iconElement((linkedPath && '#502dff') || 'currentColor')}</Link>
                                </li>
                            );
                        })}
                        <li key="sign-out">
                            <button className="sign-out"
                                onClick={() => startTransition(async () => await signOut())}
                                disabled={isPending}>
                                <PiSignOutLight />
                            </button>
                        </li>
                    </ul>
                </div>
            </nav>
        </div>
    );
};
