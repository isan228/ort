import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';

const AuthContext = createContext();

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

axios.defaults.baseURL = API_URL;

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      loadUser();
    } else {
      // Убеждаемся, что заголовок авторизации удален для неавторизованных пользователей
      delete axios.defaults.headers.common['Authorization'];
      setLoading(false);
    }
  }, []);

  const loadUser = async () => {
    try {
      const response = await axios.get('/auth/me');
      setUser(response.data);
    } catch (error) {
      localStorage.removeItem('token');
      delete axios.defaults.headers.common['Authorization'];
    } finally {
      setLoading(false);
    }
  };

  const login = async (phone, password) => {
    try {
      const response = await axios.post('/auth/login', { phone, password });
      const { token, user } = response.data;
      
      localStorage.setItem('token', token);
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      setUser(user);
      
      toast.success('Успешный вход!');
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || 'Ошибка входа';
      toast.error(message);
      return { success: false, error: message };
    }
  };

  const register = async (userData) => {
    try {
      const response = await axios.post('/auth/register', userData);
      const { token, user } = response.data;
      
      localStorage.setItem('token', token);
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      setUser(user);
      
      toast.success('Регистрация успешна!');
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || 'Ошибка регистрации';
      toast.error(message);
      return { success: false, error: message };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    delete axios.defaults.headers.common['Authorization'];
    setUser(null);
    toast.success('Вы вышли из системы');
  };

  const value = {
    user,
    login,
    register,
    logout,
    loading,
    loadUser
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

