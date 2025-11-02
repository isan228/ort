# Платформа для подготовки к ОРТ

Веб-приложение для подготовки к Общереспубликанскому тестированию (ОРТ) с системой тестов, статистикой и рейтингами.

## Функционал

### Для пользователей:
- ✅ Регистрация и авторизация
- ✅ Прохождение тестов по различным предметам
- ✅ Бесплатные и платные тесты (по подписке)
- ✅ Моментальная проверка результатов
- ✅ Подробный разбор ошибок
- ✅ Статистика и история тестов
- ✅ Рейтинги (по школе, региону, стране)
- ✅ Личный кабинет

### Для репититоров:
- ✅ Добавление предметов
- ✅ Создание и редактирование тестов
- ✅ Добавление вопросов к тестам

### Для администраторов:
- ✅ Управление пользователями
- ✅ Назначение ролей (пользователь, репититор, админ)
- ✅ Полная статистика платформы
- ✅ Управление предметами и тестами

## Технологии

### Backend:
- Node.js + Express.js
- PostgreSQL
- Sequelize ORM
- JWT аутентификация
- REST API

### Frontend:
- React 18
- React Router
- Tailwind CSS
- Axios
- React Hot Toast

## Установка и запуск

### Требования:
- Node.js (v16 или выше)
- PostgreSQL (v12 или выше)
- npm или yarn

### Быстрый старт:

**Windows (PowerShell):**
```powershell
.\start.ps1
```

**Windows (CMD):**
```cmd
start.bat
```

**Linux/Mac:**
```bash
chmod +x start.sh
./start.sh
```

**Или через npm:**
```bash
npm install
npm run dev
```

### Шаги установки:

1. **Клонируйте репозиторий** (если используется git):
```bash
git clone <repository-url>
cd ort
```

2. **Установите зависимости backend:**
```bash
cd server
npm install
```

3. **Настройте базу данных:**
   - Создайте базу данных PostgreSQL:
   ```sql
   CREATE DATABASE ort_db;
   ```

4. **Настройте переменные окружения:**
   - Скопируйте `server/.env.example` в `server/.env`
   - Отредактируйте `server/.env` с вашими настройками:
   ```
   PORT=5000
   DB_HOST=localhost
   DB_PORT=5432
   DB_NAME=ort_db
   DB_USER=postgres
   DB_PASSWORD=your_password
   JWT_SECRET=your_super_secret_jwt_key
   JWT_EXPIRES_IN=7d
   FRONTEND_URL=http://localhost:3000
   ```

5. **Установите все зависимости одним командой (из корня проекта):**
```bash
npm run install:all
```

Или установите отдельно:
```bash
npm install          # Зависимости корня (concurrently, nodemon)
cd server && npm install && cd ..   # Backend зависимости
cd client && npm install && cd ..   # Frontend зависимости
```

6. **Создайте файл `.env` в папке `client`:**
```
REACT_APP_API_URL=http://localhost:5000/api
```

7. **Запустите backend и frontend одновременно:**
```bash
npm run dev
```

Или используйте скрипты:
- Windows: `start.bat` или `.\start.ps1`
- Linux/Mac: `./start.sh`

8. **Откройте браузер:**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000

## Структура проекта

```
ort/
├── server/                 # Backend
│   ├── config/            # Конфигурация (база данных)
│   ├── models/            # Sequelize модели
│   ├── routes/            # API роуты
│   ├── middleware/        # Middleware (auth, etc.)
│   └── index.js          # Точка входа
├── client/                # Frontend
│   ├── src/
│   │   ├── components/    # React компоненты
│   │   ├── pages/        # Страницы
│   │   ├── context/      # Context API
│   │   └── App.js        # Главный компонент
│   └── public/           # Статические файлы
└── package.json          # Root package.json
```

## API Endpoints

### Аутентификация:
- `POST /api/auth/register` - Регистрация
- `POST /api/auth/login` - Вход
- `GET /api/auth/me` - Текущий пользователь
- `POST /api/auth/forgot-password` - Восстановление пароля

### Тесты:
- `GET /api/tests` - Список тестов
- `GET /api/tests/:id` - Детали теста
- `GET /api/tests/:id/questions` - Вопросы теста
- `POST /api/tests/:id/submit` - Отправка ответов

### Пользователи:
- `GET /api/users/profile` - Профиль
- `PUT /api/users/profile` - Обновление профиля
- `GET /api/users/history` - История тестов
- `GET /api/users/statistics` - Статистика
- `GET /api/users/ranking` - Рейтинг

### Подписка:
- `GET /api/subscription` - Текущая подписка
- `POST /api/subscription` - Создание подписки
- `GET /api/subscription/history` - История подписок

### Админ панель:
- `GET /api/admin/users` - Список пользователей
- `PUT /api/admin/users/:id/role` - Изменение роли
- `POST /api/admin/subjects` - Создание предмета
- `POST /api/admin/tests` - Создание теста
- `POST /api/admin/tests/:id/questions` - Добавление вопроса

## База данных

База данных автоматически создается при первом запуске сервера благодаря Sequelize sync.

### Основные таблицы:
- `Users` - Пользователи
- `Subscriptions` - Подписки
- `Subjects` - Предметы
- `Tests` - Тесты
- `Questions` - Вопросы
- `TestResults` - Результаты тестов

## Разработка

### Создание первого админа:
После запуска сервера, вы можете создать пользователя через регистрацию и затем вручную изменить роль в базе данных:
```sql
UPDATE "Users" SET role = 'admin' WHERE email = 'admin@example.com';
```

### Добавление предметов:
Войдите как админ или репититор и используйте админ-панель для добавления предметов и тестов.

## Лицензия

ISC

## Автор

Разработано для подготовки к ОРТ

