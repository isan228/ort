#!/usr/bin/env node

/**
 * Скрипт для проверки подключения к базе данных
 * Использование: node test-db-connection.js
 */

require('dotenv').config();
const { Sequelize } = require('sequelize');

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 5432,
    dialect: 'postgres',
    logging: console.log
  }
);

async function testConnection() {
  try {
    console.log('🔌 Попытка подключения к базе данных...');
    console.log('📋 Параметры подключения:');
    console.log(`   Host: ${process.env.DB_HOST || 'localhost'}`);
    console.log(`   Port: ${process.env.DB_PORT || 5432}`);
    console.log(`   Database: ${process.env.DB_NAME}`);
    console.log(`   User: ${process.env.DB_USER}`);
    console.log(`   Password: ${process.env.DB_PASSWORD ? '***' : 'НЕ УСТАНОВЛЕН'}`);
    console.log('');

    await sequelize.authenticate();
    console.log('✅ Подключение к базе данных установлено успешно!');
    
    // Проверка версии PostgreSQL
    const [results] = await sequelize.query('SELECT version();');
    console.log('📊 Версия PostgreSQL:', results[0].version);
    
    await sequelize.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Ошибка при подключении к базе данных:');
    console.error('');
    
    if (error.name === 'SequelizeConnectionError') {
      console.error('🔍 Тип ошибки: Ошибка подключения');
      if (error.original) {
        console.error('📝 Детали:', error.original.message);
        
        // Проверка типичных проблем
        if (error.original.code === '28P01') {
          console.error('');
          console.error('⚠️  ПРОБЛЕМА: Неверное имя пользователя или пароль');
          console.error('💡 РЕШЕНИЕ:');
          console.error('   1. Проверьте DB_USER и DB_PASSWORD в server/.env');
          console.error('   2. Убедитесь, что пользователь существует в PostgreSQL:');
          console.error('      sudo -u postgres psql -c "\\du"');
          console.error('   3. Проверьте пароль пользователя:');
          console.error('      sudo -u postgres psql -c "ALTER USER ' + process.env.DB_USER + ' WITH PASSWORD \'your_password\';"');
        } else if (error.original.code === '3D000') {
          console.error('');
          console.error('⚠️  ПРОБЛЕМА: База данных не существует');
          console.error('💡 РЕШЕНИЕ: Создайте базу данных:');
          console.error('      sudo -u postgres psql -c "CREATE DATABASE ' + process.env.DB_NAME + ';"');
        } else if (error.original.code === 'ENOTFOUND' || error.original.code === 'ECONNREFUSED') {
          console.error('');
          console.error('⚠️  ПРОБЛЕМА: Не удается подключиться к серверу PostgreSQL');
          console.error('💡 РЕШЕНИЕ:');
          console.error('   1. Проверьте, что PostgreSQL запущен: sudo systemctl status postgresql');
          console.error('   2. Проверьте DB_HOST в server/.env (должен быть localhost или 127.0.0.1)');
          console.error('   3. Проверьте DB_PORT (должен быть 5432 по умолчанию)');
        }
      }
    } else {
      console.error('📝 Ошибка:', error.message);
    }
    
    console.error('');
    console.error('🔧 Полная информация об ошибке:');
    console.error(error);
    
    await sequelize.close().catch(() => {});
    process.exit(1);
  }
}

testConnection();

