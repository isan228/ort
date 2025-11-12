import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Navbar from '../components/Navbar';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const Universities = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [universities, setUniversities] = useState([]);
  const [selectedUniversity, setSelectedUniversity] = useState(null);
  const [selectedSpecialty, setSelectedSpecialty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadUniversities();
  }, []);

  const loadUniversities = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/universities');
      setUniversities(response.data);
    } catch (error) {
      toast.error('Ошибка загрузки университетов');
    } finally {
      setLoading(false);
    }
  };

  const loadUniversityDetails = async (universityId) => {
    try {
      if (user) {
        const response = await axios.get(`/universities/${universityId}`);
        setSelectedUniversity(response.data);
      } else {
        // Для неавторизованных пользователей загружаем без шансов поступления
        const response = await axios.get('/universities');
        const university = response.data.find(u => u.id === universityId);
        setSelectedUniversity(university);
      }
    } catch (error) {
      toast.error('Ошибка загрузки информации об университете');
    }
  };

  const loadSpecialtyDetails = async (universityId, specialtyId) => {
    try {
      if (user) {
        const response = await axios.get(`/universities/${universityId}/specialties/${specialtyId}`);
        setSelectedSpecialty(response.data);
      } else {
        toast.error('Войдите в систему для просмотра детальной информации');
      }
    } catch (error) {
      toast.error('Ошибка загрузки информации о направлении');
    }
  };

  const getChanceColor = (chance) => {
    if (chance >= 80) return 'text-green-600 bg-green-100';
    if (chance >= 50) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const getChanceStatus = (status) => {
    const statusMap = {
      high: { text: 'Высокий', color: 'text-green-600' },
      medium: { text: 'Средний', color: 'text-yellow-600' },
      low: { text: 'Низкий', color: 'text-red-600' }
    };
    return statusMap[status] || statusMap.medium;
  };

  const filteredUniversities = universities.filter(uni =>
    uni.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (uni.nameKg && uni.nameKg.toLowerCase().includes(searchTerm.toLowerCase()))
  );

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

  if (selectedSpecialty) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <button
            onClick={() => setSelectedSpecialty(null)}
            className="mb-6 text-primary-600 hover:text-primary-700 font-medium"
          >
            ← Назад к университету
          </button>

          <div className="bg-white rounded-2xl shadow-xl p-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">{selectedSpecialty.name}</h1>
            
            {selectedSpecialty.university && (
              <p className="text-lg text-gray-600 mb-6">
                {selectedSpecialty.university.name}
              </p>
            )}

            {selectedSpecialty.description && (
              <div className="mb-6">
                <h2 className="text-xl font-semibold mb-2">Описание</h2>
                <p className="text-gray-700">{selectedSpecialty.description}</p>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div className="bg-blue-50 rounded-xl p-6">
                <h3 className="font-semibold text-gray-700 mb-2">Средний балл для поступления</h3>
                <p className="text-3xl font-bold text-blue-600">{selectedSpecialty.averageScore}</p>
              </div>

              {selectedSpecialty.minScore && (
                <div className="bg-yellow-50 rounded-xl p-6">
                  <h3 className="font-semibold text-gray-700 mb-2">Минимальный балл</h3>
                  <p className="text-3xl font-bold text-yellow-600">{selectedSpecialty.minScore}</p>
                </div>
              )}

              {selectedSpecialty.duration && (
                <div className="bg-green-50 rounded-xl p-6">
                  <h3 className="font-semibold text-gray-700 mb-2">Срок обучения</h3>
                  <p className="text-3xl font-bold text-green-600">{selectedSpecialty.duration} лет</p>
                </div>
              )}

              {selectedSpecialty.degree && (
                <div className="bg-purple-50 rounded-xl p-6">
                  <h3 className="font-semibold text-gray-700 mb-2">Степень</h3>
                  <p className="text-xl font-bold text-purple-600">
                    {selectedSpecialty.degree === 'bachelor' ? 'Бакалавр' : 
                     selectedSpecialty.degree === 'master' ? 'Магистр' : 'Доктор'}
                  </p>
                </div>
              )}
            </div>

            {selectedSpecialty.admissionChance && (
              <div className="bg-gradient-to-r from-primary-50 to-purple-50 rounded-xl p-6 border-2 border-primary-200">
                <h2 className="text-2xl font-bold mb-4">Ваш шанс поступления</h2>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-gray-600 mb-1">Ваш балл ОРТ</p>
                    <p className="text-3xl font-bold text-primary-600">{selectedSpecialty.admissionChance.userScore}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-gray-600 mb-1">Шанс поступления</p>
                    <p className={`text-4xl font-bold ${getChanceColor(selectedSpecialty.admissionChance.chance)} px-6 py-3 rounded-xl`}>
                      {selectedSpecialty.admissionChance.chance}%
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-gray-600 mb-1">Требуется</p>
                    <p className="text-3xl font-bold text-gray-700">{selectedSpecialty.admissionChance.requiredScore}</p>
                  </div>
                </div>
                <div className="mt-4">
                  <p className={`text-lg font-semibold ${getChanceStatus(selectedSpecialty.admissionChance.status).color}`}>
                    {getChanceStatus(selectedSpecialty.admissionChance.status).text} шанс
                  </p>
                </div>
              </div>
            )}

            {!selectedSpecialty.admissionChance && user && (
              <div className="bg-yellow-50 border-2 border-yellow-200 rounded-xl p-6">
                <p className="text-yellow-800">
                  Для расчета шанса поступления необходимо иметь активную подписку и пройти основной ОРТ тест.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (selectedUniversity) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <button
            onClick={() => {
              setSelectedUniversity(null);
              setSelectedSpecialty(null);
            }}
            className="mb-6 text-primary-600 hover:text-primary-700 font-medium"
          >
            ← Назад к списку
          </button>

          <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
            {selectedUniversity.photo && (
              <div className="h-64 bg-gradient-to-r from-primary-400 to-purple-500 relative overflow-hidden">
                <img
                  src={selectedUniversity.photo}
                  alt={selectedUniversity.name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.target.style.display = 'none';
                  }}
                />
              </div>
            )}

            <div className="p-8">
              <h1 className="text-4xl font-bold text-gray-900 mb-4">{selectedUniversity.name}</h1>
              
              {selectedUniversity.description && (
                <p className="text-gray-700 mb-6 text-lg">{selectedUniversity.description}</p>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                {selectedUniversity.address && (
                  <div className="flex items-start">
                    <span className="text-2xl mr-3">📍</span>
                    <div>
                      <p className="font-semibold text-gray-700">Адрес</p>
                      <p className="text-gray-600">{selectedUniversity.address}</p>
                    </div>
                  </div>
                )}
                {selectedUniversity.website && (
                  <div className="flex items-start">
                    <span className="text-2xl mr-3">🌐</span>
                    <div>
                      <p className="font-semibold text-gray-700">Сайт</p>
                      <a href={selectedUniversity.website} target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:underline">
                        {selectedUniversity.website}
                      </a>
                    </div>
                  </div>
                )}
                {selectedUniversity.phone && (
                  <div className="flex items-start">
                    <span className="text-2xl mr-3">📞</span>
                    <div>
                      <p className="font-semibold text-gray-700">Телефон</p>
                      <p className="text-gray-600">{selectedUniversity.phone}</p>
                    </div>
                  </div>
                )}
                {selectedUniversity.email && (
                  <div className="flex items-start">
                    <span className="text-2xl mr-3">✉️</span>
                    <div>
                      <p className="font-semibold text-gray-700">Email</p>
                      <p className="text-gray-600">{selectedUniversity.email}</p>
                    </div>
                  </div>
                )}
              </div>

              <h2 className="text-2xl font-bold text-gray-900 mb-6">Направления подготовки</h2>
              
              {selectedUniversity.specialties && selectedUniversity.specialties.length > 0 ? (
                <div className="space-y-4">
                  {selectedUniversity.specialties.map((specialty) => {
                    const chance = selectedUniversity.admissionChances?.find(
                      c => c.specialtyId === specialty.id
                    );

                    return (
                      <div
                        key={specialty.id}
                        className="border-2 border-gray-200 rounded-xl p-6 hover:border-primary-300 hover:shadow-lg transition-all cursor-pointer"
                        onClick={() => loadSpecialtyDetails(selectedUniversity.id, specialty.id)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <h3 className="text-xl font-semibold text-gray-900 mb-2">{specialty.name}</h3>
                            {specialty.description && (
                              <p className="text-gray-600 mb-3 line-clamp-2">{specialty.description}</p>
                            )}
                            <div className="flex items-center gap-4">
                              <div>
                                <span className="text-sm text-gray-500">Средний балл: </span>
                                <span className="font-semibold text-primary-600">{specialty.averageScore}</span>
                              </div>
                              {specialty.duration && (
                                <div>
                                  <span className="text-sm text-gray-500">Срок: </span>
                                  <span className="font-semibold text-gray-700">{specialty.duration} лет</span>
                                </div>
                              )}
                            </div>
                          </div>
                          {chance && (
                            <div className="ml-4 text-center">
                              <p className="text-sm text-gray-500 mb-1">Шанс</p>
                              <p className={`text-2xl font-bold ${getChanceColor(chance.chance)} px-4 py-2 rounded-lg`}>
                                {chance.chance}%
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-gray-500">Направления пока не добавлены</p>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4 bg-gradient-to-r from-primary-600 to-purple-600 bg-clip-text text-transparent">
            Университеты Кыргызстана
          </h1>
          <p className="text-lg text-gray-600">
            Выберите университет и узнайте о направлениях подготовки и шансах поступления
          </p>
        </div>

        <div className="mb-6">
          <input
            type="text"
            placeholder="Поиск университетов..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full max-w-md mx-auto block px-6 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          />
        </div>

        {filteredUniversities.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600">Университеты не найдены</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredUniversities.map((university) => (
              <div
                key={university.id}
                onClick={() => loadUniversityDetails(university.id)}
                className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-all cursor-pointer transform hover:scale-105"
              >
                {university.photo ? (
                  <div className="h-48 bg-gradient-to-r from-primary-400 to-purple-500 relative overflow-hidden">
                    <img
                      src={university.photo}
                      alt={university.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.style.display = 'none';
                      }}
                    />
                  </div>
                ) : (
                  <div className="h-48 bg-gradient-to-r from-primary-400 to-purple-500 flex items-center justify-center">
                    <span className="text-6xl text-white opacity-50">🏛️</span>
                  </div>
                )}
                <div className="p-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{university.name}</h3>
                  {university.description && (
                    <p className="text-gray-600 text-sm mb-4 line-clamp-2">{university.description}</p>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">
                      {university.specialties?.length || 0} направлений
                    </span>
                    <span className="text-primary-600 font-semibold">Подробнее →</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Universities;

