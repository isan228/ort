const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Specialty = sequelize.define('Specialty', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  universityId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'Universities',
      key: 'id'
    }
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  nameKg: {
    type: DataTypes.STRING,
    allowNull: true
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  averageScore: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: false,
    comment: 'Average ORT score required for admission'
  },
  minScore: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: true,
    comment: 'Minimum ORT score required'
  },
  maxScore: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: true,
    comment: 'Maximum ORT score (for reference)'
  },
  duration: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'Duration of study in years'
  },
  degree: {
    type: DataTypes.ENUM('bachelor', 'master', 'phd'),
    defaultValue: 'bachelor'
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  createdBy: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'Users',
      key: 'id'
    }
  }
});

module.exports = Specialty;

