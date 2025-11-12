import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

const Navbar = () => {
  const { user, logout } = useAuth();
  const { language, changeLanguage, t } = useLanguage();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
    setMobileMenuOpen(false);
  };

  return (
    <nav className="bg-white/95 backdrop-blur-md shadow-lg border-b border-gray-200 sticky top-0 z-50 transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16 md:h-20">
          <div className="flex items-center">
            <Link to="/" className="flex items-center group" onClick={() => setMobileMenuOpen(false)}>
              <span className="text-xl md:text-2xl font-bold bg-gradient-to-r from-primary-600 via-purple-600 to-pink-600 bg-clip-text text-transparent transform group-hover:scale-105 transition-transform duration-300">
                ОРТ Тесты
              </span>
            </Link>
            <div className="hidden md:ml-6 md:flex md:space-x-8">
              <Link
                to="/"
                className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-all duration-300"
              >
                {t('common.home')}
              </Link>
              <Link
                to="/universities"
                className="border-transparent text-gray-500 hover:text-primary-600 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-all duration-300 hover:border-primary-600 relative group"
              >
                Университеты
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-primary-600 transition-all duration-300 group-hover:w-full"></span>
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
          
          {/* Desktop Actions */}
          <div className="hidden md:flex items-center space-x-2 lg:space-x-4">
            {/* Language Switcher */}
            <div className="flex items-center space-x-1 bg-gradient-to-r from-gray-100 to-gray-50 rounded-xl p-1 shadow-inner border border-gray-200">
              <button
                onClick={() => changeLanguage('ru')}
                className={`px-3 lg:px-4 py-1.5 rounded-lg text-xs lg:text-sm font-medium transition-all duration-300 transform hover:scale-110 ${
                  language === 'ru'
                    ? 'bg-gradient-to-r from-primary-600 to-purple-600 text-white shadow-lg'
                    : 'text-gray-700 hover:bg-gray-200 hover:text-primary-600'
                }`}
              >
                RU
              </button>
              <button
                onClick={() => changeLanguage('kg')}
                className={`px-3 lg:px-4 py-1.5 rounded-lg text-xs lg:text-sm font-medium transition-all duration-300 transform hover:scale-110 ${
                  language === 'kg'
                    ? 'bg-gradient-to-r from-primary-600 to-purple-600 text-white shadow-lg'
                    : 'text-gray-700 hover:bg-gray-200 hover:text-primary-600'
                }`}
              >
                KG
              </button>
            </div>

            {user ? (
              <div className="flex items-center space-x-2 lg:space-x-4">
                <span className="hidden lg:inline text-sm text-gray-700">{user.firstName} {user.lastName}</span>
                <button
                  onClick={handleLogout}
                  className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white px-3 lg:px-4 py-2 rounded-lg text-xs lg:text-sm font-medium shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-300"
                >
                  {t('common.logout')}
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-2 lg:space-x-4">
                <Link
                  to="/login"
                  className="text-gray-600 hover:text-primary-600 px-3 lg:px-4 py-2 rounded-lg text-xs lg:text-sm font-medium transition-all duration-300 hover:bg-gray-50 transform hover:scale-105"
                >
                  {t('common.login')}
                </Link>
                <Link
                  to="/subscription"
                  className="bg-gradient-to-r from-primary-600 to-purple-600 hover:from-primary-700 hover:to-purple-700 text-white px-3 lg:px-4 py-2 rounded-lg text-xs lg:text-sm font-medium shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-300"
                >
                  {t('common.subscription')}
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center space-x-2">
            <div className="flex items-center space-x-1 bg-gradient-to-r from-gray-100 to-gray-50 rounded-lg p-1 shadow-inner border border-gray-200">
              <button
                onClick={() => changeLanguage('ru')}
                className={`px-2 py-1 rounded text-xs font-medium transition-all duration-300 ${
                  language === 'ru'
                    ? 'bg-gradient-to-r from-primary-600 to-purple-600 text-white'
                    : 'text-gray-700'
                }`}
              >
                RU
              </button>
              <button
                onClick={() => changeLanguage('kg')}
                className={`px-2 py-1 rounded text-xs font-medium transition-all duration-300 ${
                  language === 'kg'
                    ? 'bg-gradient-to-r from-primary-600 to-purple-600 text-white'
                    : 'text-gray-700'
                }`}
              >
                KG
              </button>
            </div>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-500"
            >
              <span className="sr-only">Open main menu</span>
              {mobileMenuOpen ? (
                <svg className="block h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="block h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="md:hidden animate-fade-in">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-white border-t border-gray-200">
            <Link
              to="/"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-primary-600 hover:bg-gray-50 transition-colors"
            >
              {t('common.home')}
            </Link>
            <Link
              to="/universities"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-primary-600 hover:bg-gray-50 transition-colors"
            >
              Университеты
            </Link>
            {user ? (
              <>
                <Link
                  to="/tests"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-primary-600 hover:bg-gray-50 transition-colors"
                >
                  {t('common.tests')}
                </Link>
                <Link
                  to="/dashboard"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-primary-600 hover:bg-gray-50 transition-colors"
                >
                  {t('common.dashboard')}
                </Link>
                {(user.role === 'admin' || user.role === 'repetitor') && (
                  <Link
                    to={user.role === 'admin' ? '/admin' : '/repetitor'}
                    onClick={() => setMobileMenuOpen(false)}
                    className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-primary-600 hover:bg-gray-50 transition-colors"
                  >
                    {t('common.admin')}
                  </Link>
                )}
                <div className="px-3 py-2 text-sm text-gray-700 border-t border-gray-200 mt-2 pt-2">
                  {user.firstName} {user.lastName}
                </div>
                <button
                  onClick={handleLogout}
                  className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-red-600 hover:bg-red-50 transition-colors"
                >
                  {t('common.logout')}
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-primary-600 hover:bg-gray-50 transition-colors"
                >
                  {t('common.login')}
                </Link>
                <Link
                  to="/subscription"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-3 py-2 rounded-md text-base font-medium text-white bg-gradient-to-r from-primary-600 to-purple-600 hover:from-primary-700 hover:to-purple-700 transition-colors"
                >
                  {t('common.subscription')}
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
