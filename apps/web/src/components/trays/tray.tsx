import { ReactNode } from 'react';
import { useState } from 'react';
import { useEffect } from 'react';
import { useCallback } from 'react';
import { useRef } from 'react';

import './tray.styles.css';
import { useTrayStore } from '@stores/tray-store';
import { AgentSelectionTray } from './agent-selection-tray';


export const Tray = (): ReactNode => {
    const { isOpen, trayType, closeTray, sourceNodeId } = useTrayStore();
    const [isVisible, setIsVisible] = useState(false);
    const bodyRef = useRef<HTMLElement | null>(null);

    // Initialize bodyRef in an effect to ensure it's only accessed in browser environment
    useEffect(() => {
        if (typeof document !== 'undefined') {
            bodyRef.current = document.body;
        }
    }, []);

    // Handle keyboard events (Escape key to close tray)
    const handleKeyDown = useCallback((event: KeyboardEvent) => {
            if (event.key === 'Escape' && isOpen) {
                closeTray();
            }
        },
        [isOpen, closeTray]
    );

    // Set up event listeners
    useEffect(() => {
        if (isOpen && typeof document !== 'undefined') {
            document.addEventListener('keydown', handleKeyDown);
        }

        return () => {
            if (typeof document !== 'undefined') {
                document.removeEventListener('keydown', handleKeyDown);
            }
        };
    }, [isOpen, handleKeyDown]);

    // Handle visibility for animation
    useEffect(() => {
        if (isOpen) {
            setIsVisible(true);
            // Add class to prevent scrolling on body when tray is open
            if (bodyRef.current) {
                bodyRef.current.classList.add('overflow-hidden');
            }
        } else {
            // Delay hiding to allow animation to complete
            const timer = setTimeout(() => {
                setIsVisible(false);
                if (bodyRef.current) {
                    bodyRef.current.classList.remove('overflow-hidden');
                }
            }, 300);
            return () => clearTimeout(timer);
        }
    }, [isOpen]);

    if (!isVisible && !isOpen) {
        return null;
    }

    return (
        <div className="tray-container" role="dialog" aria-modal="true" aria-labelledby="tray-title">
            <div className="tray-backdrop"
                onClick={closeTray}
                aria-hidden="true" />

            <div className={`tray-content ${isOpen ? 'tray-content-open' : 'tray-content-closed'}`}
                aria-live="polite">
                {trayType === 'agent-selection' && (
                    <AgentSelectionTray
                        onClose={closeTray}
                        parentNodeId={sourceNodeId} />
                )}
            </div>
        </div>
    );
};
