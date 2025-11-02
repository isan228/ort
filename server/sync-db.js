#!/usr/bin/env node

/**
 * Скрипт для синхронизации базы данных
 * Использование: node sync-db.js [force|alter]
 */

require('dotenv').config();
const sequelize = require('./config/database');

// Загружаем все модели для установки ассоциаций
require('./models');

const syncOption = process.argv[2] || 'alter';

async function syncDatabase() {
  try {
    console.log('🔌 Подключение к базе данных...');
    await sequelize.authenticate();
    console.log('✅ Подключение к базе данных установлено');

    const options = {};
    if (syncOption === 'force') {
      console.log('⚠️  ВНИМАНИЕ: Будет выполнена полная пересоздание таблиц (force)');
      options.force = true;
    } else if (syncOption === 'alter') {
      console.log('📝 Синхронизация схемы базы данных (alter)...');
      options.alter = true;
    } else {
      console.log('📝 Синхронизация схемы базы данных...');
    }

    await sequelize.sync(options);
    console.log('✅ База данных успешно синхронизирована');

    await sequelize.close();
    console.log('🔌 Соединение закрыто');
    process.exit(0);
  } catch (error) {
    console.error('❌ Ошибка при синхронизации базы данных:', error);
    process.exit(1);
  }
}

syncDatabase();

