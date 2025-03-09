'use client';

import { FaArrowRight, FaListUl } from 'react-icons/fa';
import Link from 'next/link';
import { Button } from '@components/utils/button/button';

export const InteractiveHeader = () => {
    return (
        <div className="fixed top-20 right-6 z-10 flex flex-row space-x-4">
            <Link href="/sandbox" className="shadow-lg">
                Start New Project
                <FaArrowRight size={20} />
            </Link>
            <Button variant="secondary"
                size="lg"
                icon={<FaListUl size={20} />}
                onClick={() => {
                    const allProjectsElement = document.getElementById('all-projects-section');
                    if (allProjectsElement) {
                        allProjectsElement.scrollIntoView({ behavior: 'smooth' });
                    }
                }}
                className="shadow-lg">
                All Projects
            </Button>
        </div>
    );
};
