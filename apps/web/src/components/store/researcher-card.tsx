import { ReactElement } from 'react';

import { FaChartBar, FaFileAlt, FaFilePowerpoint, FaTiktok, FaVolumeUp, FaBell } from 'react-icons/fa';

import { useMarketplaceStore } from '@stores/marketplace-store';
import type { Researcher } from '@stores/marketplace-store';

import './researcher-card.styles.css';

interface ResearcherCardProps {
    researcher: Researcher;
}

const ResearcherCard = ({ researcher }: ResearcherCardProps): ReactElement => {
    const { addToCart } = useMarketplaceStore();
    
    const getToolIcon = (tool: string): ReactElement => {
        switch (tool) {
            case 'tiktok':
                return <FaTiktok className="text-xl" />;
            case 'chart':
                return <FaChartBar className="text-xl" />;
            case 'document':
                return <FaFileAlt className="text-xl" />;
            case 'presentation':
                return <FaFilePowerpoint className="text-xl" />;
            case 'audio':
                return <FaVolumeUp className="text-xl" />;
            case 'alert':
                return <FaBell className="text-xl" />;
            default:
                return <FaFileAlt className="text-xl" />;
        }
    };

    return (
        <div className="researcher-card">
            <div className="researcher-card-content">
                <div className="researcher-header">
                    <div className="researcher-avatar-container">
                        <img 
                            src={researcher.avatar} 
                            alt={researcher.name}
                            className="researcher-avatar"
                            onError={(e) => {
                                // Fallback to first letter of name if image fails to load
                                const target = e.target as HTMLImageElement;
                                target.style.display = 'none';
                                target.parentElement!.innerHTML = researcher.name.charAt(0);
                                target.parentElement!.className += ' researcher-avatar-fallback';
                            }}
                        />
                    </div>
                    <div className="researcher-info">
                        <h3 className="researcher-name">{researcher.name}</h3>
                        <p className="researcher-role">{researcher.role}</p>
                    </div>
                </div>
                
                <div className="researcher-skill-section">
                    <p className="researcher-skill-label">Core Skill:</p>
                    <p className="researcher-skill-value">{researcher.coreSkill}</p>
                </div>
                
                <div className="researcher-tools">
                    {researcher.tools.map((tool, index) => (
                        <div key={index} className="researcher-tool">
                            {getToolIcon(tool)}
                        </div>
                    ))}
                </div>
                
                <div className="researcher-stats">
                    <div className="researcher-stat">
                        <p className="researcher-stat-label">Training Hours</p>
                        <p className="researcher-stat-value">{researcher.trainingHours}</p>
                    </div>
                    <div className="researcher-stat">
                        <p className="researcher-stat-label">Accuracy</p>
                        <p className="researcher-stat-value">{researcher.accuracy}%</p>
                    </div>
                </div>
                
                <button 
                    onClick={() => addToCart(researcher)}
                    className="researcher-add-button"
                >
                    Add
                </button>
            </div>
        </div>
    );
};

export default ResearcherCard;
