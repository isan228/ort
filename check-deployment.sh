#!/bin/bash

# Скрипт для проверки состояния развертывания
# Использование: ./check-deployment.sh

echo "🔍 Проверка состояния развертывания..."
echo ""

# Проверка Node.js сервера
echo "📊 Node.js сервер (PM2):"
if command -v pm2 &> /dev/null; then
    pm2 status | grep ort-server || echo "  ❌ Сервер не запущен"
else
    echo "  ❌ PM2 не установлен"
fi
echo ""

# Проверка базы данных
echo "📊 База данных PostgreSQL:"
if systemctl is-active --quiet postgresql; then
    echo "  ✅ PostgreSQL запущен"
else
    echo "  ❌ PostgreSQL не запущен"
fi
echo ""

# Проверка Nginx
echo "📊 Nginx:"
if systemctl is-active --quiet nginx; then
    echo "  ✅ Nginx запущен"
    
    # Проверка активной конфигурации
    if [ -f "/etc/nginx/sites-enabled/ort" ]; then
        echo "  ✅ Конфигурация ort активирована"
    else
        echo "  ⚠️  Конфигурация ort не найдена в sites-enabled"
    fi
    
    # Проверка дефолтной конфигурации
    if [ -f "/etc/nginx/sites-enabled/default" ]; then
        echo "  ⚠️  Дефолтная конфигурация все еще активна - рекомендуется удалить"
    fi
else
    echo "  ❌ Nginx не запущен"
fi
echo ""

# Проверка .env файла
echo "📊 Настройки окружения:"
if [ -f "/var/www/ort/server/.env" ]; then
    echo "  ✅ .env файл существует"
    DB_USER=$(grep "^DB_USER=" /var/www/ort/server/.env | cut -d'=' -f2)
    if [ "$DB_USER" = "ort_user" ]; then
        echo "  ✅ DB_USER правильный (ort_user)"
    else
        echo "  ⚠️  DB_USER: $DB_USER (должен быть ort_user)"
    fi
else
    echo "  ❌ .env файл не найден"
fi
echo ""

# Проверка клиентской сборки
echo "📊 Клиентская часть:"
if [ -f "/var/www/ort/client/build/index.html" ]; then
    echo "  ✅ Клиент собран (build/index.html существует)"
    echo "  📁 Размер build директории:"
    du -sh /var/www/ort/client/build
else
    echo "  ❌ Клиент не собран (запустите: cd client && npm run build)"
fi
echo ""

# Проверка портов
echo "📊 Сетевые порты:"
if command -v ss &> /dev/null; then
    if ss -tulpn | grep -q ":5000"; then
        echo "  ✅ Порт 5000 прослушивается (Node.js сервер)"
    else
        echo "  ❌ Порт 5000 не прослушивается"
    fi
    
    if ss -tulpn | grep -q ":80"; then
        echo "  ✅ Порт 80 прослушивается (Nginx)"
    else
        echo "  ❌ Порт 80 не прослушивается"
    fi
    
    if ss -tulpn | grep -q ":443"; then
        echo "  ✅ Порт 443 прослушивается (HTTPS)"
    else
        echo "  ⚠️  Порт 443 не прослушивается (SSL не настроен)"
    fi
else
    echo "  ⚠️  Команда 'ss' не найдена, используйте: sudo apt install iproute2"
fi
echo ""

echo "✅ Проверка завершена"
echo ""
echo "💡 Для просмотра логов:"
echo "   PM2: pm2 logs ort-server"
echo "   Nginx: sudo tail -f /var/log/nginx/ort-error.log"

