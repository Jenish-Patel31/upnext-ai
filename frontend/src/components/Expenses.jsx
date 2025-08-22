import { useState, useEffect } from 'react';
import { auth } from '../firebase-config';
import { Plus, TrendingUp, TrendingDown, Search, Edit3, Trash2, X, Mic, Calendar, DollarSign, Tag } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import * as api from '../services/api.js';
import VoiceExpenseModal from './VoiceExpenseModal';
import FloatingVoiceButton from './FloatingVoiceButton';

export default function Expenses() {
  const [user, setUser] = useState(null);
  const [expenses, setExpenses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [showVoiceExpense, setShowVoiceExpense] = useState(false);
  const [showCategoryDetail, setShowCategoryDetail] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [showEditExpense, setShowEditExpense] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    dateRange: 'all',
    startDate: '',
    endDate: '',
    minAmount: '',
    maxAmount: '',
    category: 'all'
  });
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState({ type: '', text: '' });
  
  // Auto-hide message after 5 seconds
  useEffect(() => {
    if (message.text) {
      const timer = setTimeout(() => {
        setMessage({ type: '', text: '' });
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [message.text]);

  const [expenseForm, setExpenseForm] = useState({
    title: '',
    amount: '',
    category: '',
    date: new Date().toISOString().split('T')[0],
    description: ''
  });

  const [categoryForm, setCategoryForm] = useState({
    name: '',
    color: '#3B82F6',
    budgetLimit: '',
    icon: '💳'
  });

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        await loadUserData(currentUser.uid);
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const loadUserData = async (uid) => {
    try {
      setIsLoading(true);
      
      const [expensesData, categoriesData] = await Promise.all([
        api.getExpenses(uid).catch((error) => {
          console.error('Error fetching expenses:', error);
          return [];
        }),
        api.getCategories(uid).catch((error) => {
          console.error('Error fetching categories:', error);
          return [];
        })
      ]);
      
      setExpenses(expensesData);
      setCategories(categoriesData);
    } catch (error) {
      console.error('Error loading data:', error);
      setMessage({ type: 'error', text: 'Failed to load data' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddExpense = async () => {
    if (!expenseForm.title || !expenseForm.amount || !expenseForm.category) {
      setMessage({ type: 'error', text: 'Please fill in all required fields!' });
      return;
    }

    try {
      const newExpense = await api.addExpense({
        uid: user.uid,
        title: expenseForm.title,
        amount: parseFloat(expenseForm.amount),
        category: expenseForm.category
      });

      setExpenses(prev => [newExpense.expense, ...prev]);
      setExpenseForm({
        title: '',
        amount: '',
        category: '',
        date: new Date().toISOString().split('T')[0],
        description: ''
      });
      setShowAddExpense(false);
      
      // Check for budget warnings after adding expense
      const category = categories.find(cat => cat.name === expenseForm.category);
      if (category && category.budgetLimit > 0) {
        const newTotalSpent = getCategorySpent(category.name) + parseFloat(expenseForm.amount);
        const percentage = (newTotalSpent / category.budgetLimit) * 100;
        
        if (percentage >= 100) {
          setMessage({ 
            type: 'warning', 
            text: `Budget exceeded for ${category.name}! You've spent ₹${newTotalSpent.toFixed(2)} out of ₹${category.budgetLimit.toFixed(2)} budget.` 
          });
        } else if (percentage >= 50) {
          setMessage({ 
            type: 'warning', 
            text: `Budget ${percentage.toFixed(1)}% used for ${category.name}. Consider monitoring your spending.` 
          });
        } else {
          setMessage({ type: 'success', text: 'Expense added successfully!' });
        }
      } else {
        setMessage({ type: 'success', text: 'Expense added successfully!' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: error.message });
    }
  };

  const handleAddCategory = async () => {
    if (!categoryForm.name || !categoryForm.budgetLimit) {
      setMessage({ type: 'error', text: 'Please fill in all required fields!' });
      return;
    }

    try {
      const newCategory = await api.addCategory({
        uid: user.uid,
        name: categoryForm.name,
        color: categoryForm.color,
        budgetLimit: parseFloat(categoryForm.budgetLimit),
        icon: categoryForm.icon
      });

      setCategories(prev => [...prev, newCategory.category]);
      setCategoryForm({
        name: '',
        color: '#3B82F6',
        budgetLimit: '',
        icon: '💳'
      });
      setShowAddCategory(false);
      setMessage({ type: 'success', text: 'Category added successfully!' });
    } catch (error) {
      setMessage({ type: 'error', text: error.message });
    }
  };

  const handleDeleteCategory = async (categoryId) => {
    if (window.confirm('Are you sure you want to delete this category? This will also delete all associated expenses.')) {
      try {
        await api.deleteCategory(categoryId);
        setCategories(prev => prev.filter(category => category._id !== categoryId));
        setExpenses(prev => prev.filter(expense => {
          const category = categories.find(cat => cat._id === categoryId);
          return expense.category !== category?.name;
        }));
        setMessage({ type: 'success', text: 'Category deleted successfully!' });
      } catch (error) {
        setMessage({ type: 'error', text: error.message });
      }
    }
  };

  const openCategoryDetail = (category) => {
    setSelectedCategory(category);
    setShowCategoryDetail(true);
  };

  const closeCategoryDetail = () => {
    setShowCategoryDetail(false);
    setSelectedCategory(null);
  };

  const getCategoryExpenses = (categoryName) => {
    return expenses.filter(expense => expense.category === categoryName);
  };

  const handleEditExpense = (expense) => {
    setEditingExpense({
      _id: expense._id,
      title: expense.title,
      amount: expense.amount,
      category: expense.category,
      date: new Date(expense.date).toISOString().split('T')[0]
    });
    setShowEditExpense(true);
  };

  const handleDeleteExpense = async (expenseId) => {
    if (window.confirm('Are you sure you want to delete this expense?')) {
      try {
        // Delete from database first
        await api.deleteExpense(expenseId);
        
        // Remove from expenses array
        setExpenses(prev => prev.filter(exp => exp._id !== expenseId));
        setMessage({ type: 'success', text: 'Expense deleted successfully!' });
        
        // Close modal if it's open
        if (showCategoryDetail) {
          closeCategoryDetail();
        }
      } catch (error) {
        console.error('Error deleting expense:', error);
        setMessage({ type: 'error', text: error.message || 'Failed to delete expense' });
      }
    }
  };

  const handleUpdateExpense = async () => {
    if (!editingExpense.title || !editingExpense.amount || !editingExpense.category) {
      setMessage({ type: 'error', text: 'Please fill in all required fields!' });
      return;
    }

    try {
      // Update in database first
      const updatedExpense = await api.updateExpense(editingExpense._id, {
        title: editingExpense.title,
        amount: parseFloat(editingExpense.amount),
        category: editingExpense.category,
        date: editingExpense.date
      });

      // Update in expenses array
      setExpenses(prev => prev.map(exp => 
        exp._id === editingExpense._id 
          ? { ...exp, ...editingExpense, amount: parseFloat(editingExpense.amount) }
          : exp
      ));

      setShowEditExpense(false);
      setEditingExpense(null);
      setMessage({ type: 'success', text: 'Expense updated successfully!' });
    } catch (error) {
      console.error('Error updating expense:', error);
      setMessage({ type: 'error', text: error.message || 'Failed to update expense' });
    }
  };

  const applyFilters = (expenseList) => {
    return expenseList.filter(expense => {
      // Search query filter
      const matchesSearch = searchQuery === '' || 
        expense.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        expense.category.toLowerCase().includes(searchQuery.toLowerCase());

      // Date range filter
      let matchesDate = true;
      if (filters.dateRange !== 'all') {
        const expenseDate = new Date(expense.date);
        const today = new Date();
        
        switch (filters.dateRange) {
          case 'today':
            matchesDate = expenseDate.toDateString() === today.toDateString();
            break;
          case 'yesterday':
            const yesterday = new Date(today);
            yesterday.setDate(yesterday.getDate() - 1);
            matchesDate = expenseDate.toDateString() === yesterday.toDateString();
            break;
          case 'thisWeek':
            const weekStart = new Date(today);
            weekStart.setDate(today.getDate() - today.getDay());
            matchesDate = expenseDate >= weekStart;
            break;
          case 'thisMonth':
            matchesDate = expenseDate.getMonth() === today.getMonth() && 
                         expenseDate.getFullYear() === today.getFullYear();
            break;
          case 'lastMonth':
            const lastMonth = new Date(today);
            lastMonth.setMonth(lastMonth.getMonth() - 1);
            matchesDate = expenseDate.getMonth() === lastMonth.getMonth() && 
                         expenseDate.getFullYear() === lastMonth.getFullYear();
            break;
          case 'custom':
            if (filters.startDate && filters.endDate) {
              const start = new Date(filters.startDate);
              const end = new Date(filters.endDate);
              matchesDate = expenseDate >= start && expenseDate <= end;
            }
            break;
        }
      }

      // Amount range filter
      let matchesAmount = true;
      if (filters.minAmount && expense.amount < parseFloat(filters.minAmount)) {
        matchesAmount = false;
      }
      if (filters.maxAmount && expense.amount > parseFloat(filters.maxAmount)) {
        matchesAmount = false;
      }

      // Category filter
      let matchesCategory = true;
      if (filters.category !== 'all' && expense.category !== filters.category) {
        matchesCategory = false;
      }

      return matchesSearch && matchesDate && matchesAmount && matchesCategory;
    });
  };

  const clearFilters = () => {
    setFilters({
      dateRange: 'all',
      startDate: '',
      endDate: '',
      minAmount: '',
      maxAmount: '',
      category: 'all'
    });
    setSearchQuery('');
  };

  const getFilteredExpenses = () => {
    return applyFilters(expenses);
  };

  const getFilteredCategoryExpenses = (categoryName) => {
    const categoryExpenses = expenses.filter(expense => expense.category === categoryName);
    return applyFilters(categoryExpenses);
  };

  const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0);
  const totalBudget = categories.reduce((sum, category) => sum + (category.budgetLimit || 0), 0);
  const remainingBudget = totalBudget - totalExpenses;

  const filteredExpenses = getFilteredExpenses();

  // Calculate spent amount for each category
  const getCategorySpent = (categoryName) => {
    return expenses
      .filter(expense => expense.category === categoryName)
      .reduce((sum, expense) => sum + expense.amount, 0);
  };

  // Professional budget warning system
  const getBudgetWarning = (category) => {
    if (!category.budgetLimit || category.budgetLimit === 0) return null;
    
    const spent = getCategorySpent(category.name);
    const budgetLimit = category.budgetLimit;
    const percentage = (spent / budgetLimit) * 100;
    
    if (percentage >= 100) {
      return { type: 'exceeded', percentage, spent, budgetLimit };
    } else if (percentage >= 50) {
      return { type: 'warning', percentage, spent, budgetLimit };
    }
    
    return null;
  };

  const getWarningStyle = (warning) => {
    if (!warning) return '';
    
    switch (warning.type) {
      case 'exceeded':
        return 'border-red-200 bg-red-50/30';
      case 'warning':
        return 'border-orange-200 bg-orange-50/20';
      default:
        return '';
    }
  };

  const getProgressBarColor = (warning) => {
    if (!warning) return 'bg-green-500';
    
    switch (warning.type) {
      case 'exceeded':
        return 'bg-red-500';
      case 'warning':
        return 'bg-orange-500';
      default:
        return 'bg-green-500';
    }
  };

  const getWarningMessage = (warning) => {
    if (!warning) return '';
    
    switch (warning.type) {
      case 'exceeded':
        return `Budget exceeded by ₹${(warning.spent - warning.budgetLimit).toFixed(2)}`;
      case 'warning':
        return `Budget ${warning.percentage.toFixed(1)}% used`;
      default:
        return '';
    }
  };

  // Check if individual expense is expensive (>50% of category budget)
  const isExpenseExpensive = (expense) => {
    const category = categories.find(cat => cat.name === expense.category);
    if (!category || !category.budgetLimit || category.budgetLimit === 0) return false;
    
    const expensePercentage = (expense.amount / category.budgetLimit) * 100;
    return expensePercentage > 50;
  };



  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
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
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Expense Tracker</h1>
              <p className="text-gray-600">Track your spending and manage your budget</p>
            </div>
            <div className="flex space-x-3 mt-4 sm:mt-0">
              <button
                onClick={() => setShowAddCategory(true)}
                className="px-4 py-2 bg-gray-600 text-white font-medium rounded-xl hover:bg-gray-700 transition-colors duration-200 flex items-center space-x-2"
              >
                <Plus className="w-4 h-4" />
                <span>Add Category</span>
              </button>
              <button
                onClick={() => setShowVoiceExpense(true)}
                className="px-4 py-2 bg-purple-600 text-white font-medium rounded-xl hover:bg-purple-700 transition-colors duration-200 flex items-center space-x-2"
              >
                <Mic className="w-4 h-4" />
                <span>Voice Expense</span>
              </button>
              <button
                onClick={() => setShowAddExpense(true)}
                className="px-4 py-2 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 transition-colors duration-200 flex items-center space-x-2"
              >
                <Plus className="w-4 h-4" />
                <span>Add Expense</span>
              </button>
            </div>
          </div>

          {/* Message Alert */}
          {message.text && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`mb-6 p-4 rounded-xl flex items-center space-x-3 ${
                message.type === 'success' 
                  ? 'bg-green-50 border border-green-200 text-green-800' 
                  : message.type === 'warning'
                  ? 'bg-orange-50 border border-orange-200 text-orange-800'
                  : 'bg-red-50 border border-red-200 text-red-800'
              }`}
            >
              <span className="font-medium">{message.text}</span>
            </motion.div>
          )}



          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Expenses</p>
                  <p className="text-2xl font-bold text-gray-900">₹{totalExpenses.toFixed(2)}</p>
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
                  <p className="text-2xl font-bold text-gray-900">₹{totalBudget.toFixed(2)}</p>
                </div>
                                  <div className="p-3 bg-blue-100 rounded-xl">
                    <span className="text-2xl font-bold text-blue-600">₹</span>
                  </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Remaining</p>
                  <p className={`text-2xl font-bold ${remainingBudget >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    ₹{remainingBudget.toFixed(2)}
                  </p>
                </div>
                <div className={`p-3 rounded-xl ${remainingBudget >= 0 ? 'bg-green-100' : 'bg-red-100'}`}>
                  {remainingBudget >= 0 ? (
                    <TrendingDown className="h-6 w-6 text-green-600" />
                  ) : (
                    <TrendingUp className="h-6 w-6 text-red-600" />
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Categories Grid */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Categories</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {categories.map((category) => {
                const spent = getCategorySpent(category.name);
                const percentage = category.budgetLimit > 0 ? (spent / category.budgetLimit) * 100 : 0;
                const budgetWarning = getBudgetWarning(category);
                
                return (
                  <motion.div
                    key={category._id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className={`rounded-2xl p-6 shadow-sm border transition-shadow duration-200 cursor-pointer group hover:shadow-md ${
                      budgetWarning 
                        ? `border-2 ${getWarningStyle(budgetWarning)}` 
                        : 'bg-white border-gray-200'
                    }`}
                    onClick={() => openCategoryDetail(category)}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <span className="text-2xl">{category.icon}</span>
                        <div>
                          <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">{category.name}</h3>
                          <p className="text-sm text-gray-500">₹{spent.toFixed(2)} / ₹{category.budgetLimit.toFixed(2)}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            openCategoryDetail(category);
                          }}
                          className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors duration-200"
                          title="View details"
                        >
                          <Tag className="w-4 h-4" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteCategory(category._id);
                          }}
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors duration-200"
                          title="Delete category"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    
                    <div className="mb-3">
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-600">Progress</span>
                        <span className={`font-medium ${
                          budgetWarning?.type === 'exceeded' ? 'text-red-600' :
                          budgetWarning?.type === 'warning' ? 'text-orange-600' :
                          'text-gray-900'
                        }`}>
                          {percentage.toFixed(1)}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full transition-all duration-300 ${getProgressBarColor(budgetWarning)}`}
                          style={{ width: `${Math.min(percentage, 100)}%` }}
                        />
                      </div>
                    </div>

                    {budgetWarning && (
                      <div className={`flex items-center space-x-2 text-sm ${
                        budgetWarning.type === 'exceeded' ? 'text-red-600' :
                        'text-orange-600'
                      }`}>
                        <span>{getWarningMessage(budgetWarning)}</span>
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </div>
          </div>

          {/* Expenses List */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
                <h2 className="text-2xl font-bold text-gray-900">Recent Expenses</h2>
                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => setShowFilters(!showFilters)}
                    className="px-4 py-2 bg-gray-100 text-gray-700 font-medium rounded-xl hover:bg-gray-200 transition-colors duration-200 flex items-center space-x-2"
                  >
                    <Search className="w-4 h-4" />
                    <span>Filters</span>
                  </button>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                      type="text"
                      placeholder="Search expenses..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 pr-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>

              {/* Filter Panel */}
              <AnimatePresence>
                {showFilters && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="border-t border-gray-200 pt-4 mt-4"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {/* Date Range Filter */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Date Range</label>
                        <select
                          value={filters.dateRange}
                          onChange={(e) => setFilters(prev => ({ ...prev, dateRange: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="all">All Time</option>
                          <option value="today">Today</option>
                          <option value="yesterday">Yesterday</option>
                          <option value="thisWeek">This Week</option>
                          <option value="thisMonth">This Month</option>
                          <option value="lastMonth">Last Month</option>
                          <option value="custom">Custom Range</option>
                        </select>
                      </div>

                      {/* Custom Date Range */}
                      {filters.dateRange === 'custom' && (
                        <>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
                            <input
                              type="date"
                              value={filters.startDate}
                              onChange={(e) => setFilters(prev => ({ ...prev, startDate: e.target.value }))}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
                            <input
                              type="date"
                              value={filters.endDate}
                              onChange={(e) => setFilters(prev => ({ ...prev, endDate: e.target.value }))}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                          </div>
                        </>
                      )}

                      {/* Amount Range */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Min Amount</label>
                        <input
                          type="number"
                          placeholder="0"
                          value={filters.minAmount}
                          onChange={(e) => setFilters(prev => ({ ...prev, minAmount: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Max Amount</label>
                        <input
                          type="number"
                          placeholder="∞"
                          value={filters.maxAmount}
                          onChange={(e) => setFilters(prev => ({ ...prev, maxAmount: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>

                      {/* Category Filter */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                        <select
                          value={filters.category}
                          onChange={(e) => setFilters(prev => ({ ...prev, category: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="all">All Categories</option>
                          {categories.map((category) => (
                            <option key={category._id} value={category.name}>
                              {category.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Filter Actions */}
                    <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200">
                      <div className="text-sm text-gray-600">
                        Showing {filteredExpenses.length} of {expenses.length} expenses
                      </div>
                      <button
                        onClick={clearFilters}
                        className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium transition-colors duration-200"
                      >
                        Clear All Filters
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Expense</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredExpenses.map((expense) => (
                    <motion.tr
                      key={expense._id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="hover:bg-gray-50 transition-colors duration-200"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{expense.title}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {expense.category}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        ₹{expense.amount.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(expense.date).toLocaleDateString()}
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Add Expense Modal */}
      {showAddExpense && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Add New Expense</h3>
              <button
                onClick={() => setShowAddExpense(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Title</label>
                <input
                  type="text"
                  value={expenseForm.title}
                  onChange={(e) => setExpenseForm(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter expense title"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Amount</label>
                <input
                  type="number"
                  value={expenseForm.amount}
                  onChange={(e) => setExpenseForm(prev => ({ ...prev, amount: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="0.00"
                  step="0.01"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                <select
                  value={expenseForm.category}
                  onChange={(e) => setExpenseForm(prev => ({ ...prev, category: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select a category</option>
                  {categories.map((category) => (
                    <option key={category._id} value={category.name}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
                <input
                  type="date"
                  value={expenseForm.date}
                  onChange={(e) => setExpenseForm(prev => ({ ...prev, date: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => setShowAddExpense(false)}
                className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 font-medium rounded-xl hover:bg-gray-50 transition-colors duration-200"
              >
                Cancel
              </button>
              <button
                onClick={handleAddExpense}
                className="flex-1 px-4 py-3 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 transition-colors duration-200"
              >
                Add Expense
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Category Modal */}
      {showAddCategory && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Add New Category</h3>
              <button
                onClick={() => setShowAddCategory(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Category Name</label>
                <input
                  type="text"
                  value={categoryForm.name}
                  onChange={(e) => setCategoryForm(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter category name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Budget Limit</label>
                <input
                  type="number"
                  value={categoryForm.budgetLimit}
                  onChange={(e) => setCategoryForm(prev => ({ ...prev, budgetLimit: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="0.00"
                  step="0.01"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Color</label>
                <input
                  type="color"
                  value={categoryForm.color}
                  onChange={(e) => setCategoryForm(prev => ({ ...prev, color: e.target.value }))}
                  className="w-full h-12 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Icon</label>
                <input
                  type="text"
                  value={categoryForm.icon}
                  onChange={(e) => setCategoryForm(prev => ({ ...prev, icon: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="🍕"
                />
              </div>
            </div>

            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => setShowAddCategory(false)}
                className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 font-medium rounded-xl hover:bg-gray-50 transition-colors duration-200"
              >
                Cancel
              </button>
              <button
                onClick={handleAddCategory}
                className="flex-1 px-4 py-3 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 transition-colors duration-200"
              >
                Add Category
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Voice Expense Modal */}
      <VoiceExpenseModal
        isOpen={showVoiceExpense}
        onClose={() => setShowVoiceExpense(false)}
        onExpenseAdded={(newExpense) => {
          setExpenses(prev => [newExpense, ...prev]);
          setMessage({ type: 'success', text: 'Voice expense added successfully!' });
        }}
        categories={categories}
        user={user}
      />

      {/* Category Detail Modal */}
      <AnimatePresence>
        {showCategoryDetail && selectedCategory && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={closeCategoryDetail}
          >
                            <motion.div
                  initial={{ opacity: 0, scale: 0.9, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9, y: 20 }}
                  transition={{ type: "spring", damping: 25, stiffness: 300 }}
                  className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl h-[90vh] flex flex-col overflow-hidden"
                  onClick={(e) => e.stopPropagation()}
                >
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
                    <span className="text-2xl">{selectedCategory.icon}</span>
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">{selectedCategory.name}</h2>
                    <p className="text-gray-600">Category Details & Expenses</p>
                  </div>
                </div>
                <button
                  onClick={closeCategoryDetail}
                  className="p-2 rounded-lg text-gray-500 hover:bg-gray-200 transition-colors"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>



              {/* Category Stats */}
              <div className="p-6 border-b border-gray-200 bg-white">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
                      <DollarSign className="h-8 w-8 text-blue-600" />
                    </div>
                    <p className="text-sm font-medium text-gray-600">Total Spent</p>
                    <p className="text-2xl font-bold text-gray-900">
                      ₹{getCategoryExpenses(selectedCategory.name).reduce((sum, exp) => sum + exp.amount, 0).toFixed(2)}
                    </p>
                  </div>
                  <div className="text-center">
                    <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
                      <Tag className="h-8 w-8 text-green-600" />
                    </div>
                    <p className="text-sm font-medium text-gray-600">Budget Limit</p>
                    <p className="text-2xl font-bold text-gray-900">₹{selectedCategory.budgetLimit.toFixed(2)}</p>
                  </div>
                  <div className="text-center">
                    <div className="w-16 h-16 bg-purple-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
                      <TrendingUp className="h-8 w-8 text-purple-600" />
                    </div>
                    <p className="text-sm font-medium text-gray-600">Remaining</p>
                    <p className={`text-2xl font-bold ${(selectedCategory.budgetLimit - getCategoryExpenses(selectedCategory.name).reduce((sum, exp) => sum + exp.amount, 0)) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      ₹{(selectedCategory.budgetLimit - getCategoryExpenses(selectedCategory.name).reduce((sum, exp) => sum + exp.amount, 0)).toFixed(2)}
                    </p>
                  </div>
                </div>
                

              </div>

              {/* Expenses List */}
              <div className="flex-1 flex flex-col min-h-0">
                <div className="p-6 pb-0">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
                      <Calendar className="h-5 w-5 text-gray-500" />
                      <span>Expenses ({getFilteredCategoryExpenses(selectedCategory.name).length})</span>
                    </h3>
                    <button
                      onClick={() => setShowFilters(!showFilters)}
                      className="px-3 py-2 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition-colors duration-200 flex items-center space-x-2 text-sm"
                    >
                      <Search className="w-4 h-4" />
                      <span>Filters</span>
                    </button>
                  </div>

                  {/* Category Filter Panel */}
                  <AnimatePresence>
                    {showFilters && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="border border-gray-200 rounded-lg p-4 mb-4 bg-gray-50"
                      >
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {/* Date Range Filter */}
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Date Range</label>
                            <select
                              value={filters.dateRange}
                              onChange={(e) => setFilters(prev => ({ ...prev, dateRange: e.target.value }))}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                            >
                              <option value="all">All Time</option>
                              <option value="today">Today</option>
                              <option value="yesterday">Yesterday</option>
                              <option value="thisWeek">This Week</option>
                              <option value="thisMonth">This Month</option>
                              <option value="lastMonth">Last Month</option>
                              <option value="custom">Custom Range</option>
                            </select>
                          </div>

                          {/* Custom Date Range */}
                          {filters.dateRange === 'custom' && (
                            <>
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
                                <input
                                  type="date"
                                  value={filters.startDate}
                                  onChange={(e) => setFilters(prev => ({ ...prev, startDate: e.target.value }))}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
                                <input
                                  type="date"
                                  value={filters.endDate}
                                  onChange={(e) => setFilters(prev => ({ ...prev, endDate: e.target.value }))}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                                />
                              </div>
                            </>
                          )}

                          {/* Amount Range */}
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Min Amount</label>
                            <input
                              type="number"
                              placeholder="0"
                              value={filters.minAmount}
                              onChange={(e) => setFilters(prev => ({ ...prev, minAmount: e.target.value }))}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Max Amount</label>
                            <input
                              type="number"
                              placeholder="∞"
                              value={filters.maxAmount}
                              onChange={(e) => setFilters(prev => ({ ...prev, maxAmount: e.target.value }))}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                            />
                          </div>
                        </div>

                        {/* Filter Actions */}
                        <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200">
                          <div className="text-sm text-gray-600">
                            Showing {getFilteredCategoryExpenses(selectedCategory.name).length} of {getCategoryExpenses(selectedCategory.name).length} expenses
                          </div>
                          <button
                            onClick={clearFilters}
                            className="px-3 py-1 text-gray-600 hover:text-gray-800 font-medium transition-colors duration-200 text-sm"
                          >
                            Clear Filters
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
                
                                {/* Scrollable Expenses Container */}
                <div className="flex-1 overflow-y-auto px-6 pb-6 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                  <div className="space-y-3">
                    {getFilteredCategoryExpenses(selectedCategory.name).length > 0 ? (
                      <>
                        
                        {getFilteredCategoryExpenses(selectedCategory.name)
                          .sort((a, b) => new Date(b.date) - new Date(a.date))
                          .map((expense, index) => (
                            <motion.div
                              key={expense._id}
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: index * 0.05 }}
                              className={`rounded-xl p-4 transition-colors duration-200 ${
                                isExpenseExpensive(expense)
                                  ? 'bg-red-50 border-2 border-red-200 hover:bg-red-100'
                                  : 'bg-gray-50 hover:bg-gray-100'
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-3">
                                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                                    <DollarSign className="h-5 w-5 text-blue-600" />
                                  </div>
                                  <div>
                                    <div className="flex items-center space-x-2">
                                      <h4 className="font-medium text-gray-900">{expense.title}</h4>
                                      {isExpenseExpensive(expense) && (
                                        <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full font-medium">
                                          ⚠️ Expensive
                                        </span>
                                      )}
                                    </div>
                                    <p className="text-sm text-gray-500">
                                      {new Date(expense.date).toLocaleDateString('en-US', {
                                        weekday: 'short',
                                        year: 'numeric',
                                        month: 'short',
                                        day: 'numeric'
                                      })}
                                    </p>
                                  </div>
                                </div>
                                <div className="flex items-center space-x-3">
                                  <div className="text-right">
                                    <p className="text-lg font-bold text-gray-900">₹{expense.amount.toFixed(2)}</p>
                                    <p className="text-xs text-gray-500">{expense.category}</p>
                                  </div>
                                  <div className="flex items-center space-x-2 ml-4">
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleEditExpense(expense);
                                      }}
                                      className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors duration-200"
                                      title="Edit expense"
                                    >
                                      <Edit3 className="h-4 w-4" />
                                    </button>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleDeleteExpense(expense._id);
                                      }}
                                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-200"
                                      title="Delete expense"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </button>
                                  </div>
                                </div>
                              </div>
                            </motion.div>
                          ))}
                        
                        
                      </>
                    ) : (
                      <div className="text-center py-12">
                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                          <Tag className="h-8 w-8 text-gray-400" />
                        </div>
                        <p className="text-gray-500 font-medium">No expenses in this category yet</p>
                        <p className="text-sm text-gray-400 mt-1">Start adding expenses to see them here</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="p-6 border-t border-gray-200 bg-gray-50">
                <div className="flex justify-between items-center">
                  <p className="text-sm text-gray-600">
                    Last updated: {new Date().toLocaleDateString()}
                  </p>
                  <button
                    onClick={closeCategoryDetail}
                    className="px-6 py-2 bg-gray-600 text-white font-medium rounded-xl hover:bg-gray-700 transition-colors duration-200"
                  >
                    Close
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Edit Expense Modal */}
      <AnimatePresence>
        {showEditExpense && editingExpense && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowEditExpense(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                    <Edit3 className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Edit Expense</h3>
                    <p className="text-sm text-gray-600">Update expense details</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowEditExpense(false)}
                  className="p-2 rounded-lg text-gray-500 hover:bg-gray-200 transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Form */}
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Title</label>
                  <input
                    type="text"
                    value={editingExpense.title}
                    onChange={(e) => setEditingExpense(prev => ({ ...prev, title: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter expense title"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Amount</label>
                  <input
                    type="number"
                    value={editingExpense.amount}
                    onChange={(e) => setEditingExpense(prev => ({ ...prev, amount: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="0.00"
                    step="0.01"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                  <select
                    value={editingExpense.category}
                    onChange={(e) => setEditingExpense(prev => ({ ...prev, category: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {categories.map((category) => (
                      <option key={category._id} value={category.name}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
                  <input
                    type="date"
                    value={editingExpense.date}
                    onChange={(e) => setEditingExpense(prev => ({ ...prev, date: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Footer */}
              <div className="p-6 border-t border-gray-200 bg-gray-50">
                <div className="flex space-x-3">
                  <button
                    onClick={() => setShowEditExpense(false)}
                    className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 font-medium rounded-xl hover:bg-gray-50 transition-colors duration-200"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleUpdateExpense}
                    className="flex-1 px-4 py-3 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 transition-colors duration-200"
                  >
                    Update Expense
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Voice Button */}
      <FloatingVoiceButton
        categories={categories}
        user={user}
        onExpenseAdded={(newExpense) => {
          setExpenses(prev => [newExpense, ...prev]);
          setMessage({ type: 'success', text: 'Voice expense added successfully!' });
        }}
      />
    </div>
  );
} 