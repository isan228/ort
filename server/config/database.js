const { Sequelize } = require('sequelize');
require('dotenv').config();

// Валидация обязательных переменных окружения
const requiredEnvVars = ['DB_NAME', 'DB_USER', 'DB_PASSWORD'];
const missingVars = requiredEnvVars.filter(varName => !process.env[varName] || process.env[varName].trim() === '');

if (missingVars.length > 0) {
  console.error('❌ ОШИБКА: Отсутствуют обязательные переменные окружения:');
  missingVars.forEach(varName => {
    console.error(`   - ${varName}`);
  });
  console.error('');
  console.error('💡 Решение:');
  console.error('   1. Убедитесь, что файл server/.env существует');
  console.error('   2. Скопируйте env.example в .env: cp env.example .env');
  console.error('   3. Заполните все обязательные поля в .env файле');
  console.error('');
  process.exit(1);
}

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    dialect: 'postgres',
    logging: false,
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  }
);

module.exports = sequelize;

