'use client';

import Image from 'next/image';
import { FaPause } from 'react-icons/fa';
import { LuBook } from 'react-icons/lu';
import { VscSettings } from 'react-icons/vsc';

import { Button } from '@components/utils/button/button';
import { Card } from '@components/card';

interface CompanyCardProps {
    name: string;
    logoUrl: string;
    onOpen?: () => void;
    onViewDocs?: () => void;
    onPause?: () => void;
    onSettings?: () => void;
    className?: string;
}

export const CompanyCard = ({
    name,
    logoUrl,
    onOpen,
    onViewDocs,
    onPause,
    onSettings,
    className = ''
}: CompanyCardProps) => (
    <Card className={`max-w-3xl bg-white shadow-sm rounded-lg overflow-hidden ${className}`}>
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <div className="flex items-center space-x-2">
                <Image src={logoUrl}
                    alt={`${name} Logo`}
                    width={256}
                    height={256}
                    className="w-6 h-6 rounded" />
                <span className="text-sm font-medium text-gray-700">
                    {name}
                </span>
            </div>
            <div className="flex items-center space-x-4">
                <Button variant="muted"
                    size="sm"
                    icon={<LuBook size={20} className="text-gray-600" />}
                    onClick={onViewDocs}
                    aria-label="View Documentation" />
                <Button variant="muted"
                    size="sm"
                    icon={<FaPause size={20} className="text-gray-600" />}
                    onClick={onPause}
                    aria-label="Pause" />
                <Button variant="muted"
                    size="sm"
                    icon={<VscSettings size={20} className="text-gray-600" />}
                    onClick={onSettings}
                    aria-label="Settings" />
                <Button variant="primary"
                    size="sm"
                    onClick={onOpen}>
                    Open
                </Button>
            </div>
        </div>
    </Card>
);
