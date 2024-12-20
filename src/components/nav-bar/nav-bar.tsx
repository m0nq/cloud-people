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
        iconElement: (fillColor: string) => (
            <svg width="1em" height="1em" viewBox="0 0 32 36" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path fill={fillColor}
                    d="M29.1521 22.1494V14.6257C30.6545 14.2569 31.7537 12.9292 31.7537 11.3064C31.7537 9.42552 30.2514 7.9134 28.3827 7.9134C27.43 7.9134 26.5506 8.31909 25.9276 8.98294L19.4786 5.25797C19.5886 4.96292 19.6252 4.631 19.6252 4.26219C19.6252 2.38126 18.1229 0.869141 16.2541 0.869141C14.3854 0.869141 12.8831 2.38126 12.8831 4.26219C12.8831 4.59411 12.9564 4.92604 13.0296 5.22109L6.58066 8.98294C5.95774 8.31909 5.07833 7.9134 4.12564 7.9134C2.2569 7.9134 0.754578 9.42552 0.754578 11.3064C0.754578 12.9292 1.89048 14.2569 3.35616 14.6257V22.1126C1.85384 22.4814 0.754578 23.8091 0.754578 25.4318C0.754578 27.3128 2.2569 28.8249 4.12564 28.8249C5.07833 28.8249 5.95774 28.4192 6.58066 27.7553L13.0296 31.5172C12.9564 31.8122 12.8831 32.1442 12.8831 32.4761C12.8831 34.357 14.3854 35.8691 16.2541 35.8691C18.1229 35.8691 19.6252 34.357 19.6252 32.4761C19.6252 32.1442 19.5519 31.8122 19.4786 31.5172L25.9276 27.7553C26.5506 28.4192 27.43 28.8249 28.3827 28.8249C30.2514 28.8249 31.7537 27.3128 31.7537 25.4318C31.7904 23.846 30.6545 22.4814 29.1521 22.1494ZM25.9276 23.1083L19.4786 19.3834C19.5886 19.0883 19.6252 18.7564 19.6252 18.3876C19.6252 18.0557 19.5519 17.7237 19.4786 17.4287L25.9276 13.6668C26.3673 14.1463 26.9536 14.4782 27.6132 14.6257V22.1126C26.9536 22.297 26.404 22.6289 25.9276 23.1083ZM16.2541 20.2316C15.2282 20.2316 14.422 19.3834 14.422 18.3876C14.422 17.3918 15.2648 16.5435 16.2541 16.5435C17.2435 16.5435 18.0862 17.3918 18.0862 18.3876C18.0862 19.3834 17.2801 20.2316 16.2541 20.2316ZM4.89512 22.1494V14.6257C5.55468 14.4782 6.14095 14.1094 6.58066 13.6668L13.0296 17.4287C12.9564 17.7237 12.8831 18.0557 12.8831 18.3876C12.8831 18.7195 12.9564 19.0514 13.0296 19.3465L6.58066 23.1083C6.10431 22.6289 5.55468 22.297 4.89512 22.1494ZM28.3827 9.4624C29.4086 9.4624 30.2148 10.3107 30.2148 11.3064C30.2148 12.3022 29.372 13.1505 28.3827 13.1505C27.3567 13.1505 26.5506 12.3022 26.5506 11.3064C26.5506 10.3107 27.3933 9.4624 28.3827 9.4624ZM25.1582 10.3475C25.0482 10.6426 25.0116 10.9745 25.0116 11.3064C25.0116 11.6384 25.0849 11.9703 25.1582 12.3022L18.7092 16.0641C18.2695 15.5846 17.6832 15.2527 17.0236 15.0683V7.58147C17.6832 7.43395 18.2695 7.06514 18.7092 6.62257L25.1582 10.3475ZM16.2541 2.41814C17.2801 2.41814 18.0862 3.2664 18.0862 4.26219C18.0862 5.25797 17.2435 6.10623 16.2541 6.10623C15.2648 6.10623 14.422 5.25797 14.422 4.26219C14.422 3.2664 15.2282 2.41814 16.2541 2.41814ZM13.7991 6.58568C14.2388 7.06514 14.8251 7.39706 15.4847 7.58147V15.0683C14.8251 15.2158 14.2388 15.5846 13.7991 16.0641L7.35014 12.3022C7.46006 12.0072 7.49671 11.6753 7.49671 11.3064C7.49671 10.9745 7.42342 10.6426 7.35014 10.3107L13.7991 6.58568ZM2.2569 11.3433C2.2569 10.3107 3.09967 9.49928 4.089 9.49928C5.11498 9.49928 5.9211 10.3475 5.9211 11.3433C5.9211 12.3391 5.07833 13.1874 4.089 13.1874C3.09967 13.1874 2.2569 12.3391 2.2569 11.3433ZM4.12564 27.3128C3.09967 27.3128 2.29354 26.4645 2.29354 25.4687C2.29354 24.4361 3.13631 23.6247 4.12564 23.6247C5.15162 23.6247 5.95774 24.4729 5.95774 25.4687C5.95774 26.4645 5.11498 27.3128 4.12564 27.3128ZM7.35014 26.4276C7.46006 26.1326 7.49671 25.8006 7.49671 25.4318C7.49671 25.0999 7.42342 24.768 7.35014 24.4729L13.7991 20.7111C14.2388 21.1905 14.8251 21.5225 15.4847 21.7069V29.1937C14.8251 29.3412 14.2388 29.71 13.7991 30.1895L7.35014 26.4276ZM16.2541 34.357C15.2282 34.357 14.422 33.5088 14.422 32.513C14.422 31.4803 15.2648 30.6689 16.2541 30.6689C17.2435 30.6689 18.0862 31.5172 18.0862 32.513C18.0862 33.5088 17.2801 34.357 16.2541 34.357ZM18.7092 30.1526C18.2695 29.6731 17.6832 29.3412 17.0236 29.1568V21.7069C17.6832 21.5593 18.2695 21.1905 18.7092 20.748L25.1582 24.5098C25.0482 24.8049 25.0116 25.1368 25.0116 25.4687C25.0116 25.8006 25.0849 26.1326 25.1582 26.4645L18.7092 30.1526ZM28.3827 27.3128C27.3567 27.3128 26.5506 26.4645 26.5506 25.4687C26.5506 24.4361 27.3933 23.6247 28.3827 23.6247C29.4086 23.6247 30.2148 24.4729 30.2148 25.4687C30.2514 26.4645 29.4086 27.3128 28.3827 27.3128Z" />
            </svg>
        )
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
        iconElement: (fillColor: string) => (
            <svg width="25" height="25" viewBox="0 0 30 26" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path stroke={fillColor} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
                    d="M19.1293 13.6802C19.1293 14.2106 18.9186 14.7193 18.5435 15.0944C18.1685 15.4695 17.6598 15.6802 17.1293 15.6802H5.12933L1.12933 19.6802V3.68018C1.12933 3.14974 1.34005 2.64103 1.71512 2.26596C2.09019 1.89089 2.5989 1.68018 3.12933 1.68018H17.1293C17.6598 1.68018 18.1685 1.89089 18.5435 2.26596C18.9186 2.64103 19.1293 3.14974 19.1293 3.68018V13.6802Z" />
                <path stroke={fillColor} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
                    d="M10.1293 19.0044C10.1293 19.5348 10.34 20.0435 10.7151 20.4186C11.0902 20.7937 11.5989 21.0044 12.1293 21.0044H24.1293L28.1293 25.0044V9.00439C28.1293 8.47396 27.9186 7.96525 27.5435 7.59018C27.1685 7.21511 26.6598 7.00439 26.1293 7.00439H12.1293C11.5989 7.00439 11.0902 7.21511 10.7151 7.59018C10.34 7.96525 10.1293 8.47396 10.1293 9.00439V19.0044Z" />
            </svg>
        )
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
                            <button className="sign-out" onClick={() => startTransition(async () => await signOut())} disabled={isPending}>
                                <PiSignOutLight />
                            </button>
                        </li>
                    </ul>
                </div>
            </nav>
        </div>
    );
};
