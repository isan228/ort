# Инструкция по настройке

## 1. Настройка Backend (.env файл)

Создайте файл `server/.env` со следующим содержимым:

```env
PORT=5000
DB_HOST=localhost
DB_PORT=5432
DB_NAME=ort_db
DB_USER=postgres
DB_PASSWORD=ваш_пароль_postgres
JWT_SECRET=your_super_secret_jwt_key_change_in_production_make_it_long_and_random
JWT_EXPIRES_IN=7d
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=ваш_email@gmail.com
EMAIL_PASS=ваш_пароль_email
FRONTEND_URL=http://localhost:3000
```

### Важно:
- Замените `DB_PASSWORD` на ваш пароль PostgreSQL
- Замените `JWT_SECRET` на длинный случайный ключ (минимум 32 символа)
- Если не планируете использовать email уведомления, можете оставить поля EMAIL пустыми

## 2. Настройка Frontend (.env файл)

Создайте файл `client/.env` со следующим содержимым:

```env
REACT_APP_API_URL=http://localhost:5000/api
```

## 3. Настройка базы данных PostgreSQL

1. Убедитесь, что PostgreSQL установлен и запущен
2. Создайте базу данных:
```sql
CREATE DATABASE ort_db;
```

3. База данных автоматически создаст таблицы при первом запуске сервера (благодаря Sequelize sync)

## 4. Запуск проекта

### Backend:
```bash
cd server
npm run dev
```

### Frontend (в новом терминале):
```bash
cd client
npm start
```

## 5. Создание первого администратора

1. Зарегистрируйтесь через веб-интерфейс
2. Выполните SQL запрос:
```sql
UPDATE "Users" SET role = 'admin' WHERE email = 'ваш_email@example.com';
```

## 6. (Опционально) Загрузка начальных данных

Запустите скрипт для создания базовых предметов:
```bash
node server/seed.js
```

Это создаст предметы: Математика, Русский язык, Английский язык, История, Естествознание.

## Проблемы и решения

### Ошибка подключения к базе данных
- Убедитесь, что PostgreSQL запущен
- Проверьте правильность данных в `server/.env`
- Убедитесь, что база данных `ort_db` создана

### Ошибка "react-scripts не найден"
- Установите зависимости: `cd client && npm install`

### Ошибка при установке зависимостей
- Попробуйте очистить кеш: `npm cache clean --force`
- Удалите `node_modules` и `package-lock.json`, затем снова запустите `npm install`

## Структура проекта

```
ort/
├── server/              # Backend (Node.js + Express)
│   ├── config/          # Конфигурация БД
│   ├── models/          # Модели Sequelize
│   ├── routes/          # API роуты
│   ├── middleware/      # Middleware
│   └── .env            # Настройки (создать вручную)
├── client/              # Frontend (React)
│   ├── src/            # Исходный код
│   └── .env           # Настройки (создать вручную)
└── README.md           # Основная документация
```

## Полезные команды

### Быстрый запуск:
- **Windows:** `start.bat` или `.\start.ps1`
- **Linux/Mac:** `./start.sh`
- **Через npm:** `npm run dev` (из корня проекта)

### Отдельные команды:
- Запуск backend: `npm run server:dev`
- Запуск frontend: `npm run client:dev`
- Установка всех зависимостей: `npm run install:all`
- Загрузка начальных данных: `node server/seed.js`
- Сборка frontend: `npm run build`

