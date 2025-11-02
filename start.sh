#!/bin/bash
# Bash скрипт для запуска backend и frontend одновременно
# Использование: ./start.sh

echo "========================================"
echo "  Запуск платформы ОРТ"
echo "========================================"
echo ""

# Проверка наличия node_modules
if [ ! -d "node_modules" ]; then
    echo "Установка зависимостей корневого проекта..."
    npm install
fi

if [ ! -d "server/node_modules" ]; then
    echo "Установка зависимостей backend..."
    cd server
    npm install
    cd ..
fi

if [ ! -d "client/node_modules" ]; then
    echo "Установка зависимостей frontend..."
    cd client
    npm install
    cd ..
fi

echo ""
echo "Запуск backend и frontend..."
echo ""

# Запуск через npm
npm run dev

