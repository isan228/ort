const express = require('express');
const multer = require('multer');
const pdfParse = require('pdf-parse');
const { User, Test, Question, Subject, TestResult, Subscription, University, Specialty } = require('../models');
const { auth, adminAuth, repetitorAuth } = require('../middleware/auth');
const { body, validationResult } = require('express-validator');
const { Op } = require('sequelize');
const path = require('path');
const fs = require('fs');

const router = express.Router();

// Настройка multer для загрузки PDF
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'test-' + uniqueSuffix + '.pdf');
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Только PDF файлы разрешены'), false);
    }
  }
});

// Функция для парсинга PDF и извлечения вопросов
const parsePDFQuestions = (pdfText) => {
  const questions = [];
  // Нормализуем текст: убираем лишние пробелы, объединяем строки
  const normalizedText = pdfText.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const lines = normalizedText.split('\n').map(line => line.trim()).filter(line => line.length > 2);
  
  let currentQuestion = null;
  let currentOptions = [];
  let questionNumber = 0;
  let inQuestion = false;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Определение начала вопроса (номер вопроса: 1., 1), 1) и т.д.)
    const questionMatch = line.match(/^(\d+)[\.\)]\s*(.+)$/i);
    if (questionMatch) {
      // Сохраняем предыдущий вопрос, если есть
      if (currentQuestion && currentOptions.length >= 2) {
        const correctIndex = currentOptions.findIndex(opt => opt.isCorrect);
        const finalCorrectIndex = correctIndex >= 0 ? correctIndex : 0;
        
        questions.push({
          questionText: currentQuestion.trim(),
          options: currentOptions.map(opt => ({ text: opt.text.trim(), isCorrect: false })),
          correctAnswer: finalCorrectIndex,
          explanation: ''
        });
      }
      
      questionNumber = parseInt(questionMatch[1]);
      currentQuestion = questionMatch[2];
      currentOptions = [];
      inQuestion = true;
      continue;
    }
    
    // Определение вариантов ответа (A., B., C., D. или 1., 2., 3., 4. или a), b), c), d))
    const optionMatch = line.match(/^([A-Da-d]|[1-4])[\.\)]\s*(.+)$/i);
    if (optionMatch && currentQuestion) {
      const optionText = optionMatch[2];
      // Проверяем, является ли это правильным ответом
      const isCorrect = optionText.includes('*') || 
                       /правильный|верный|correct|✓|true/i.test(optionText) ||
                       optionText.trim().endsWith('*');
      
      const cleanText = optionText.replace(/\*/g, '').replace(/правильный|верный|correct|✓/gi, '').trim();
      
      if (cleanText.length > 0) {
        currentOptions.push({
          text: cleanText,
          isCorrect: isCorrect
        });
      }
      continue;
    }
    
    // Если это продолжение вопроса или варианта
    if (inQuestion && currentQuestion) {
      if (currentOptions.length > 0) {
        // Продолжение последнего варианта
        const lastOption = currentOptions[currentOptions.length - 1];
        // Убираем маркеры правильности из продолжения
        const cleanLine = line.replace(/\*/g, '').replace(/правильный|верный|correct|✓/gi, '').trim();
        if (cleanLine.length > 0) {
          lastOption.text += ' ' + cleanLine;
        }
      } else {
        // Продолжение вопроса
        currentQuestion += ' ' + line;
      }
    }
  }
  
  // Сохраняем последний вопрос
  if (currentQuestion && currentOptions.length >= 2) {
    const correctIndex = currentOptions.findIndex(opt => opt.isCorrect);
    const finalCorrectIndex = correctIndex >= 0 ? correctIndex : 0;
    
    questions.push({
      questionText: currentQuestion.trim(),
      options: currentOptions.map(opt => ({ text: opt.text.trim(), isCorrect: false })),
      correctAnswer: finalCorrectIndex,
      explanation: ''
    });
  }
  
  return questions;
};

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

