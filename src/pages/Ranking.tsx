import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, Award, Users, Building } from 'lucide-react';
import { useUsersStore } from '../store/users';
import { useThemeStore } from '../store/theme';

export const Ranking: React.FC = () => {
  const { users, loading, fetchUsers } = useUsersStore();
  const { isDarkMode } = useThemeStore();
  
  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);
  
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
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className={`text-2xl font-bold ${isDarkMode ? 'text-gray-100' : 'text-gray-900'}`}>User Rankings</h1>
        <div className={`flex items-center ${isDarkMode ? 'text-gray-300' : 'text-gray-500'}`}>
          <Users size={20} className="mr-2" />
          <span>{users.length} Users</span>
        </div>
      </div>
      
      <div className={`${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white'} rounded-lg shadow overflow-hidden`}>
        <div className={`grid grid-cols-4 ${isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'} border-b py-3 px-4 text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-500'}`}>
          <div className="col-span-1 text-center">Rank</div>
          <div className="col-span-1">User</div>
          <div className="col-span-1 text-center">
            <div className="flex items-center justify-center">
              <Building size={16} className="mr-2" />
              <span>Companies</span>
            </div>
          </div>
          <div className="col-span-1 text-right">Revenue</div>
        </div>
        
        {loading ? (
          <div className="flex justify-center py-12">
            <svg className={`animate-spin h-8 w-8 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
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
            {users.map((user, index) => {
              let bgClass = '';
              if (isDarkMode) {
                bgClass = index === 0 ? 'bg-yellow-900/30' : index === 1 ? 'bg-gray-700/50' : index === 2 ? 'bg-amber-900/30' : '';
              } else {
                bgClass = index === 0 ? 'bg-yellow-50' : index === 1 ? 'bg-gray-50' : index === 2 ? 'bg-amber-50' : '';
              }
              
              return (
                <motion.div
                  key={user.id}
                  variants={item}
                  className={`grid grid-cols-4 py-4 px-4 items-center ${isDarkMode ? 'border-gray-700' : 'border-gray-200'} border-b ${bgClass}`}
                >
                  <div className="col-span-1 flex justify-center">
                    {index < 3 ? (
                      <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
                        isDarkMode ? 
                          (index === 0 ? 'bg-yellow-900/50 text-yellow-300' : 
                          index === 1 ? 'bg-gray-600 text-gray-300' : 
                          'bg-amber-900/50 text-amber-300') :
                          (index === 0 ? 'bg-yellow-100 text-yellow-800' : 
                          index === 1 ? 'bg-gray-100 text-gray-800' : 
                          'bg-amber-100 text-amber-800')
                      }`}>
                        <Award size={16} />
                      </div>
                    ) : (
                      <div className={`${isDarkMode ? 'text-gray-400' : 'text-gray-500'} font-medium`}>{getOrdinal(index + 1)}</div>
                    )}
                  </div>
                  <div className="col-span-1 flex items-center">
                    <img
                      src={user.avatar}
                      alt={user.name}
                      className="w-10 h-10 rounded-full mr-3"
                    />
                    <div>
                      <div className={`font-medium ${isDarkMode ? 'text-gray-100' : 'text-gray-900'}`}>{user.name}</div>
                      <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>{ user.email}</div>
                    </div>
                  </div>
                  <div className="col-span-1 flex justify-center">
                    <div className={`inline-flex items-center justify-center px-2.5 py-0.5 rounded-full ${
                      isDarkMode ? 'bg-blue-900/50 text-blue-300' : 'bg-blue-100 text-blue-800'
                    } text-sm font-medium`}>
                      {user.companies || 0}
                    </div>
                  </div>
                  <div className="col-span-1 text-right flex items-center justify-end">
                    <TrendingUp size={16} className={`${isDarkMode ? 'text-green-400' : 'text-green-500'} mr-2`} />
                    <span className={`font-bold ${isDarkMode ? 'text-gray-100' : 'text-gray-900'}`}>{formatCurrency(user.revenue)}</span>
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