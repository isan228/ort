import React, { useState, useEffect } from 'react';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import axios from 'axios';
import Navbar from '../components/Navbar';
import toast from 'react-hot-toast';
import AdminUsers from '../components/admin/AdminUsers';
import AdminSubjects from '../components/admin/AdminSubjects';
import AdminTests from '../components/admin/AdminTests';
import AdminStatistics from '../components/admin/AdminStatistics';
import AdminUniversities from '../components/admin/AdminUniversities';

const AdminPanel = () => {
  const location = useLocation();

  return (
    <div>
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Панель администратора</h1>

        {/* Tabs */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="-mb-px flex space-x-8">
            <Link
              to="/admin/statistics"
              className={`${
                location.pathname.includes('/statistics')
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              Статистика
            </Link>
            <Link
              to="/admin/users"
              className={`${
                location.pathname.includes('/users')
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              Пользователи
            </Link>
            <Link
              to="/admin/subjects"
              className={`${
                location.pathname.includes('/subjects')
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              Предметы
            </Link>
            <Link
              to="/admin/tests"
              className={`${
                location.pathname.includes('/tests')
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              Тесты
            </Link>
            <Link
              to="/admin/universities"
              className={`${
                location.pathname.includes('/universities')
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              Университеты
            </Link>
          </nav>
        </div>

        {/* Content */}
        <Routes>
          <Route path="/statistics" element={<AdminStatistics />} />
          <Route path="/users" element={<AdminUsers />} />
          <Route path="/subjects" element={<AdminSubjects />} />
          <Route path="/tests" element={<AdminTests />} />
          <Route path="/universities" element={<AdminUniversities />} />
          <Route path="/" element={<AdminStatistics />} />
        </Routes>
      </div>
    </div>
  );
};

export default AdminPanel;

