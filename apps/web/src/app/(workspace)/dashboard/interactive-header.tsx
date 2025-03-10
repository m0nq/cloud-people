'use client';

import { FaArrowRight, FaListUl } from 'react-icons/fa';
import Link from 'next/link';
import { Button } from '@components/utils/button/button';

export const InteractiveHeader = () => {
    return (
        <div className="flex justify-end space-x-4 mb-4">
            <Link href="/sandbox"
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 space-x-2">
                Start New Project
                <FaArrowRight size={16} />
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
