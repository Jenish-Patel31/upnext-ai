// src/components/Navbar.jsx
import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { auth } from '../firebase-config';
import { signOut } from 'firebase/auth';
import NotificationModal from './NotificationModal';
import { 
  Bell, 
  UserCircle, 
  ChevronDown, 
  Settings, 
  LogOut, 
  Home, 
  User, 
  CreditCard, 
  Target,
  Menu,
  X
} from 'lucide-react';

function Navbar({ userName = "User", userEmail = "user@example.com", userPhoto = null }) {
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [notificationCount, setNotificationCount] = useState(0);
  const navigate = useNavigate();
  const location = useLocation();

  // Better fallbacks for user data
  const displayName = userName || "User";
  const displayEmail = userEmail || "user@example.com";
  const displayPhoto = userPhoto || null;

  // Generate initials for avatar fallback
  const getInitials = (name) => {
    if (!name || name === "User") return "U";
    return name.split(' ').map(word => word.charAt(0)).join('').toUpperCase().slice(0, 2);
  };

  const handleSignOut = async () => {
    await signOut(auth);
    navigate('/login');
  };

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: Home },
    { name: 'Profile', href: '/profile', icon: User },
    { name: 'Expenses', href: '/expenses', icon: CreditCard },
    { name: 'Plans', href: '/plans', icon: Target },
  ];

  const isActive = (path) => location.pathname === path;

  // Generate notifications for over-budget categories
  useEffect(() => {
    // Request notification permission
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }

    const generateNotifications = async () => {
      try {
        // Fetch categories and expenses for the current user
        const uid = auth.currentUser?.uid;
        if (!uid) return;

        // Fetch categories
        const categoriesResponse = await fetch(`http://localhost:5000/api/categories/${uid}`);
        const categories = await categoriesResponse.ok ? await categoriesResponse.json() : [];

        // Fetch expenses
        const expensesResponse = await fetch(`http://localhost:5000/api/expenses/${uid}`);
        const expenses = await expensesResponse.ok ? await expensesResponse.json() : [];

        const newNotifications = [];

        // Check each category for budget violations
        categories.forEach(category => {
          if (category.budgetLimit && category.budgetLimit > 0) {
            const categoryExpenses = expenses.filter(exp => exp.category === category.name);
            const totalSpent = categoryExpenses.reduce((sum, exp) => sum + exp.amount, 0);
            const percentage = (totalSpent / category.budgetLimit) * 100;

            if (percentage >= 100) {
              // Create individual notifications for each expense that contributed to over-budget
              categoryExpenses.forEach(expense => {
                // Check if this specific expense caused or contributed to over-budget
                const expensesBeforeThis = categoryExpenses
                  .filter(exp => new Date(exp.date) <= new Date(expense.date))
                  .reduce((sum, exp) => sum + exp.amount, 0);
                
                if (expensesBeforeThis > category.budgetLimit) {
                  newNotifications.push({
                    type: 'overBudget',
                    categoryName: category.name,
                    budgetLimit: category.budgetLimit,
                    spent: expensesBeforeThis,
                    percentage: (expensesBeforeThis / category.budgetLimit) * 100,
                    date: expense.date,
                    expense: expense, // The specific expense that caused over-budget
                    totalExpenses: categoryExpenses.length
                  });
                }
              });
            } else if (percentage >= 80) {
              // Warning notification for approaching budget limit
              newNotifications.push({
                type: 'warning',
                categoryName: category.name,
                budgetLimit: category.budgetLimit,
                spent: totalSpent,
                percentage: percentage,
                date: new Date(),
                totalExpenses: categoryExpenses.length
              });
            }
          }
        });

        // Remove duplicates and keep only the most recent notifications
        const uniqueNotifications = newNotifications.filter((notification, index, self) => 
          index === self.findIndex(n => 
            n.type === notification.type && 
            n.categoryName === notification.categoryName &&
            n.expense?._id === notification.expense?._id
          )
        );

        // Check if there are new notifications (more than before)
        const hasNewNotifications = uniqueNotifications.length > notifications.length;
        
        setNotifications(uniqueNotifications);
        setNotificationCount(uniqueNotifications.length);

        // Play notification sound and show visual feedback for new notifications
        if (hasNewNotifications && uniqueNotifications.length > 0) {
          // Play notification sound (if browser supports it)
          try {
            const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIG2m98OScTgwOUarm7blmGgU7k9n1unEiBC13yO/eizEIHWq+8+OWT');
            audio.volume = 0.3;
            audio.play().catch(() => {}); // Ignore errors if audio fails
          } catch (error) {
            // Audio not supported, continue silently
          }

          // Show browser notification if permitted
          if ('Notification' in window && Notification.permission === 'granted') {
            new Notification('Budget Alert!', {
              body: `You have ${uniqueNotifications.length} new budget alert${uniqueNotifications.length !== 1 ? 's' : ''}`,
              icon: '/favicon.ico',
              tag: 'budget-notification'
            });
          }
        }
      } catch (error) {
        console.error('Error generating notifications:', error);
      }
    };

    // Generate notifications when component mounts
    generateNotifications();

    // Set up interval to check for new notifications every 5 minutes
    const interval = setInterval(generateNotifications, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  // Function to refresh notifications (can be called from other components)
  const refreshNotifications = async () => {
    try {
      const uid = auth.currentUser?.uid;
      if (!uid) return;

      const categoriesResponse = await fetch(`http://localhost:5000/api/categories/${uid}`);
      const categories = await categoriesResponse.ok ? await categoriesResponse.json() : [];

      const expensesResponse = await fetch(`http://localhost:5000/api/expenses/${uid}`);
      const expenses = await expensesResponse.ok ? await expensesResponse.json() : [];

      const newNotifications = [];

      categories.forEach(category => {
        if (category.budgetLimit && category.budgetLimit > 0) {
          const categoryExpenses = expenses.filter(exp => exp.category === category.name);
          const totalSpent = categoryExpenses.reduce((sum, exp) => sum + exp.amount, 0);
          const percentage = (totalSpent / category.budgetLimit) * 100;

          if (percentage >= 100) {
            // Create individual notifications for each expense that contributed to over-budget
            categoryExpenses.forEach(expense => {
              // Check if this specific expense caused or contributed to over-budget
              const expensesBeforeThis = categoryExpenses
                .filter(exp => new Date(exp.date) <= new Date(expense.date))
                .reduce((sum, exp) => sum + exp.amount, 0);
              
              if (expensesBeforeThis > category.budgetLimit) {
                newNotifications.push({
                  type: 'overBudget',
                  categoryName: category.name,
                  budgetLimit: category.budgetLimit,
                  spent: expensesBeforeThis,
                  percentage: (expensesBeforeThis / category.budgetLimit) * 100,
                  date: expense.date,
                  expense: expense, // The specific expense that caused over-budget
                  totalExpenses: categoryExpenses.length
                });
              }
            });
          } else if (percentage >= 80) {
            // Warning notification for approaching budget limit
            newNotifications.push({
              type: 'warning',
              categoryName: category.name,
              budgetLimit: category.budgetLimit,
              spent: totalSpent,
              percentage: percentage,
              date: new Date(),
              totalExpenses: categoryExpenses.length
            });
          }
        }
      });

      // Remove duplicates and keep only the most recent notifications
      const uniqueNotifications = newNotifications.filter((notification, index, self) => 
        index === self.findIndex(n => 
          n.type === notification.type && 
          n.categoryName === notification.categoryName &&
          n.expense?._id === notification.expense?._id
        )
      );

      setNotifications(uniqueNotifications);
      setNotificationCount(uniqueNotifications.length);
    } catch (error) {
      console.error('Error refreshing notifications:', error);
    }
  };

  // Function to remove individual notification
  const removeNotification = (index, type) => {
    const updatedNotifications = notifications.filter((_, i) => i !== index);
    setNotifications(updatedNotifications);
    setNotificationCount(updatedNotifications.length);
  };

  // Make refreshNotifications globally available
  useEffect(() => {
    window.refreshNotifications = refreshNotifications;
    return () => {
      delete window.refreshNotifications;
    };
  }, []);

  return (
    <nav className="bg-white/95 backdrop-blur-lg sticky top-0 z-50 border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          
          {/* Logo */}
          <div className="flex items-center">
            <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              UpNext
            </span>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-1">
            {navigation.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.name}
                  onClick={() => navigate(item.href)}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 flex items-center space-x-2 ${
                    isActive(item.href)
                      ? 'bg-blue-50 text-blue-700 border border-blue-200'
                      : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.name}</span>
                </button>
              );
            })}
          </div>

          {/* Right Navigation Items */}
          <div className="flex items-center space-x-4">
            {/* Notifications */}
            <div className="relative">
              <button
                onClick={() => setShowNotifications(true)}
                className="p-2 text-gray-500 hover:text-blue-600 rounded-full hover:bg-blue-50 transition-all duration-200 relative"
                aria-label="Notifications"
              >
                <Bell className="h-5 w-5" />
                {notificationCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium animate-pulse">
                    {notificationCount > 9 ? '9+' : notificationCount}
                  </span>
                )}
              </button>
            </div>

            {/* Profile Menu */}
            <div className="relative">
              <button
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                className="flex items-center space-x-3 focus:outline-none hover:bg-blue-50 rounded-full px-3 py-2 transition-all duration-200"
              >
                {displayPhoto ? (
                  <img
                    className="h-8 w-8 rounded-full object-cover ring-2 ring-white shadow-sm"
                    src={displayPhoto}
                    alt={displayName}
                  />
                ) : (
                  <UserCircle className="h-8 w-8 text-blue-600" />
                )}
                <div className="hidden lg:block text-left">
                  <p className="text-sm font-medium text-gray-900">{displayName}</p>
                  <p className="text-xs text-gray-500">{displayEmail}</p>
                </div>
                <ChevronDown className="h-4 w-4 text-gray-400" />
              </button>

              {showProfileMenu && (
                <div className="absolute right-0 mt-2 w-64 rounded-2xl shadow-lg bg-white ring-1 ring-black ring-opacity-5 p-2 border border-gray-200">
                  <div className="p-1">
                    <button 
                      onClick={() => navigate('/profile')}
                      className="w-full px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-xl flex items-center transition-all duration-200"
                    >
                      <User className="h-4 w-4 mr-3" />
                      Profile
                    </button>
                    <button className="w-full px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-xl flex items-center transition-all duration-200">
                      <Settings className="h-4 w-4 mr-3" />
                      Settings
                    </button>
                    <hr className="my-1" />
                    <button
                      onClick={handleSignOut}
                      className="w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-xl flex items-center transition-all duration-200"
                    >
                      <LogOut className="h-4 w-4 mr-3" />
                      Sign out
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Mobile menu button */}
            <button
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              className="md:hidden p-2 text-gray-500 hover:text-blue-600 rounded-full hover:bg-blue-50 transition-all duration-200"
            >
              {showMobileMenu ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {showMobileMenu && (
          <div className="md:hidden py-4 border-t border-gray-200">
            <div className="space-y-1">
              {navigation.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.name}
                    onClick={() => {
                      navigate(item.href);
                      setShowMobileMenu(false);
                    }}
                    className={`w-full px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 flex items-center space-x-3 ${
                      isActive(item.href)
                        ? 'bg-blue-50 text-blue-700 border border-blue-200'
                        : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{item.name}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Notification Modal */}
      <NotificationModal
        isOpen={showNotifications}
        onClose={() => setShowNotifications(false)}
        notifications={notifications}
        onRefresh={refreshNotifications}
        onRemoveNotification={removeNotification}
      />
    </nav>
  );
}

export default Navbar;
