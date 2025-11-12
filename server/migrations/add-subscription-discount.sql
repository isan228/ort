-- Миграция: Добавление колонки discountAmount в таблицу Subscriptions
-- Дата: 2025-11-12
-- Описание: Добавляет колонку discountAmount для хранения суммы скидки

DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'Subscriptions' AND column_name = 'discountAmount'
    ) THEN
        ALTER TABLE "Subscriptions" ADD COLUMN "discountAmount" DECIMAL(10, 2) NOT NULL DEFAULT 0;
        RAISE NOTICE 'Колонка discountAmount добавлена в таблицу Subscriptions';
    ELSE
        RAISE NOTICE 'Колонка discountAmount уже существует';
    END IF;
END $$;
