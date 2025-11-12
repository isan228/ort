require('dotenv').config();
const sequelize = require('./config/database');
const { Op } = require('sequelize');
const { User } = require('./models');

/**
 * Миграция для обновления поля phone в базе данных
 * 
 * Эта миграция:
 * 1. Проверяет существующих пользователей без телефона
 * 2. Генерирует временные телефоны для пользователей без телефона
 * 3. Обновляет структуру таблицы (phone становится обязательным и уникальным)
 * 
 * ВАЖНО: Запустите этот скрипт перед синхронизацией БД с новыми изменениями модели
 */

const migratePhoneField = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Подключение к базе данных установлено.');

    // Проверяем текущую структуру таблицы
    const [results] = await sequelize.query(`
      SELECT column_name, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'Users' AND column_name = 'phone';
    `);

    if (results.length === 0) {
      console.log('❌ Колонка phone не найдена в таблице Users.');
      console.log('   Возможно, таблица еще не создана. Запустите сначала sync-db.js');
      return;
    }

    const phoneColumn = results[0];
    console.log(`📊 Текущее состояние колонки phone:`);
    console.log(`   - is_nullable: ${phoneColumn.is_nullable}`);
    console.log(`   - column_default: ${phoneColumn.column_default || 'null'}`);

    // Проверяем пользователей без телефона
    const usersWithoutPhone = await User.findAll({
      where: {
        [Op.or]: [
          { phone: null },
          { phone: '' }
        ]
      }
    });

    console.log(`\n📋 Найдено пользователей без телефона: ${usersWithoutPhone.length}`);

    if (usersWithoutPhone.length > 0) {
      console.log('\n⚠️  Обнаружены пользователи без телефона. Генерируем временные телефоны...');
      
      for (const user of usersWithoutPhone) {
        // Генерируем временный телефон на основе email или ID
        let tempPhone;
        if (user.email) {
          // Используем email как основу для временного телефона
          tempPhone = `+996${String(Math.abs(user.email.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0))).slice(0, 9)}`;
        } else {
          // Используем ID пользователя
          tempPhone = `+996${String(Math.abs(user.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0))).slice(0, 9)}`;
        }
        
        // Убеждаемся, что телефон уникален
        let finalPhone = tempPhone;
        let counter = 1;
        while (await User.findOne({ where: { phone: finalPhone } })) {
          finalPhone = `${tempPhone}${counter}`;
          counter++;
        }

        await user.update({ phone: finalPhone });
        console.log(`   ✅ Пользователь ${user.firstName} ${user.lastName} (${user.email || user.id}): установлен телефон ${finalPhone}`);
      }
    }

    // Проверяем дубликаты телефонов
    const [duplicates] = await sequelize.query(`
      SELECT phone, COUNT(*) as count
      FROM "Users"
      WHERE phone IS NOT NULL AND phone != ''
      GROUP BY phone
      HAVING COUNT(*) > 1;
    `);

    if (duplicates.length > 0) {
      console.log(`\n⚠️  Обнаружены дубликаты телефонов: ${duplicates.length} групп`);
      
      for (const dup of duplicates) {
        const usersWithSamePhone = await User.findAll({
          where: { phone: dup.phone },
          order: [['createdAt', 'ASC']]
        });

        // Оставляем первый пользователя с оригинальным телефоном
        // Остальным добавляем суффикс
        for (let i = 1; i < usersWithSamePhone.length; i++) {
          const user = usersWithSamePhone[i];
          let newPhone = `${dup.phone}${i}`;
          
          // Убеждаемся, что новый телефон уникален
          let counter = 1;
          while (await User.findOne({ where: { phone: newPhone } })) {
            newPhone = `${dup.phone}${counter}`;
            counter++;
          }

          await user.update({ phone: newPhone });
          console.log(`   ✅ Пользователь ${user.firstName} ${user.lastName}: телефон изменен на ${newPhone}`);
        }
      }
    }

    // Теперь обновляем структуру таблицы
    console.log('\n🔄 Обновление структуры таблицы...');

    // Делаем phone обязательным (NOT NULL)
    await sequelize.query(`
      ALTER TABLE "Users"
      ALTER COLUMN phone SET NOT NULL;
    `);

    // Создаем уникальный индекс для phone (если его еще нет)
    try {
      await sequelize.query(`
        CREATE UNIQUE INDEX IF NOT EXISTS "Users_phone_unique" ON "Users" (phone);
      `);
      console.log('   ✅ Уникальный индекс для phone создан');
    } catch (error) {
      if (error.message.includes('already exists')) {
        console.log('   ℹ️  Уникальный индекс для phone уже существует');
      } else {
        throw error;
      }
    }

    // Делаем email опциональным (убираем NOT NULL, если был)
    try {
      await sequelize.query(`
        ALTER TABLE "Users"
        ALTER COLUMN email DROP NOT NULL;
      `);
      console.log('   ✅ Колонка email теперь опциональная');
    } catch (error) {
      console.log('   ℹ️  Колонка email уже опциональная или не существует');
    }

    // Убираем уникальный индекс для email (если был)
    try {
      await sequelize.query(`
        DROP INDEX IF EXISTS "Users_email_unique";
      `);
      console.log('   ✅ Уникальный индекс для email удален');
    } catch (error) {
      console.log('   ℹ️  Уникальный индекс для email не найден');
    }

    console.log('\n✅ Миграция завершена успешно!');
    console.log('\n📝 Следующие шаги:');
    console.log('   1. Запустите sync-db.js с параметром "alter" для синхронизации модели');
    console.log('   2. Проверьте, что все пользователи имеют корректные телефоны');
    console.log('   3. Уведомите пользователей с временными телефонами о необходимости обновить их');

  } catch (error) {
    console.error('❌ Ошибка при миграции:', error);
    throw error;
  } finally {
    await sequelize.close();
    console.log('\n📴 Соединение с базой данных закрыто.');
  }
};

// Запуск миграции
migratePhoneField()
  .then(() => {
    console.log('\n✅ Миграция успешно завершена!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Миграция завершилась с ошибкой:', error);
    process.exit(1);
  });

