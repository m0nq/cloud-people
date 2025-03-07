import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ShoppingCart, Filter, Search, Users, Briefcase, Clock, CheckCircle } from 'lucide-react';
import { useStoreItemsStore } from '../store/store-items';
import { useThemeStore } from '../store/theme';
import { Card, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';

export const Store: React.FC = () => {
  const { items, loading, fetchItems } = useStoreItemsStore();
  const { isDarkMode } = useThemeStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'agents' | 'business'>('agents');
  
  useEffect(() => {
    fetchItems();
  }, [fetchItems]);
  
  const categories = Array.from(
    new Set(items.map((item) => item.category))
  );
  
  const filteredItems = items.filter((item) => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory ? item.category === selectedCategory : true;
    
    // Filter by tab
    const isAgentItem = ['AI Tools', 'Collaboration', 'Visualization'].includes(item.category);
    const isBusinessItem = ['Modules', 'Integrations', 'Security', 'Templates'].includes(item.category);
    
    const matchesTab = activeTab === 'agents' ? isAgentItem : isBusinessItem;
    
    return matchesSearch && matchesCategory && matchesTab;
  });
  
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };
  
  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05,
      },
    },
  };
  
  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 },
  };
  
  // Function to get app icon based on app name
  const getAppIcon = (appName: string) => {
    switch (appName.toLowerCase()) {
      case 'tiktok':
        return (
          <div className="w-10 h-10 rounded-lg overflow-hidden bg-black flex items-center justify-center">
            <svg viewBox="0 0 24 24" width="24" height="24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M19.589 6.686a4.793 4.793 0 0 1-3.77-4.245V2h-3.445v13.672a2.896 2.896 0 0 1-5.201 1.743l-.002-.001.002.001a2.895 2.895 0 0 1 3.183-4.51v-3.5a6.329 6.329 0 0 0-5.394 10.692 6.33 6.33 0 0 0 10.857-4.424V8.687a8.182 8.182 0 0 0 4.773 1.526V6.79a4.831 4.831 0 0 1-1.003-.104z" fill="#fff"/>
            </svg>
          </div>
        );
      case 'sheets':
        return (
          <div className="w-10 h-10 rounded-lg overflow-hidden bg-green-600 flex items-center justify-center">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="white" xmlns="http://www.w3.org/2000/svg">
              <path d="M19 3H5c-1.1 0-1.99.9-1.99 2L3 19c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V5h14v14zM7 10h2v2H7zm0 4h2v2H7zm4-4h2v2h-2zm0 4h2v2h-2zm4-4h2v2h-2zm0 4h2v2h-2z"/>
            </svg>
          </div>
        );
      case 'docs':
        return (
          <div className="w-10 h-10 rounded-lg overflow-hidden bg-blue-500 flex items-center justify-center">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="white" xmlns="http://www.w3.org/2000/svg">
              <path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"/>
            </svg>
          </div>
        );
      case 'notion':
        return (
          <div className="w-10 h-10 rounded-lg overflow-hidden bg-gray-900 flex items-center justify-center">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="white" xmlns="http://www.w3.org/2000/svg">
              <path d="M4.459 4.208c.746.606 1.026.56 2.428.466l13.215-.793c.28 0 .047-.28-.046-.326L17.86 1.968c-.42-.326-.981-.7-2.055-.607L3.01 2.295c-.466.046-.56.28-.374.466l1.823 1.447zm1.775 2.286v13.554c0 .793.28 1.12 1.307 1.073l14.522-.84c.747-.046.934-.42.934-1.073V5.929c0-.653-.187-.933-.747-.887l-15.177.887c-.56.047-.84.327-.84.56zm14.896 1.26v10.501c0 .42-.187.7-.56.747l-1.307.28c-.373.047-.7-.093-.7-.42V6.847c0-.28.187-.606.607-.653l1.307-.233c.373-.047.653.186.653.606zm-12.028-.373c-.046-.7.56-.887 1.026-.887l9.634-.7c.653-.047.933.327.933.7v10.501c0 .42-.373.747-.84.793l-10.267.653c-.7.047-.934-.327-.934-.7l.187-1.167 1.307-.327V7.94l-1.026.187V7.38z"/>
            </svg>
          </div>
        );
      case 'slack':
        return (
          <div className="w-10 h-10 rounded-lg overflow-hidden bg-purple-600 flex items-center justify-center">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="white" xmlns="http://www.w3.org/2000/svg">
              <path d="M6 15a2 2 0 1 1 0-4 2 2 0 0 1 0 4zm0-6a2 2 0 1 1 0-4 2 2 0 0 1 0 4zm6 0a2 2 0 1 1 0-4 2 2 0 0 1 0 4zm6 0a2 2 0 1 1 0-4 2 2 0 0 1 0 4zm-6 6a2 2 0 1 1 0-4 2 2 0 0 1 0 4zm6 0a2 2 0 1 1 0-4 2 2 0 0 1 0 4z"/>
            </svg>
          </div>
        );
      case 'asana':
        return (
          <div className="w-10 h-10 rounded-lg overflow-hidden bg-red-500 flex items-center justify-center">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="white" xmlns="http://www.w3.org/2000/svg">
              <path d="M19.7 7.3c-1.4-1.4-3.8-1.4-5.2 0-1.4 1.4-1.4 3.8 0 5.2 1.4 1.4 3.8 1.4 5.2 0 1.4-1.4 1.4-3.8 0-5.2zm-7.6 0c-1.4-1.4-3.8-1.4-5.2 0-1.4 1.4-1.4 3.8 0 5.2 1.4 1.4 3.8 1.4 5.2 0 1.4-1.4 1.4-3.8 0-5.2zm3.8 7.6c-1.4-1.4-3.8-1.4-5.2 0-1.4 1.4-1.4 3.8 0 5.2 1.4 1.4 3.8 1.4 5.2 0 1.4-1.4 1.4-3.8 0-5.2z"/>
            </svg>
          </div>
        );
      case 'tableau':
        return (
          <div className="w-10 h-10 rounded-lg overflow-hidden bg-blue-700 flex items-center justify-center">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="white" xmlns="http://www.w3.org/2000/svg">
              <path d="M11.654 17.022h.96V13.5h3.535v-.947h-3.535V9.011h-.96v3.542H8.11v.947h3.544v3.522zm-3.98-6.5h-.961V7.006H3.179v.947h3.535v3.522h.96V7.953zm7.96 0h.96V7.006h3.535v.947h-3.535v3.522h-.96V7.953zm-3.98-3.98h.96V3.027h3.535v.946h-3.535v3.522h-.96V3.973zm0 15.96h.96v-3.516h3.535v-.947h-3.535v-3.522h-.96v3.522H8.11v.947h3.544v3.516zm-7.96-3.98h.96v-3.516h3.535v-.947H3.654v-3.522h-.96v3.522H-.842v.947h3.535v3.516zm15.92 0h.96v-3.516h3.535v-.947h-3.535v-3.522h-.96v3.522h-3.535v.947h3.535v3.516zM11.654 3.973h.96V.456h3.535v.947h-3.535v3.522h-.96V1.403H8.11v-.947h3.544v3.517z"/>
            </svg>
          </div>
        );
      case 'powerbi':
        return (
          <div className="w-10 h-10 rounded-lg overflow-hidden bg-yellow-500 flex items-center justify-center">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="white" xmlns="http://www.w3.org/2000/svg">
              <path d="M21 2H3c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h18c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM11 17H7v-6h4v6zm4 0h-3V7h3v10zm4 0h-3v-8h3v8z"/>
            </svg>
          </div>
        );
      case 'wordpress':
        return (
          <div className="w-10 h-10 rounded-lg overflow-hidden bg-blue-600 flex items-center justify-center">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="white" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2C6.486 2 2 6.486 2 12s4.486 10 10 10 10-4.486 10-10S17.514 2 12 2zm0 19.5c-5.247 0-9.5-4.253-9.5-9.5S6.753 2.5 12 2.5s9.5 4.253 9.5 9.5-4.253 9.5-9.5 9.5zm-4.5-9.5c0 2.485 1.44 4.637 3.534 5.66l-3-8.227c-.28.816-.534 1.656-.534 2.567zm9.92-.621c0-.778-.28-1.316-.52-1.735-.32-.519-.62-1.037-.62-1.595 0-.635.477-1.216 1.154-1.216.031 0 .06.004.09.006A7.494 7.494 0 0 0 12 4.5c-2.7 0-5.074 1.39-6.458 3.49.181.006.351.01.495.01.804 0 2.047-.098 2.047-.098.414-.024.463.584.049.633 0 0-.416.049-.878.073l2.787 8.293 1.677-5.028-1.194-3.265c-.414-.024-.807-.073-.807-.073-.414-.024-.365-.657.049-.633 0 0 1.267.098 2.022.098.804 0 2.047-.098 2.047-.098.414-.024.463.584.049.633 0 0-.416.049-.878.073l2.767 8.228.763-2.546c.33-.929.58-1.595.58-2.169zm-3.86.956l-2.296 6.67c.685.203 1.412.313 2.169.313.895 0 1.754-.155 2.551-.438a.38.38 0 0 1-.033-.059l-2.391-6.486zM16.52 8.92c.03.231.047.478.047.736 0 .723-.136 1.536-.543 2.557l-2.178 6.3c2.13-1.24 3.575-3.514 3.575-6.153 0-1.236-.32-2.397-.901-3.44z"/>
            </svg>
          </div>
        );
      case 'analytics':
        return (
          <div className="w-10 h-10 rounded-lg overflow-hidden bg-orange-500 flex items-center justify-center">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="white" xmlns="http://www.w3.org/2000/svg">
              <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z"/>
            </svg>
          </div>
        );
      case 'ahrefs':
        return (
          <div className="w-10 h-10 rounded-lg overflow-hidden bg-yellow-600 flex items-center justify-center">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="white" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/>
            </svg>
          </div>
        );
      default:
        return (
          <div className="w-10 h-10 rounded-lg overflow-hidden bg-gray-400 flex items-center justify-center">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="white" xmlns="http://www.w3.org/2000/svg">
              <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 7h-2V8h2v2zm0 4h-2v-2h2v2zm-6-4h2v2H6v-2zm0-4h2v2H6V6zm0 8h2v2H6v-2zm12 2h-2v-2h2v2zm0-4h-2v-2h2v2zm0-4h-2V6h2v2z"/>
            </svg>
          </div>
        );
    }
  };
  
  return (
    <div className="space-y-6 pr-6">
      <h1 className={`text-2xl font-bold ${isDarkMode ? 'text-gray-100' : 'text-gray-900'}`}>Store</h1>
      
      {/* Tabs */}
      <div className={`border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
        <div className="flex -mb-px">
          <button
            onClick={() => setActiveTab('agents')}
            className={`py-4 px-6 font-medium text-sm border-b-2 transition-colors duration-200 flex items-center ${
              activeTab === 'agents'
                ? isDarkMode
                  ? 'border-blue-500 text-blue-400'
                  : 'border-blue-500 text-blue-600'
                : isDarkMode
                  ? 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <Users size={18} className="mr-2" />
            Agents
          </button>
          <button
            onClick={() => setActiveTab('business')}
            className={`py-4 px-6 font-medium text-sm border-b-2 transition-colors duration-200 flex items-center ${
              activeTab === 'business'
                ? isDarkMode
                  ? 'border-blue-500 text-blue-400'
                  : 'border-blue-500 text-blue-600'
                : isDarkMode
                  ? 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <Briefcase size={18} className="mr-2" />
            Business
          </button>
        </div>
      </div>
      
      {/* Search bar and filter on the same line */}
      <div className="flex items-center justify-center space-x-4 max-w-2xl mx-auto">
        <div className="w-1/2">
          <Input
            placeholder="Search items..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            leftIcon={<Search size={16} className={isDarkMode ? 'text-gray-400' : 'text-gray-400'} />}
          />
        </div>
        
        <div className="w-1/2 relative">
          <select
            className={`w-full pl-3 pr-10 py-2 text-base ${
              isDarkMode 
                ? 'bg-gray-700 border-gray-600 text-gray-200 focus:outline-none focus:ring-blue-500 focus:border-blue-500' 
                : 'border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500'
            } sm:text-sm rounded-md`}
            value={selectedCategory || ''}
            onChange={(e) => setSelectedCategory(e.target.value || null)}
          >
            <option value="">All Categories</option>
            {categories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
          <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
            <Filter size={16} className={isDarkMode ? 'text-gray-400' : 'text-gray-400'} />
          </div>
        </div>
      </div>
      
      {loading ? (
        <div className="flex justify-center py-12">
          <svg className={`animate-spin h-8 w-8 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        </div>
      ) : (
        <>
          {filteredItems.length === 0 ? (
            <div className={`text-center py-12 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800 mb-4">
                {activeTab === 'agents' ? (
                  <Users size={24} className={isDarkMode ? 'text-gray-500' : 'text-gray-400'} />
                ) : (
                  <Briefcase size={24} className={isDarkMode ? 'text-gray-500' : 'text-gray-400'} />
                )}
              </div>
              <h3 className={`text-lg font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-900'}`}>No items found</h3>
              <p className="mt-1">Try adjusting your search or filter to find what you're looking for.</p>
            </div>
          ) : (
            <motion.div
              variants={container}
              initial="hidden"
              animate="show"
              className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6"
            >
              {filteredItems.map((storeItem) => (
                <motion.div key={storeItem.id} variants={item}>
                  {activeTab === 'agents' ? (
                    // Agent card design
                    <Card className="h-full flex flex-col overflow-hidden">
                      <CardContent className="p-5">
                        <div className="flex items-center mb-4">
                          <div className="w-14 h-14 rounded-full overflow-hidden bg-gray-200 mr-3">
                            <img
                              src={storeItem.image}
                              alt={storeItem.name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div>
                            <h3 className={`text-xl font-semibold ${isDarkMode ? 'text-gray-100' : 'text-gray-900'}`}>
                              {storeItem.name}
                            </h3>
                            <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                              Researcher
                            </p>
                          </div>
                        </div>
                        
                        <div className="mb-4">
                          <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                            Core Skill:
                          </p>
                          <p className={`text-lg font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-800'} truncate`}>
                            {storeItem.coreSkill}
                          </p>
                        </div>
                        
                        {storeItem.compatibleApps && (
                          <div className="flex space-x-2 mb-4">
                            {storeItem.compatibleApps.map((app, index) => (
                              <div key={index}>
                                {getAppIcon(app)}
                              </div>
                            ))}
                          </div>
                        )}
                        
                        <div className="flex justify-between mt-auto">
                          <div className="flex flex-row space-x-4">
                            <div>
                              <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'} mb-1`}>
                                Training Hours
                              </p>
                              <div className={`px-3 py-1 rounded-full ${isDarkMode ? 'bg-gray-800' : 'bg-gray-900'} text-white text-sm font-medium text-center`}>
                                {storeItem.trainingHours}
                              </div>
                            </div>
                            <div>
                              <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'} mb-1`}>
                                Accuracy
                              </p>
                              <div className={`px-3 py-1 rounded-full ${isDarkMode ? 'bg-gray-800' : 'bg-gray-900'} text-white text-sm font-medium text-center`}>
                                {storeItem.accuracy}%
                              </div>
                            </div>
                          </div>
                          
                          <Button
                            variant="primary"
                            size="sm"
                            leftIcon={<ShoppingCart size={16} />}
                            className="self-end"
                          >
                            Add
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ) : (
                    // Business item card design (unchanged)
                    <Card className="h-full flex flex-col">
                      <div className="h-40 overflow-hidden">
                        <img
                          src={storeItem.image}
                          alt={storeItem.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <CardContent className="flex-grow flex flex-col">
                        <div className="mb-2">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            isDarkMode ? 'bg-blue-900/50 text-blue-300' : 'bg-blue-100 text-blue-800'
                          }`}>
                            {storeItem.category}
                          </span>
                        </div>
                        <h3 className={`text-lg font-medium ${isDarkMode ? 'text-gray-100' : 'text-gray-900'} mb-1`}>{storeItem.name}</h3>
                        <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'} mb-4 flex-grow`}>{storeItem.description}</p>
                        <div className="flex justify-between items-center mt-auto">
                          <span className={`text-lg font-bold ${isDarkMode ? 'text-gray-100' : 'text-gray-900'}`}>{formatCurrency(storeItem.price)}</span>
                          <Button
                            variant="primary"
                            size="sm"
                            leftIcon={<ShoppingCart size={16} />}
                          >
                            Add to Cart
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </motion.div>
              ))}
            </motion.div>
          )}
        </>
      )}
    </div>
  );
};