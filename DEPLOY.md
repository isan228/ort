# Руководство по развертыванию (Deployment Guide)

Это руководство поможет вам развернуть ORT тестинг платформу на арендованном сервере и сделать её публично доступной.

## Требования к серверу

- Ubuntu 20.04 / 22.04 или Debian 11/12
- Минимум 2GB RAM
- Минимум 20GB дискового пространства
- Root доступ (или sudo права)
- Открытые порты: 22 (SSH), 80 (HTTP), 443 (HTTPS)

## Шаг 1: Подготовка сервера

### 1.1 Обновление системы

```bash
sudo apt update
sudo apt upgrade -y
```

### 1.2 Установка Node.js 18.x

```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs
node --version  # Должно быть v18.x.x
npm --version
```

### 1.3 Установка PostgreSQL

```bash
sudo apt install -y postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Создание пользователя и базы данных
sudo -u postgres psql << EOF
CREATE DATABASE ort_testing;
CREATE USER ort_user WITH PASSWORD 'your_secure_password_here';
ALTER ROLE ort_user SET client_encoding TO 'utf8';
ALTER ROLE ort_user SET default_transaction_isolation TO 'read committed';
ALTER ROLE ort_user SET timezone TO 'UTC';
GRANT ALL PRIVILEGES ON DATABASE ort_testing TO ort_user;
\q
EOF
```

**⚠️ ВАЖНО:** Замените `your_secure_password_here` на надежный пароль!

### 1.4 Установка Nginx

```bash
sudo apt install -y nginx
sudo systemctl start nginx
sudo systemctl enable nginx
```

### 1.5 Установка PM2 для управления процессами

```bash
sudo npm install -g pm2
```

## Шаг 2: Клонирование и настройка проекта

### 2.1 Клонирование репозитория

```bash
cd /var/www
sudo git clone https://github.com/isan228/ort.git
sudo chown -R $USER:$USER /var/www/ort
cd ort
```

### 2.2 Установка зависимостей

```bash
# Установка зависимостей для всех частей проекта
npm run install:all
```

### 2.3 Настройка переменных окружения

#### Server (.env)

```bash
cd server
cp .env.example .env  # Копируем пример
nano .env
```

**КРИТИЧЕСКИ ВАЖНО:** 
1. Файл должен называться именно `.env` (с точкой в начале), НЕ `env`
2. Убедитесь, что используете правильного пользователя PostgreSQL (`ort_user`, не `root` или `postgres`)
3. После создания файла обязательно проверьте его содержимое

**КРИТИЧЕСКИ ВАЖНО:** Убедитесь, что используете правильного пользователя PostgreSQL!

Отредактируйте файл `server/.env` с вашими настройками:

```env
# Database - ⚠️ ВАЖНО: Используйте ort_user, НЕ root!
DB_HOST=localhost
DB_PORT=5432
DB_NAME=ort_testing
DB_USER=ort_user
DB_PASSWORD=your_secure_password_here

# JWT
JWT_SECRET=your_very_secure_jwt_secret_key_here_min_32_chars

# Server
PORT=5000
NODE_ENV=production

# API URL (для production)
API_URL=http://your-domain.com/api

# Client URL
CLIENT_URL=http://your-domain.com
```

**⚠️ ЧАСТАЯ ОШИБКА:** Не используйте `DB_USER=root` или `DB_USER=postgres`! Используйте пользователя, который был создан на шаге 1.3 (`ort_user`).

После создания .env файла, проверьте настройки:

```bash
node check-env.js
```

Этот скрипт покажет текущие настройки и предупредит о возможных проблемах.

#### Client (.env)

```bash
cd ../client
cp env.example .env  # Копируем пример
nano .env
```

Отредактируйте файл `client/.env`:

```env
REACT_APP_API_URL=https://your-domain.com/api
```

**⚠️ ВАЖНО:** Замените `your-domain.com` на ваш реальный домен!

### 2.4 Проверка подключения к базе данных

**ВАЖНО:** Перед синхронизацией базы данных обязательно проверьте подключение:

```bash
cd server
node test-db-connection.js
```

Этот скрипт покажет:
- ✅ Успешное подключение - можно продолжать
- ❌ Ошибки подключения - с подробными инструкциями по исправлению

**Типичные проблемы и решения:**

1. **Ошибка аутентификации (28P01)** - неверный пароль:
   ```bash
   # Проверьте пароль в PostgreSQL
   sudo -u postgres psql -c "\du"
   
   # Если нужно изменить пароль
   sudo -u postgres psql -c "ALTER USER ort_user WITH PASSWORD 'новый_пароль';"
   ```

