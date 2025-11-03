# Руководство по миграции базы данных

## Важные изменения в модели User

В последней версии произошли следующие изменения в модели `User`:

1. **Поле `phone`** теперь:
   - ✅ Обязательное (`allowNull: false`)
   - ✅ Уникальное (`unique: true`)

2. **Поле `email`** теперь:
   - ✅ Опциональное (`allowNull: true`)
   - ✅ Не уникальное (`unique: false`)

## Проблемы при обновлении

Если у вас уже есть база данных с пользователями, возможны следующие проблемы:

### ❌ Проблема 1: Пользователи без телефона
Если в БД есть пользователи с `phone = null` или пустым телефоном, при синхронизации будет ошибка:
```
ERROR: null value in column "phone" violates not-null constraint
```

### ❌ Проблема 2: Дубликаты телефонов
Если у нескольких пользователей одинаковый телефон, будет ошибка уникальности:
```
ERROR: duplicate key value violates unique constraint "Users_phone_unique"
```

## Решение: Миграция базы данных

### Шаг 1: Запустите скрипт миграции

```bash
cd server
node migrate-phone-field.js
```

Этот скрипт автоматически:
1. ✅ Найдет всех пользователей без телефона
2. ✅ Сгенерирует временные телефоны для них
3. ✅ Исправит дубликаты телефонов
4. ✅ Обновит структуру таблицы:
   - Сделает `phone` обязательным и уникальным
   - Сделает `email` опциональным

### Шаг 2: Проверьте результаты

После миграции проверьте:
- Все ли пользователи получили телефоны
- Нет ли дубликатов

```bash
# В psql или через pgAdmin
SELECT phone, COUNT(*) FROM "Users" GROUP BY phone HAVING COUNT(*) > 1;
# Должен вернуть 0 строк (нет дубликатов)

SELECT COUNT(*) FROM "Users" WHERE phone IS NULL OR phone = '';
# Должен вернуть 0 (нет пользователей без телефона)
```

### Шаг 3: Синхронизируйте модель

```bash
node sync-db.js alter
```

### Шаг 4: Уведомите пользователей

Если миграция создала временные телефоны, пользователи должны:
1. Войти в систему (через старый способ, если есть)
2. Обновить свой профиль с реальным номером телефона

## Вариант 2: Ручная миграция (для опытных)

Если вы предпочитаете сделать миграцию вручную:

```sql
-- 1. Заполните пустые телефоны
UPDATE "Users" 
SET phone = '+996' || LPAD(CAST(ABS(HASHTEXT(email)) AS TEXT), 9, '0')
WHERE phone IS NULL OR phone = '';

-- 2. Исправьте дубликаты (оставьте первый, остальным добавьте суффикс)
WITH duplicates AS (
  SELECT phone, ROW_NUMBER() OVER (PARTITION BY phone ORDER BY "createdAt") as rn
  FROM "Users"
  WHERE phone IN (
    SELECT phone FROM "Users" 
    GROUP BY phone 
    HAVING COUNT(*) > 1
  )
)
UPDATE "Users" u
SET phone = u.phone || '_' || d.rn
FROM duplicates d
WHERE u.phone = d.phone AND d.rn > 1;

-- 3. Сделайте phone обязательным
ALTER TABLE "Users" ALTER COLUMN phone SET NOT NULL;

-- 4. Создайте уникальный индекс
CREATE UNIQUE INDEX IF NOT EXISTS "Users_phone_unique" ON "Users" (phone);

-- 5. Сделайте email опциональным
ALTER TABLE "Users" ALTER COLUMN email DROP NOT NULL;

-- 6. Удалите уникальный индекс для email
DROP INDEX IF EXISTS "Users_email_unique";
```

## Откат изменений (если нужно)

Если нужно откатить изменения:

```sql
-- Убрать NOT NULL с phone
ALTER TABLE "Users" ALTER COLUMN phone DROP NOT NULL;

-- Удалить уникальный индекс для phone
DROP INDEX IF EXISTS "Users_phone_unique";

-- Вернуть уникальность для email
CREATE UNIQUE INDEX IF NOT EXISTS "Users_email_unique" ON "Users" (email);

-- Сделать email обязательным (если нужно)
ALTER TABLE "Users" ALTER COLUMN email SET NOT NULL;
```

## Проверка после миграции

```bash
# Проверьте подключение
node test-db-connection.js

# Проверьте структуру таблицы
# В psql:
\d "Users"

# Должно показать:
# phone | character varying | NOT NULL | UNIQUE
# email | character varying | NULL     | (без UNIQUE)
```

## Часто задаваемые вопросы

### Q: Что делать, если у пользователя нет телефона?
A: Миграция автоматически создаст временный телефон на основе email или ID. Пользователь должен будет обновить его позже.

### Q: Что если у пользователя нет ни телефона, ни email?
A: Миграция создаст временный телефон на основе ID пользователя.

### Q: Безопасно ли запускать миграцию на продакшене?
A: Да, но сначала сделайте резервную копию базы данных:
```bash
pg_dump -U ort_user -d ort_testing > backup_$(date +%Y%m%d_%H%M%S).sql
```

### Q: Можно ли запустить миграцию несколько раз?
A: Да, скрипт идемпотентный и безопасно запускать несколько раз.

