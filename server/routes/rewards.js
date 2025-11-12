const express = require('express');
const { User, MonthlyRanking, TestResult, Test } = require('../models');
const { auth } = require('../middleware/auth');
const { Op } = require('sequelize');
const sequelize = require('../config/database');

const router = express.Router();

// Все роуты требуют аутентификации
router.use(auth);

// @route   GET /api/rewards/coins
// @desc    Get user coins balance
// @access  Private
router.get('/coins', async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: ['id', 'coins', 'referralCode']
    });

    res.json({
      coins: user.coins || 0,
      referralCode: user.referralCode
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/rewards/referrals
// @desc    Get user referrals list
// @access  Private
router.get('/referrals', async (req, res) => {
  try {
    const referrals = await User.findAll({
      where: { referredBy: req.user.id },
      attributes: ['id', 'firstName', 'lastName', 'phone', 'createdAt'],
      include: [{
        model: require('../models').Subscription,
        as: 'subscriptions',
        where: { status: 'active' },
        required: false
      }],
      order: [['createdAt', 'DESC']]
    });

    const referralsWithSubscription = referrals.map(ref => ({
      id: ref.id,
      firstName: ref.firstName,
      lastName: ref.lastName,
      phone: ref.phone,
      joinedAt: ref.createdAt,
      hasActiveSubscription: ref.subscriptions && ref.subscriptions.length > 0
    }));

    res.json(referralsWithSubscription);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/rewards/referral-link
// @desc    Get user referral link
// @access  Private
router.get('/referral-link', async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: ['id', 'referralCode']
    });

    if (!user.referralCode) {
      // Генерируем код если его нет
      const crypto = require('crypto');
      user.referralCode = crypto.randomBytes(8).toString('hex').toUpperCase();
      await user.save();
    }

    const referralLink = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/subscription?ref=${user.referralCode}`;

    res.json({
      referralCode: user.referralCode,
      referralLink: referralLink
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   POST /api/rewards/calculate-monthly-ranking
// @desc    Calculate monthly rankings and award bonuses (admin only or cron job)
// @access  Private (should be admin or cron)
router.post('/calculate-monthly-ranking', async (req, res) => {
  try {
    const now = new Date();
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const month = lastMonth.getMonth() + 1;
    const year = lastMonth.getFullYear();

    // Проверяем, не был ли уже рассчитан рейтинг за этот месяц
    const existingRanking = await MonthlyRanking.findOne({
      where: {
        month,
        year,
        type: 'country'
      }
    });

    if (existingRanking) {
      return res.json({ message: 'Ranking for this month already calculated' });
    }

    // Получаем всех пользователей с их результатами за прошлый месяц
    const startOfMonth = new Date(year, month - 1, 1);
    const endOfMonth = new Date(year, month, 0, 23, 59, 59);

    const testResults = await TestResult.findAll({
      where: {
        createdAt: {
          [Op.between]: [startOfMonth, endOfMonth]
        }
      },
      include: [{
        model: User,
        as: 'user',
        attributes: ['id', 'firstName', 'lastName']
      }]
    });

    // Группируем по пользователям и считаем средний балл
    const userStats = {};
    testResults.forEach(result => {
      const userId = result.userId;
      if (!userStats[userId]) {
        userStats[userId] = {
          userId,
          scores: [],
          totalTests: 0,
          user: result.user
        };
      }
      userStats[userId].scores.push(result.score);
      userStats[userId].totalTests++;
    });

    // Сортируем по среднему баллу
    const rankings = Object.values(userStats)
      .map(stat => ({
        userId: stat.userId,
        avgScore: stat.scores.reduce((a, b) => a + b, 0) / stat.scores.length,
        totalTests: stat.totalTests,
        user: stat.user
      }))
      .sort((a, b) => b.avgScore - a.avgScore);

    // Сохраняем рейтинги в базу
    const monthlyRankings = [];
    for (let i = 0; i < rankings.length; i++) {
      const ranking = rankings[i];
      const [monthlyRanking, created] = await MonthlyRanking.findOrCreate({
        where: {
          userId: ranking.userId,
          month,
          year,
          type: 'country'
        },
        defaults: {
          rank: i + 1,
          avgScore: ranking.avgScore,
          totalTests: ranking.totalTests,
          bonusAwarded: false
        }
      });

      if (!created) {
        monthlyRanking.rank = i + 1;
        monthlyRanking.avgScore = ranking.avgScore;
        monthlyRanking.totalTests = ranking.totalTests;
        await monthlyRanking.save();
      }

      monthlyRankings.push(monthlyRanking);
    }

    // Начисляем бонус 1000 монет первому месту
    if (rankings.length > 0) {
      const firstPlace = rankings[0];
      const firstPlaceRanking = monthlyRankings.find(r => r.userId === firstPlace.userId);
      
      if (firstPlaceRanking && !firstPlaceRanking.bonusAwarded) {
        const user = await User.findByPk(firstPlace.userId);
        if (user) {
          user.coins = (user.coins || 0) + 1000;
          await user.save();
          
          firstPlaceRanking.bonusAwarded = true;
          await firstPlaceRanking.save();
        }
      }
    }

    res.json({
      message: 'Monthly ranking calculated successfully',
      rankingsCount: rankings.length,
      firstPlace: rankings[0] ? {
        userId: rankings[0].userId,
        avgScore: rankings[0].avgScore,
        bonusAwarded: true
      } : null
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/rewards/monthly-rankings
// @desc    Get monthly rankings history
// @access  Private
router.get('/monthly-rankings', async (req, res) => {
  try {
    const rankings = await MonthlyRanking.findAll({
      where: { userId: req.user.id },
      order: [['year', 'DESC'], ['month', 'DESC']],
      limit: 12
    });

    res.json(rankings);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;

