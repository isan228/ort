import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Navbar from '../components/Navbar';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

const Ranking = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [rankings, setRankings] = useState([]);
  const [type, setType] = useState('school');
  const [loading, setLoading] = useState(true);
  const [subjects, setSubjects] = useState([]);
  const [filters, setFilters] = useState({
    subjectId: '',
    school: '',
    region: ''
  });
  const [filterOptions, setFilterOptions] = useState({
    schools: [],
    regions: []
  });

  useEffect(() => {
    loadSubjects();
    loadFilterOptions();
  }, []);

  useEffect(() => {
    loadRankings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [type, filters.subjectId, filters.school, filters.region]);

  const loadSubjects = async () => {
    try {
      const response = await axios.get('/tests/subjects');
      setSubjects(response.data);
    } catch (error) {
      console.error('Error loading subjects:', error);
    }
  };

  const loadFilterOptions = async () => {
    try {
      const response = await axios.get('/users/ranking/filters');
      setFilterOptions(response.data);
    } catch (error) {
      console.error('Error loading filter options:', error);
    }
  };

  const loadRankings = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        type: type
      });

      if (filters.subjectId) {
        params.append('subjectId', filters.subjectId);
      }
      if (filters.school) {
        params.append('school', filters.school);
      }
      if (filters.region) {
        params.append('region', filters.region);
      }

      const response = await axios.get(`/users/ranking?${params.toString()}`);
      setRankings(response.data);
    } catch (error) {
      toast.error('Ошибка загрузки рейтинга');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (filterName, value) => {
    setFilters(prev => ({
      ...prev,
      [filterName]: value
    }));
  };

  const clearFilters = () => {
    setFilters({
      subjectId: '',
      school: '',
      region: ''
    });
  };

  return (
    <div>
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">{t('ranking.title')}</h1>

        {/* Type Selector */}
        <div className="mb-6 flex flex-wrap gap-3 animate-fade-in">
          <button
            onClick={() => setType('school')}
            className={`px-6 py-2.5 rounded-xl font-medium transition-all duration-300 transform hover:scale-105 ${
              type === 'school'
                ? 'bg-gradient-to-r from-primary-600 to-purple-600 text-white shadow-lg'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300 hover:shadow-md'
            }`}
          >
            {t('ranking.bySchool')}
          </button>
          <button
            onClick={() => setType('region')}
            className={`px-6 py-2.5 rounded-xl font-medium transition-all duration-300 transform hover:scale-105 ${
              type === 'region'
                ? 'bg-gradient-to-r from-primary-600 to-purple-600 text-white shadow-lg'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300 hover:shadow-md'
            }`}
          >
            {t('ranking.byRegion')}
          </button>
          <button
            onClick={() => setType('country')}
            className={`px-6 py-2.5 rounded-xl font-medium transition-all duration-300 transform hover:scale-105 ${
              type === 'country'
                ? 'bg-gradient-to-r from-primary-600 to-purple-600 text-white shadow-lg'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300 hover:shadow-md'
            }`}
          >
            {t('ranking.byCountry')}
          </button>
        </div>

        {/* Filters */}
        <div className="mb-6 bg-white shadow-xl rounded-2xl p-6 border border-gray-100 animate-scale-in">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">{t('ranking.filters')}</h2>
            <button
              onClick={clearFilters}
              className="text-sm text-primary-600 hover:text-primary-700 font-medium"
            >
              {t('ranking.reset')}
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Subject Filter */}
            <div>
              <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-2">
                {t('ranking.subject')}
              </label>
              <select
                id="subject"
                value={filters.subjectId}
                onChange={(e) => handleFilterChange('subjectId', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="">{t('ranking.allSubjects')}</option>
                {subjects.map((subject) => (
                  <option key={subject.id} value={subject.id}>
                    {subject.name}
                  </option>
                ))}
              </select>
            </div>

            {/* School Filter */}
            <div>
              <label htmlFor="school" className="block text-sm font-medium text-gray-700 mb-2">
                {t('ranking.school')}
              </label>
              <select
                id="school"
                value={filters.school}
                onChange={(e) => handleFilterChange('school', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                disabled={type === 'school'}
              >
                <option value="">{t('ranking.allSchools')}</option>
                {filterOptions.schools.map((school) => (
                  <option key={school} value={school}>
                    {school}
                  </option>
                ))}
              </select>
            </div>

            {/* Region Filter */}
            <div>
              <label htmlFor="region" className="block text-sm font-medium text-gray-700 mb-2">
                {t('ranking.region')}
              </label>
              <select
                id="region"
                value={filters.region}
                onChange={(e) => handleFilterChange('region', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                disabled={type === 'region'}
              >
                <option value="">{t('ranking.allRegions')}</option>
                {filterOptions.regions.map((region) => (
                  <option key={region} value={region}>
                    {region}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Rankings Table */}
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          </div>
        ) : rankings.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600">{t('ranking.empty')}</p>
          </div>
        ) : (
          <div className="bg-white shadow-xl rounded-2xl overflow-hidden border border-gray-100 animate-fade-in">
            <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('ranking.place')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('ranking.participant')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('ranking.school')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('ranking.region')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('ranking.averageScore')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('ranking.tests')}
                    </th>
                  </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {rankings.map((ranking, index) => (
                  <tr
                    key={ranking.userId}
                    className={`transition-all duration-300 hover:bg-gray-50 hover:shadow-md ${
                      ranking.userId === user?.id 
                        ? 'bg-gradient-to-r from-primary-50 to-purple-50 border-l-4 border-primary-600 shadow-sm' 
                        : ''
                    } animate-slide-in-left`}
                    style={{ animationDelay: `${index * 0.05}s`, animationFillMode: 'both' }}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {index + 1 === 1 && <span className="text-yellow-500 text-xl">🥇</span>}
                        {index + 1 === 2 && <span className="text-gray-400 text-xl">🥈</span>}
                        {index + 1 === 3 && <span className="text-orange-400 text-xl">🥉</span>}
                        <span className="ml-2 font-semibold">{index + 1}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {ranking.user?.photo && (
                          <img
                            src={ranking.user.photo}
                            alt=""
                            className="h-10 w-10 rounded-full mr-3"
                          />
                        )}
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {ranking.user?.firstName} {ranking.user?.lastName}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {ranking.user?.school || '—'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {ranking.user?.region || '—'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-semibold text-primary-600">
                        {Math.round(ranking.avgScore || 0)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {ranking.totalTests || 0}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Ranking;

