import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Navbar from '../components/Navbar';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

const TestDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [test, setTest] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [timeLeft, setTimeLeft] = useState(null);
  const [startTime, setStartTime] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTest();
  }, [id]);

  useEffect(() => {
    if (test && test.timeLimit) {
      setTimeLeft(test.timeLimit * 60); // конвертируем минуты в секунды
    }
  }, [test]);

  useEffect(() => {
    if (timeLeft !== null && timeLeft > 0) {
      const timer = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
      return () => clearInterval(timer);
    } else if (timeLeft === 0) {
      handleSubmit();
    }
  }, [timeLeft]);

  const loadTest = async () => {
    try {
      setLoading(true);
      
      // Сохраняем оригинальный заголовок авторизации
      const originalAuth = axios.defaults.headers.common['Authorization'];
      
      // Сначала загружаем информацию о тесте без авторизации
      let testInfo = null;
      let isFreeTest = false;
      
      // Убираем заголовок авторизации для проверки теста
      delete axios.defaults.headers.common['Authorization'];
      
      try {
        const testResponse = await axios.get(`/tests/${id}`);
        testInfo = testResponse.data;
        isFreeTest = testInfo.isFree === true;
      } catch (error) {
        console.warn('Не удалось загрузить информацию о тесте:', error);
      }
      
      // Если тест бесплатный или пользователь не авторизован, загружаем без токена
      // Если тест платный и пользователь авторизован, используем токен
      if (isFreeTest || !user) {
        // Для бесплатных тестов или незарегистрированных пользователей - без токена
        delete axios.defaults.headers.common['Authorization'];
      } else {
        // Для платных тестов авторизованных пользователей - с токеном
        if (originalAuth) {
          axios.defaults.headers.common['Authorization'] = originalAuth;
        }
      }
      
      // Загружаем вопросы
      const response = await axios.get(`/tests/${id}/questions`);
      setTest(response.data.test);
      setQuestions(response.data.questions);
      setStartTime(new Date());
      
      // Инициализация ответов
      const initialAnswers = {};
      response.data.questions.forEach((q) => {
        initialAnswers[q.id] = null;
      });
      setAnswers(initialAnswers);
      
      // Восстанавливаем заголовок если был
      if (originalAuth) {
        axios.defaults.headers.common['Authorization'] = originalAuth;
      }
    } catch (error) {
      // Восстанавливаем заголовок в случае ошибки
      const token = localStorage.getItem('token');
      if (token) {
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      }
      
      if (error.response?.status === 401) {
        // Если ошибка 401, проверяем, может быть тест бесплатный и просто не нужен токен
        delete axios.defaults.headers.common['Authorization'];
        try {
          const retryResponse = await axios.get(`/tests/${id}/questions`);
          setTest(retryResponse.data.test);
          setQuestions(retryResponse.data.questions);
          setStartTime(new Date());
          
          const initialAnswers = {};
          retryResponse.data.questions.forEach((q) => {
            initialAnswers[q.id] = null;
          });
          setAnswers(initialAnswers);
          return; // Успешно загрузили
        } catch (retryError) {
          // Если и без токена не работает, значит нужна авторизация
          if (retryError.response?.status === 401) {
            toast.error('Для прохождения этого теста нужно войти в систему');
            navigate('/login');
          } else if (retryError.response?.status === 403) {
            toast.error('Требуется подписка для прохождения этого теста');
            navigate('/subscription');
          } else {
            toast.error('Ошибка загрузки теста');
            navigate('/');
          }
        }
      } else if (error.response?.status === 403) {
        toast.error('Требуется подписка для прохождения этого теста');
        navigate('/subscription');
      } else {
        toast.error('Ошибка загрузки теста');
        console.error('Ошибка загрузки теста:', error);
        navigate('/');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerChange = (questionId, answerIndex) => {
    setAnswers({
      ...answers,
      [questionId]: answerIndex
    });
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSubmit = async () => {
    try {
      const timeSpent = Math.floor((new Date() - startTime) / 1000);
      const answersArray = Object.entries(answers).map(([questionId, selectedAnswer]) => ({
        questionId,
        selectedAnswer: selectedAnswer !== null ? selectedAnswer : -1
      }));

      const response = await axios.post(`/tests/${id}/submit`, {
        answers: answersArray,
        timeSpent
      });

      if (!response.data.saved && !user) {
        toast('Результат не сохранен. Войдите в систему, чтобы сохранять результаты тестов.', {
          icon: 'ℹ️',
          duration: 4000
        });
      }

      navigate(`/tests/${id}/result`, { state: { result: response.data } });
    } catch (error) {
      if (error.response?.status === 401) {
        toast.error('Для сохранения результатов нужно войти в систему');
        navigate('/login');
      } else {
        toast.error('Ошибка отправки ответов');
      }
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

  if (questions.length === 0) {
    return (
      <div>
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <p>Вопросы не найдены</p>
        </div>
      </div>
    );
  }

  const question = questions[currentQuestion];
  const progress = ((currentQuestion + 1) / questions.length) * 100;

  return (
    <div>
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="bg-gradient-to-r from-white to-gray-50 shadow-xl rounded-2xl p-6 mb-6 border border-gray-100 animate-scale-in relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-primary-100/30 to-purple-100/30 rounded-full blur-2xl"></div>
          <div className="relative z-10">
            <div className="flex justify-between items-center mb-4">
              <h1 className="text-2xl font-bold bg-gradient-to-r from-primary-600 to-purple-600 bg-clip-text text-transparent">{test.title}</h1>
              {timeLeft !== null && (
                <div className="text-xl font-semibold bg-gradient-to-r from-primary-600 to-purple-600 bg-clip-text text-transparent animate-pulse">
                  {formatTime(timeLeft)}
                </div>
              )}
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden shadow-inner">
              <div
                className="bg-gradient-to-r from-primary-600 via-purple-600 to-pink-600 h-3 rounded-full transition-all duration-500 relative overflow-hidden"
                style={{ width: `${progress}%` }}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer"></div>
              </div>
            </div>
            <p className="mt-3 text-sm text-gray-600 font-medium">
              Вопрос {currentQuestion + 1} из {questions.length}
            </p>
          </div>
        </div>

        {/* Question */}
        <div className="bg-white shadow-2xl rounded-2xl p-6 mb-6 border border-gray-100 animate-fade-in relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary-600 via-purple-600 to-pink-600"></div>
          <h2 className="text-xl font-semibold mb-6 text-gray-900">{question.questionText}</h2>
          {question.questionImage && (
            <img src={question.questionImage} alt="Question" className="mb-6 max-w-full rounded-xl shadow-lg animate-scale-in" />
          )}
          <div className="space-y-3">
            {question.options.map((option, index) => (
              <label
                key={index}
                className={`flex items-center p-4 border-2 rounded-xl cursor-pointer transition-all duration-300 transform hover:scale-105 ${
                  answers[question.id] === index
                    ? 'border-primary-600 bg-gradient-to-r from-primary-50 to-purple-50 shadow-lg scale-105'
                    : 'border-gray-300 hover:border-primary-400 hover:bg-gray-50 hover:shadow-md'
                } animate-slide-in-left`}
                style={{ animationDelay: `${index * 0.05}s`, animationFillMode: 'both' }}
              >
                <input
                  type="radio"
                  name={`question-${question.id}`}
                  value={index}
                  checked={answers[question.id] === index}
                  onChange={() => handleAnswerChange(question.id, index)}
                  className="mr-4 w-5 h-5 text-primary-600 focus:ring-2 focus:ring-primary-500 cursor-pointer"
                />
                <span className="text-gray-800 font-medium">{option.text || option}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Navigation */}
        <div className="flex justify-between animate-fade-in">
          <button
            onClick={() => setCurrentQuestion(Math.max(0, currentQuestion - 1))}
            disabled={currentQuestion === 0}
            className="px-8 py-3 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed font-semibold transition-all duration-300 transform hover:scale-105 shadow-md hover:shadow-lg"
          >
            ← Назад
          </button>
          {currentQuestion === questions.length - 1 ? (
            <button
              onClick={handleSubmit}
              className="px-8 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl hover:from-green-700 hover:to-emerald-700 font-semibold transition-all duration-300 transform hover:scale-105 shadow-xl hover:shadow-2xl animate-pulse-glow"
            >
              ✓ Завершить тест
            </button>
          ) : (
            <button
              onClick={() => setCurrentQuestion(Math.min(questions.length - 1, currentQuestion + 1))}
              className="px-8 py-3 bg-gradient-to-r from-primary-600 to-purple-600 text-white rounded-xl hover:from-primary-700 hover:to-purple-700 font-semibold transition-all duration-300 transform hover:scale-105 shadow-xl hover:shadow-2xl"
            >
              Следующий →
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default TestDetail;

