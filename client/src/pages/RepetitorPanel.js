import React, { useState } from 'react';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import Navbar from '../components/Navbar';
import AdminSubjects from '../components/admin/AdminSubjects';
import AdminTests from '../components/admin/AdminTests';

const RepetitorPanel = () => {
  const location = useLocation();

  return (
    <div>
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Панель репититора</h1>

        {/* Tabs */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="-mb-px flex space-x-8">
            <Link
              to="/repetitor/subjects"
              className={`${
                location.pathname.includes('/subjects')
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              Предметы
            </Link>
            <Link
              to="/repetitor/tests"
              className={`${
                location.pathname.includes('/tests')
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              Тесты
            </Link>
          </nav>
        </div>

        {/* Content */}
        <Routes>
          <Route path="/subjects" element={<AdminSubjects />} />
          <Route path="/tests" element={<AdminTests />} />
          <Route path="/" element={<AdminSubjects />} />
        </Routes>
      </div>
    </div>
  );
};

export default RepetitorPanel;

