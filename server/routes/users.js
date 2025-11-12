const express = require('express');
const { User, TestResult, Test, Subject, Subscription, Question } = require('../models');
const { auth } = require('../middleware/auth');
const { Op } = require('sequelize');
const sequelize = require('../config/database');

const router = express.Router();

// @route   GET /api/users/profile
// @desc    Get user profile
// @access  Private
router.get('/profile', auth, async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: { 
        exclude: ['password', 'emailVerificationToken', 'resetPasswordToken']
      },
      include: [{
        model: Subscription,
        as: 'subscriptions',
        where: { status: 'active' },
        required: false,
        order: [['endDate', 'DESC']],
        limit: 1
      }]
    });

    res.json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   PUT /api/users/profile
// @desc    Update user profile
// @access  Private
router.put('/profile', auth, async (req, res) => {
  try {
    const { firstName, lastName, school, region, photo } = req.body;
    
    await User.update(
      { firstName, lastName, school, region, photo },
      { where: { id: req.user.id } }
    );

    const updatedUser = await User.findByPk(req.user.id, {
      attributes: { exclude: ['password', 'emailVerificationToken', 'resetPasswordToken'] }
    });

    res.json(updatedUser);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/users/history
// @desc    Get user test history
// @access  Private
router.get('/history', auth, async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    const testResults = await TestResult.findAndCountAll({
      where: { userId: req.user.id },
      include: [{
        model: Test,
        as: 'test',
        include: [{ model: Subject, as: 'subject' }]
      }],
      order: [['completedAt', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.json({
      results: testResults.rows,
      total: testResults.count,
      page: parseInt(page),
      pages: Math.ceil(testResults.count / limit)
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/users/test-result/:testId
// @desc    Get test result by test ID for current user
// @access  Private
router.get('/test-result/:testId', auth, async (req, res) => {
  try {
    const { testId } = req.params;
    
    // Получаем последний результат теста для текущего пользователя
    const testResult = await TestResult.findOne({
      where: { 
        userId: req.user.id,
        testId: testId
      },
      include: [{
        model: Test,
        as: 'test',
        include: [{ model: Subject, as: 'subject' }]
      }],
      order: [['completedAt', 'DESC']]
    });

    if (!testResult) {
      return res.status(404).json({ message: 'Test result not found' });
    }

    // Загружаем вопросы теста для построения detailedAnswers
    const test = await Test.findByPk(testId, {
      include: [{ model: Question, as: 'questions' }]
    });

    if (!test) {
      return res.status(404).json({ message: 'Test not found' });
    }

    // Формируем detailedAnswers из сохраненных ответов
    const answers = testResult.answers || [];
    const detailedAnswers = test.questions.map((question, index) => {
      const answer = answers.find(a => a.questionId === question.id || a.questionIndex === index);
      const selectedAnswer = answer?.selectedAnswer ?? -1;
      const isCorrect = selectedAnswer === question.correctAnswer;

      return {
        questionId: question.id,
        questionText: question.questionText,
        options: question.options,
        correctAnswer: question.correctAnswer,
        selectedAnswer: selectedAnswer,
        isCorrect: isCorrect,
        explanation: question.explanation || ''
      };
    });

    res.json({
      result: testResult,
      detailedAnswers,
      score: testResult.score,
      maxScore: testResult.maxScore,
      correctAnswers: testResult.correctAnswers,
      totalQuestions: testResult.totalQuestions,
      timeSpent: testResult.timeSpent,
      saved: true
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/users/statistics
// @desc    Get user statistics
// @access  Private
router.get('/statistics', auth, async (req, res) => {
  try {
    const userId = req.user.id;

    // Общая статистика
    const totalResults = await TestResult.count({ where: { userId } });
    
    const avgScore = await TestResult.findOne({
      where: { userId },
      attributes: [
        [sequelize.fn('AVG', sequelize.col('score')), 'avgScore'],
        [sequelize.fn('AVG', sequelize.col('maxScore')), 'avgMaxScore']
      ],
      raw: true
    });

    // Статистика по предметам (упрощенная версия)
    const testResults = await TestResult.findAll({
      where: { userId },
      include: [{
        model: Test,
        as: 'test',
        include: [{ model: Subject, as: 'subject' }]
      }]
    });

    // Группировка по предметам
    const subjectStatsMap = {};
    testResults.forEach(result => {
      const subjectId = result.test?.subject?.id;
      const subjectName = result.test?.subject?.name;
      if (subjectId) {
        if (!subjectStatsMap[subjectId]) {
          subjectStatsMap[subjectId] = {
            subjectId,
            subjectName,
            scores: [],
            attempts: 0
          };
        }
        subjectStatsMap[subjectId].scores.push(result.score);
        subjectStatsMap[subjectId].attempts++;
      }
    });

    const subjectStats = Object.values(subjectStatsMap).map(stat => ({
      subjectId: stat.subjectId,
      subjectName: stat.subjectName,
      avgScore: stat.scores.reduce((a, b) => a + b, 0) / stat.scores.length,
      attempts: stat.attempts
    }));

    // Рейтинг по школе (если указана школа) - упрощенная версия
    let schoolRank = null;
    if (req.user.school) {
      const schoolUsers = await User.findAll({
        where: { school: req.user.school },
        attributes: ['id']
      });
      
      const schoolUserIds = schoolUsers.map(u => u.id);
      
      const schoolResults = await TestResult.findAll({
        where: { userId: { [Op.in]: schoolUserIds } }
      });

      // Группировка по пользователям и расчет среднего балла
      const userAvgScores = {};
      schoolResults.forEach(result => {
        if (!userAvgScores[result.userId]) {
          userAvgScores[result.userId] = { scores: [], count: 0 };
        }
        userAvgScores[result.userId].scores.push(result.score);
        userAvgScores[result.userId].count++;
      });

      const myAvgScore = avgScore?.avgScore || 0;
      const betterUsersCount = Object.values(userAvgScores).filter(userStat => {
        const userAvg = userStat.scores.reduce((a, b) => a + b, 0) / userStat.scores.length;
        return userAvg > myAvgScore;
      }).length;

      schoolRank = betterUsersCount + 1;
    }

    res.json({
      totalTests: totalResults,
      averageScore: parseFloat(avgScore?.avgScore || 0),
      averageMaxScore: parseFloat(avgScore?.avgMaxScore || 0),
      subjectStats,
      schoolRank
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/users/ranking
// @desc    Get rankings with filters (type, subjectId, school, region)
// @access  Private
router.get('/ranking', auth, async (req, res) => {
  try {
    const { type = 'school', subjectId, school, region } = req.query;

    // Фильтр по типу (школа/регион/страна)
    let userWhere = {};
    if (type === 'school' && (school || req.user.school)) {
      userWhere.school = school || req.user.school;
    } else if (type === 'region' && (region || req.user.region)) {
      userWhere.region = region || req.user.region;
    }

    // Дополнительные фильтры по школе и региону
    if (school && type !== 'school') {
      userWhere.school = school;
    }
    if (region && type !== 'region') {
      userWhere.region = region;
    }

    const users = await User.findAll({
      where: userWhere,
      attributes: ['id', 'firstName', 'lastName', 'school', 'region']
    });

    const userIds = users.map(u => u.id);

    if (userIds.length === 0) {
      return res.json([]);
    }

    // Фильтр результатов по предмету
    let resultWhere = { userId: { [Op.in]: userIds } };
    
    if (subjectId) {
      const testResultWhere = { userId: { [Op.in]: userIds } };
      const testResults = await TestResult.findAll({
        where: testResultWhere,
        include: [{
          model: Test,
          as: 'test',
          where: { subjectId: subjectId },
          attributes: ['id', 'subjectId']
        }, {
          model: User,
          as: 'user',
          attributes: ['id', 'firstName', 'lastName', 'school', 'region', 'photo']
        }]
      });

      // Группируем по пользователям
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

      const rankings = Object.values(userStats).map(stat => ({
        userId: stat.userId,
        avgScore: stat.scores.reduce((a, b) => a + b, 0) / stat.scores.length,
        totalTests: stat.totalTests,
        user: stat.user
      })).sort((a, b) => b.avgScore - a.avgScore).slice(0, 100);

      return res.json(rankings);
    }

    // Без фильтра по предмету - все результаты
    const allResults = await TestResult.findAll({
      where: resultWhere,
      include: [{
        model: User,
        as: 'user',
        attributes: ['id', 'firstName', 'lastName', 'school', 'region', 'photo']
      }]
    });

    // Группируем по пользователям и считаем статистику
    const userStats = {};
    allResults.forEach(result => {
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

    // Преобразуем в массив и сортируем
    const rankings = Object.values(userStats).map(stat => ({
      userId: stat.userId,
      avgScore: stat.scores.reduce((a, b) => a + b, 0) / stat.scores.length,
      totalTests: stat.totalTests,
      user: stat.user
    })).sort((a, b) => b.avgScore - a.avgScore).slice(0, 100);

    res.json(rankings);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/users/ranking/filters
// @desc    Get available filter options (schools, regions)
// @access  Private
router.get('/ranking/filters', auth, async (req, res) => {
  try {
    const schools = await User.findAll({
      attributes: [[sequelize.fn('DISTINCT', sequelize.col('school')), 'school']],
      where: {
        school: { [Op.ne]: null }
      },
      raw: true
    });

    const regions = await User.findAll({
      attributes: [[sequelize.fn('DISTINCT', sequelize.col('region')), 'region']],
      where: {
        region: { [Op.ne]: null }
      },
      raw: true
    });

    res.json({
      schools: schools.map(s => s.school).filter(Boolean).sort(),
      regions: regions.map(r => r.region).filter(Boolean).sort()
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
