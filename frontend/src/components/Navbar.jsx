// src/components/Navbar.jsx
import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { auth } from '../firebase-config';
import { signOut } from 'firebase/auth';
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
            <button
              className="p-2 text-gray-500 hover:text-blue-600 rounded-full hover:bg-blue-50 transition-all duration-200"
              aria-label="Notifications"
            >
              <Bell className="h-5 w-5" />
            </button>

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
    </nav>
  );
}

export default Navbar;
