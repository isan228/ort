import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';

const AdminTests = () => {
  const navigate = useNavigate();
  const [tests, setTests] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [uploadMode, setUploadMode] = useState('manual'); // 'manual' или 'pdf'
  const [pdfFile, setPdfFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({
    subjectId: '',
    title: '',
    description: '',
    isFree: false,
    timeLimit: '',
    maxScore: 100
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [testsRes, subjectsRes] = await Promise.all([
        axios.get('/tests'),
        axios.get('/tests/subjects')
      ]);
      setTests(testsRes.data);
      setSubjects(subjectsRes.data);
    } catch (error) {
      toast.error('Ошибка загрузки данных');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post('/admin/tests', {
        ...formData,
        timeLimit: formData.timeLimit ? parseInt(formData.timeLimit) : null
      });
      toast.success('Тест создан');
      setShowModal(false);
      setFormData({ subjectId: '', title: '', description: '', isFree: false, timeLimit: '', maxScore: 100 });
      loadData();
    } catch (error) {
      toast.error('Ошибка создания теста');
    }
  };

  const handlePdfUpload = async (e) => {
    e.preventDefault();
    
    if (!pdfFile) {
      toast.error('Выберите PDF файл');
      return;
    }

    if (!formData.subjectId || !formData.title) {
      toast.error('Заполните предмет и название теста');
      return;
    }

    setUploading(true);
    
    try {
      const formDataToSend = new FormData();
      formDataToSend.append('pdf', pdfFile);
      formDataToSend.append('subjectId', formData.subjectId);
      formDataToSend.append('title', formData.title);
      formDataToSend.append('description', formData.description || '');
      formDataToSend.append('isFree', formData.isFree);
      formDataToSend.append('timeLimit', formData.timeLimit || '');
      formDataToSend.append('maxScore', formData.maxScore || 100);

      const response = await axios.post('/admin/tests/upload-pdf', formDataToSend, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      toast.success(response.data.message || `Тест создан с ${response.data.questions?.length || 0} вопросами`);
      setShowModal(false);
      setPdfFile(null);
      setFormData({ subjectId: '', title: '', description: '', isFree: false, timeLimit: '', maxScore: 100 });
      setUploadMode('manual');
      loadData();
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Ошибка загрузки PDF';
      toast.error(errorMessage);
      if (error.response?.data?.pdfText) {
        console.log('PDF текст (первые 500 символов):', error.response.data.pdfText);
      }
    } finally {
      setUploading(false);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.type !== 'application/pdf') {
        toast.error('Выберите PDF файл');
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        toast.error('Размер файла не должен превышать 10MB');
        return;
      }
      setPdfFile(file);
    }
  };

  const handleEdit = (testId) => {
    navigate(`/admin/tests/${testId}/edit`);
  };

  if (loading) {
    return <div className="flex justify-center py-12">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
    </div>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold">Тесты</h2>
        <button
          onClick={() => setShowModal(true)}
          className="bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700"
        >
          Добавить тест
        </button>
      </div>

      <div className="bg-white shadow rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Название</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Предмет</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Тип</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Время</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Действия</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {tests.map((test) => (
              <tr key={test.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {test.title}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {test.subject?.name || '—'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <span className={`px-2 py-1 rounded text-xs ${
                    test.isFree ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
                  }`}>
                    {test.isFree ? 'Бесплатно' : 'По подписке'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {test.timeLimit ? `${test.timeLimit} мин` : '—'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <button
                    onClick={() => handleEdit(test.id)}
                    className="text-primary-600 hover:text-primary-700"
                  >
                    Редактировать
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold">Добавить тест</h3>
              <button
                onClick={() => {
                  setShowModal(false);
                  setUploadMode('manual');
                  setPdfFile(null);
                  setFormData({ subjectId: '', title: '', description: '', isFree: false, timeLimit: '', maxScore: 100 });
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>

            {/* Выбор способа добавления */}
            <div className="mb-6 flex gap-4 border-b pb-4">
              <button
                type="button"
                onClick={() => {
                  setUploadMode('manual');
                  setPdfFile(null);
                }}
                className={`px-4 py-2 rounded-md font-medium transition-all ${
                  uploadMode === 'manual'
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Ручное добавление
              </button>
              <button
                type="button"
                onClick={() => setUploadMode('pdf')}
                className={`px-4 py-2 rounded-md font-medium transition-all ${
                  uploadMode === 'pdf'
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Загрузить из PDF
              </button>
            </div>

            {uploadMode === 'manual' ? (
              <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Предмет</label>
                  <select
                    required
                    value={formData.subjectId}
                    onChange={(e) => setFormData({ ...formData, subjectId: e.target.value })}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                  >
                    <option value="">Выберите предмет</option>
                    {subjects.map((subject) => (
                      <option key={subject.id} value={subject.id}>{subject.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Название</label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Описание</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                    rows={3}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Время лимит (минут)</label>
                  <input
                    type="number"
                    value={formData.timeLimit}
                    onChange={(e) => setFormData({ ...formData, timeLimit: e.target.value })}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Максимальный балл</label>
                  <input
                    type="number"
                    value={formData.maxScore}
                    onChange={(e) => setFormData({ ...formData, maxScore: parseInt(e.target.value) })}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                  />
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="isFree"
                    checked={formData.isFree}
                    onChange={(e) => setFormData({ ...formData, isFree: e.target.checked })}
                    className="mr-2"
                  />
                  <label htmlFor="isFree" className="text-sm text-gray-700">
                    Бесплатный тест
                  </label>
                </div>
              </div>
                <div className="mt-6 flex justify-end space-x-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false);
                      setFormData({ subjectId: '', title: '', description: '', isFree: false, timeLimit: '', maxScore: 100 });
                    }}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
                  >
                    Отмена
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
                  >
                    Создать
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={handlePdfUpload}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Загрузить PDF файл</label>
                    <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md hover:border-primary-400 transition-colors">
                      <div className="space-y-1 text-center">
                        <svg
                          className="mx-auto h-12 w-12 text-gray-400"
                          stroke="currentColor"
                          fill="none"
                          viewBox="0 0 48 48"
                          aria-hidden="true"
                        >
                          <path
                            d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                            strokeWidth={2}
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                        <div className="flex text-sm text-gray-600">
                          <label
                            htmlFor="pdf-upload"
                            className="relative cursor-pointer bg-white rounded-md font-medium text-primary-600 hover:text-primary-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-primary-500"
                          >
                            <span>Выберите файл</span>
                            <input
                              id="pdf-upload"
                              name="pdf-upload"
                              type="file"
                              accept=".pdf,application/pdf"
                              className="sr-only"
                              onChange={handleFileChange}
                            />
                          </label>
                          <p className="pl-1">или перетащите сюда</p>
                        </div>
                        <p className="text-xs text-gray-500">PDF до 10MB</p>
                        {pdfFile && (
                          <p className="text-sm text-green-600 mt-2">
                            ✓ Выбран: {pdfFile.name}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Предмет *</label>
                    <select
                      required
                      value={formData.subjectId}
                      onChange={(e) => setFormData({ ...formData, subjectId: e.target.value })}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                    >
                      <option value="">Выберите предмет</option>
                      {subjects.map((subject) => (
                        <option key={subject.id} value={subject.id}>{subject.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Название теста *</label>
                    <input
                      type="text"
                      required
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                      placeholder="Например: Тест по математике №1"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Описание</label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                      rows={2}
                      placeholder="Описание теста (необязательно)"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Время лимит (минут)</label>
                      <input
                        type="number"
                        value={formData.timeLimit}
                        onChange={(e) => setFormData({ ...formData, timeLimit: e.target.value })}
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                        placeholder="Необязательно"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Максимальный балл</label>
                      <input
                        type="number"
                        value={formData.maxScore}
                        onChange={(e) => setFormData({ ...formData, maxScore: parseInt(e.target.value) || 100 })}
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                      />
                    </div>
                  </div>

                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="isFreePdf"
                      checked={formData.isFree}
                      onChange={(e) => setFormData({ ...formData, isFree: e.target.checked })}
                      className="mr-2"
                    />
                    <label htmlFor="isFreePdf" className="text-sm text-gray-700">
                      Бесплатный тест
                    </label>
                  </div>

                  <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
                    <p className="text-sm text-blue-800">
                      <strong>Формат PDF:</strong> Вопросы должны быть пронумерованы (1., 2., 3...), 
                      варианты ответов должны начинаться с букв (A., B., C., D.) или цифр (1., 2., 3., 4.). 
                      Правильный ответ можно пометить символом * или словом "правильный"/"верный".
                    </p>
                  </div>
                </div>

                <div className="mt-6 flex justify-end space-x-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false);
                      setPdfFile(null);
                      setFormData({ subjectId: '', title: '', description: '', isFree: false, timeLimit: '', maxScore: 100 });
                      setUploadMode('manual');
                    }}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
                    disabled={uploading}
                  >
                    Отмена
                  </button>
                  <button
                    type="submit"
                    disabled={uploading || !pdfFile}
                    className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {uploading ? 'Загрузка...' : 'Загрузить и создать тест'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminTests;

