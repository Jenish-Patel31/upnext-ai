import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, AlertTriangle, TrendingUp, RefreshCw, DollarSign, Bell } from 'lucide-react';

const NotificationModal = ({ isOpen, onClose, notifications, onRefresh, onRemoveNotification }) => {
  const [activeTab, setActiveTab] = useState('overBudget');

  // Group notifications by type
  const overBudgetNotifications = notifications.filter(n => n.type === 'overBudget');
  const warningNotifications = notifications.filter(n => n.type === 'warning');
  const allNotifications = [...overBudgetNotifications, ...warningNotifications];

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'overBudget':
        return <AlertTriangle className="h-5 w-5 text-red-500" />;
      case 'warning':
        return <TrendingUp className="h-5 w-5 text-orange-500" />;
      default:
        return <AlertTriangle className="h-5 w-5 text-gray-500" />;
    }
  };

  const getNotificationColor = (type) => {
    switch (type) {
      case 'overBudget':
        return 'border-red-200 bg-gradient-to-r from-red-50 to-red-100';
      case 'warning':
        return 'border-orange-200 bg-gradient-to-r from-orange-50 to-orange-100';
      default:
        return 'border-gray-200 bg-gradient-to-r from-gray-50 to-gray-100';
    }
  };

  const formatAmount = (amount) => {
    if (amount >= 10000000) {
      return `₹${(amount / 10000000).toFixed(1)} crore`;
    } else if (amount >= 100000) {
      return `₹${(amount / 100000).toFixed(1)} lakh`;
    } else if (amount >= 1000) {
      return `₹${(amount / 1000).toFixed(1)}k`;
    } else {
      return `₹${amount.toFixed(2)}`;
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  // Remove individual notification
  const removeNotification = (index, type) => {
    if (onRemoveNotification) {
      onRemoveNotification(index, type);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40"
        onClick={onClose}
      />
      
      {/* Modal Container - Positioned below navbar */}
      <div className="fixed top-20 right-2 sm:right-4 z-[60] pointer-events-none">
        <motion.div
          initial={{ opacity: 0, y: -20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.95 }}
          transition={{ 
            type: "spring", 
            damping: 25, 
            stiffness: 300,
            duration: 0.3
          }}
          className="w-[calc(100vw-1rem)] sm:w-80 md:w-96 max-h-[calc(100vh-6rem)] overflow-hidden pointer-events-auto"
          style={{ 
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(20px)',
            maxWidth: 'calc(100vw - 2rem)'
          }}
        >
          {/* Main Modal */}
          <div className="bg-white/95 backdrop-blur-xl rounded-2xl border border-gray-200/50 overflow-hidden">
            
            {/* Header with gradient */}
            <div className="relative p-4 bg-gradient-to-r from-red-500 via-red-600 to-orange-600 text-white">
              {/* Background pattern */}
              <div className="absolute inset-0 bg-gradient-to-r from-red-600/20 to-orange-600/20" />
              <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-30" />
              
              <div className="relative flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm border border-white/30">
                    <Bell className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold">Budget Alerts</h2>
                    <p className="text-red-100 text-sm font-medium">
                      {allNotifications.length} alert{allNotifications.length !== 1 ? 's' : ''}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {onRefresh && (
                    <button
                      onClick={onRefresh}
                      className="p-2 hover:bg-white/20 rounded-full transition-all duration-200 hover:scale-110"
                      title="Refresh alerts"
                    >
                      <RefreshCw className="h-4 w-4" />
                    </button>
                  )}
                  <button
                    onClick={onClose}
                    className="p-2 hover:bg-white/20 rounded-full transition-all duration-200 hover:scale-110"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Tabs with better styling */}
            <div className="flex border-b border-gray-200 bg-gray-50/50">
              <button
                onClick={() => setActiveTab('overBudget')}
                className={`flex-1 px-4 py-3 text-sm font-medium transition-all duration-200 ${
                  activeTab === 'overBudget'
                    ? 'text-red-600 border-b-2 border-red-600 bg-red-50/80 shadow-sm'
                    : 'text-gray-600 hover:text-red-600 hover:bg-red-50/50'
                }`}
              >
                <div className="flex items-center justify-center space-x-2">
                  <AlertTriangle className="h-4 w-4" />
                  <span>Over Budget ({overBudgetNotifications.length})</span>
                </div>
              </button>
              <button
                onClick={() => setActiveTab('warnings')}
                className={`flex-1 px-4 py-3 text-sm font-medium transition-all duration-200 ${
                  activeTab === 'warnings'
                    ? 'text-orange-600 border-b-2 border-orange-600 bg-orange-50/80 shadow-sm'
                    : 'text-gray-600 hover:text-orange-600 hover:bg-orange-50/50'
                }`}
              >
                <div className="flex items-center justify-center space-x-2">
                  <TrendingUp className="h-4 w-4" />
                  <span>Warnings ({warningNotifications.length})</span>
                </div>
              </button>
            </div>

            {/* Content with better scrolling */}
            <div className="max-h-96 overflow-y-auto p-4 bg-gradient-to-b from-white to-gray-50/30">
              {activeTab === 'overBudget' && (
                <div className="space-y-3">
                  {overBudgetNotifications.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <div className="w-16 h-16 mx-auto mb-4 bg-green-100 rounded-full flex items-center justify-center">
                        <AlertTriangle className="h-8 w-8 text-green-500" />
                      </div>
                      <p className="text-lg font-medium text-gray-700">No over-budget alerts</p>
                      <p className="text-sm text-gray-500">Great job staying within your budget!</p>
                    </div>
                  ) : (
                    overBudgetNotifications.map((notification, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className={`p-4 rounded-xl border-2 ${getNotificationColor(notification.type)} relative group hover:shadow-lg transition-all duration-200`}
                      >
                        {/* Close button with better positioning */}
                        <button
                          onClick={() => removeNotification(index, 'overBudget')}
                          className="absolute top-3 right-3 p-1.5 hover:bg-red-200 rounded-full transition-all duration-200 opacity-0 group-hover:opacity-100 hover:scale-110"
                          title="Dismiss alert"
                        >
                          <X className="h-4 w-4 text-red-600" />
                        </button>

                        <div className="flex items-start space-x-3 pr-8">
                          <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                            {getNotificationIcon(notification.type)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-3">
                              <h3 className="font-semibold text-red-700 truncate">
                                {notification.categoryName} - Budget Exceeded
                              </h3>
                              <span className="text-xs text-gray-500 flex-shrink-0 ml-2">
                                {formatDate(notification.date)}
                              </span>
                            </div>
                            
                            {/* Show individual expenses that caused over-budget */}
                            {notification.expense && (
                              <div className="space-y-2 mb-3">
                                <p className="text-xs text-gray-600 font-medium">Expense that caused over-budget:</p>
                                <div className="p-3 bg-white/70 rounded-lg border border-red-200 shadow-sm">
                                  <div className="flex justify-between items-center">
                                    <div className="flex items-center space-x-2 min-w-0">
                                      <div className="w-6 h-6 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                                        <DollarSign className="h-3 w-3 text-red-500" />
                                      </div>
                                      <span className="text-sm font-medium text-gray-800 truncate">{notification.expense.title}</span>
                                    </div>
                                    <span className="text-sm font-bold text-red-600 flex-shrink-0 ml-2">{formatAmount(notification.expense.amount)}</span>
                                  </div>
                                  <div className="text-xs text-gray-500 mt-2 text-center">
                                    Date: {formatDate(notification.expense.date)}
                                  </div>
                                </div>
                              </div>
                            )}
                            
                            {/* Summary info with better layout */}
                            <div className="bg-white/50 rounded-lg p-3 border border-red-200/50">
                              <div className="grid grid-cols-2 gap-2 text-sm">
                                <div className="flex justify-between">
                                  <span className="text-gray-600">Budget:</span>
                                  <span className="font-medium">{formatAmount(notification.budgetLimit)}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-gray-600">Spent:</span>
                                  <span className="font-medium text-red-600">{formatAmount(notification.spent)}</span>
                                </div>
                                <div className="col-span-2 flex justify-between font-bold text-red-600 border-t border-red-200 pt-2 mt-2">
                                  <span>Over by:</span>
                                  <span>{formatAmount(notification.spent - notification.budgetLimit)}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))
                  )}
                </div>
              )}

              {activeTab === 'warnings' && (
                <div className="space-y-3">
                  {warningNotifications.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <div className="w-16 h-16 mx-auto mb-4 bg-green-100 rounded-full flex items-center justify-center">
                        <TrendingUp className="h-8 w-8 text-green-500" />
                      </div>
                      <p className="text-lg font-medium text-gray-700">No warning alerts</p>
                      <p className="text-sm text-gray-500">You're managing your budget well!</p>
                    </div>
                  ) : (
                    warningNotifications.map((notification, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className={`p-4 rounded-xl border-2 ${getNotificationColor(notification.type)} relative group hover:shadow-lg transition-all duration-200`}
                      >
                        {/* Close button with better positioning */}
                        <button
                          onClick={() => removeNotification(index, 'warning')}
                          className="absolute top-3 right-3 p-1.5 hover:bg-orange-200 rounded-full transition-all duration-200 opacity-0 group-hover:opacity-100 hover:scale-110"
                          title="Dismiss alert"
                        >
                          <X className="h-4 w-4 text-orange-600" />
                        </button>

                        <div className="flex items-start space-x-3 pr-8">
                          <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0">
                            {getNotificationIcon(notification.type)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-3">
                              <h3 className="font-semibold text-orange-700 truncate">
                                {notification.categoryName} - Budget Warning
                              </h3>
                              <span className="text-xs text-gray-500 flex-shrink-0 ml-2">
                                {formatDate(notification.date)}
                              </span>
                            </div>
                            
                            {/* Summary info with better layout */}
                            <div className="bg-white/50 rounded-lg p-3 border border-orange-200/50">
                              <div className="grid grid-cols-2 gap-2 text-sm">
                                <div className="flex justify-between">
                                  <span className="text-gray-600">Budget:</span>
                                  <span className="font-medium">{formatAmount(notification.budgetLimit)}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-gray-600">Spent:</span>
                                  <span className="font-medium text-orange-600">{formatAmount(notification.spent)}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-gray-600">Remaining:</span>
                                  <span className="font-medium text-green-600">{formatAmount(notification.budgetLimit - notification.spent)}</span>
                                </div>
                                <div className="flex justify-between font-bold text-orange-600">
                                  <span>Used:</span>
                                  <span>{notification.percentage.toFixed(1)}%</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))
                  )}
                </div>
              )}
            </div>

            {/* Footer with better styling */}
            <div className="p-4 border-t border-gray-200 bg-gradient-to-r from-gray-50 to-gray-100/50">
              <div className="flex items-center justify-between">
                <div className="text-xs text-gray-500 flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <span>Last updated: {new Date().toLocaleString('en-IN')}</span>
                </div>
                <button
                  onClick={onClose}
                  className="px-4 py-2 bg-gradient-to-r from-gray-600 to-gray-700 text-white text-sm font-medium rounded-xl hover:from-gray-700 hover:to-gray-800 transition-all duration-200 hover:shadow-md"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default NotificationModal;
