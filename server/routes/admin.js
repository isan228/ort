const express = require('express');
const { User, Test, Question, Subject, TestResult, Subscription } = require('../models');
const { auth, adminAuth, repetitorAuth } = require('../middleware/auth');
const { body, validationResult } = require('express-validator');
const { Op } = require('sequelize');

const router = express.Router();

// Все роуты требуют аутентификации
router.use(auth);

// @route   GET /api/admin/users
// @desc    Get all users (Admin only)
// @access  Admin
router.get('/users', adminAuth, async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    const users = await User.findAndCountAll({
      attributes: { exclude: ['password', 'emailVerificationToken', 'resetPasswordToken'] },
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['createdAt', 'DESC']]
    });

    res.json({
      users: users.rows,
      total: users.count,
      page: parseInt(page),
      pages: Math.ceil(users.count / limit)
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   PUT /api/admin/users/:id/role
// @desc    Update user role (Admin only)
// @access  Admin
router.put('/users/:id/role', adminAuth, [
  body('role').isIn(['user', 'repetitor', 'admin'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { role } = req.body;
    const user = await User.findByPk(req.params.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.role = role;
    await user.save();

    res.json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   POST /api/admin/subjects
// @desc    Create subject (Admin/Repetitor)
// @access  Repetitor, Admin
router.post('/subjects', repetitorAuth, [
  body('name').notEmpty(),
  body('description').optional()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, nameKg, description, icon } = req.body;
    const subject = await Subject.create({ name, nameKg, description, icon });

    res.status(201).json(subject);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   POST /api/admin/tests
// @desc    Create test (Admin/Repetitor)
// @access  Repetitor, Admin
router.post('/tests', repetitorAuth, [
  body('subjectId').notEmpty(),
  body('title').notEmpty(),
  body('isFree').isBoolean(),
  body('timeLimit').optional().isInt(),
  body('maxScore').optional().isInt()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { subjectId, title, description, isFree, timeLimit, maxScore } = req.body;
    
    const test = await Test.create({
      subjectId,
      title,
      description,
      isFree,
      timeLimit,
      maxScore: maxScore || 100,
      createdBy: req.user.id
    });

    const createdTest = await Test.findByPk(test.id, {
      include: [
        { model: Subject, as: 'subject' },
        { model: User, as: 'creator', attributes: ['id', 'firstName', 'lastName'] }
      ]
    });

    res.status(201).json(createdTest);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   PUT /api/admin/tests/:id
// @desc    Update test (Admin/Repetitor)
// @access  Repetitor, Admin
router.put('/tests/:id', repetitorAuth, async (req, res) => {
  try {
    const test = await Test.findByPk(req.params.id);

    if (!test) {
      return res.status(404).json({ message: 'Test not found' });
    }

    // Проверка прав (только создатель или админ)
    if (test.createdBy !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const { title, description, isFree, timeLimit, maxScore, isActive } = req.body;
    
    await test.update({
      title: title || test.title,
      description: description !== undefined ? description : test.description,
      isFree: isFree !== undefined ? isFree : test.isFree,
      timeLimit: timeLimit !== undefined ? timeLimit : test.timeLimit,
      maxScore: maxScore || test.maxScore,
      isActive: isActive !== undefined ? isActive : test.isActive
    });

    const updatedTest = await Test.findByPk(test.id, {
      include: [
        { model: Subject, as: 'subject' },
        { model: User, as: 'creator', attributes: ['id', 'firstName', 'lastName'] }
      ]
    });

    res.json(updatedTest);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   POST /api/admin/tests/:id/questions
// @desc    Add question to test (Admin/Repetitor)
// @access  Repetitor, Admin
router.post('/tests/:id/questions', repetitorAuth, [
  body('questionText').notEmpty(),
  body('options').isArray({ min: 2 }),
  body('correctAnswer').isInt({ min: 0 }),
  body('points').optional().isInt({ min: 1 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const test = await Test.findByPk(req.params.id);

    if (!test) {
      return res.status(404).json({ message: 'Test not found' });
    }

    // Проверка прав
    if (test.createdBy !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const { questionText, questionImage, options, correctAnswer, explanation, points } = req.body;

    if (correctAnswer < 0 || correctAnswer >= options.length) {
      return res.status(400).json({ message: 'Invalid correctAnswer index' });
    }

    const question = await Question.create({
      testId: test.id,
      questionText,
      questionImage,
      options,
      correctAnswer,
      explanation,
      points: points || 1,
      createdBy: req.user.id
    });

    res.status(201).json(question);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   PUT /api/admin/questions/:id
// @desc    Update question (Admin/Repetitor)
// @access  Repetitor, Admin
router.put('/questions/:id', repetitorAuth, async (req, res) => {
  try {
    const question = await Question.findByPk(req.params.id, {
      include: [{ model: Test, as: 'test' }]
    });

    if (!question) {
      return res.status(404).json({ message: 'Question not found' });
    }

    // Проверка прав
    if (question.createdBy !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const { questionText, questionImage, options, correctAnswer, explanation, points } = req.body;

    if (correctAnswer !== undefined && (correctAnswer < 0 || correctAnswer >= options.length)) {
      return res.status(400).json({ message: 'Invalid correctAnswer index' });
    }

    await question.update({
      questionText: questionText || question.questionText,
      questionImage: questionImage !== undefined ? questionImage : question.questionImage,
      options: options || question.options,
      correctAnswer: correctAnswer !== undefined ? correctAnswer : question.correctAnswer,
      explanation: explanation !== undefined ? explanation : question.explanation,
      points: points || question.points
    });

    res.json(question);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   DELETE /api/admin/questions/:id
// @desc    Delete question (Admin/Repetitor)
// @access  Repetitor, Admin
router.delete('/questions/:id', repetitorAuth, async (req, res) => {
  try {
    const question = await Question.findByPk(req.params.id);

    if (!question) {
      return res.status(404).json({ message: 'Question not found' });
    }

    // Проверка прав
    if (question.createdBy !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    await question.destroy();
    res.json({ message: 'Question deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/admin/statistics
// @desc    Get platform statistics (Admin only)
// @access  Admin
router.get('/statistics', adminAuth, async (req, res) => {
  try {
    const totalUsers = await User.count();
    const totalTests = await Test.count();
    const totalResults = await TestResult.count();
    const activeSubscriptions = await Subscription.count({
      where: {
        status: 'active',
        endDate: { [Op.gt]: new Date() }
      }
    });

    res.json({
      totalUsers,
      totalTests,
      totalResults,
      activeSubscriptions
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
