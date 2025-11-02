import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

const Navbar = () => {
  const { user, logout } = useAuth();
  const { language, changeLanguage, t } = useLanguage();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav className="bg-white/95 backdrop-blur-md shadow-lg border-b border-gray-200 sticky top-0 z-50 transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <Link to="/" className="flex items-center group">
              <span className="text-2xl font-bold bg-gradient-to-r from-primary-600 via-purple-600 to-pink-600 bg-clip-text text-transparent transform group-hover:scale-105 transition-transform duration-300">
                ОРТ Тесты
              </span>
            </Link>
            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
              <Link
                to="/"
                className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
              >
                {t('common.home')}
              </Link>
              {user && (
                <>
                  <Link
                    to="/tests"
                    className="border-transparent text-gray-500 hover:text-primary-600 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-all duration-300 hover:border-primary-600 relative group"
                  >
                    {t('common.tests')}
                    <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-primary-600 transition-all duration-300 group-hover:w-full"></span>
                  </Link>
                  <Link
                    to="/dashboard"
                    className="border-transparent text-gray-500 hover:text-primary-600 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-all duration-300 hover:border-primary-600 relative group"
                  >
                    {t('common.dashboard')}
                    <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-primary-600 transition-all duration-300 group-hover:w-full"></span>
                  </Link>
                  {(user.role === 'admin' || user.role === 'repetitor') && (
                    <Link
                      to={user.role === 'admin' ? '/admin' : '/repetitor'}
                      className="border-transparent text-gray-500 hover:text-primary-600 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-all duration-300 hover:border-primary-600 relative group"
                    >
                      {t('common.admin')}
                      <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-primary-600 transition-all duration-300 group-hover:w-full"></span>
                    </Link>
                  )}
                </>
              )}
            </div>
          </div>
          <div className="flex items-center space-x-4">
            {/* Language Switcher */}
            <div className="flex items-center space-x-2 bg-gradient-to-r from-gray-100 to-gray-50 rounded-xl p-1 shadow-inner border border-gray-200">
              <button
                onClick={() => changeLanguage('ru')}
                className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all duration-300 transform hover:scale-110 ${
                  language === 'ru'
                    ? 'bg-gradient-to-r from-primary-600 to-purple-600 text-white shadow-lg'
                    : 'text-gray-700 hover:bg-gray-200 hover:text-primary-600'
                }`}
              >
                RU
              </button>
              <button
                onClick={() => changeLanguage('kg')}
                className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all duration-300 transform hover:scale-110 ${
                  language === 'kg'
                    ? 'bg-gradient-to-r from-primary-600 to-purple-600 text-white shadow-lg'
                    : 'text-gray-700 hover:bg-gray-200 hover:text-primary-600'
                }`}
              >
                KG
              </button>
            </div>

            {user ? (
              <div className="flex items-center space-x-4">
                <span className="text-gray-700">{user.firstName} {user.lastName}</span>
                <button
                  onClick={handleLogout}
                  className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-300"
                >
                  {t('common.logout')}
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-4">
                <Link
                  to="/login"
                  className="text-gray-600 hover:text-primary-600 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-300 hover:bg-gray-50 transform hover:scale-105"
                >
                  {t('common.login')}
                </Link>
                <Link
                  to="/subscription"
                  className="bg-gradient-to-r from-primary-600 to-purple-600 hover:from-primary-700 hover:to-purple-700 text-white px-4 py-2 rounded-lg text-sm font-medium shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-300"
                >
                  {t('common.subscription')}
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;

