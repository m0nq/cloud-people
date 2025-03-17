'use client';

import Image from 'next/image';
import { FiBook } from 'react-icons/fi';
import { FiPause } from 'react-icons/fi';
import { LuSettings2 } from 'react-icons/lu';

import './company-card.styles.css';

interface CompanyCardProps {
    name: string;
    logoUrl: string;
    onOpen?: () => void;
    onViewDocs?: () => void;
    onPause?: () => void;
    onSettings?: () => void;
}

export const CompanyCard = ({
    name,
    logoUrl,
    onOpen,
    onViewDocs,
    onPause,
    onSettings
}: CompanyCardProps) => (
    <div className="company-card-container">
        <div className="card-header">
            <div className="company-info">
                <Image src={logoUrl}
                    alt={`${name} Logo`}
                    width={256}
                    height={256}
                    className="company-logo" />
                <span className="company-name">
                    {name}
                </span>
            </div>
            <div className="action-buttons">
                <button onClick={onViewDocs} className="action-button" aria-label="View Documentation">
                    <FiBook size={20} className="icon-button" />
                </button>
                <button onClick={onPause} className="action-button" aria-label="Pause">
                    <FiPause size={20} className="icon-button" />
                </button>
                <button onClick={onSettings} className="action-button" aria-label="Settings">
                    <LuSettings2 size={20} className="icon-button" />
                </button>
                <button className="open-button" onClick={onOpen}>
                    Open
                </button>
            </div>
        </div>
    </div>
);