2. **База данных не существует (3D000)**:
   ```bash
   sudo -u postgres psql -c "CREATE DATABASE ort_testing;"
   ```

3. **PostgreSQL не запущен**:
   ```bash
   sudo systemctl status postgresql
   sudo systemctl start postgresql
   ```

### 2.5 Инициализация базы данных

После успешной проверки подключения:

```bash
cd server
node sync-db.js alter
```

Или если нужно полностью пересоздать таблицы (⚠️ удалит все данные):

```bash
node sync-db.js force
```

Этот скрипт автоматически:
- Подключится к базе данных
- Загрузит все модели и их ассоциации
- Синхронизирует схему базы данных
- Закроет соединение

### 2.6 Заполнение тестовыми данными (опционально)

```bash
node seed.js
```

### 2.6 Сборка клиентской части

```bash
cd ../client
npm run build
```

Это создаст папку `client/build` с готовыми файлами для продакшена.

## Шаг 3: Настройка PM2

### 3.1 Создание PM2 конфигурации

Создайте файл `ecosystem.config.js` в корне проекта:

```javascript
module.exports = {
  apps: [
    {
      name: 'ort-server',
      script: './server/index.js',
      cwd: '/var/www/ort',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        PORT: 5000
      },
      error_file: './logs/server-error.log',
      out_file: './logs/server-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      autorestart: true,
      max_memory_restart: '500M'
    }
  ]
};
```

### 3.2 Запуск сервера через PM2

**ВАЖНО:** Убедитесь, что файл `server/.env` создан и содержит правильные настройки!

```bash
cd /var/www/ort

# Проверьте настройки перед запуском
cd server
node check-env.js
node test-db-connection.js

# Вернитесь в корень проекта
cd ..

# Создайте директорию для логов (если не существует)
mkdir -p logs

# Запустите через PM2
pm2 start ecosystem.config.js

# Проверьте статус
pm2 status

# Сохраните конфигурацию PM2
pm2 save

# Настройте автозапуск при загрузке системы
pm2 startup  # Следуйте инструкциям, которые выведет команда
```

**Если сервер не запускается:**

1. Проверьте логи: `pm2 logs ort-server`
2. Убедитесь, что `server/.env` файл существует и содержит правильные настройки
3. Проверьте путь к .env в `ecosystem.config.js` - должен указывать на `./server/.env`

## Шаг 4: Настройка Nginx

### 4.1 Создание конфигурации Nginx

**Вариант 1: Автоматическая настройка (рекомендуется)**

```bash
cd /var/www/ort
chmod +x setup-nginx.sh
sudo ./setup-nginx.sh ort.kg
```

**Вариант 2: Ручная настройка**

```bash
sudo nano /etc/nginx/sites-available/ort
```

Вставьте следующую конфигурацию (замените `ort.kg` на ваш домен):

```nginx
server {
    listen 80;
    server_name ort.kg www.ort.kg;

    # Логи
    access_log /var/log/nginx/ort-access.log;
    error_log /var/log/nginx/ort-error.log;

    # Максимальный размер загружаемых файлов
    client_max_body_size 10M;

    # API проксирование
    location /api {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Статические файлы React
    location / {
        root /var/www/ort/client/build;
        try_files $uri $uri/ /index.html;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }

    # Статические файлы без кэширования
    location ~* \.(html|json)$ {
        root /var/www/ort/client/build;
        expires -1;
        add_header Cache-Control "no-cache, no-store, must-revalidate";
    }
}
```

### 4.2 Активация конфигурации

Если используете ручную настройку:

```bash
# Активация конфигурации
sudo ln -s /etc/nginx/sites-available/ort /etc/nginx/sites-enabled/

# Удаление дефолтной страницы (опционально)
sudo rm /etc/nginx/sites-enabled/default

# Проверка конфигурации
sudo nginx -t

# Перезагрузка Nginx
sudo systemctl reload nginx
```

**ВАЖНО:** Убедитесь, что:
1. ✅ Клиентская часть собрана: `cd /var/www/ort/client && npm run build`
2. ✅ Директория `client/build` существует и содержит файлы `index.html`
3. ✅ Сервер Node.js запущен: `pm2 status`
4. ✅ Конфигурация Nginx указывает на правильный путь: `/var/www/ort/client/build`

### 4.3 Проверка работы