// @route   POST /api/admin/tests/upload-pdf
// @desc    Upload PDF and create test with questions (Admin/Repetitor)
// @access  Repetitor, Admin
router.post('/tests/upload-pdf', repetitorAuth, upload.single('pdf'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'PDF файл не загружен' });
    }

    const { subjectId, title, description, isFree, timeLimit, maxScore } = req.body;

    if (!subjectId || !title) {
      // Удаляем загруженный файл
      fs.unlinkSync(req.file.path);
      return res.status(400).json({ message: 'subjectId и title обязательны' });
    }

    // Читаем и парсим PDF
    const pdfBuffer = fs.readFileSync(req.file.path);
    const pdfData = await pdfParse(pdfBuffer);
    
    // Парсим вопросы из текста PDF
    const parsedQuestions = parsePDFQuestions(pdfData.text);
    
    if (parsedQuestions.length === 0) {
      fs.unlinkSync(req.file.path);
      return res.status(400).json({ 
        message: 'Не удалось извлечь вопросы из PDF. Убедитесь, что PDF содержит вопросы в правильном формате.',
        pdfText: pdfData.text.substring(0, 500) // Первые 500 символов для отладки
      });
    }

    // Создаем тест
    const test = await Test.create({
      subjectId,
      title,
      description: description || '',
      isFree: isFree === 'true' || isFree === true,
      timeLimit: timeLimit ? parseInt(timeLimit) : null,
      maxScore: maxScore ? parseInt(maxScore) : parsedQuestions.length * 10,
      createdBy: req.user.id
    });

    // Создаем вопросы
    const createdQuestions = [];
    for (const questionData of parsedQuestions) {
      const question = await Question.create({
        testId: test.id,
        questionText: questionData.questionText,
        options: questionData.options,
        correctAnswer: questionData.correctAnswer,
        explanation: questionData.explanation || '',
        points: 10,
        createdBy: req.user.id
      });
      createdQuestions.push(question);
    }

    // Удаляем временный файл
    fs.unlinkSync(req.file.path);

    const createdTest = await Test.findByPk(test.id, {
      include: [
        { model: Subject, as: 'subject' },
        { model: User, as: 'creator', attributes: ['id', 'firstName', 'lastName'] }
      ]
    });

    res.status(201).json({
      test: createdTest,
      questions: createdQuestions,
      message: `Тест создан с ${createdQuestions.length} вопросами`
    });
  } catch (error) {
    console.error('PDF upload error:', error);
    
    // Удаляем файл в случае ошибки
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    
    res.status(500).json({ 
      message: 'Ошибка при обработке PDF', 
      error: error.message 
    });
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

// ==================== Universities Management ====================

// @route   GET /api/admin/universities
// @desc    Get all universities (Admin)
// @access  Admin
router.get('/universities', adminAuth, async (req, res) => {
  try {
    const universities = await University.findAll({
      include: [{
        model: Specialty,
        as: 'specialties'
      }],
      order: [['name', 'ASC']]
    });

    res.json(universities);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   POST /api/admin/universities
// @desc    Create university (Admin)
// @access  Admin
router.post('/universities', adminAuth, [
  body('name').notEmpty(),
  body('description').optional()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, nameKg, description, photo, address, website, phone, email } = req.body;

    const university = await University.create({
      name,
      nameKg,
      description,
      photo: photo || null,
      address,
      website,
      phone,
      email,
      createdBy: req.user.id
    });

    res.status(201).json(university);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   PUT /api/admin/universities/:id
// @desc    Update university (Admin)
// @access  Admin
router.put('/universities/:id', adminAuth, async (req, res) => {
  try {
    const university = await University.findByPk(req.params.id);
    if (!university) {
      return res.status(404).json({ message: 'University not found' });
    }

    const { name, nameKg, description, photo, address, website, phone, email, isActive } = req.body;

    await university.update({
      name: name || university.name,
      nameKg: nameKg !== undefined ? nameKg : university.nameKg,
      description: description !== undefined ? description : university.description,
      photo: photo !== undefined ? photo : university.photo,
      address: address !== undefined ? address : university.address,
      website: website !== undefined ? website : university.website,
      phone: phone !== undefined ? phone : university.phone,
      email: email !== undefined ? email : university.email,
      isActive: isActive !== undefined ? isActive : university.isActive
    });

    res.json(university);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   DELETE /api/admin/universities/:id
// @desc    Delete university (Admin)
// @access  Admin
router.delete('/universities/:id', adminAuth, async (req, res) => {
  try {
    const university = await University.findByPk(req.params.id);
    if (!university) {
      return res.status(404).json({ message: 'University not found' });
    }

    await university.destroy();
    res.json({ message: 'University deleted' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// ==================== Specialties Management ====================

// @route   POST /api/admin/universities/:id/specialties
// @desc    Create specialty (Admin)
// @access  Admin
router.post('/universities/:id/specialties', adminAuth, [
  body('name').notEmpty(),
  body('averageScore').isFloat({ min: 0, max: 300 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const university = await University.findByPk(req.params.id);
    if (!university) {
      return res.status(404).json({ message: 'University not found' });
    }

    const { name, nameKg, description, averageScore, minScore, maxScore, duration, degree } = req.body;

    const specialty = await Specialty.create({
      universityId: university.id,
      name,
      nameKg,
      description,
      averageScore,
      minScore,
      maxScore,
      duration,
      degree: degree || 'bachelor',
      createdBy: req.user.id
    });

    res.status(201).json(specialty);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   PUT /api/admin/specialties/:id
// @desc    Update specialty (Admin)
// @access  Admin
router.put('/specialties/:id', adminAuth, async (req, res) => {
  try {
    const specialty = await Specialty.findByPk(req.params.id);
    if (!specialty) {
      return res.status(404).json({ message: 'Specialty not found' });
    }

    const { name, nameKg, description, averageScore, minScore, maxScore, duration, degree, isActive } = req.body;

    await specialty.update({
      name: name || specialty.name,
      nameKg: nameKg !== undefined ? nameKg : specialty.nameKg,
      description: description !== undefined ? description : specialty.description,
      averageScore: averageScore !== undefined ? averageScore : specialty.averageScore,
      minScore: minScore !== undefined ? minScore : specialty.minScore,
      maxScore: maxScore !== undefined ? maxScore : specialty.maxScore,
      duration: duration !== undefined ? duration : specialty.duration,
      degree: degree || specialty.degree,
      isActive: isActive !== undefined ? isActive : specialty.isActive
    });

    res.json(specialty);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   DELETE /api/admin/specialties/:id
// @desc    Delete specialty (Admin)
// @access  Admin
router.delete('/specialties/:id', adminAuth, async (req, res) => {
  try {
    const specialty = await Specialty.findByPk(req.params.id);
    if (!specialty) {
      return res.status(404).json({ message: 'Specialty not found' });
    }

    await specialty.destroy();
    res.json({ message: 'Specialty deleted' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
