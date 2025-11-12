-- Миграция: Добавление колонок для системы бонусов и рефералов
-- Дата: 2025-11-12
-- Описание: Добавляет колонки coins, referralCode и referredBy в таблицу Users

-- Добавление колонки coins (монеты пользователя)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'Users' AND column_name = 'coins'
    ) THEN
        ALTER TABLE "Users" ADD COLUMN "coins" INTEGER NOT NULL DEFAULT 0;
        RAISE NOTICE 'Колонка coins добавлена';
    ELSE
        RAISE NOTICE 'Колонка coins уже существует';
    END IF;
END $$;

-- Добавление колонки referralCode (реферальный код)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'Users' AND column_name = 'referralCode'
    ) THEN
        ALTER TABLE "Users" ADD COLUMN "referralCode" VARCHAR(255) UNIQUE;
        RAISE NOTICE 'Колонка referralCode добавлена';
    ELSE
        RAISE NOTICE 'Колонка referralCode уже существует';
    END IF;
END $$;

-- Добавление колонки referredBy (ID пользователя, который пригласил)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'Users' AND column_name = 'referredBy'
    ) THEN
        ALTER TABLE "Users" ADD COLUMN "referredBy" UUID;
        -- Добавление внешнего ключа
        ALTER TABLE "Users" 
        ADD CONSTRAINT "Users_referredBy_fkey" 
        FOREIGN KEY ("referredBy") 
        REFERENCES "Users"("id") 
        ON DELETE SET NULL;
        RAISE NOTICE 'Колонка referredBy добавлена';
    ELSE
        RAISE NOTICE 'Колонка referredBy уже существует';
    END IF;
END $$;

-- Генерация реферальных кодов для существующих пользователей, у которых их нет
DO $$ 
DECLARE
    user_record RECORD;
    new_code VARCHAR(255);
    code_exists BOOLEAN;
BEGIN
    FOR user_record IN SELECT id FROM "Users" WHERE "referralCode" IS NULL LOOP
        LOOP
            -- Генерируем случайный код (16 символов в hex = 8 байт)
            new_code := upper(substring(md5(random()::text || user_record.id::text) from 1 for 16));
            
            -- Проверяем уникальность
            SELECT EXISTS(SELECT 1 FROM "Users" WHERE "referralCode" = new_code) INTO code_exists;
            
            EXIT WHEN NOT code_exists;
        END LOOP;
        
        UPDATE "Users" SET "referralCode" = new_code WHERE id = user_record.id;
    END LOOP;
    
    RAISE NOTICE 'Реферальные коды сгенерированы для существующих пользователей';
END $$;

-- Создание индекса для быстрого поиска по referralCode
CREATE INDEX IF NOT EXISTS "Users_referralCode_idx" ON "Users"("referralCode");

-- Создание индекса для referredBy
CREATE INDEX IF NOT EXISTS "Users_referredBy_idx" ON "Users"("referredBy");

