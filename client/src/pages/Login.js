import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import Navbar from '../components/Navbar';

const Login = () => {
  const [formData, setFormData] = useState({
    phone: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    const result = await login(formData.phone, formData.password);
    
    if (result.success) {
      navigate('/dashboard');
    }
    
    setLoading(false);
  };

  return (
    <div>
      <Navbar />
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8 animate-scale-in">
          <div className="bg-white shadow-2xl rounded-2xl p-8 border border-gray-100 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-primary-100/50 to-purple-100/50 rounded-full blur-2xl"></div>
            <div className="relative z-10">
              <div className="text-center">
                <h2 className="text-3xl font-extrabold bg-gradient-to-r from-primary-600 to-purple-600 bg-clip-text text-transparent mb-2">
                  {t('login.title') || 'Вход в систему'}
                </h2>
                <p className="text-sm text-gray-600 mt-2">
                  {t('login.noAccount') || 'Нет аккаунта?'}{' '}
                  <Link to="/subscription" className="font-medium text-primary-600 hover:text-primary-500 transition-colors">
                    {t('login.subscribe') || 'Оформите подписку'}
                  </Link>
                </p>
              </div>
              
              <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                <div className="space-y-4">
                  <div>
                    <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                      {t('login.phone') || 'Номер телефона'}
                    </label>
                    <input
                      id="phone"
                      name="phone"
                      type="tel"
                      autoComplete="tel"
                      required
                      className="appearance-none relative block w-full px-4 py-3 border-2 border-gray-300 placeholder-gray-500 text-gray-900 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-300 hover:border-primary-400 focus:shadow-lg focus:scale-105 sm:text-sm"
                      placeholder="+996 XXX XXX XXX"
                      value={formData.phone}
                      onChange={handleChange}
                    />
                  </div>
                  <div>
                    <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                      {t('login.password') || 'Пароль'}
                    </label>
                    <input
                      id="password"
                      name="password"
                      type="password"
                      autoComplete="current-password"
                      required
                      className="appearance-none relative block w-full px-4 py-3 border-2 border-gray-300 placeholder-gray-500 text-gray-900 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-300 hover:border-primary-400 focus:shadow-lg focus:scale-105 sm:text-sm"
                      placeholder={t('login.passwordPlaceholder') || 'Пароль'}
                      value={formData.password}
                      onChange={handleChange}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="text-sm">
                    <Link to="/forgot-password" className="font-medium text-primary-600 hover:text-primary-500 transition-colors">
                      {t('login.forgotPassword') || 'Забыли пароль?'}
                    </Link>
                  </div>
                </div>

                <div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-xl text-white bg-gradient-to-r from-primary-600 via-purple-600 to-pink-600 hover:from-primary-700 hover:via-purple-700 hover:to-pink-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transition-all transform hover:scale-105 duration-300"
                  >
                    {loading ? (t('login.loading') || 'Вход...') : (t('login.submit') || 'Войти')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
