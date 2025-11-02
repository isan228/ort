#!/usr/bin/env node

/**
 * Скрипт для проверки переменных окружения
 * Использование: node check-env.js
 */

require('dotenv').config();

console.log('📋 Текущие настройки в .env файле:');
console.log('');
console.log('Database Settings:');
console.log(`  DB_HOST: ${process.env.DB_HOST || '❌ НЕ УСТАНОВЛЕН'}`);
console.log(`  DB_PORT: ${process.env.DB_PORT || '5432 (по умолчанию)'}`);
console.log(`  DB_NAME: ${process.env.DB_NAME || '❌ НЕ УСТАНОВЛЕН'}`);
console.log(`  DB_USER: ${process.env.DB_USER || '❌ НЕ УСТАНОВЛЕН'}`);
console.log(`  DB_PASSWORD: ${process.env.DB_PASSWORD ? '***' : '❌ НЕ УСТАНОВЛЕН'}`);
console.log('');
console.log('Server Settings:');
console.log(`  PORT: ${process.env.PORT || '5000 (по умолчанию)'}`);
console.log(`  NODE_ENV: ${process.env.NODE_ENV || '❌ НЕ УСТАНОВЛЕН'}`);
console.log(`  JWT_SECRET: ${process.env.JWT_SECRET ? '***' : '❌ НЕ УСТАНОВЛЕН'}`);
console.log('');

// Проверка критических параметров
const errors = [];
const warnings = [];

if (!process.env.DB_NAME) {
  errors.push('❌ DB_NAME не установлен');
}
if (!process.env.DB_USER) {
  errors.push('❌ DB_USER не установлен');
}
if (!process.env.DB_PASSWORD) {
  errors.push('❌ DB_PASSWORD не установлен');
}
if (!process.env.JWT_SECRET) {
  errors.push('❌ JWT_SECRET не установлен');
}

if (process.env.DB_USER === 'root' || process.env.DB_USER === 'postgres') {
  warnings.push('⚠️  DB_USER установлен как "root" или "postgres"');
  warnings.push('   Рекомендуется использовать отдельного пользователя (например, ort_user)');
}

if (errors.length > 0) {
  console.log('❌ КРИТИЧЕСКИЕ ОШИБКИ:');
  errors.forEach(err => console.log(`   ${err}`));
  console.log('');
}

if (warnings.length > 0) {
  console.log('⚠️  ПРЕДУПРЕЖДЕНИЯ:');
  warnings.forEach(warn => console.log(`   ${warn}`));
  console.log('');
}

if (errors.length === 0 && warnings.length === 0) {
  console.log('✅ Все настройки выглядят правильно!');
} else if (errors.length === 0) {
  console.log('✅ Критических ошибок не обнаружено, но есть предупреждения.');
}

console.log('');
console.log('💡 Чтобы создать правильный .env файл:');
console.log('   1. cp env.example .env');
console.log('   2. nano .env');
console.log('   3. Установите правильные значения:');
console.log('      DB_USER=ort_user');
console.log('      DB_NAME=ort_testing');
console.log('      DB_PASSWORD=ваш_пароль_из_postgresql');

