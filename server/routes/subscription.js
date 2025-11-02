const express = require('express');
const { Subscription, User } = require('../models');
const { auth } = require('../middleware/auth');
const { Op } = require('sequelize');

const router = express.Router();

// Все роуты требуют аутентификации
router.use(auth);

// @route   GET /api/subscription
// @desc    Get user subscription
// @access  Private
router.get('/', async (req, res) => {
  try {
    const subscription = await Subscription.findOne({
      where: {
        userId: req.user.id,
        status: 'active'
      },
      order: [['endDate', 'DESC']]
    });

    res.json(subscription);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   POST /api/subscription
// @desc    Create/activate subscription
// @access  Private
router.post('/', async (req, res) => {
  try {
    const { paymentId, duration = 30 } = req.body; // duration в днях

    // Деактивация старой подписки
    await Subscription.update(
      { status: 'expired' },
      {
        where: {
          userId: req.user.id,
          status: 'active'
        }
      }
    );

    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + duration);

    const subscription = await Subscription.create({
      userId: req.user.id,
      status: 'active',
      startDate,
      endDate,
      paymentId
    });

    res.status(201).json(subscription);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   PUT /api/subscription/auto-renew
// @desc    Toggle auto-renew
// @access  Private
router.put('/auto-renew', async (req, res) => {
  try {
    const { autoRenew } = req.body;

    const subscription = await Subscription.findOne({
      where: {
        userId: req.user.id,
        status: 'active'
      }
    });

    if (!subscription) {
      return res.status(404).json({ message: 'Active subscription not found' });
    }

    subscription.autoRenew = autoRenew;
    await subscription.save();

    res.json(subscription);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/subscription/history
// @desc    Get subscription history
// @access  Private
router.get('/history', async (req, res) => {
  try {
    const subscriptions = await Subscription.findAll({
      where: { userId: req.user.id },
      order: [['createdAt', 'DESC']]
    });

    res.json(subscriptions);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;

