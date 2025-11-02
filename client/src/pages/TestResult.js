import React, { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Navbar from '../components/Navbar';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const TestResult = () => {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [result, setResult] = useState(location.state?.result || null);
  const [loading, setLoading] = useState(!result);

  useEffect(() => {
    if (!result) {
      loadResult();
    }
  }, [id]);

  const loadResult = async () => {
    try {
      setLoading(true);
      
      // Если пользователь авторизован, пытаемся загрузить сохраненный результат
      if (user) {
        try {
          const response = await axios.get(`/users/test-result/${id}`);
          setResult(response.data);
          setLoading(false);
          return;
        } catch (error) {
          // Если результат не найден для авторизованного пользователя, показываем ошибку
          if (error.response?.status === 404) {
            toast.error('Результат не найден');
            navigate('/statistics');
            return;
          }
        }
      }
      
      // Если результат не был передан через state и не найден в БД
      toast.error('Результат не найден');
      navigate(user ? '/statistics' : '/tests');
    } catch (error) {
      console.error('Error loading result:', error);
      toast.error('Ошибка загрузки результата');
      navigate(user ? '/statistics' : '/tests');
    } finally {
      setLoading(false);
    }
  };

  if (loading || !result) {
    return (
      <div>
        <Navbar />
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      </div>
    );
  }

  // Поддержка как сохраненных результатов, так и несохраненных (для гостей)
  const testResult = result.result || result;
  const detailedAnswers = result.detailedAnswers || [];
  const score = result.score || testResult?.score || 0;
  const maxScore = result.maxScore || testResult?.maxScore || 100;
  const correctAnswers = result.correctAnswers || testResult?.correctAnswers || 0;
  const totalQuestions = result.totalQuestions || testResult?.totalQuestions || 0;
  const timeSpent = result.timeSpent || testResult?.timeSpent;
  const saved = result.saved !== undefined ? result.saved : !!testResult;
  
  const percentage = Math.round((score / maxScore) * 100);

  return (
    <div>
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Результаты теста</h1>

        {/* Summary */}
        <div className="bg-gradient-to-br from-white via-primary-50/30 to-purple-50/30 shadow-2xl rounded-2xl p-8 mb-6 border border-primary-100 animate-scale-in relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-primary-200/20 to-purple-200/20 rounded-full blur-3xl"></div>
          <div className="relative z-10 text-center">
            <div className="text-7xl font-bold bg-gradient-to-r from-primary-600 via-purple-600 to-pink-600 bg-clip-text text-transparent mb-4 animate-scale-in animate-float">
              {percentage}%
            </div>
            {!saved && (
              <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                <p className="text-sm text-yellow-800">
                  ⚠️ Результат не сохранен. Войдите в систему, чтобы сохранять результаты тестов и видеть историю.
                </p>
              </div>
            )}
            <p className="text-xl text-gray-600 mb-4">
              Правильных ответов: {correctAnswers} из {totalQuestions}
            </p>
            <p className="text-lg text-gray-600">
              Баллы: {score} / {maxScore}
            </p>
            {timeSpent && (
              <p className="text-sm text-gray-500 mt-2">
                Время: {Math.floor(timeSpent / 60)} мин {timeSpent % 60} сек
              </p>
            )}
          </div>
        </div>

        {/* Detailed Results */}
        <div className="bg-white shadow-2xl rounded-2xl p-6 border border-gray-100 animate-fade-in">
          <h2 className="text-2xl font-semibold mb-6 bg-gradient-to-r from-primary-600 to-purple-600 bg-clip-text text-transparent">Разбор ответов</h2>
          <div className="space-y-6">
            {detailedAnswers.map((answer, index) => (
              <div
                key={index}
                className={`border-2 rounded-xl p-5 transition-all duration-300 transform hover:scale-102 hover:shadow-lg animate-slide-in-left ${
                  answer.isCorrect 
                    ? 'border-green-400 bg-gradient-to-r from-green-50 to-emerald-50 shadow-md' 
                    : 'border-red-400 bg-gradient-to-r from-red-50 to-pink-50 shadow-md'
                }`}
                style={{ animationDelay: `${index * 0.1}s`, animationFillMode: 'both' }}
              >
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-semibold">Вопрос {index + 1}</h3>
                  <span
                    className={`px-3 py-1 rounded text-sm font-medium ${
                      answer.isCorrect ? 'bg-green-200 text-green-800' : 'bg-red-200 text-red-800'
                    }`}
                  >
                    {answer.isCorrect ? 'Правильно' : 'Неправильно'}
                  </span>
                </div>
                <p className="mb-3">{answer.questionText}</p>
                <div className="space-y-2">
                  {answer.options.map((option, optIndex) => (
                    <div
                      key={optIndex}
                      className={`p-2 rounded ${
                        optIndex === answer.correctAnswer
                          ? 'bg-green-200 font-semibold'
                          : optIndex === answer.selectedAnswer && !answer.isCorrect
                          ? 'bg-red-200'
                          : 'bg-gray-100'
                      }`}
                    >
                      {optIndex === answer.correctAnswer && '✓ '}
                      {optIndex === answer.selectedAnswer && !answer.isCorrect && '✗ '}
                      {option.text || option}
                    </div>
                  ))}
                </div>
                {answer.explanation && (
                  <div className="mt-3 p-3 bg-blue-50 rounded">
                    <p className="text-sm text-blue-900">
                      <strong>Объяснение:</strong> {answer.explanation}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="mt-6 flex justify-center space-x-4">
          <button
            onClick={() => navigate('/tests')}
            className="px-6 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
          >
            К тестам
          </button>
          <button
            onClick={() => navigate('/dashboard')}
            className="px-6 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
          >
            В личный кабинет
          </button>
        </div>
      </div>
    </div>
  );
};

export default TestResult;

