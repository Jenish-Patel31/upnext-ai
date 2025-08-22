// App.jsx
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { useState, useEffect } from 'react';
import { auth } from './firebase-config';

// ChatPage removed - using ChatUI modal instead
import Login from './components/Login';
import SignUp from './components/SignUp';
import Dashboard from './components/Dashboard';
import UserProfile from './components/UserProfile';
import Expenses from './components/Expenses';
import MyPlans from './components/MyPlans';
import Navbar from './components/Navbar';

function RequireAuth({ children }) {
  const location = useLocation();
  return auth.currentUser ? children : <Navigate to="/login" state={{ from: location }} replace />;
}

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        
        if (!currentUser.emailVerified) {
          console.warn('Email not verified');
        }
      }
      setUser(currentUser);
      setLoading(false);
    }, (error) => {
      console.error('Auth state change error:', error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <>
      {user && (
        <Navbar
          userName={user.displayName || "User"}
          userEmail={user.email}
          userPhoto={user.photoURL}
        />
      )}

      <Routes>
        {/* Chat route removed - using ChatUI modal instead */}
        <Route path="/login" element={!user ? <Login /> : <Navigate to="/dashboard" replace />} />
        <Route path="/signup" element={!user ? <SignUp /> : <Navigate to="/dashboard" replace />} />

        <Route path="/dashboard" element={
          <RequireAuth>
            <Dashboard />
          </RequireAuth>
        } />

        <Route path="/profile" element={
          <RequireAuth>
            <UserProfile />
          </RequireAuth>
        } />

        <Route path="/expenses" element={
          <RequireAuth>
            <Expenses />
          </RequireAuth>
        } />

        <Route path="/plans" element={
          <RequireAuth>
            <MyPlans />
          </RequireAuth>
        } />

        <Route path="/" element={<Navigate to={user ? "/dashboard" : "/login"} replace />} />
      </Routes>
    </>
  );
}

export default App;
