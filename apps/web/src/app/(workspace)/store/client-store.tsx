'use client';

import { ReactElement } from 'react';

import { FiSearch } from 'react-icons/fi';

import ResearcherCard from '@components/store/researcher-card';
import { useMarketplaceStore } from '@stores/marketplace-store';

import './store.styles.css';

const ClientStore = (): ReactElement => {
    const { 
        filteredResearchers, 
        activeTab, 
        setActiveTab, 
        searchTerm, 
        setSearchTerm,
        selectedCategory,
        setSelectedCategory
    } = useMarketplaceStore();

    const categories = [
        { value: null, label: 'All Categories' },
        { value: 'analysis', label: 'Analysis' },
        { value: 'writing', label: 'Writing' },
        { value: 'data', label: 'Data' },
        { value: 'project', label: 'Project Management' },
        { value: 'seo', label: 'SEO' }
    ];

    return (
        <div className="store-container">
            <div className="store-header">
                <h1 className="store-title">Store</h1>
            </div>
            
            {/* Tabs */}
            <div className="store-tabs">
                <button
                    className={`store-tab ${activeTab === 'agents' ? 'store-tab-active' : 'store-tab-inactive'}`}
                    onClick={() => setActiveTab('agents')}
                >
                    Agents
                </button>
                <button
                    className={`store-tab ${activeTab === 'business' ? 'store-tab-active' : 'store-tab-inactive'}`}
                    onClick={() => setActiveTab('business')}
                >
                    Business
                </button>
            </div>
            
            {/* Search and Filter */}
            <div className="search-filter-container">
                <div className="search-container">
                    <div className="search-icon-wrapper">
                        <FiSearch className="search-icon" />
                    </div>
                    <input
                        type="text"
                        className="search-input"
                        placeholder="Search items..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <select
                    className="category-select"
                    value={selectedCategory || ''}
                    onChange={(e) => setSelectedCategory(e.target.value === '' ? null : e.target.value)}
                >
                    {categories.map((category) => (
                        <option key={category.label} value={category.value || ''}>
                            {category.label}
                        </option>
                    ))}
                </select>
            </div>
            
            {/* Researcher Cards Grid */}
            <div className="researchers-grid">
                {filteredResearchers.map((researcher) => (
                    <ResearcherCard key={researcher.id} researcher={researcher} />
                ))}
            </div>
            
            {/* Empty State */}
            {filteredResearchers.length === 0 && (
                <div className="empty-state">
                    <p className="empty-state-title">No researchers found</p>
                    <p className="empty-state-subtitle">Try adjusting your search or filters</p>
                </div>
            )}
        </div>
    );
};

export default ClientStore;
