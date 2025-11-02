import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Navbar from '../components/Navbar';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import toast from 'react-hot-toast';

const Home = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [freeTests, setFreeTests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFreeTests();
  }, []);

  const loadFreeTests = async () => {
    try {
      const response = await axios.get('/tests/free-by-subject');
      const testsArray = Object.values(response.data).map(item => ({
        subject: item.subject,
        test: item.test
      }));
      setFreeTests(testsArray);
    } catch (error) {
      console.error('Error loading free tests:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTestClick = (testId) => {
    // Бесплатные тесты можно проходить без входа
    navigate(`/tests/${testId}`);
  };

  return (
    <div>
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Hero Section */}
        <div className="text-center mb-16 animate-fade-in">
          <div className="relative">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-full max-w-lg h-72 bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 rounded-full opacity-20 blur-3xl animate-float"></div>
            </div>
            <div className="relative">
              <h1 className="text-4xl font-extrabold text-gray-900 sm:text-5xl md:text-6xl mb-4 animate-scale-in">
                {t('home.title')} <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-600 via-purple-600 to-pink-600 animate-gradient">ОРТ</span>
              </h1>
              <p className="mt-3 max-w-md mx-auto text-base text-gray-500 sm:text-lg md:mt-5 md:text-xl md:max-w-3xl animate-slide-in-right">
                {t('home.subtitle')}
              </p>
            </div>
          </div>
          <div className="mt-5 max-w-md mx-auto sm:flex sm:justify-center md:mt-8">
            {!user ? (
              <>
                <Link
                  to="/subscription"
                  className="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-gradient-to-r from-primary-600 to-purple-600 hover:from-primary-700 hover:to-purple-700 transform hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl md:py-4 md:text-lg md:px-10 mr-4 animate-fade-in"
                  style={{ animationDelay: '0.2s', animationFillMode: 'both' }}
                >
                  {t('common.subscription')}
                </Link>
                <Link
                  to="/login"
                  className="w-full flex items-center justify-center px-8 py-3 border-2 border-primary-600 text-base font-medium rounded-md text-primary-700 bg-white hover:bg-primary-50 transform hover:scale-105 transition-all duration-300 md:py-4 md:text-lg md:px-10 animate-fade-in"
                  style={{ animationDelay: '0.3s', animationFillMode: 'both' }}
                >
                  {t('common.login')}
                </Link>
              </>
            ) : (
              <>
                <Link
                  to="/subscription"
                  className="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 md:py-4 md:text-lg md:px-10 mr-4"
                >
                  {t('common.subscription')}
                </Link>
                <Link
                  to="/tests"
                  className="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-primary-700 bg-primary-100 hover:bg-primary-200 md:py-4 md:text-lg md:px-10"
                >
                  {t('home.allTests')}
                </Link>
              </>
            )}
          </div>
        </div>

        {/* Free Tests by Subject */}
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          </div>
        ) : freeTests.length > 0 ? (
          <div className="mb-16">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
              {t('home.freeTests')}
            </h2>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {freeTests.map((item, index) => (
                  <div
                    key={item.test.id}
                    onClick={() => handleTestClick(item.test.id)}
                    className="bg-white shadow-lg rounded-xl p-6 hover-lift cursor-pointer transform transition-all duration-300 border border-gray-100 hover:border-primary-300 group relative overflow-hidden animate-scale-in"
                    style={{ animationDelay: `${index * 0.1}s`, animationFillMode: 'both' }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-primary-500/0 via-primary-500/5 to-primary-500/0 transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
                    <div className="relative z-10">
                  <div className="flex items-center justify-between mb-4">
                    <span className="px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      Бесплатно
                    </span>
                    {item.test.timeLimit && (
                      <span className="text-sm text-gray-500">{item.test.timeLimit} мин</span>
                    )}
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {item.subject.name}
                  </h3>
                  <h4 className="text-xl font-bold text-primary-600 mb-2">
                    {item.test.title}
                  </h4>
                  {item.test.description && (
                    <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                      {item.test.description}
                    </p>
                  )}
                    <div className="flex items-center text-primary-600 font-medium group-hover:text-primary-700 transition-colors">
                      <span className="transform group-hover:translate-x-2 transition-transform">{t('home.startTest')}</span>
                    </div>
                    </div>
                  </div>
              ))}
            </div>
            {!user && (
              <div className="mt-8 text-center">
                <Link
                  to="/subscription"
                  className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
                >
                  {t('subscription.purchase')} →
                </Link>
              </div>
            )}
          </div>
        ) : (
          <div className="mb-16 text-center py-12">
            <p className="text-gray-600">Бесплатные тесты пока не добавлены</p>
          </div>
        )}

        {/* Subscription Benefits */}
        <div className="mb-16 bg-gradient-to-br from-primary-50 via-purple-50 to-blue-50 rounded-2xl p-8 md:p-12 shadow-xl border border-primary-100 animate-fade-in relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-primary-200/30 to-purple-200/30 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-gradient-to-tr from-blue-200/30 to-pink-200/30 rounded-full blur-3xl"></div>
          <div className="relative z-10">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              {t('home.subscriptionBenefits')}
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              {t('home.subscriptionSubtitle')}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            <div className="bg-white rounded-xl p-6 shadow-lg card-hover border border-gray-100 animate-scale-in" style={{ animationDelay: '0.1s', animationFillMode: 'both' }}>
              <div className="flex items-center mb-3">
                <div className="p-2 bg-blue-100 rounded-lg mr-3">
                  <svg className="h-6 w-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900">{t('subscription.allTestsTitle')}</h3>
              </div>
              <p className="text-sm text-gray-600">
                {t('subscription.allTestsDesc')}
              </p>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-lg card-hover border border-gray-100 animate-scale-in" style={{ animationDelay: '0.2s', animationFillMode: 'both' }}>
              <div className="flex items-center mb-3">
                <div className="p-2 bg-green-100 rounded-lg mr-3 transform hover:rotate-12 transition-transform">
                  <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900">{t('subscription.statsTitle')}</h3>
              </div>
              <p className="text-sm text-gray-600">
                {t('subscription.statsDesc')}
              </p>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-lg card-hover border border-gray-100 animate-scale-in" style={{ animationDelay: '0.3s', animationFillMode: 'both' }}>
              <div className="flex items-center mb-3">
                <div className="p-2 bg-purple-100 rounded-lg mr-3 transform hover:rotate-12 transition-transform">
                  <svg className="h-6 w-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900">{t('subscription.rankingsTitle')}</h3>
              </div>
              <p className="text-sm text-gray-600">
                {t('subscription.rankingsDesc')}
              </p>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-lg card-hover border border-gray-100 animate-scale-in" style={{ animationDelay: '0.4s', animationFillMode: 'both' }}>
              <div className="flex items-center mb-3">
                <div className="p-2 bg-yellow-100 rounded-lg mr-3 transform hover:rotate-12 transition-transform">
                  <svg className="h-6 w-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900">{t('subscription.historyTitle')}</h3>
              </div>
              <p className="text-sm text-gray-600">
                {t('subscription.historyDesc')}
              </p>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-lg card-hover border border-gray-100 animate-scale-in" style={{ animationDelay: '0.5s', animationFillMode: 'both' }}>
              <div className="flex items-center mb-3">
                <div className="p-2 bg-red-100 rounded-lg mr-3 transform hover:rotate-12 transition-transform">
                  <svg className="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900">{t('subscription.analysisTitle')}</h3>
              </div>
              <p className="text-sm text-gray-600">
                {t('subscription.analysisDesc')}
              </p>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-lg card-hover border border-gray-100 animate-scale-in" style={{ animationDelay: '0.6s', animationFillMode: 'both' }}>
              <div className="flex items-center mb-3">
                <div className="p-2 bg-indigo-100 rounded-lg mr-3 transform hover:rotate-12 transition-transform">
                  <svg className="h-6 w-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900">{t('subscription.unlimitedTitle')}</h3>
              </div>
              <p className="text-sm text-gray-600">
                {t('subscription.unlimitedDesc')}
              </p>
            </div>
          </div>

          <div className="text-center relative z-10">
            <Link
              to="/subscription"
              className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-primary-600 via-purple-600 to-pink-600 text-white text-lg font-semibold rounded-xl hover:from-primary-700 hover:via-purple-700 hover:to-pink-700 transition-all duration-300 shadow-xl hover:shadow-2xl transform hover:scale-105 animate-pulse-glow"
            >
              {t('home.learnMore')}
              <svg className="ml-2 h-5 w-5 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
          </div>
        </div>

        {/* Features */}
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3 mt-16">
          <div className="pt-6">
            <div className="flow-root bg-white rounded-lg px-6 pb-8">
              <div className="-mt-6">
                <div className="inline-flex items-center justify-center p-3 bg-primary-500 rounded-md shadow-lg">
                  <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="mt-8 text-lg font-medium text-gray-900 tracking-tight">
                  Моментальная проверка
                </h3>
                <p className="mt-5 text-base text-gray-500">
                  Получайте результаты сразу после прохождения теста
                </p>
              </div>
            </div>
          </div>

          <div className="pt-6">
            <div className="flow-root bg-white rounded-lg px-6 pb-8">
              <div className="-mt-6">
                <div className="inline-flex items-center justify-center p-3 bg-primary-500 rounded-md shadow-lg">
                  <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <h3 className="mt-8 text-lg font-medium text-gray-900 tracking-tight">
                  Статистика и аналитика
                </h3>
                <p className="mt-5 text-base text-gray-500">
                  Отслеживайте свой прогресс и улучшайте слабые места
                </p>
              </div>
            </div>
          </div>

          <div className="pt-6">
            <div className="flow-root bg-white rounded-lg px-6 pb-8">
              <div className="-mt-6">
                <div className="inline-flex items-center justify-center p-3 bg-primary-500 rounded-md shadow-lg">
                  <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <h3 className="mt-8 text-lg font-medium text-gray-900 tracking-tight">
                  Рейтинги
                </h3>
                <p className="mt-5 text-base text-gray-500">
                  Соревнуйтесь с другими по школе, региону и стране
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
