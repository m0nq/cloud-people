import './main.styles.css';
import { Banner } from '@components/banner/banner';
import { Content } from '@components/content/content';

export const Main = () => {
    return (
        <div className="app">
            <div className="root-container">
                <div className="inner-container">
                    <Banner />
                    <div className="header">Header</div>
                    <div className="sidebar">Sidebar</div>
                    <Content />
                    {/*<div className="footer">Footer</div>*/}
                </div>
            </div>
        </div>
    );
};