```bash
# Проверьте, что Nginx использует правильную конфигурацию
sudo nginx -T | grep "server_name"

# Проверьте, что статические файлы доступны
ls -la /var/www/ort/client/build/

# Должны быть файлы: index.html, static/, и т.д.
```

## Шаг 5: Настройка SSL сертификата (HTTPS)

### 5.1 Установка Certbot

```bash
sudo apt install -y certbot python3-certbot-nginx
```

### 5.2 Получение SSL сертификата

```bash
sudo certbot --nginx -d ort.kg -d www.your-domain.com
```

Следуйте инструкциям. Certbot автоматически обновит конфигурацию Nginx и настроит автоматическое обновление сертификата.

### 5.3 Обновление переменных окружения для HTTPS

Обновите `server/.env` и `client/.env`, заменив `http://` на `https://`:

```env
# server/.env
API_URL=https://your-domain.com/api
CLIENT_URL=https://your-domain.com

# client/.env
REACT_APP_API_URL=https://your-domain.com/api
```

После изменения пересоберите клиент и перезапустите PM2:

```bash
cd /var/www/ort/client
npm run build
cd ..
pm2 restart ort-server
```

## Шаг 6: Настройка файрвола

```bash
sudo ufw allow 22/tcp   # SSH
sudo ufw allow 80/tcp   # HTTP
sudo ufw allow 443/tcp  # HTTPS
sudo ufw enable
```

## Шаг 7: Проверка развертывания

Перед настройкой SSL, убедитесь, что всё работает:

```bash
cd /var/www/ort

# Используйте скрипт проверки
chmod +x check-deployment.sh
./check-deployment.sh
```

Или проверьте вручную:

1. **Проверьте работу сервера:**
   ```bash
   curl http://localhost:5000/api/health
   # Должен вернуть: {"status":"OK","message":"Server is running"}
   ```

2. **Проверьте статические файлы:**
   ```bash
   ls -la /var/www/ort/client/build/
   # Должен быть index.html и директория static/
   ```

3. **Проверьте конфигурацию Nginx:**
   ```bash
   sudo nginx -t
   sudo systemctl status nginx
   ```

4. **Проверьте в браузере:**
   - Откройте: `http://ort.kg`
   - Должна загрузиться главная страница приложения, НЕ дефолтная страница Nginx

## Шаг 8: Настройка автозапуска PM2 при перезагрузке

```bash
pm2 save
pm2 startup
```

Следуйте инструкциям, которые выведет команда `pm2 startup`.

## Шаг 9: Финальная проверка

1. **Проверьте работу сервера:**
   ```bash
   pm2 status
   pm2 logs ort-server --lines 20
   ```

2. **Проверьте Nginx:**
   ```bash
   sudo systemctl status nginx
   sudo tail -f /var/log/nginx/ort-access.log
   ```

3. **Проверьте в браузере:**
   - HTTP: `http://ort.kg` (должна открыться главная страница)
   - API: `http://ort.kg/api/health` (должен вернуть JSON с статусом)

4. **После настройки SSL:**
   - HTTPS: `https://ort.kg` (должен работать через SSL)
   - Автоматическое перенаправление с HTTP на HTTPS должно работать

## Полезные команды

### Управление PM2

```bash
pm2 status              # Статус процессов
pm2 logs ort-server     # Просмотр логов
pm2 restart ort-server  # Перезапуск сервера
pm2 stop ort-server     # Остановка сервера
pm2 monit               # Мониторинг в реальном времени
```

### Управление Nginx

```bash
sudo systemctl status nginx    # Статус
sudo systemctl restart nginx   # Перезапуск
sudo nginx -t                   # Проверка конфигурации
```

### Управление PostgreSQL

```bash
sudo systemctl status postgresql
sudo systemctl restart postgresql
```

### Обновление приложения

```bash
cd /var/www/ort
git pull origin main
cd server
npm install
cd ../client
npm install
npm run build
cd ..
pm2 restart ort-server
```

## Резервное копирование базы данных

Создайте скрипт для резервного копирования:

```bash
sudo nano /usr/local/bin/backup-ort-db.sh
```

```bash
#!/bin/bash
BACKUP_DIR="/var/backups/ort"
DATE=$(date +%Y%m%d_%H%M%S)
mkdir -p $BACKUP_DIR
sudo -u postgres pg_dump ort_testing > $BACKUP_DIR/ort_backup_$DATE.sql
# Удаление старых backup (старше 30 дней)
find $BACKUP_DIR -name "ort_backup_*.sql" -mtime +30 -delete
```

