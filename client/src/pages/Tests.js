import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import Navbar from '../components/Navbar';
import toast from 'react-hot-toast';

const Tests = () => {
  const [subjects, setSubjects] = useState([]);
  const [tests, setTests] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSubjects();
    loadTests();
  }, []);

  useEffect(() => {
    if (selectedSubject) {
      loadTests(selectedSubject);
    } else {
      loadTests();
    }
  }, [selectedSubject]);

  const loadSubjects = async () => {
    try {
      const response = await axios.get('/tests/subjects');
      setSubjects(response.data);
    } catch (error) {
      toast.error('Ошибка загрузки предметов');
    }
  };

  const loadTests = async (subjectId = null) => {
    try {
      setLoading(true);
      const url = subjectId ? `/tests?subjectId=${subjectId}` : '/tests';
      const response = await axios.get(url);
      setTests(response.data);
    } catch (error) {
      toast.error('Ошибка загрузки тестов');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Тесты</h1>

        {/* Subject Filter */}
        <div className="mb-6 flex flex-wrap gap-3 animate-fade-in">
          <button
            onClick={() => setSelectedSubject(null)}
            className={`px-6 py-2.5 rounded-xl font-medium transition-all duration-300 transform hover:scale-105 ${
              selectedSubject === null
                ? 'bg-gradient-to-r from-primary-600 to-purple-600 text-white shadow-lg'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300 hover:shadow-md'
            }`}
          >
            Все
          </button>
          {subjects.map((subject, index) => (
            <button
              key={subject.id}
              onClick={() => setSelectedSubject(subject.id)}
              className={`px-6 py-2.5 rounded-xl font-medium transition-all duration-300 transform hover:scale-105 animate-scale-in ${
                selectedSubject === subject.id
                  ? 'bg-gradient-to-r from-primary-600 to-purple-600 text-white shadow-lg'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300 hover:shadow-md'
              }`}
              style={{ animationDelay: `${index * 0.05}s`, animationFillMode: 'both' }}
            >
              {subject.name}
            </button>
          ))}
        </div>

        {/* Tests List */}
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          </div>
        ) : tests.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600">Тесты не найдены</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {tests.map((test, index) => (
              <Link
                key={test.id}
                to={`/tests/${test.id}`}
                className="bg-white shadow-lg rounded-xl p-6 card-hover border border-gray-100 animate-scale-in transform transition-all duration-300 group relative overflow-hidden"
                style={{ animationDelay: `${index * 0.1}s`, animationFillMode: 'both' }}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-primary-500/0 via-primary-500/5 to-primary-500/0 transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
                <div className="relative z-10">
                <div className="flex items-center justify-between mb-4">
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    test.isFree ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
                  }`}>
                    {test.isFree ? 'Бесплатно' : 'По подписке'}
                  </span>
                  {test.timeLimit && (
                    <span className="text-sm text-gray-500">{test.timeLimit} мин</span>
                  )}
                </div>
                <h3 className="text-xl font-semibold mb-2">{test.title}</h3>
                {test.subject && (
                  <p className="text-sm text-gray-600 mb-2">{test.subject.name}</p>
                )}
                {test.description && (
                  <p className="text-gray-600 text-sm">{test.description}</p>
                )}
                <div className="mt-4 flex items-center text-primary-600 font-medium group-hover:text-primary-700 transition-colors">
                  <span className="transform group-hover:translate-x-2 transition-transform">Начать тест →</span>
                </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Tests;

