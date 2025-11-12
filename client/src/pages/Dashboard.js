import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import Navbar from '../components/Navbar';
import RewardsPanel from '../components/RewardsPanel';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const Dashboard = () => {
  const { user, loadUser } = useAuth();
  const [profile, setProfile] = useState(null);
  const [subscription, setSubscription] = useState(null);
  const [statistics, setStatistics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [profileRes, subscriptionRes, statisticsRes] = await Promise.all([
        axios.get('/users/profile'),
        axios.get('/subscription'),
        axios.get('/users/statistics')
      ]);

      setProfile(profileRes.data);
      setSubscription(subscriptionRes.data);
      setStatistics(statisticsRes.data);
    } catch (error) {
      toast.error('Ошибка загрузки данных');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div>
        <Navbar />
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Личный кабинет</h1>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Profile Card */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Профиль</h2>
            <div className="space-y-2">
              <p><span className="font-medium">Имя:</span> {profile?.firstName} {profile?.lastName}</p>
              <p><span className="font-medium">Email:</span> {profile?.email}</p>
              {profile?.school && <p><span className="font-medium">Школа:</span> {profile.school}</p>}
              {profile?.region && <p><span className="font-medium">Регион:</span> {profile.region}</p>}
            </div>
            <Link
              to="/statistics"
              className="mt-4 inline-block text-primary-600 hover:text-primary-700"
            >
              Изменить профиль →
            </Link>
          </div>

          {/* Subscription Card */}
          <div className="bg-white shadow-xl rounded-2xl p-6 border border-gray-100 card-hover animate-scale-in" style={{ animationDelay: '0.2s', animationFillMode: 'both' }}>
            <h2 className="text-xl font-semibold mb-4 bg-gradient-to-r from-primary-600 to-purple-600 bg-clip-text text-transparent">Подписка</h2>
            {subscription ? (
              <div className="space-y-2">
                <p className={`text-lg font-medium ${subscription.status === 'active' ? 'text-green-600' : 'text-red-600'}`}>
                  {subscription.status === 'active' ? 'Активна' : 'Истекла'}
                </p>
                <p><span className="font-medium">До:</span> {new Date(subscription.endDate).toLocaleDateString('ru-RU')}</p>
                <Link
                  to="/subscription"
                  className="mt-4 inline-block text-primary-600 hover:text-primary-700"
                >
                  Управление подпиской →
                </Link>
              </div>
            ) : (
              <div>
                <p className="text-gray-600 mb-4">Нет активной подписки</p>
                <Link
                  to="/subscription"
                  className="inline-block bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700"
                >
                  Купить подписку
                </Link>
              </div>
            )}
          </div>

          {/* Statistics Card */}
          <div className="bg-white shadow-xl rounded-2xl p-6 border border-gray-100 card-hover animate-scale-in" style={{ animationDelay: '0.3s', animationFillMode: 'both' }}>
            <h2 className="text-xl font-semibold mb-4 bg-gradient-to-r from-primary-600 to-purple-600 bg-clip-text text-transparent">Статистика</h2>
            {statistics ? (
              <div className="space-y-2">
                <p><span className="font-medium">Всего тестов:</span> {statistics.totalTests}</p>
                <p><span className="font-medium">Средний балл:</span> {Math.round(statistics.averageScore)}</p>
                <Link
                  to="/statistics"
                  className="mt-4 inline-block text-primary-600 hover:text-primary-700"
                >
                  Подробная статистика →
                </Link>
              </div>
            ) : (
              <p className="text-gray-600">Нет данных</p>
            )}
          </div>
        </div>

        {/* Rewards Panel */}
        <div className="mt-8">
          <RewardsPanel />
        </div>

        {/* Quick Actions */}
        <div className="mt-8 bg-gradient-to-br from-white via-primary-50/20 to-purple-50/20 shadow-2xl rounded-2xl p-6 border border-primary-100 animate-fade-in relative overflow-hidden">
          <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-br from-primary-200/20 to-purple-200/20 rounded-full blur-3xl"></div>
          <div className="relative z-10">
            <h2 className="text-xl font-semibold mb-6 bg-gradient-to-r from-primary-600 to-purple-600 bg-clip-text text-transparent">Быстрые действия</h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <Link
                to="/tests"
                className="bg-gradient-to-r from-primary-600 to-purple-600 text-white px-6 py-3 rounded-xl hover:from-primary-700 hover:to-purple-700 text-center font-semibold transform hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl"
              >
                Пройти тест
              </Link>
              <Link
                to="/statistics"
                className="bg-gray-200 text-gray-800 px-6 py-3 rounded-xl hover:bg-gray-300 text-center font-semibold transform hover:scale-105 transition-all duration-300 shadow-md hover:shadow-lg"
              >
                Статистика
              </Link>
              <Link
                to="/ranking"
                className="bg-gray-200 text-gray-800 px-6 py-3 rounded-xl hover:bg-gray-300 text-center font-semibold transform hover:scale-105 transition-all duration-300 shadow-md hover:shadow-lg"
              >
                Рейтинг
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

