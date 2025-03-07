import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Home, BarChart2, ShoppingBag, Key, LogOut, Layers, DollarSign } from 'lucide-react';
import { useAuthStore } from '../../store/auth';
import { useThemeStore } from '../../store/theme';

export const Navbar: React.FC = () => {
  const location = useLocation();
  const { logout, user } = useAuthStore();
  const { isDarkMode } = useThemeStore();
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  
  const navItems = [
    { path: '/', icon: <Home size={20} />, label: 'Home' },
    { path: '/office', icon: <Layers size={20} />, label: 'Office' },
    { path: '/store', icon: <ShoppingBag size={20} />, label: 'Store' },
    { path: '/ranking', icon: <BarChart2 size={20} />, label: 'Ranking' },
    { path: '/earn', icon: <DollarSign size={20} />, label: 'Earn' },
    { path: '/keys', icon: <Key size={20} />, label: 'Keys' },
  ];
  
  return (
    <div className={`fixed left-0 top-0 h-full ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border-r w-16 z-10 flex flex-col transition-colors duration-200`}>
      <div className={`flex-shrink-0 flex items-center justify-center h-16 ${isDarkMode ? 'border-gray-700' : 'border-gray-200'} border-b`}>
        <Link to="/" className="flex items-center justify-center">
          <svg xmlns="http://www.w3.org/2000/svg" width="30" height="20" viewBox="0 0 67 44" fill="none">
            <path fillRule="evenodd" clipRule="evenodd" d="M66.0155 27.6498C66.0155 34.9354 60.9873 41.0467 54.2119 42.7026C53.8347 42.8356 53.4443 42.965 53.0414 43.0906L53.1504 43.0537L53.1255 43.037C52.8467 43.1497 52.542 43.2118 52.2228 43.2118C50.8918 43.2118 49.8127 42.1328 49.8127 40.8017L49.8128 40.7887V31.5758C49.8128 29.5819 48.1964 27.9655 46.2025 27.9655C44.2086 27.9655 42.5922 29.5819 42.5922 31.5758V39.1671H42.5918C42.5921 39.1829 42.5922 39.1988 42.5922 39.2147C42.5922 40.5457 41.5132 41.6248 40.1822 41.6248C38.8512 41.6248 37.7722 40.5457 37.7722 39.2147C37.7722 39.1988 37.7723 39.1829 37.7726 39.1671H37.7721V28.2096C37.7721 25.7253 35.7582 23.7114 33.2739 23.7114C30.7896 23.7114 28.7757 25.7253 28.7757 28.2096V39.1671H28.7753C28.7756 39.1829 28.7757 39.1988 28.7757 39.2147C28.7757 40.5457 27.6967 41.6248 26.3657 41.6248C25.0347 41.6248 23.9557 40.5457 23.9557 39.2147C23.9557 39.1988 23.9558 39.1829 23.9561 39.1671H23.9557V31.5758C23.9557 29.5819 22.3393 27.9655 20.3454 27.9655C18.3515 27.9655 16.7352 29.5819 16.7352 31.5758V40.7987L16.7352 40.8017L16.7352 40.8048V40.8662L16.7343 40.8668C16.6998 42.1678 15.6344 43.2118 14.3251 43.2118C14.0847 43.2118 13.8526 43.1766 13.6335 43.1111L13.5615 43.1632C13.0747 43.015 12.6056 42.8613 12.1552 42.7025C5.37999 41.0464 0.352051 34.9353 0.352051 27.6498C0.352051 19.5304 6.59693 12.8696 14.5456 12.2084C18.0015 5.42659 25.0502 0.781738 33.1837 0.781738C41.3172 0.781738 48.3658 5.42659 51.8218 12.2084C59.7705 12.8695 66.0155 19.5303 66.0155 27.6498ZM20.3728 26.7236C22.8722 26.7236 24.8983 24.6974 24.8983 22.198C24.8983 19.6987 22.8722 17.6725 20.3728 17.6725C17.8734 17.6725 15.8473 19.6987 15.8473 22.198C15.8473 24.6974 17.8734 26.7236 20.3728 26.7236ZM39.2598 16.1076C39.2598 19.4633 36.5394 22.1836 33.1837 22.1836C29.8281 22.1836 27.1077 19.4633 27.1077 16.1076C27.1077 12.7519 29.8281 10.0316 33.1837 10.0316C36.5394 10.0316 39.2598 12.7519 39.2598 16.1076ZM45.9947 26.7236C48.4941 26.7236 50.5202 24.6974 50.5202 22.198C50.5202 19.6987 48.4941 17.6725 45.9947 17.6725C43.4953 17.6725 41.4692 19.6987 41.4692 22.198C41.4692 24.6974 43.4953 26.7236 45.9947 26.7236Z" fill={isDarkMode ? "#56E8CD" : "#56E8CD"}/>
          </svg>
        </Link>
      </div>
      
      <nav className="flex-1 flex flex-col items-center pt-5 space-y-6">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          const isHovered = hoveredItem === item.path;
          
          return (
            <div key={item.path} className="relative group" onMouseEnter={() => setHoveredItem(item.path)} onMouseLeave={() => setHoveredItem(null)}>
              <Link
                to={item.path}
                className={`flex items-center justify-center w-10 h-10 rounded-lg transition-colors duration-200 ${
                  isActive
                    ? isDarkMode 
                      ? 'bg-blue-900 text-blue-300' 
                      : 'bg-blue-100 text-blue-600'
                    : isDarkMode
                      ? 'text-gray-400 hover:bg-gray-700 hover:text-gray-200'
                      : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900'
                }`}
              >
                {item.icon}
                {isActive && (
                  <motion.div
                    layoutId="navbar-indicator"
                    className={`absolute left-0 w-1 h-10 ${isDarkMode ? 'bg-blue-400' : 'bg-blue-600'} rounded-r-md`}
                    initial={false}
                  />
                )}
              </Link>
              
              {/* Tooltip that appears on hover */}
              {isHovered && (
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className={`absolute left-16 top-1 ${isDarkMode ? 'bg-gray-700 text-white' : 'bg-gray-800 text-white'} text-sm py-1 px-3 rounded-md whitespace-nowrap z-20`}
                >
                  {item.label}
                  <div className={`absolute left-0 top-1/2 transform -translate-x-1 -translate-y-1/2 border-4 border-transparent ${isDarkMode ? 'border-r-gray-700' : 'border-r-gray-800'}`}></div>
                </motion.div>
              )}
            </div>
          );
        })}
      </nav>
      
      <div className="flex-shrink-0 flex flex-col items-center pb-5">
        {user && (
          <>
            <div className="relative group mb-4" onMouseEnter={() => setHoveredItem('profile')} onMouseLeave={() => setHoveredItem(null)}>
              <div className="w-10 h-10 rounded-full overflow-hidden">
                <img
                  className="h-full w-full object-cover"
                  src={user.avatar}
                  alt={user.name}
                />
              </div>
              
              {/* Profile tooltip */}
              {hoveredItem === 'profile' && (
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className={`absolute left-16 top-1 ${isDarkMode ? 'bg-gray-700 text-white' : 'bg-gray-800 text-white'} text-sm py-1 px-3 rounded-md whitespace-nowrap z-20`}
                >
                  {user.name}
                  <div className={`absolute left-0 top-1/2 transform -translate-x-1 -translate-y-1/2 border-4 border-transparent ${isDarkMode ? 'border-r-gray-700' : 'border-r-gray-800'}`}></div>
                </motion.div>
              )}
            </div>
            
            <div className="relative group" onMouseEnter={() => setHoveredItem('logout')} onMouseLeave={() => setHoveredItem(null)}>
              <button
                onClick={logout}
                className={`flex items-center justify-center w-10 h-10 rounded-lg ${
                  isDarkMode
                    ? 'text-gray-400 hover:bg-gray-700 hover:text-gray-200'
                    : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900'
                } transition-colors duration-200`}
              >
                <LogOut size={20} />
              </button>
              
              {/* Logout tooltip */}
              {hoveredItem === 'logout' && (
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className={`absolute left-16 bottom-1 ${isDarkMode ? 'bg-gray-700 text-white' : 'bg-gray-800 text-white'} text-sm py-1 px-3 rounded-md whitespace-nowrap z-20`}
                >
                  Logout
                  <div className={`absolute left-0 top-1/2 transform -translate-x-1 -translate-y-1/2 border-4 border-transparent ${isDarkMode ? 'border-r-gray-700' : 'border-r-gray-800'}`}></div>
                </motion.div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};