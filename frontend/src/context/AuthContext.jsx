import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [studentProfile, setStudentProfile] = useState(null);
  const [wallet, setWallet] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('campusbite_token') || null);
  const [loading, setLoading] = useState(true);

  // Set default auth header
  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      localStorage.setItem('campusbite_token', token);
      fetchCurrentUser();
    } else {
      delete axios.defaults.headers.common['Authorization'];
      localStorage.removeItem('campusbite_token');
      setUser(null);
      setStudentProfile(null);
      setWallet(null);
      setLoading(false);
    }
  }, [token]);

  const fetchCurrentUser = async () => {
    try {
      const res = await axios.get('/api/auth/me');
      if (res.data.success) {
        setUser(res.data.user);
        setStudentProfile(res.data.student_profile);
        setWallet(res.data.wallet);
      }
    } catch (err) {
      console.warn('Session expired or invalid token:', err.response?.data?.message || err.message);
      // Auto-fallback to demo login if first visit
      if (!user) {
        await quickLoginDemo('student');
      }
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    const res = await axios.post('/api/auth/login', { email, password });
    if (res.data.success) {
      setToken(res.data.token);
      setUser(res.data.user);
      setStudentProfile(res.data.student_profile);
      return res.data;
    }
    throw new Error(res.data.message || 'Login failed');
  };

  const register = async (formData) => {
    const res = await axios.post('/api/auth/register', formData);
    if (res.data.success) {
      setToken(res.data.token);
      setUser(res.data.user);
      setStudentProfile(res.data.student_profile);
      return res.data;
    }
    throw new Error(res.data.message || 'Registration failed');
  };

  const quickLoginDemo = async (role = 'student') => {
    const email = role === 'kitchen' ? 'admin.kitchen@campusbite.edu' : 'student.demo@campusbite.edu';
    return await login(email, 'password123');
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    setStudentProfile(null);
    setWallet(null);
  };

  const refreshWallet = async () => {
    try {
      const res = await axios.get('/api/wallet/summary');
      if (res.data.success) {
        setWallet(prev => ({ ...(prev || {}), balance: res.data.summary.balance }));
      }
    } catch (err) {
      // ignore
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        studentProfile,
        wallet,
        token,
        loading,
        login,
        register,
        quickLoginDemo,
        logout,
        refreshWallet
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}
