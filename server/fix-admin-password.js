#!/usr/bin/env node

/**
 * Скрипт для исправления пароля админа
 * Использование: node fix-admin-password.js
 * 
 * Этот скрипт исправляет пароль админа, если он был создан с двойным хешированием
 */

require('dotenv').config();
const sequelize = require('./config/database');
const { Op } = require('sequelize');
const { User } = require('./models');

const fixAdminPassword = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Подключение к базе данных установлено');

    // Ищем админа по телефону или email
    let adminUser = await User.findOne({ 
      where: { 
        [Op.or]: [
          { phone: '+996555000000' },
          { email: 'admin@ort.test' },
          { role: 'admin' }
        ]
      }
    });

    if (!adminUser) {
      console.log('❌ Админ пользователь не найден');
      console.log('💡 Создайте админа через seed.js: node seed.js');
      return;
    }

    console.log('📋 Найден пользователь:');
    console.log(`   ID: ${adminUser.id}`);
    console.log(`   Телефон: ${adminUser.phone}`);
    console.log(`   Email: ${adminUser.email || 'не указан'}`);
    console.log(`   Роль: ${adminUser.role}`);
    console.log('');

    // Устанавливаем новый пароль (будет автоматически захеширован через хук модели)
    // Сначала нужно обойти хук, чтобы установить пароль напрямую
    const bcrypt = require('bcryptjs');
    const newPassword = 'admin123';
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Обновляем пароль напрямую в БД, минуя хук
    await sequelize.query(
      `UPDATE "Users" SET password = :password WHERE id = :id`,
      {
        replacements: { password: hashedPassword, id: adminUser.id },
        type: sequelize.QueryTypes.UPDATE
      }
    );

    // Обновляем роль на admin, если нужно
    if (adminUser.role !== 'admin') {
      adminUser.role = 'admin';
      await adminUser.save();
      console.log('✅ Роль обновлена на admin');
    }

    // Убеждаемся, что телефон установлен
    if (!adminUser.phone) {
      adminUser.phone = '+996555000000';
      await adminUser.save();
      console.log('✅ Телефон установлен: +996555000000');
    }

    console.log('');
    console.log('✅ Пароль админа исправлен!');
    console.log('');
    console.log('📝 Данные для входа:');
    console.log(`   Телефон: ${adminUser.phone || '+996555000000'}`);
    console.log(`   Пароль: ${newPassword}`);
    console.log('');
    console.log('💡 Теперь вы можете войти в систему с этими данными');

  } catch (error) {
    console.error('❌ Ошибка:', error);
    throw error;
  } finally {
    await sequelize.close();
    console.log('📴 Соединение с базой данных закрыто');
  }
};

fixAdminPassword()
  .then(() => {
    console.log('');
    console.log('✅ Готово!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('');
    console.error('❌ Ошибка:', error);
    process.exit(1);
  });

