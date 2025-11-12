const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const MonthlyRanking = sequelize.define('MonthlyRanking', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'Users',
      key: 'id'
    }
  },
  month: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: 'Month number (1-12)'
  },
  year: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  rank: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: 'User rank in this month'
  },
  avgScore: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0
  },
  totalTests: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0
  },
  type: {
    type: DataTypes.ENUM('school', 'region', 'country'),
    allowNull: false,
    defaultValue: 'country'
  },
  bonusAwarded: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    comment: 'Whether 1000 coins bonus was awarded for first place'
  }
}, {
  indexes: [
    {
      unique: true,
      fields: ['userId', 'month', 'year', 'type']
    }
  ]
});

module.exports = MonthlyRanking;

