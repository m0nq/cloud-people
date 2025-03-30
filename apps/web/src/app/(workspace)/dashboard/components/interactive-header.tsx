'use client';

import { FaArrowRight } from 'react-icons/fa';
import Link from 'next/link';

import '../dashboard.styles.css';
import { IoIosList } from 'react-icons/io';

export const InteractiveHeader = () => {
    return (
        <div className="interactive-header-container">
            <div className="header-buttons">
                <Link href="/canvas" className="header-link">
                    Start New Project
                    <FaArrowRight size={16} />
                </Link>
                <button className="header-button"
                    onClick={() => {
                        const allProjectsElement = document.getElementById('all-projects-section');
                        if (allProjectsElement) {
                            allProjectsElement.scrollIntoView({ behavior: 'smooth' });
                        }
                    }}>
                    <IoIosList size={24} />
                    All Projects
                </button>
            </div>
        </div>
    );
};
