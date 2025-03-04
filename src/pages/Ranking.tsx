import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { DollarSign, Briefcase, Award, Calendar } from 'lucide-react';
import { useUsersStore } from '../store/users';
import { useThemeStore } from '../store/theme';
import { MostImproved } from '../components/ranking/MostImproved.tsx';
import { TopEarnersCard } from '../components/ranking/TopEarnersCard.tsx';

export const Ranking: React.FC = () => {
  const { users, loading, fetchUsers } = useUsersStore();
  const { isDarkMode } = useThemeStore();
  
  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);
  
  // Create different datasets for each card
  const getWeeklyUsers = () => {
    return [...users].sort((a, b) => b.revenue - a.revenue);
  };
  
  const getMonthlyUsers = () => {
    return [...users].sort((a, b) => (b.companies || 0) - (a.companies || 0));
  };
  
  const getQuarterlyUsers = () => {
    return [...users].sort((a, b) => a.name.localeCompare(b.name));
  };
  
  const getYearlyUsers = () => {
    return [...users].sort(() => Math.random() - 0.5); // Random order for demo
  };
  
  return (
    <div className="space-y-6">
      <h1 className={`text-2xl font-bold ${isDarkMode ? 'text-gray-100' : 'text-gray-900'}`}>Ranking</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Most Improved */}
        <MostImproved 
          users={getWeeklyUsers()} 
          loading={loading} 
          isDarkMode={isDarkMode}
          timeframe="Last 7 days"
        />
        
        {/* Monthly Top Earners */}
        <TopEarnersCard 
          title="Monthly Top Earners" 
          icon={<DollarSign size={20} className="text-green-500" />}
          users={getMonthlyUsers()} 
          loading={loading} 
          isDarkMode={isDarkMode}
          timeframe="Last 30 days"
        />
        
        {/* Quarterly Top Earners */}
        <TopEarnersCard 
          title="Quarterly Top Earners" 
          icon={<Briefcase size={20} className="text-purple-500" />}
          users={getQuarterlyUsers()} 
          loading={loading} 
          isDarkMode={isDarkMode}
          timeframe="Last 90 days"
        />
        
        {/* Yearly Top Earners */}
        <TopEarnersCard 
          title="Yearly Top Earners" 
          icon={<Award size={20} className="text-yellow-500" />}
          users={getYearlyUsers()} 
          loading={loading} 
          isDarkMode={isDarkMode}
          timeframe="Last 365 days"
        />
      </div>
    </div>
  );
};