```bash
sudo chmod +x /usr/local/bin/backup-ort-db.sh
```

Добавьте в cron для автоматического резервного копирования:

```bash
sudo crontab -e
```

Добавьте строку:
```
0 2 * * * /usr/local/bin/backup-ort-db.sh
```

Это будет делать резервное копирование каждый день в 2:00 ночи.

## Решение проблем

### Сервер не запускается

1. Проверьте логи: `pm2 logs ort-server`
2. Проверьте переменные окружения: `cat server/.env`
3. Проверьте порт (используйте `ss` вместо `netstat`):
   ```bash
   sudo ss -tulpn | grep 5000
   # или
   sudo lsof -i :5000
   ```
4. Проверьте, запущен ли процесс: `pm2 status`
5. Проверьте подключение к базе данных: `cd server && node test-db-connection.js`

### База данных не подключается

1. **Проверьте настройки в .env файле:**
   ```bash
   cd server
   node check-env.js
   ```
   Убедитесь, что `DB_USER=ort_user`, а не `root` или `postgres`!

2. **Проверьте, существует ли пользователь в PostgreSQL:**
   ```bash
   sudo -u postgres psql -c "\du"
   ```
   Вы должны увидеть пользователя `ort_user`.

3. **Если пользователя нет или неправильный пароль:**
   ```bash
   # Создать пользователя (если не создан)
   sudo -u postgres psql -c "CREATE USER ort_user WITH PASSWORD 'ваш_пароль';"
   
   # Изменить пароль существующего пользователя
   sudo -u postgres psql -c "ALTER USER ort_user WITH PASSWORD 'ваш_пароль';"
   
   # Дать права на базу данных
   sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE ort_testing TO ort_user;"
   ```

4. **Проверьте подключение с помощью тестового скрипта:**
   ```bash
   cd server
   node test-db-connection.js
   ```

5. **Проверьте статус PostgreSQL:**
   ```bash
   sudo systemctl status postgresql
   ```

6. **Проверьте логи PostgreSQL:**
   ```bash
   sudo tail -f /var/log/postgresql/postgresql-*.log
   ```
   
   **Типичные ошибки в логах:**
   - `FATAL: password authentication failed for user "root"` - означает, что в `.env` установлен `DB_USER=root`, а нужно `DB_USER=ort_user`
   - `FATAL: Role "root" does not exist` - та же проблема

### Nginx показывает дефолтную страницу

**Проблема:** Открывается "Welcome to nginx!" вместо приложения.

**Решение:**

1. **Проверьте, что конфигурация активирована:**
   ```bash
   ls -la /etc/nginx/sites-enabled/ | grep ort
   # Должна быть символическая ссылка на /etc/nginx/sites-available/ort
   ```

2. **Удалите дефолтную конфигурацию:**
   ```bash
   sudo rm /etc/nginx/sites-enabled/default
   ```

3. **Убедитесь, что клиент собран:**
   ```bash
   ls -la /var/www/ort/client/build/index.html
   # Файл должен существовать
   ```

4. **Проверьте путь в конфигурации Nginx:**
   ```bash
   sudo cat /etc/nginx/sites-available/ort | grep "root"
   # Должно быть: root /var/www/ort/client/build;
   ```

5. **Перезагрузите Nginx:**
   ```bash
   sudo nginx -t
   sudo systemctl reload nginx
   ```

### Nginx не работает

1. Проверьте конфигурацию: `sudo nginx -t`
2. Проверьте логи: `sudo tail -f /var/log/nginx/ort-error.log`
3. Проверьте статус: `sudo systemctl status nginx`
4. Проверьте, что порт 80 свободен: `sudo ss -tulpn | grep :80`

## Безопасность

1. ✅ Используйте сильные пароли для базы данных
2. ✅ Регулярно обновляйте систему: `sudo apt update && sudo apt upgrade`
3. ✅ Настройте файрвол (UFW)
4. ✅ Используйте HTTPS (SSL сертификат)
5. ✅ Регулярно делайте резервные копии базы данных
6. ✅ Ограничьте SSH доступ (используйте ключи вместо паролей)
7. ✅ Настройте fail2ban для защиты от брутфорса

## Поддержка

Если возникли проблемы, проверьте:
- Логи PM2: `pm2 logs`
- Логи Nginx: `/var/log/nginx/`
- Логи PostgreSQL: `/var/log/postgresql/`
- Системные логи: `journalctl -xe`

