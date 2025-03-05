import React from 'react';
import { motion } from 'framer-motion';
import { DollarSign, Briefcase, Users, TrendingUp, Star, Gift, Target, Zap } from 'lucide-react';
import { useThemeStore } from '../store/theme';
import { Card, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';

export const Earn: React.FC = () => {
  const { isDarkMode } = useThemeStore();

  const earningMethods = [
    {
      title: 'Agent Marketplace',
      description: 'Create and sell AI agents in the marketplace. Earn commission on every sale.',
      icon: <Users size={24} className="text-blue-500" />,
      potential: '$500-$5000/month',
      difficulty: 'Medium',
      timeCommitment: '10-20 hours/week'
    },
    {
      title: 'Template Creation',
      description: 'Design and publish workflow templates. Get paid when others use your templates.',
      icon: <Briefcase size={24} className="text-purple-500" />,
      potential: '$200-$2000/month',
      difficulty: 'Easy',
      timeCommitment: '5-10 hours/week'
    },
    {
      title: 'Automation Scripts',
      description: 'Develop custom automation scripts for businesses. Earn per project or subscription.',
      icon: <Zap size={24} className="text-yellow-500" />,
      potential: '$1000-$10000/month',
      difficulty: 'Hard',
      timeCommitment: '20-40 hours/week'
    },
    {
      title: 'Referral Program',
      description: 'Invite new users and earn a percentage of their platform spending.',
      icon: <Gift size={24} className="text-green-500" />,
      potential: '$100-$1000/month',
      difficulty: 'Easy',
      timeCommitment: '2-5 hours/week'
    }
  ];

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <div className="space-y-6 pr-6">
      <div>
        <h1 className={`text-2xl font-bold ${isDarkMode ? 'text-gray-100' : 'text-gray-900'}`}>
          Earn Revenue
        </h1>
        <p className={`mt-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
          Multiple ways to monetize your expertise and creativity
        </p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Total Earnings
              </div>
              <DollarSign size={20} className="text-green-500" />
            </div>
            <div className={`text-2xl font-bold mt-2 ${isDarkMode ? 'text-gray-100' : 'text-gray-900'}`}>
              $12,345.67
            </div>
            <div className="flex items-center mt-2 text-green-500 text-sm">
              <TrendingUp size={16} className="mr-1" />
              <span>+12.3% from last month</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Active Products
              </div>
              <Target size={20} className="text-blue-500" />
            </div>
            <div className={`text-2xl font-bold mt-2 ${isDarkMode ? 'text-gray-100' : 'text-gray-900'}`}>
              24
            </div>
            <div className="flex items-center mt-2 text-blue-500 text-sm">
              <Star size={16} className="mr-1" />
              <span>4.8 average rating</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Total Customers
              </div>
              <Users size={20} className="text-purple-500" />
            </div>
            <div className={`text-2xl font-bold mt-2 ${isDarkMode ? 'text-gray-100' : 'text-gray-900'}`}>
              1,234
            </div>
            <div className="flex items-center mt-2 text-purple-500 text-sm">
              <TrendingUp size={16} className="mr-1" />
              <span>+25% new this month</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Earning Methods */}
      <div className="mt-12">
        <h2 className={`text-xl font-semibold mb-6 ${isDarkMode ? 'text-gray-100' : 'text-gray-900'}`}>
          Ways to Earn
        </h2>
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 md:grid-cols-2 gap-6"
        >
          {earningMethods.map((method, index) => (
            <motion.div key={index} variants={item}>
              <Card className="h-full">
                <CardContent className="p-6">
                  <div className="flex items-start">
                    <div className={`p-3 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                      {method.icon}
                    </div>
                    <div className="ml-4 flex-1">
                      <h3 className={`text-lg font-semibold ${isDarkMode ? 'text-gray-100' : 'text-gray-900'}`}>
                        {method.title}
                      </h3>
                      <p className={`mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        {method.description}
                      </p>
                      <div className="mt-4 grid grid-cols-3 gap-4">
                        <div>
                          <div className={`text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                            Potential
                          </div>
                          <div className={`mt-1 text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-900'}`}>
                            {method.potential}
                          </div>
                        </div>
                        <div>
                          <div className={`text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                            Difficulty
                          </div>
                          <div className={`mt-1 text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-900'}`}>
                            {method.difficulty}
                          </div>
                        </div>
                        <div>
                          <div className={`text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                            Time
                          </div>
                          <div className={`mt-1 text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-900'}`}>
                            {method.timeCommitment}
                          </div>
                        </div>
                      </div>
                      <div className="mt-6 flex justify-end space-x-3">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => console.log('Details:', method.title)}
                        >
                          Details
                        </Button>
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => console.log('Accept:', method.title)}
                        >
                          Accept
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </div>
  );
};