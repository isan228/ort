import React, { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';

const AdminStatistics = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const response = await axios.get('/admin/statistics');
      setStats(response.data);
    } catch (error) {
      toast.error('Ошибка загрузки статистики');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center py-12">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
    </div>;
  }

  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-2">Всего пользователей</h3>
        <p className="text-3xl font-bold text-primary-600">{stats?.totalUsers || 0}</p>
      </div>
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-2">Всего тестов</h3>
        <p className="text-3xl font-bold text-primary-600">{stats?.totalTests || 0}</p>
      </div>
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-2">Всего результатов</h3>
        <p className="text-3xl font-bold text-primary-600">{stats?.totalResults || 0}</p>
      </div>
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-2">Активных подписок</h3>
        <p className="text-3xl font-bold text-primary-600">{stats?.activeSubscriptions || 0}</p>
      </div>
    </div>
  );
};

export default AdminStatistics;

