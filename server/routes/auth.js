const express = require('express');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const { User, Subscription } = require('../models');
const { auth } = require('../middleware/auth');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const { Op } = require('sequelize');

const router = express.Router();

// Email transporter (настроить в .env)
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// @route   POST /api/auth/register
// @desc    Register user
// @access  Public
router.post('/register', [
  body('phone').notEmpty().trim(),
  body('password').isLength({ min: 6 }),
  body('firstName').notEmpty().trim(),
  body('lastName').notEmpty().trim(),
  body('email').optional().isEmail().normalizeEmail()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { phone, password, firstName, lastName, school, region, email } = req.body;

    const existingUser = await User.findOne({ where: { phone } });
    if (existingUser) {
      return res.status(400).json({ message: 'User with this phone number already exists' });
    }

    const verificationToken = crypto.randomBytes(32).toString('hex');
    const user = await User.create({
      phone,
      email: email || null,
      password,
      firstName,
      lastName,
      school,
      region,
      emailVerificationToken: verificationToken
    });

    // Отправка email для верификации (опционально, только если email указан)
    if (email) {
      const verificationUrl = `${process.env.FRONTEND_URL}/verify-email/${verificationToken}`;
      
      try {
        await transporter.sendMail({
          from: process.env.EMAIL_USER,
          to: email,
          subject: 'Подтверждение email',
          html: `<p>Пожалуйста, подтвердите ваш email: <a href="${verificationUrl}">${verificationUrl}</a></p>`
        });
      } catch (emailError) {
        console.error('Email sending error:', emailError);
      }
    }

    const token = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    res.status(201).json({
      token,
      user: {
        id: user.id,
        phone: user.phone,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        school: user.school,
        region: user.region,
        coins: user.coins || 0,
        referralCode: user.referralCode
      }
    });
  } catch (error) {
    console.error(error);
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({ message: 'Phone number already registered' });
    }
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   POST /api/auth/login
// @desc    Login user
// @access  Public
router.post('/login', [
  body('phone').notEmpty().trim(),
  body('password').exists()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { phone, password } = req.body;

    // Нормализуем телефон (убираем пробелы)
    const normalizedPhone = phone ? phone.trim().replace(/\s/g, '') : '';

    const user = await User.findOne({ where: { phone: normalizedPhone } });
    if (!user) {
      console.log(`Login attempt failed: User not found with phone: ${normalizedPhone}`);
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      console.log(`Login attempt failed: Password mismatch for user: ${user.phone}`);
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    res.json({
      token,
      user: {
        id: user.id,
        phone: user.phone,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        school: user.school,
        region: user.region,
        coins: user.coins || 0,
        referralCode: user.referralCode
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/auth/me
// @desc    Get current user
// @access  Private
router.get('/me', auth, async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: { exclude: ['password', 'emailVerificationToken', 'resetPasswordToken'] }
    });
    res.json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   POST /api/auth/forgot-password
// @desc    Forgot password
// @access  Public
router.post('/forgot-password', [
  body('phone').notEmpty().trim()
], async (req, res) => {
  try {
    const { phone } = req.body;
    const user = await User.findOne({ where: { phone } });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetExpires = new Date(Date.now() + 3600000); // 1 hour

    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = resetExpires;
    await user.save();

    // Если есть email, отправляем письмо, иначе возвращаем токен для SMS
    if (user.email) {
      const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;
      
      try {
        await transporter.sendMail({
          from: process.env.EMAIL_USER,
          to: user.email,
          subject: 'Восстановление пароля',
          html: `<p>Для восстановления пароля перейдите по ссылке: <a href="${resetUrl}">${resetUrl}</a></p>`
        });
      } catch (emailError) {
        console.error('Email sending error:', emailError);
      }
      
      res.json({ message: 'Password reset email sent' });
    } else {
      // В реальном приложении здесь должна быть отправка SMS с токеном
      res.json({ 
        message: 'Password reset token generated',
        token: resetToken // В продакшене не возвращаем токен, отправляем через SMS
      });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   POST /api/auth/register-with-payment
// @desc    Register user and create subscription after payment
// @access  Public
router.post('/register-with-payment', [
  body('phone').notEmpty().trim(),
  body('password').isLength({ min: 6 }),
  body('firstName').notEmpty().trim(),
  body('lastName').notEmpty().trim(),
  body('email').optional().isEmail().normalizeEmail(),
  body('paymentMethod').notEmpty(),
  body('paymentId').notEmpty()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { phone, password, firstName, lastName, school, region, email, paymentMethod, paymentId, duration = 30, referralCode } = req.body;

    // Проверка существующего пользователя
    const existingUser = await User.findOne({ where: { phone } });
    if (existingUser) {
      return res.status(400).json({ message: 'User with this phone number already exists' });
    }

    // Здесь должна быть проверка успешности оплаты через платежную систему
    // Для заглушки просто проверяем наличие paymentId
    if (!paymentId) {
      return res.status(400).json({ message: 'Payment verification failed' });
    }

    // Обработка реферального кода
    let referrer = null;
    let discountAmount = 0;
    if (referralCode) {
      referrer = await User.findOne({ where: { referralCode: referralCode.toUpperCase() } });
      if (referrer) {
        discountAmount = 100; // Скидка 100 сомов для реферала
      }
    }

    // Создание пользователя
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const user = await User.create({
      phone,
      email: email || null,
      password,
      firstName,
      lastName,
      school,
      region,
      emailVerificationToken: verificationToken,
      referredBy: referrer ? referrer.id : null
    });

    // Создание подписки
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + duration);

    const subscription = await Subscription.create({
      userId: user.id,
      status: 'active',
      startDate,
      endDate,
      paymentId: `${paymentMethod}_${paymentId}`,
      discountAmount: discountAmount
    });

    // Начисление бонусов рефереру (100 монет)
    if (referrer) {
      referrer.coins = (referrer.coins || 0) + 100;
      await referrer.save();
    }

    // Отправка email для верификации (опционально)
    if (email) {
      const verificationUrl = `${process.env.FRONTEND_URL}/verify-email/${verificationToken}`;
      
      try {
        await transporter.sendMail({
          from: process.env.EMAIL_USER,
          to: email,
          subject: 'Подтверждение email',
          html: `<p>Пожалуйста, подтвердите ваш email: <a href="${verificationUrl}">${verificationUrl}</a></p>`
        });
      } catch (emailError) {
        console.error('Email sending error:', emailError);
      }
    }

    const token = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    res.status(201).json({
      token,
      user: {
        id: user.id,
        phone: user.phone,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        school: user.school,
        region: user.region,
        coins: user.coins || 0,
        referralCode: user.referralCode
      },
      subscription: {
        id: subscription.id,
        status: subscription.status,
        startDate: subscription.startDate,
        endDate: subscription.endDate,
        discountAmount: subscription.discountAmount || 0
      }
    });
  } catch (error) {
    console.error(error);
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({ message: 'Phone number already registered' });
    }
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;

