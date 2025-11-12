import React, { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';

const RewardsPanel = () => {
  const [coins, setCoins] = useState(0);
  const [referralCode, setReferralCode] = useState('');
  const [referralLink, setReferralLink] = useState('');
  const [referrals, setReferrals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    loadRewardsData();
  }, []);

  const loadRewardsData = async () => {
    try {
      const [coinsRes, referralRes, referralsRes] = await Promise.all([
        axios.get('/rewards/coins'),
        axios.get('/rewards/referral-link'),
        axios.get('/rewards/referrals')
      ]);

      setCoins(coinsRes.data.coins || 0);
      setReferralCode(referralRes.data.referralCode);
      setReferralLink(referralRes.data.referralLink);
      setReferrals(referralsRes.data || []);
    } catch (error) {
      console.error('Error loading rewards data:', error);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    toast.success('Ссылка скопирована!');
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-32 bg-gray-200 rounded-xl"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Coins Display */}
      <div className="bg-gradient-to-r from-yellow-400 via-yellow-500 to-yellow-600 rounded-2xl p-6 shadow-xl">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-white text-sm font-medium mb-1">Ваши монеты</h3>
            <p className="text-4xl font-bold text-white">{coins.toLocaleString()}</p>
          </div>
          <div className="text-6xl">🪙</div>
        </div>
        <div className="mt-4 pt-4 border-t border-yellow-300">
          <p className="text-yellow-100 text-sm">
            💡 Получайте монеты за рефералов и первое место в рейтинге!
          </p>
        </div>
      </div>

      {/* Referral Section */}
      <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
        <h3 className="text-xl font-semibold mb-4 text-gray-900">Реферальная программа</h3>
        
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Ваша реферальная ссылка
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={referralLink}
              readOnly
              className="flex-1 px-4 py-2 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
            <button
              onClick={copyToClipboard}
              className={`px-6 py-2 rounded-xl font-medium transition-all ${
                copied
                  ? 'bg-green-500 text-white'
                  : 'bg-primary-600 text-white hover:bg-primary-700'
              }`}
            >
              {copied ? '✓ Скопировано' : 'Копировать'}
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Ваш реферальный код: <span className="font-mono font-bold">{referralCode}</span>
          </p>
        </div>

        <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4 mb-4">
          <div className="flex items-start">
            <div className="text-2xl mr-3">🎁</div>
            <div>
              <h4 className="font-semibold text-blue-900 mb-1">Как это работает:</h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Поделитесь ссылкой с друзьями</li>
                <li>• За каждого друга, который купит подписку, вы получите <strong>100 монет</strong></li>
                <li>• Ваш друг получит <strong>скидку 100 сомов</strong> на подписку</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Referrals List */}
        <div>
          <h4 className="font-semibold text-gray-900 mb-3">
            Ваши рефералы ({referrals.length})
          </h4>
          {referrals.length === 0 ? (
            <p className="text-gray-500 text-sm">Пока нет рефералов</p>
          ) : (
            <div className="space-y-2">
              {referrals.map((ref) => (
                <div
                  key={ref.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div>
                    <p className="font-medium text-gray-900">
                      {ref.firstName} {ref.lastName}
                    </p>
                    <p className="text-xs text-gray-500">
                      Присоединился: {new Date(ref.joinedAt).toLocaleDateString('ru-RU')}
                    </p>
                  </div>
                  <div className="text-right">
                    {ref.hasActiveSubscription ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        ✓ Подписка активна
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                        Без подписки
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Monthly Ranking Bonus */}
      <div className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl p-6 shadow-xl text-white">
        <div className="flex items-center mb-3">
          <span className="text-3xl mr-3">🏆</span>
          <h3 className="text-xl font-bold">Бонус за рейтинг</h3>
        </div>
        <p className="text-purple-100 mb-2">
          Удерживайте первое место в рейтинге на месяц и получите
        </p>
        <p className="text-3xl font-bold">+1000 монет</p>
        <p className="text-sm text-purple-100 mt-2">
          Рейтинг рассчитывается автоматически в конце каждого месяца
        </p>
      </div>
    </div>
  );
};

export default RewardsPanel;

