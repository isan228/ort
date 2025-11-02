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
cp .env.example .env  # Если есть пример
nano .env
```

Создайте файл `server/.env` со следующим содержимым:

```env
# Database
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

#### Client (.env)

```bash
cd ../client
nano .env
```

Создайте файл `client/.env`:

```env
REACT_APP_API_URL=https://your-domain.com/api
```

**⚠️ ВАЖНО:** Замените `your-domain.com` на ваш реальный домен!

### 2.4 Инициализация базы данных

```bash
cd ../server
node -e "require('./models/index.js').sequelize.sync({ alter: true }).then(() => { console.log('Database synced'); process.exit(0); });"
```

### 2.5 Заполнение тестовыми данными (опционально)

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

```bash
cd /var/www/ort
pm2 start ecosystem.config.js
pm2 save
pm2 startup  # Следуйте инструкциям для автозапуска при загрузке системы
```

## Шаг 4: Настройка Nginx

### 4.1 Создание конфигурации Nginx

```bash
sudo nano /etc/nginx/sites-available/ort
```

Вставьте следующую конфигурацию (замените `your-domain.com` на ваш домен):

```nginx
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;

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

```bash
sudo ln -s /etc/nginx/sites-available/ort /etc/nginx/sites-enabled/
sudo nginx -t  # Проверка конфигурации
sudo systemctl reload nginx
```

## Шаг 5: Настройка SSL сертификата (HTTPS)

### 5.1 Установка Certbot

```bash
sudo apt install -y certbot python3-certbot-nginx
```

### 5.2 Получение SSL сертификата

```bash
sudo certbot --nginx -d your-domain.com -d www.your-domain.com
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

## Шаг 7: Настройка автозапуска PM2 при перезагрузке

```bash
pm2 save
pm2 startup
```

Следуйте инструкциям, которые выведет команда `pm2 startup`.

## Шаг 8: Финальная проверка

1. Проверьте работу сервера: `pm2 status`
2. Проверьте логи: `pm2 logs ort-server`
3. Проверьте Nginx: `sudo systemctl status nginx`
4. Откройте в браузере: `https://your-domain.com`

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
3. Проверьте порт: `sudo netstat -tulpn | grep 5000`

### База данных не подключается

1. Проверьте статус PostgreSQL: `sudo systemctl status postgresql`
2. Проверьте права доступа: `sudo -u postgres psql -c "\du"`
3. Проверьте логи PostgreSQL: `sudo tail -f /var/log/postgresql/postgresql-*.log`

### Nginx не работает

1. Проверьте конфигурацию: `sudo nginx -t`
2. Проверьте логи: `sudo tail -f /var/log/nginx/ort-error.log`
3. Проверьте статус: `sudo systemctl status nginx`

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

