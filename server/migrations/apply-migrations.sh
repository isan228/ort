#!/bin/bash

# Скрипт для применения миграций на продакшене
# Использование: ./apply-migrations.sh

set -e

echo "🚀 Применение миграций базы данных..."

# Проверка переменных окружения
if [ -z "$DB_NAME" ] || [ -z "$DB_USER" ]; then
    echo "❌ Ошибка: Переменные окружения DB_NAME и DB_USER должны быть установлены"
    echo "Или используйте: psql -U ort_user -d ort_testing -f migrations/add-rewards-columns.sql"
    exit 1
fi

# Применение миграций
echo "📝 Применение миграции: add-rewards-columns.sql"
psql -U "$DB_USER" -d "$DB_NAME" -f migrations/add-rewards-columns.sql

echo "📝 Применение миграции: add-subscription-discount.sql"
psql -U "$DB_USER" -d "$DB_NAME" -f migrations/add-subscription-discount.sql

echo "✅ Все миграции успешно применены!"

