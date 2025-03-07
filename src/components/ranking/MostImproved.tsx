import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, Award, Building, Calendar } from 'lucide-react';

interface MostImprovedProps {
  users: any[];
  loading: boolean;
  isDarkMode: boolean;
  timeframe: string;
}

export const MostImproved: React.FC<MostImprovedProps> = ({ users, loading, isDarkMode, timeframe }) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };
  
  const getOrdinal = (n: number) => {
    const s = ['th', 'st', 'nd', 'rd'];
    const v = n % 100;
    return n + (s[(v - 20) % 10] || s[v] || s[0]);
  };
  
  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };
  
  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 },
  };
  
  // Filter and sort users based on timeframe if needed
  const filteredUsers = [...users].slice(0, 5); // Just show top 5

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className={`text-xl font-bold ${isDarkMode ? 'text-gray-100' : 'text-gray-900'} flex items-center`}>
          <Calendar size={20} className="text-blue-500" />
          <span className="ml-2">Most Improved In The Ranks</span>
        </h2>
        <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
          {timeframe}
        </div>
      </div>
      
      <div className={`${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white'} rounded-lg shadow overflow-hidden`}>
        <div className={`grid grid-cols-4 ${isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'} border-b py-2 px-3 text-xs font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-500'}`}>
          <div className="col-span-1 text-center">Rank</div>
          <div className="col-span-1">User</div>
          <div className="col-span-1 text-center">
            <div className="flex items-center justify-center">
              <Building size={14} className="mr-1" />
              <span>Companies</span>
            </div>
          </div>
          <div className="col-span-1 text-right">Revenue</div>
        </div>
        
        {loading ? (
          <div className="flex justify-center py-8">
            <svg className={`animate-spin h-6 w-6 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </div>
        ) : (
          <motion.div
            variants={container}
            initial="hidden"
            animate="show"
          >
            {filteredUsers.map((user, index) => {
              return (
                <motion.div
                  key={user.id}
                  variants={item}
                  className={`grid grid-cols-4 py-3 px-3 items-center ${isDarkMode ? 'border-gray-700' : 'border-gray-200'} border-b text-sm`}
                >
                  <div className="col-span-1 flex justify-center">
                    {index < 3 ? (
                      <div className={`flex items-center justify-center w-6 h-6 rounded-full ${
                        isDarkMode ? 
                          'bg-gray-600 text-gray-300' : 
                          'bg-gray-100 text-gray-800'
                      }`}>
                        <Award size={14} />
                      </div>
                    ) : (
                      <div className={`${isDarkMode ? 'text-gray-400' : 'text-gray-500'} font-medium text-sm`}>{getOrdinal(index + 1)}</div>
                    )}
                  </div>
                  <div className="col-span-1 flex items-center">
                    <img
                      src={user.avatar}
                      alt={user.name}
                      className="w-8 h-8 rounded-full mr-2"
                    />
                    <div>
                      <div className={`font-medium ${isDarkMode ? 'text-gray-100' : 'text-gray-900'} text-sm`}>{user.name}</div>
                    </div>
                  </div>
                  <div className="col-span-1 flex justify-center">
                    <div className={`inline-flex items-center justify-center px-2 py-0.5 rounded-full ${
                      isDarkMode ? 'bg-blue-900/50 text-blue-300' : 'bg-blue-100 text-blue-800'
                    } text-xs font-medium`}>
                      {user.companies || 0}
                    </div>
                  </div>
                  <div className="col-span-1 text-right flex items-center justify-end">
                    <TrendingUp size={14} className={`${isDarkMode ? 'text-green-400' : 'text-green-500'} mr-1`} />
                    <span className={`font-bold ${isDarkMode ? 'text-gray-100' : 'text-gray-900'} text-sm`}>{formatCurrency(user.revenue)}</span>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </div>
    </div>
  );
};