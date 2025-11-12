import React, { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';

const AdminUniversities = () => {
  const [universities, setUniversities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showSpecialtyModal, setShowSpecialtyModal] = useState(false);
  const [selectedUniversity, setSelectedUniversity] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    nameKg: '',
    description: '',
    photo: '',
    address: '',
    website: '',
    phone: '',
    email: ''
  });
  const [specialtyFormData, setSpecialtyFormData] = useState({
    name: '',
    nameKg: '',
    description: '',
    averageScore: '',
    minScore: '',
    duration: '',
    degree: 'bachelor'
  });

  useEffect(() => {
    loadUniversities();
  }, []);

  const loadUniversities = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/admin/universities');
      setUniversities(response.data);
    } catch (error) {
      toast.error('Ошибка загрузки университетов');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (selectedUniversity) {
        await axios.put(`/admin/universities/${selectedUniversity.id}`, formData);
        toast.success('Университет обновлен');
      } else {
        await axios.post('/admin/universities', formData);
        toast.success('Университет создан');
      }
      setShowModal(false);
      setFormData({ name: '', nameKg: '', description: '', photo: '', address: '', website: '', phone: '', email: '' });
      setSelectedUniversity(null);
      loadUniversities();
    } catch (error) {
      toast.error('Ошибка сохранения университета');
    }
  };

  const handleSpecialtySubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`/admin/universities/${selectedUniversity.id}/specialties`, specialtyFormData);
      toast.success('Направление создано');
      setShowSpecialtyModal(false);
      setSpecialtyFormData({ name: '', nameKg: '', description: '', averageScore: '', minScore: '', duration: '', degree: 'bachelor' });
      loadUniversities();
    } catch (error) {
      toast.error('Ошибка создания направления');
    }
  };

  const handleEdit = (university) => {
    setSelectedUniversity(university);
    setFormData({
      name: university.name,
      nameKg: university.nameKg || '',
      description: university.description || '',
      photo: university.photo || '',
      address: university.address || '',
      website: university.website || '',
      phone: university.phone || '',
      email: university.email || ''
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Вы уверены, что хотите удалить этот университет?')) return;
    try {
      await axios.delete(`/admin/universities/${id}`);
      toast.success('Университет удален');
      loadUniversities();
    } catch (error) {
      toast.error('Ошибка удаления университета');
    }
  };

  const handleDeleteSpecialty = async (id) => {
    if (!window.confirm('Вы уверены, что хотите удалить это направление?')) return;
    try {
      await axios.delete(`/admin/specialties/${id}`);
      toast.success('Направление удалено');
      loadUniversities();
    } catch (error) {
      toast.error('Ошибка удаления направления');
    }
  };

  if (loading) {
    return <div className="text-center py-12">Загрузка...</div>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Университеты</h2>
        <button
          onClick={() => {
            setSelectedUniversity(null);
            setFormData({ name: '', nameKg: '', description: '', photo: '', address: '', website: '', phone: '', email: '' });
            setShowModal(true);
          }}
          className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700"
        >
          Добавить университет
        </button>
      </div>

      <div className="space-y-6">
        {universities.map((university) => (
          <div key={university.id} className="bg-white shadow-lg rounded-xl p-6">
            <div className="flex justify-between items-start mb-4">
              <div className="flex-1">
                <h3 className="text-xl font-bold text-gray-900 mb-2">{university.name}</h3>
                {university.nameKg && (
                  <p className="text-gray-600 mb-2">{university.nameKg}</p>
                )}
                {university.description && (
                  <p className="text-gray-700 mb-4">{university.description}</p>
                )}
                <div className="grid grid-cols-2 gap-4 text-sm">
                  {university.address && (
                    <div>
                      <span className="font-semibold">Адрес:</span> {university.address}
                    </div>
                  )}
                  {university.website && (
                    <div>
                      <span className="font-semibold">Сайт:</span>{' '}
                      <a href={university.website} target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:underline">
                        {university.website}
                      </a>
                    </div>
                  )}
                  {university.phone && (
                    <div>
                      <span className="font-semibold">Телефон:</span> {university.phone}
                    </div>
                  )}
                  {university.email && (
                    <div>
                      <span className="font-semibold">Email:</span> {university.email}
                    </div>
                  )}
                </div>
              </div>
              <div className="flex space-x-2 ml-4">
                <button
                  onClick={() => handleEdit(university)}
                  className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600"
                >
                  Редактировать
                </button>
                <button
                  onClick={() => handleDelete(university.id)}
                  className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
                >
                  Удалить
                </button>
              </div>
            </div>

            <div className="mt-6">
              <div className="flex justify-between items-center mb-4">
                <h4 className="text-lg font-semibold">Направления ({university.specialties?.length || 0})</h4>
                <button
                  onClick={() => {
                    setSelectedUniversity(university);
                    setSpecialtyFormData({ name: '', nameKg: '', description: '', averageScore: '', minScore: '', duration: '', degree: 'bachelor' });
                    setShowSpecialtyModal(true);
                  }}
                  className="bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600 text-sm"
                >
                  Добавить направление
                </button>
              </div>
              {university.specialties && university.specialties.length > 0 ? (
                <div className="space-y-2">
                  {university.specialties.map((specialty) => (
                    <div key={specialty.id} className="bg-gray-50 rounded-lg p-4 flex justify-between items-center">
                      <div>
                        <p className="font-semibold">{specialty.name}</p>
                        <p className="text-sm text-gray-600">
                          Средний балл: {specialty.averageScore} | 
                          {specialty.minScore && ` Мин: ${specialty.minScore}`} | 
                          {specialty.duration && ` Срок: ${specialty.duration} лет`}
                        </p>
                      </div>
                      <button
                        onClick={() => handleDeleteSpecialty(specialty.id)}
                        className="bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600 text-sm"
                      >
                        Удалить
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-sm">Направления не добавлены</p>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* University Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-8 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-2xl font-bold mb-6">
              {selectedUniversity ? 'Редактировать университет' : 'Добавить университет'}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Название (RU)</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Название (KG)</label>
                <input
                  type="text"
                  value={formData.nameKg}
                  onChange={(e) => setFormData({ ...formData, nameKg: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Описание</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg"
                  rows="3"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Фото (URL)</label>
                <input
                  type="text"
                  value={formData.photo}
                  onChange={(e) => setFormData({ ...formData, photo: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Адрес</label>
                  <input
                    type="text"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Сайт</label>
                  <input
                    type="text"
                    value={formData.website}
                    onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Телефон</label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg"
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-4 mt-6">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border rounded-lg hover:bg-gray-50"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                >
                  Сохранить
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Specialty Modal */}
      {showSpecialtyModal && selectedUniversity && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-8 max-w-2xl w-full mx-4">
            <h3 className="text-2xl font-bold mb-6">Добавить направление</h3>
            <form onSubmit={handleSpecialtySubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Название</label>
                <input
                  type="text"
                  required
                  value={specialtyFormData.name}
                  onChange={(e) => setSpecialtyFormData({ ...specialtyFormData, name: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Средний балл</label>
                <input
                  type="number"
                  required
                  min="0"
                  max="300"
                  step="0.01"
                  value={specialtyFormData.averageScore}
                  onChange={(e) => setSpecialtyFormData({ ...specialtyFormData, averageScore: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Минимальный балл</label>
                  <input
                    type="number"
                    min="0"
                    max="300"
                    step="0.01"
                    value={specialtyFormData.minScore}
                    onChange={(e) => setSpecialtyFormData({ ...specialtyFormData, minScore: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Срок обучения (лет)</label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={specialtyFormData.duration}
                    onChange={(e) => setSpecialtyFormData({ ...specialtyFormData, duration: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Описание</label>
                <textarea
                  value={specialtyFormData.description}
                  onChange={(e) => setSpecialtyFormData({ ...specialtyFormData, description: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg"
                  rows="3"
                />
              </div>
              <div className="flex justify-end space-x-4 mt-6">
                <button
                  type="button"
                  onClick={() => setShowSpecialtyModal(false)}
                  className="px-4 py-2 border rounded-lg hover:bg-gray-50"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                >
                  Сохранить
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminUniversities;

