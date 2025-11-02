const express = require('express');
const { Test, Question, Subject, TestResult, User, Subscription } = require('../models');
const { auth } = require('../middleware/auth');
const { Op } = require('sequelize');

const router = express.Router();

// @route   GET /api/tests/subjects
// @desc    Get all subjects
// @access  Public
router.get('/subjects', async (req, res) => {
  try {
    const subjects = await Subject.findAll({
      include: [{
        model: Test,
        as: 'tests',
        where: { isActive: true },
        required: false
      }]
    });
    res.json(subjects);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/tests
// @desc    Get all tests (filtered by subject if provided)
// @access  Public
router.get('/', async (req, res) => {
  try {
    const { subjectId, freeOnly } = req.query;
    const where = { isActive: true };
    
    if (subjectId) {
      where.subjectId = subjectId;
    }

    if (freeOnly === 'true') {
      where.isFree = true;
    }

    const tests = await Test.findAll({
      where,
      include: [
        { model: Subject, as: 'subject' },
        { model: User, as: 'creator', attributes: ['id', 'firstName', 'lastName'] }
      ],
      attributes: { exclude: ['createdBy'] },
      order: [['createdAt', 'DESC']]
    });

    res.json(tests);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/tests/free-by-subject
// @desc    Get one free test per subject
// @access  Public
router.get('/free-by-subject', async (req, res) => {
  try {
    const subjects = await Subject.findAll();
    const freeTestsBySubject = {};

    for (const subject of subjects) {
      const freeTest = await Test.findOne({
        where: {
          subjectId: subject.id,
          isFree: true,
          isActive: true
        },
        include: [
          { model: Subject, as: 'subject' },
          { model: User, as: 'creator', attributes: ['id', 'firstName', 'lastName'] }
        ],
        order: [['createdAt', 'DESC']]
      });

      if (freeTest) {
        freeTestsBySubject[subject.id] = {
          subject: subject,
          test: freeTest
        };
      }
    }

    res.json(freeTestsBySubject);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/tests/:id
// @desc    Get test by ID
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const test = await Test.findByPk(req.params.id, {
      include: [
        { model: Subject, as: 'subject' },
        { model: User, as: 'creator', attributes: ['id', 'firstName', 'lastName'] }
      ]
    });

    if (!test) {
      return res.status(404).json({ message: 'Test not found' });
    }

    res.json(test);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/tests/:id/questions
// @desc    Get test questions (auth optional for free tests, required for premium)
// @access  Public for free tests, Private for premium
router.get('/:id/questions', async (req, res) => {
  try {
    const test = await Test.findByPk(req.params.id);

    if (!test) {
      return res.status(404).json({ message: 'Test not found' });
    }

    // Для бесплатных тестов не требуется auth
    if (test.isFree) {
      const questions = await Question.findAll({
        where: { testId: test.id },
        attributes: { exclude: ['correctAnswer'] }, // Не показываем правильный ответ
        order: [['createdAt', 'ASC']]
      });

      return res.json({
        test: {
          id: test.id,
          title: test.title,
          timeLimit: test.timeLimit,
          maxScore: test.maxScore
        },
        questions
      });
    }

    // Для платных тестов требуется auth
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    try {
      const jwt = require('jsonwebtoken');
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findByPk(decoded.userId);
      
      if (!user) {
        return res.status(401).json({ message: 'User not found' });
      }

      const subscription = await Subscription.findOne({
        where: {
          userId: user.id,
          status: 'active',
          endDate: { [Op.gt]: new Date() }
        }
      });

      if (!subscription) {
        return res.status(403).json({ message: 'Subscription required' });
      }

      const questions = await Question.findAll({
        where: { testId: test.id },
        attributes: { exclude: ['correctAnswer'] },
        order: [['createdAt', 'ASC']]
      });

      return res.json({
        test: {
          id: test.id,
          title: test.title,
          timeLimit: test.timeLimit,
          maxScore: test.maxScore
        },
        questions
      });
    } catch (authError) {
      return res.status(401).json({ message: 'Invalid token' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   POST /api/tests/:id/submit
// @desc    Submit test answers (auth optional for free tests, results saved only if authenticated)
// @access  Public for free tests, Private for premium
router.post('/:id/submit', async (req, res) => {
  try {
    const { answers, timeSpent } = req.body;
    const test = await Test.findByPk(req.params.id, {
      include: [{ model: Question, as: 'questions' }]
    });

    if (!test) {
      return res.status(404).json({ message: 'Test not found' });
    }

    // Для платных тестов требуется auth
    let userId = null;
    if (!test.isFree) {
      const token = req.header('Authorization')?.replace('Bearer ', '');
      if (!token) {
        return res.status(401).json({ message: 'Authentication required' });
      }

      try {
        const jwt = require('jsonwebtoken');
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findByPk(decoded.userId);
        
        if (!user) {
          return res.status(401).json({ message: 'User not found' });
        }

        const subscription = await Subscription.findOne({
          where: {
            userId: user.id,
            status: 'active',
            endDate: { [Op.gt]: new Date() }
          }
        });

        if (!subscription) {
          return res.status(403).json({ message: 'Subscription required' });
        }

        userId = user.id;
      } catch (authError) {
        return res.status(401).json({ message: 'Invalid token' });
      }
    } else {
      // Для бесплатных тестов auth опционален - проверяем токен если есть
      const token = req.header('Authorization')?.replace('Bearer ', '');
      if (token) {
        try {
          const jwt = require('jsonwebtoken');
          const decoded = jwt.verify(token, process.env.JWT_SECRET);
          const user = await User.findByPk(decoded.userId);
          if (user) {
            userId = user.id;
          }
        } catch (authError) {
          // Игнорируем ошибки авторизации для бесплатных тестов
        }
      }
    }

    let score = 0;
    let correctAnswers = 0;
    const detailedAnswers = [];

    // Проверка ответов
    for (const answer of answers) {
      const question = test.questions.find(q => q.id === answer.questionId);
      if (!question) continue;

      const isCorrect = question.correctAnswer === answer.selectedAnswer;
      if (isCorrect) {
        score += question.points;
        correctAnswers++;
      }

      detailedAnswers.push({
        questionId: question.id,
        questionText: question.questionText,
        selectedAnswer: answer.selectedAnswer,
        correctAnswer: question.correctAnswer,
        isCorrect,
        explanation: question.explanation,
        options: question.options
      });
    }

    // Сохранение результата только если пользователь авторизован
    let testResult = null;
    if (userId) {
      testResult = await TestResult.create({
        userId: userId,
        testId: test.id,
        score,
        maxScore: test.maxScore,
        correctAnswers,
        totalQuestions: test.questions.length,
        timeSpent,
        answers: detailedAnswers,
        startedAt: new Date(Date.now() - (timeSpent * 1000)),
        completedAt: new Date()
      });
    }

    res.json({
      result: testResult,
      detailedAnswers,
      score,
      maxScore: test.maxScore,
      correctAnswers,
      totalQuestions: test.questions.length,
      saved: !!userId // Указываем, был ли результат сохранен
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;

