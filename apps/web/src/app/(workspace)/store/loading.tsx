import { ReactElement } from 'react';

import './store.styles.css';

const StoreLoading = (): ReactElement => {
    return (
        <div className="store-container">
            <div className="loading-container">
                <div className="loading-text">Loading...</div>
            </div>
        </div>
    );
};

export default StoreLoading;
