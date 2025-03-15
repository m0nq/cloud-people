'use client';

import { FaArrowRight } from 'react-icons/fa';
import Link from 'next/link';

import '../dashboard.styles.css';
import { Button } from '@components/utils/button/button';
import { IoIosList } from 'react-icons/io';

export const InteractiveHeader = () => {
    return (
        <div className="interactive-header-container">
            <div className="header-buttons">
                <Link href="/sandbox"
                    className="header-link">
                    Start New Project
                    <FaArrowRight size={16} />
                </Link>
                <Button size="md"
                    icon={<IoIosList size={24} />}
                    onClick={() => {
                        const allProjectsElement = document.getElementById('all-projects-section');
                        if (allProjectsElement) {
                            allProjectsElement.scrollIntoView({ behavior: 'smooth' });
                        }
                    }}
                    className="header-button">
                    All Projects
                </Button>
            </div>
        </div>
    );
};
