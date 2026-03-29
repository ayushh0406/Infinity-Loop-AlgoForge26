import { createContext, useContext, useState, useEffect } from 'react';
import { getStoredUser, isAuthenticated, logoutUser } from '../services/apiService';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuth, setIsAuth] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is already logged in
    try {
      if (isAuthenticated()) {
        const storedUser = getStoredUser();
        setUser(storedUser);
        setIsAuth(true);
      }
    } catch (error) {
      console.error('Auth initialization error:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const login = (userData) => {
    setUser(userData.user);
    setIsAuth(true);
  };

  const logout = () => {
    logoutUser();
    setUser(null);
    setIsAuth(false);
  };

  const value = { user, isAuth, loading, login, logout };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === null) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
