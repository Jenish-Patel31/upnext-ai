import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from '../firebase-config';
import { signOut } from 'firebase/auth';
import Lottie from 'lottie-react';
import ChatbotWidget from "./ChatbotWidget";
import FloatingVoiceButton from "./FloatingVoiceButton";
import loadingAnimation from '../assets/loading.json';
import {
  User,
  CreditCard,
  Target,
  MessageCircle,
  TrendingUp,
  TrendingDown,
  Calendar,
  CheckCircle,
  Clock,
  ArrowRight,
  Mic
} from 'lucide-react';
import { motion } from 'framer-motion';
import * as api from '../services/api.js';

const LoadingAnimation = () => {
  return (
    <div className="w-64 h-64">
      <Lottie
        animationData={loadingAnimation}
        loop={true}
        style={{ width: '100%', height: '100%' }}
      />
    </div>
  );
};

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [expenses, setExpenses] = useState([]);
  const [plans, setPlans] = useState([]);
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    totalExpenses: 0,
    totalBudget: 0,
    activePlans: 0,
    completedPlans: 0
  });
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        
        // Create user in backend if not exists
        try {
          await api.createUser({
            uid: currentUser.uid,
            name: currentUser.displayName || currentUser.email?.split('@')[0] || 'User',
            email: currentUser.email
          });
        } catch (error) {
          console.log('User already exists or error creating user:', error);
        }

        // Load user data
        await loadUserData(currentUser.uid);
      } else {
        navigate('/login');
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [navigate]);

  const loadUserData = async (uid) => {
    try {
      setIsLoading(true);
      
      // Load expenses, plans, and categories in parallel
      const [expensesData, plansData, categoriesData] = await Promise.all([
        api.getExpenses(uid).catch(() => []),
        api.getPlans(uid).catch(() => []),
        api.getCategories(uid).catch(() => [])
      ]);

      setExpenses(expensesData);
      setPlans(plansData);
      setCategories(categoriesData);

      // Calculate stats
      const totalExpenses = expensesData.reduce((sum, exp) => sum + exp.amount, 0);
      const totalBudget = categoriesData.reduce((sum, cat) => sum + (cat.budgetLimit || 0), 0);
      const activePlans = plansData.filter(plan => !plan.completed).length;
      const completedPlans = plansData.filter(plan => plan.completed).length;

      setStats({
        totalExpenses,
        totalBudget,
        activePlans,
        completedPlans
      });

    } catch (error) {
      console.error('Error loading user data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      navigate('/login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const getRecentExpenses = () => {
    return expenses.slice(0, 5);
  };

  const getRecentPlans = () => {
    return plans.slice(0, 3);
  };

  const getDaysRemaining = (targetDate) => {
    const today = new Date();
    const target = new Date(targetDate);
    const diffTime = target - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <LoadingAnimation />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Welcome back, {user?.displayName || user?.email?.split('@')[0] || 'User'}! 👋
            </h1>
            <p className="text-gray-600">Here's your financial overview and goals progress</p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Expenses</p>
                  <p className="text-2xl font-bold text-gray-900">₹{stats.totalExpenses.toFixed(2)}</p>
                </div>
                <div className="p-3 bg-red-100 rounded-xl">
                  <TrendingUp className="h-6 w-6 text-red-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Budget</p>
                  <p className="text-2xl font-bold text-gray-900">₹{stats.totalBudget.toFixed(2)}</p>
                </div>
                <div className="p-3 bg-blue-100 rounded-xl">
                  <span className="text-2xl font-bold text-blue-600">₹</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Active Plans</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.activePlans}</p>
                </div>
                <div className="p-3 bg-green-100 rounded-xl">
                  <Target className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Completed Plans</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.completedPlans}</p>
                </div>
                <div className="p-3 bg-purple-100 rounded-xl">
                  <CheckCircle className="h-6 w-6 text-purple-600" />
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Quick Actions</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <button 
                onClick={() => navigate('/profile')}
                className="flex items-center justify-between p-4 bg-blue-50 rounded-xl hover:bg-blue-100 transition-all duration-200 group"
              >
                <div className="flex items-center space-x-3">
                  <User className="h-5 w-5 text-blue-600" />
                  <span className="font-medium text-gray-900 group-hover:text-blue-700">Profile</span>
                </div>
                <ArrowRight className="h-5 w-5 text-blue-600" />
              </button>
              
              <button 
                onClick={() => navigate('/expenses')}
                className="flex items-center justify-between p-4 bg-green-50 rounded-xl hover:bg-green-100 transition-all duration-200 group"
              >
                <div className="flex items-center space-x-3">
                  <CreditCard className="h-5 w-5 text-green-600" />
                  <span className="font-medium text-gray-900 group-hover:text-green-700">Expenses</span>
                </div>
                <ArrowRight className="h-5 w-5 text-green-600" />
              </button>

              <button 
                onClick={() => navigate('/plans')}
                className="flex items-center justify-between p-4 bg-purple-50 rounded-xl hover:bg-purple-100 transition-all duration-200 group"
              >
                <div className="flex items-center space-x-3">
                  <Target className="h-5 w-5 text-purple-600" />
                  <span className="font-medium text-gray-900 group-hover:text-purple-700">Plans</span>
                </div>
                <ArrowRight className="h-5 w-5 text-purple-600" />
              </button>

              <button 
                onClick={() => navigate('/chat')}
                className="flex items-center justify-between p-4 bg-orange-50 rounded-xl hover:bg-orange-100 transition-all duration-200 group"
              >
                <div className="flex items-center space-x-2">
                  <MessageCircle className="h-5 w-5 text-orange-600" />
                  <span className="font-medium text-gray-900 group-hover:text-orange-700">Chat</span>
                </div>
                <ArrowRight className="h-5 w-5 text-orange-600" />
              </button>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Recent Expenses */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Recent Expenses</h3>
                <button 
                  onClick={() => navigate('/expenses')}
                  className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
                  View All
                </button>
              </div>
              
              {getRecentExpenses().length > 0 ? (
                <div className="space-y-4">
                  {getRecentExpenses().map((expense) => (
                    <div key={expense._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <CreditCard className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{expense.title}</p>
                          <p className="text-sm text-gray-500">{expense.category}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-gray-900">₹{expense.amount}</p>
                        <p className="text-xs text-gray-500">
                          {new Date(expense.date).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <CreditCard className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No expenses yet</p>
                  <button 
                    onClick={() => navigate('/expenses')}
                    className="mt-2 text-blue-600 hover:text-blue-700 font-medium"
                  >
                    Add your first expense
                  </button>
                </div>
              )}
            </div>

            {/* Recent Plans */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Recent Plans</h3>
                <button 
                  onClick={() => navigate('/plans')}
                  className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
                  View All
                </button>
              </div>
              
              {getRecentPlans().length > 0 ? (
                <div className="space-y-4">
                  {getRecentPlans().map((plan) => (
                    <div key={plan._id} className="p-3 bg-gray-50 rounded-xl">
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-medium text-gray-900">{plan.goal}</h4>
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          plan.completed 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-blue-100 text-blue-800'
                        }`}>
                          {plan.completed ? 'Completed' : 'Active'}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">
                        {plan.steps?.length || 0} steps
                      </p>
                      <div className="flex items-center space-x-2 text-xs text-gray-500">
                        <Calendar className="w-3 h-3" />
                        <span>Created {new Date(plan.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Target className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No plans yet</p>
                  <button 
                    onClick={() => navigate('/plans')}
                    className="mt-2 text-blue-600 hover:text-blue-700 font-medium"
                  >
                    Create your first plan
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* AI Assistant Widget */}
          <div className="mt-8">
            <ChatbotWidget user={user} />
          </div>
        </motion.div>
      </div>

      {/* Floating Voice Button */}
      <FloatingVoiceButton
        categories={categories}
        user={user}
        onExpenseAdded={(newExpense) => {
          // Refresh expenses data
          loadUserData(user.uid);
        }}
      />
    </div>
  );
}