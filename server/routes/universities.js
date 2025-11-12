const express = require('express');
const { University, Specialty, User, TestResult, Test, Subscription } = require('../models');
const { auth, optionalAuth } = require('../middleware/auth');
const { Op } = require('sequelize');

const router = express.Router();

// @route   GET /api/universities
// @desc    Get all universities with specialties
// @access  Public
router.get('/', async (req, res) => {
  try {
    const universities = await University.findAll({
      where: { isActive: true },
      include: [{
        model: Specialty,
        as: 'specialties',
        where: { isActive: true },
        required: false
      }],
      order: [['name', 'ASC']]
    });

    res.json(universities);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/universities/:id
// @desc    Get university by ID with specialties and admission chances
// @access  Public (admission chances only for authenticated users with subscription)
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const university = await University.findByPk(req.params.id, {
      include: [{
        model: Specialty,
        as: 'specialties',
        where: { isActive: true },
        required: false,
        order: [['averageScore', 'ASC']]
      }]
    });

    if (!university) {
      return res.status(404).json({ message: 'University not found' });
    }

    // Проверяем подписку пользователя (если авторизован)
    let admissionChances = null;
    if (req.user) {
      const subscription = await Subscription.findOne({
        where: {
          userId: req.user.id,
          status: 'active',
          endDate: { [Op.gte]: new Date() }
        }
      });

      if (subscription) {
      // Получаем результат основного ОРТ теста
      const mainORTTest = await Test.findOne({
        where: { isMainORT: true, isActive: true }
      });

      if (mainORTTest) {
        const ortResult = await TestResult.findOne({
          where: {
            userId: req.user.id,
            testId: mainORTTest.id
          },
          order: [['completedAt', 'DESC']]
        });

        if (ortResult) {
          // Рассчитываем шансы поступления для каждого направления
          admissionChances = university.specialties.map(specialty => {
            const userScore = parseFloat(ortResult.score);
            const avgScore = parseFloat(specialty.averageScore);
            const minScore = specialty.minScore ? parseFloat(specialty.minScore) : avgScore - 20;
            
            let chance = 0;
            if (userScore >= avgScore) {
              chance = 100; // Высокий шанс
            } else if (userScore >= minScore) {
              // Линейная интерполяция между minScore и avgScore
              const range = avgScore - minScore;
              const position = (userScore - minScore) / range;
              chance = Math.round(50 + (position * 50)); // От 50% до 100%
            } else if (userScore >= minScore - 20) {
              // Низкий шанс
              const range = 20;
              const position = (userScore - (minScore - 20)) / range;
              chance = Math.round(position * 50); // От 0% до 50%
            }

            return {
              specialtyId: specialty.id,
              specialtyName: specialty.name,
              userScore: userScore,
              requiredScore: avgScore,
              minScore: minScore,
              chance: Math.max(0, Math.min(100, chance)),
              status: userScore >= avgScore ? 'high' : userScore >= minScore ? 'medium' : 'low'
            };
          });
        }
      }
      }
    }

    res.json({
      ...university.toJSON(),
      admissionChances
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/universities/:id/specialties/:specialtyId
// @desc    Get specialty details with admission chance
// @access  Public (admission chance only for authenticated users with subscription)
router.get('/:id/specialties/:specialtyId', optionalAuth, async (req, res) => {
  try {
    const specialty = await Specialty.findByPk(req.params.specialtyId, {
      include: [{
        model: University,
        as: 'university'
      }]
    });

    if (!specialty) {
      return res.status(404).json({ message: 'Specialty not found' });
    }

    // Проверяем подписку (если авторизован)
    let admissionChance = null;
    if (req.user) {
      const subscription = await Subscription.findOne({
        where: {
          userId: req.user.id,
          status: 'active',
          endDate: { [Op.gte]: new Date() }
        }
      });

      if (subscription) {
      const mainORTTest = await Test.findOne({
        where: { isMainORT: true, isActive: true }
      });

      if (mainORTTest) {
        const ortResult = await TestResult.findOne({
          where: {
            userId: req.user.id,
            testId: mainORTTest.id
          },
          order: [['completedAt', 'DESC']]
        });

        if (ortResult) {
          const userScore = parseFloat(ortResult.score);
          const avgScore = parseFloat(specialty.averageScore);
          const minScore = specialty.minScore ? parseFloat(specialty.minScore) : avgScore - 20;
          
          let chance = 0;
          if (userScore >= avgScore) {
            chance = 100;
          } else if (userScore >= minScore) {
            const range = avgScore - minScore;
            const position = (userScore - minScore) / range;
            chance = Math.round(50 + (position * 50));
          } else if (userScore >= minScore - 20) {
            const range = 20;
            const position = (userScore - (minScore - 20)) / range;
            chance = Math.round(position * 50);
          }

          admissionChance = {
            userScore: userScore,
            requiredScore: avgScore,
            minScore: minScore,
            chance: Math.max(0, Math.min(100, chance)),
            status: userScore >= avgScore ? 'high' : userScore >= minScore ? 'medium' : 'low'
          };
        }
      }
      }
    }

    res.json({
      ...specialty.toJSON(),
      admissionChance
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;

