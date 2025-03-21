import { ReactNode } from 'react';
import { useState } from 'react';
import { useEffect } from 'react';

import './tray.styles.css';

// This will be implemented later
type TrayType = 'agentSelection' | null;

// Placeholder for the tray store
const useTrayStore = () => {
    return {
        isOpen: false,
        trayType: null as TrayType,
        closeTray: () => {},
        parentNodeId: undefined as string | undefined
    };
};

type TrayComponentsType = {
    [key in NonNullable<TrayType>]: React.ComponentType<any>;
};

// Placeholder for the AgentSelectionTray component
const AgentSelectionTray = (): ReactNode => <div>Agent Selection Tray</div>;

const TrayComponents: TrayComponentsType = {
    agentSelection: AgentSelectionTray as React.ComponentType<any>
};

export const Tray = (): ReactNode => {
    const { isOpen, trayType, closeTray, parentNodeId } = useTrayStore();
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setIsVisible(true);
        } else {
            // Delay hiding to allow animation to complete
            const timer = setTimeout(() => setIsVisible(false), 300);
            return () => clearTimeout(timer);
        }
    }, [isOpen]);

    if (!isVisible || !trayType) return null;

    const TrayComponent = TrayComponents[trayType];

    return (
        <div className="tray-container">
            <div className="tray-backdrop" onClick={closeTray} />

            <div className={`tray-content ${isOpen ? 'tray-content-open' : 'tray-content-closed'}`}>
                <TrayComponent onClose={closeTray} parentNodeId={parentNodeId} />
            </div>
        </div>
    );
};
