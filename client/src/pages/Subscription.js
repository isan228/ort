import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Navbar from '../components/Navbar';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useNavigate, useSearchParams } from 'react-router-dom';

const Subscription = () => {
  const { user, register, loadUser } = useAuth();
  const { language, t } = useLanguage();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const referralCodeFromUrl = searchParams.get('ref');
  const [subscription, setSubscription] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showPaymentMethods, setShowPaymentMethods] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState(null);
  const [processingPayment, setProcessingPayment] = useState(false);
  const [referralCode, setReferralCode] = useState(referralCodeFromUrl || '');
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    password: '',
    confirmPassword: '',
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
    setSubmitting(true);
    
    // Валидация
    if (!formData.firstName || !formData.phone || !formData.password) {
      toast.error('Пожалуйста, заполните все обязательные поля');
      setSubmitting(false);
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      toast.error('Пароли не совпадают');
      setSubmitting(false);
      return;
    }

    if (formData.password.length < 6) {
      toast.error('Пароль должен содержать минимум 6 символов');
      setSubmitting(false);
      return;
    }

    // Показываем выбор способа оплаты вместо регистрации
    setShowPaymentMethods(true);
    setSubmitting(false);
  };

  const handlePaymentMethodSelect = (method) => {
    setSelectedPaymentMethod(method);
  };

  const handlePaymentProcess = async () => {
    if (!selectedPaymentMethod) {
      toast.error('Пожалуйста, выберите способ оплаты');
      return;
    }

    setProcessingPayment(true);

    try {
      // Заглушка для обработки оплаты
      // В реальном приложении здесь будет интеграция с платежной системой
      await new Promise(resolve => setTimeout(resolve, 2000)); // Имитация обработки платежа
      
      // Генерируем paymentId (заглушка)
      const paymentId = `payment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      // Регистрация пользователя с оплатой
      const registerData = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        phone: formData.phone,
        password: formData.password,
        school: formData.school,
        region: formData.region,
        paymentMethod: selectedPaymentMethod,
        paymentId: paymentId,
        duration: 30,
        referralCode: referralCode || undefined
      };

      const response = await axios.post('/auth/register-with-payment', registerData);
      const { token, user: newUser, subscription } = response.data;

      // Сохраняем токен и авторизуем пользователя
      localStorage.setItem('token', token);
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      // Обновляем пользователя в контексте
      if (loadUser) {
        await loadUser();
      }
      
      toast.success('Регистрация и оплата успешны! Аккаунт создан.');
      
      // Обновляем данные подписки
      await loadData();
      navigate('/dashboard');
    } catch (error) {
      const message = error.response?.data?.message || 'Ошибка при регистрации и оплате';
      toast.error(message);
    } finally {
      setProcessingPayment(false);
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
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        <div className="text-center mb-8 md:mb-12 animate-fade-in">
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-4 bg-gradient-to-r from-primary-600 to-purple-600 bg-clip-text text-transparent">
            {t('subscription.title') || 'Оформление подписки'}
          </h1>
          <p className="text-lg md:text-xl text-gray-600 max-w-2xl mx-auto px-4">
            {t('subscription.description') || 'Получите полный доступ ко всем тестам и функциям платформы'}
          </p>
        </div>

        {/* Current Subscription (if exists) */}
        {user && subscription && (
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 shadow-2xl rounded-2xl p-6 mb-8 border-2 border-green-300 animate-scale-in hover:shadow-3xl transition-all duration-300">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="text-center md:text-left">
                <h2 className="text-xl md:text-2xl font-semibold mb-2 text-green-700">{t('subscription.active')}</h2>
                <p className="text-gray-600">
                  {t('subscription.activeUntil')}: <span className="font-semibold">
                    {new Date(subscription.endDate).toLocaleDateString(language === 'kg' ? 'ky-KG' : 'ru-RU', {
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
                  className="mr-2 w-4 h-4"
                />
                <label htmlFor="autoRenew" className="text-sm text-gray-700">
                  {t('subscription.autoRenew') || 'Автоматическое продление'}
                </label>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
          {/* Subscription Form - Left Column */}
          <div className="lg:col-span-2">
            {!user ? (
              !showPaymentMethods ? (
                <div className="bg-white shadow-2xl rounded-2xl p-6 md:p-8 border border-gray-100 animate-scale-in relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-primary-100/50 to-purple-100/50 rounded-full blur-2xl"></div>
                  <div className="relative z-10">
                    <h2 className="text-2xl font-semibold mb-6 bg-gradient-to-r from-primary-600 to-purple-600 bg-clip-text text-transparent">
                      {t('subscription.formTitle') || 'Регистрация и оформление подписки'}
                    </h2>
                    <form onSubmit={handleFormSubmit} className="space-y-4 md:space-y-5">
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
                          className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-300 hover:border-primary-400 focus:shadow-lg text-sm md:text-base"
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
                          className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-300 hover:border-primary-400 focus:shadow-lg text-sm md:text-base"
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
                        className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-300 hover:border-primary-400 focus:shadow-lg text-sm md:text-base"
                        value={formData.phone}
                        onChange={handleChange}
                        placeholder="+996 XXX XXX XXX"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                          Пароль <span className="text-red-500">*</span>
                        </label>
                        <input
                          id="password"
                          name="password"
                          type="password"
                          required
                          minLength={6}
                          className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-300 hover:border-primary-400 focus:shadow-lg text-sm md:text-base"
                          value={formData.password}
                          onChange={handleChange}
                          placeholder="Минимум 6 символов"
                        />
                      </div>
                      <div>
                        <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                          Подтвердите пароль <span className="text-red-500">*</span>
                        </label>
                        <input
                          id="confirmPassword"
                          name="confirmPassword"
                          type="password"
                          required
                          minLength={6}
                          className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-300 hover:border-primary-400 focus:shadow-lg text-sm md:text-base"
                          value={formData.confirmPassword}
                          onChange={handleChange}
                          placeholder="Повторите пароль"
                        />
                      </div>
                    </div>

                    <div>
                      <label htmlFor="school" className="block text-sm font-medium text-gray-700 mb-1">
                        {t('subscription.school')}
                      </label>
                      <input
                        id="school"
                        name="school"
                        type="text"
                        className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-300 hover:border-primary-400 focus:shadow-lg text-sm md:text-base"
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
                        className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-300 hover:border-primary-400 focus:shadow-lg text-sm md:text-base"
                        value={formData.region}
                        onChange={handleChange}
                        placeholder={t('subscription.region')}
                      />
                    </div>

                    {referralCode && (
                      <div className="bg-green-50 border-2 border-green-200 rounded-xl p-4">
                        <div className="flex items-center">
                          <svg className="h-5 w-5 text-green-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <div>
                            <p className="text-sm font-semibold text-green-800">Реферальный код применен!</p>
                            <p className="text-xs text-green-600">Вы получите скидку 100 сомов при покупке подписки</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {!referralCode && (
                      <div>
                        <label htmlFor="referralCode" className="block text-sm font-medium text-gray-700 mb-1">
                          Реферальный код (необязательно)
                        </label>
                        <input
                          id="referralCode"
                          name="referralCode"
                          type="text"
                          className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-300 hover:border-primary-400 focus:shadow-lg text-sm md:text-base"
                          value={referralCode}
                          onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
                          placeholder="Введите реферальный код"
                        />
                        <p className="text-xs text-gray-500 mt-1">Получите скидку 100 сомов при использовании реферального кода</p>
                      </div>
                    )}

                    <div className="pt-4">
                      <button
                        type="submit"
                        disabled={submitting}
                        className="w-full bg-gradient-to-r from-primary-600 via-purple-600 to-pink-600 text-white px-6 py-3.5 rounded-xl hover:from-primary-700 hover:via-purple-700 hover:to-pink-700 font-semibold text-base md:text-lg shadow-xl hover:shadow-2xl transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none animate-pulse-glow"
                      >
                        {submitting ? 'Проверка...' : 'Продолжить к оплате'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
              ) : (
                <div className="bg-white shadow-2xl rounded-2xl p-6 md:p-8 border border-gray-100 animate-scale-in relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-primary-100/50 to-purple-100/50 rounded-full blur-2xl"></div>
                  <div className="relative z-10">
                    <h2 className="text-2xl font-semibold mb-6 bg-gradient-to-r from-primary-600 to-purple-600 bg-clip-text text-transparent">
                      Выберите способ оплаты
                    </h2>
                    
                    <div className="mb-6">
                      <div className="bg-gradient-to-br from-primary-50 via-purple-50 to-blue-50 rounded-xl p-6 border-2 border-primary-200">
                        <h3 className="text-xl font-bold text-gray-900 mb-2">Подписка на 30 дней</h3>
                        <p className="text-gray-600 mb-4">Полный доступ ко всем функциям платформы</p>
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="text-2xl font-bold text-primary-600">30 дней</span>
                            {referralCode && (
                              <div className="mt-2">
                                <span className="text-sm text-gray-500 line-through">Обычная цена</span>
                                <span className="ml-2 text-lg font-bold text-green-600">-100 сом (скидка)</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3 mb-6">
                      {[
                        { id: 'card', name: 'Банковская карта', icon: '💳', desc: 'Visa, MasterCard, МИР' },
                        { id: 'mobile', name: 'Мобильный платеж', icon: '📱', desc: 'О! Деньги, MegaPay, Beeline' },
                        { id: 'bank', name: 'Банковский перевод', icon: '🏦', desc: 'Перевод через банк' },
                        { id: 'crypto', name: 'Криптовалюта', icon: '₿', desc: 'Bitcoin, USDT' }
                      ].map((method) => (
                        <button
                          key={method.id}
                          onClick={() => handlePaymentMethodSelect(method.id)}
                          className={`w-full p-4 rounded-xl border-2 transition-all duration-300 text-left ${
                            selectedPaymentMethod === method.id
                              ? 'border-primary-500 bg-primary-50 shadow-lg'
                              : 'border-gray-200 hover:border-primary-300 hover:bg-gray-50'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center">
                              <span className="text-2xl mr-3">{method.icon}</span>
                              <div>
                                <div className="font-semibold text-gray-900">{method.name}</div>
                                <div className="text-sm text-gray-600">{method.desc}</div>
                              </div>
                            </div>
                            {selectedPaymentMethod === method.id && (
                              <svg className="h-6 w-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                            )}
                          </div>
                        </button>
                      ))}
                    </div>

                    <button
                      onClick={handlePaymentProcess}
                      disabled={!selectedPaymentMethod || processingPayment}
                      className="w-full bg-gradient-to-r from-primary-600 via-purple-600 to-pink-600 text-white px-6 py-3.5 rounded-xl hover:from-primary-700 hover:via-purple-700 hover:to-pink-700 font-semibold text-base md:text-lg shadow-xl hover:shadow-2xl transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none animate-pulse-glow"
                    >
                      {processingPayment ? 'Обработка оплаты...' : 'Оплатить и создать аккаунт'}
                    </button>

                    <button
                      onClick={() => setShowPaymentMethods(false)}
                      className="w-full mt-3 text-gray-600 hover:text-gray-800 text-sm"
                    >
                      ← Вернуться к форме регистрации
                    </button>
                  </div>
                </div>
              )
            ) : !subscription ? (
              <div className="bg-white shadow-2xl rounded-2xl p-6 md:p-8 border border-gray-100 animate-scale-in relative overflow-hidden">
                <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-primary-100/50 to-purple-100/50 rounded-full blur-2xl"></div>
                <div className="relative z-10">
                  <h2 className="text-2xl font-semibold mb-6 bg-gradient-to-r from-primary-600 to-purple-600 bg-clip-text text-transparent">
                    {t('subscription.purchase')}
                  </h2>
                  
                  <div className="bg-gradient-to-br from-primary-50 via-purple-50 to-blue-50 rounded-xl p-6 mb-6 border-2 border-primary-200 shadow-lg hover:shadow-xl transition-all duration-300">
                    <div className="flex flex-col md:flex-row items-center justify-between mb-4 gap-4">
                      <div>
                        <h3 className="text-xl font-bold text-gray-900">Подписка на 30 дней</h3>
                        <p className="text-gray-600">Полный доступ ко всем функциям</p>
                      </div>
                      <div className="text-center md:text-right">
                        <p className="text-3xl font-bold text-primary-600">30 дней</p>
                        <p className="text-sm text-gray-500">подписка</p>
                      </div>
                    </div>
                    
                    <div className="border-t border-primary-200 pt-4 mt-4">
                      <div className="space-y-2 text-sm text-gray-700">
                        {['Все платные тесты', 'Статистика и аналитика', 'Рейтинги и соревнования', 'История всех тестов'].map((benefit, idx) => (
                          <div key={idx} className="flex items-center">
                            <svg className="h-5 w-5 text-green-600 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            {benefit}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={handlePurchase}
                    className="w-full bg-gradient-to-r from-primary-600 via-purple-600 to-pink-600 text-white px-8 py-4 rounded-xl hover:from-primary-700 hover:via-purple-700 hover:to-pink-700 font-semibold text-lg shadow-xl hover:shadow-2xl transition-all transform hover:scale-105 animate-pulse-glow"
                  >
                    {t('subscription.purchase')}
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-white shadow-2xl rounded-2xl p-6 md:p-8 border border-gray-100 animate-scale-in">
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
                {[
                  { title: 'Все платные тесты', desc: 'Неограниченный доступ' },
                  { title: 'Подробная статистика', desc: 'Анализ прогресса' },
                  { title: 'Рейтинги', desc: 'Соревнование с другими' },
                  { title: 'История тестов', desc: 'Все результаты сохраняются' },
                  { title: 'Разбор ошибок', desc: 'Подробные объяснения' }
                ].map((item, idx) => (
                  <div key={idx} className="flex items-start">
                    <svg className="h-5 w-5 text-green-600 mr-3 mt-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <div>
                      <p className="font-medium text-gray-900">{item.title}</p>
                      <p className="text-sm text-gray-600">{item.desc}</p>
                    </div>
                  </div>
                ))}
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
