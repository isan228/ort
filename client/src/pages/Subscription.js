import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Navbar from '../components/Navbar';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

const Subscription = () => {
  const { user } = useAuth();
  const { language, t } = useLanguage();
  const [subscription, setSubscription] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    school: '',
    region: ''
  });

  useEffect(() => {
    loadData();
  }, [user]);

  const loadData = async () => {
    try {
      if (user) {
        try {
          const [subRes, historyRes] = await Promise.all([
            axios.get('/subscription'),
            axios.get('/subscription/history')
          ]);
          setSubscription(subRes.data);
          setHistory(historyRes.data || []);
        } catch (error) {
          // Если нет подписки, это нормально
          setSubscription(null);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handlePurchase = async () => {
    try {
      // Здесь должна быть интеграция с платежной системой
      // Для демо просто создаем подписку на 30 дней
      const response = await axios.post('/subscription', {
        paymentId: `demo_${Date.now()}`,
        duration: 30
      });
      setSubscription(response.data);
      toast.success('Подписка активирована!');
      loadData();
    } catch (error) {
      toast.error('Ошибка при покупке подписки');
    }
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    
    // Проверка обязательных полей
    if (!formData.firstName || !formData.phone) {
      toast.error('Пожалуйста, заполните все обязательные поля (имя и номер телефона)');
      return;
    }

    try {
      // В реальном приложении здесь должна быть проверка существующего email
      // и интеграция с платежной системой (Paybox, Stripe, Click, Paycom)
      // После заполнения формы пользователь будет перенаправлен на оплату
      
      // Для демо просто показываем успех
      toast.success('Данные сохранены! Ожидайте подтверждения подписки.');
      // В реальном приложении здесь будет редирект на страницу оплаты
    } catch (error) {
      toast.error('Ошибка при сохранении данных');
    }
  };

  const handleToggleAutoRenew = async () => {
    try {
      const response = await axios.put('/subscription/auto-renew', {
        autoRenew: !subscription.autoRenew
      });
      setSubscription(response.data);
      toast.success('Настройки обновлены');
    } catch (error) {
      toast.error('Ошибка обновления настроек');
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

  return (
    <div>
      <Navbar />
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Оформление подписки</h1>
          <p className="text-xl text-gray-600">
            Получите полный доступ ко всем тестам и функциям платформы
          </p>
        </div>

        {/* Current Subscription (if exists) */}
        {user && subscription && (
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 shadow-2xl rounded-2xl p-6 mb-8 border-2 border-green-300 animate-scale-in hover:shadow-3xl transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-semibold mb-2 text-green-700">{t('subscription.active')}</h2>
                <p className="text-gray-600">
                  {t('subscription.activeUntil')}: <span className="font-semibold">
                    {new Date(subscription.endDate).toLocaleDateString('ru-RU', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </span>
                </p>
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="autoRenew"
                  checked={subscription.autoRenew}
                  onChange={handleToggleAutoRenew}
                  className="mr-2"
                />
                <label htmlFor="autoRenew" className="text-sm text-gray-700">
                  {t('subscription.autoRenew') || 'Автоматическое продление'}
                </label>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Subscription Form - Left Column */}
          <div className="lg:col-span-2">
            {!user ? (
              <div className="bg-white shadow-2xl rounded-2xl p-8 border border-gray-100 animate-scale-in relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-primary-100/50 to-purple-100/50 rounded-full blur-2xl"></div>
                <div className="relative z-10">
                <h2 className="text-2xl font-semibold mb-6 bg-gradient-to-r from-primary-600 to-purple-600 bg-clip-text text-transparent">{t('subscription.formTitle')}</h2>
                <form onSubmit={handleFormSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1">
                        {t('subscription.firstName')} <span className="text-red-500">*</span>
                      </label>
                      <input
                        id="firstName"
                        name="firstName"
                        type="text"
                        required
                        className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-300 hover:border-primary-400 focus:shadow-lg focus:scale-105"
                        value={formData.firstName}
                        onChange={handleChange}
                        placeholder={t('subscription.firstName')}
                      />
                    </div>
                    <div>
                      <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1">
                        {t('subscription.lastName')}
                      </label>
                      <input
                        id="lastName"
                        name="lastName"
                        type="text"
                        className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-300 hover:border-primary-400 focus:shadow-lg focus:scale-105"
                        value={formData.lastName}
                        onChange={handleChange}
                        placeholder={t('subscription.lastName')}
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                      {t('subscription.phone')} <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="phone"
                      name="phone"
                      type="tel"
                      required
                      className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-300 hover:border-primary-400 focus:shadow-lg focus:scale-105"
                      value={formData.phone}
                      onChange={handleChange}
                      placeholder="+996 XXX XXX XXX"
                    />
                  </div>

                  <div>
                    <label htmlFor="school" className="block text-sm font-medium text-gray-700 mb-1">
                      {t('subscription.school')}
                    </label>
                    <input
                      id="school"
                      name="school"
                      type="text"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      value={formData.school}
                      onChange={handleChange}
                        placeholder={t('subscription.school')}
                    />
                  </div>

                  <div>
                    <label htmlFor="region" className="block text-sm font-medium text-gray-700 mb-1">
                      {t('subscription.region')}
                    </label>
                    <input
                      id="region"
                      name="region"
                      type="text"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      value={formData.region}
                      onChange={handleChange}
                        placeholder={t('subscription.region')}
                    />
                  </div>

                  <div className="pt-4">
                    <button
                      type="submit"
                      className="w-full bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700 font-semibold text-lg"
                    >
                      {t('subscription.purchase')}
                    </button>
                  </div>
                </form>
                </div>
              </div>
            ) : !subscription ? (
              <div className="bg-white shadow-2xl rounded-2xl p-8 border border-gray-100 animate-scale-in relative overflow-hidden">
                <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-primary-100/50 to-purple-100/50 rounded-full blur-2xl"></div>
                <div className="relative z-10">
                <h2 className="text-2xl font-semibold mb-6 bg-gradient-to-r from-primary-600 to-purple-600 bg-clip-text text-transparent">{t('subscription.purchase')}</h2>
                
                {/* Subscription Plan */}
                <div className="bg-gradient-to-br from-primary-50 via-purple-50 to-blue-50 rounded-xl p-6 mb-6 border-2 border-primary-200 shadow-lg hover:shadow-xl transition-all duration-300">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-xl font-bold text-gray-900">Подписка на 30 дней</h3>
                      <p className="text-gray-600">Полный доступ ко всем функциям</p>
                    </div>
                    <div className="text-right">
                      <p className="text-3xl font-bold text-primary-600">30 дней</p>
                      <p className="text-sm text-gray-500">подписка</p>
                    </div>
                  </div>
                  
                  <div className="border-t border-primary-200 pt-4 mt-4">
                    <div className="space-y-2 text-sm text-gray-700">
                      <div className="flex items-center">
                        <svg className="h-5 w-5 text-green-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        Доступ ко всем платным тестам
                      </div>
                      <div className="flex items-center">
                        <svg className="h-5 w-5 text-green-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        Статистика и аналитика
                      </div>
                      <div className="flex items-center">
                        <svg className="h-5 w-5 text-green-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        Рейтинги и соревнования
                      </div>
                      <div className="flex items-center">
                        <svg className="h-5 w-5 text-green-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        История всех тестов
                      </div>
                    </div>
                  </div>
                </div>

                {/* Payment Info */}
                <div className="bg-gray-50 rounded-lg p-6 mb-6">
                  <h3 className="text-lg font-semibold mb-4">Информация об оплате</h3>
                  <div className="space-y-3 text-sm">
                    <p className="text-gray-600">
                      <strong>Способ оплаты:</strong> Интеграция с платежной системой (Paybox, Stripe, Click, Paycom)
                    </p>
                    <p className="text-gray-600">
                      <strong>Продление:</strong> Подписка автоматически продлевается, если включено автопродление
                    </p>
                    <p className="text-gray-600">
                      <strong>Отмена:</strong> Вы можете отменить подписку в любое время в настройках
                    </p>
                  </div>
                </div>

                {/* Purchase Button */}
                <button
                  onClick={handlePurchase}
                  className="w-full bg-gradient-to-r from-primary-600 via-purple-600 to-pink-600 text-white px-8 py-4 rounded-xl hover:from-primary-700 hover:via-purple-700 hover:to-pink-700 font-semibold text-lg shadow-xl hover:shadow-2xl transition-all transform hover:scale-105 animate-pulse-glow"
                >
                  {t('subscription.purchase')}
                </button>
                </div>
              </div>
            ) : (
              <div className="bg-white shadow-2xl rounded-2xl p-8 border border-gray-100 animate-scale-in">
                <h2 className="text-2xl font-semibold mb-4 bg-gradient-to-r from-primary-600 to-purple-600 bg-clip-text text-transparent">{t('subscription.renew')}</h2>
                <p className="text-gray-600 mb-6">
                  {t('subscription.activeUntil')} {new Date(subscription.endDate).toLocaleDateString(language === 'kg' ? 'ky-KG' : 'ru-RU')}
                </p>
                <button
                  onClick={handlePurchase}
                  className="w-full bg-gradient-to-r from-primary-600 via-purple-600 to-pink-600 text-white px-8 py-4 rounded-xl hover:from-primary-700 hover:via-purple-700 hover:to-pink-700 font-semibold text-lg shadow-xl hover:shadow-2xl transition-all transform hover:scale-105"
                >
                  {t('subscription.renew')} (30 {language === 'kg' ? 'күн' : 'дней'})
                </button>
              </div>
            )}
          </div>

          {/* Benefits Sidebar - Right Column */}
          <div className="lg:col-span-1">
            <div className="bg-white shadow-lg rounded-xl p-6 sticky top-8">
              <h3 className="text-xl font-semibold mb-4">Что вы получите:</h3>
              <div className="space-y-4">
                <div className="flex items-start">
                  <svg className="h-5 w-5 text-green-600 mr-3 mt-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <div>
                    <p className="font-medium text-gray-900">Все платные тесты</p>
                    <p className="text-sm text-gray-600">Неограниченный доступ</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <svg className="h-5 w-5 text-green-600 mr-3 mt-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <div>
                    <p className="font-medium text-gray-900">Подробная статистика</p>
                    <p className="text-sm text-gray-600">Анализ прогресса</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <svg className="h-5 w-5 text-green-600 mr-3 mt-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <div>
                    <p className="font-medium text-gray-900">Рейтинги</p>
                    <p className="text-sm text-gray-600">Соревнование с другими</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <svg className="h-5 w-5 text-green-600 mr-3 mt-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <div>
                    <p className="font-medium text-gray-900">История тестов</p>
                    <p className="text-sm text-gray-600">Все результаты сохраняются</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <svg className="h-5 w-5 text-green-600 mr-3 mt-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <div>
                    <p className="font-medium text-gray-900">Разбор ошибок</p>
                    <p className="text-sm text-gray-600">Подробные объяснения</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* History */}
        {user && history.length > 0 && (
          <div className="bg-white shadow-lg rounded-xl p-6 mt-8">
            <h2 className="text-2xl font-semibold mb-4">История подписок</h2>
            <div className="space-y-3">
              {history.map((item) => (
                <div key={item.id} className="border-b border-gray-200 pb-3 last:border-0">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-medium text-gray-900">
                        {item.status === 'active' ? 'Активна' : 
                         item.status === 'expired' ? 'Истекла' : 'Отменена'}
                      </p>
                      <p className="text-sm text-gray-500">
                        {new Date(item.startDate).toLocaleDateString('ru-RU')} - {new Date(item.endDate).toLocaleDateString('ru-RU')}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Subscription;

