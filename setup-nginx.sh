#!/bin/bash

# Скрипт для автоматической настройки Nginx для ORT платформы
# Использование: sudo ./setup-nginx.sh your-domain.com

set -e

DOMAIN=$1

if [ -z "$DOMAIN" ]; then
    echo "❌ Ошибка: Укажите домен"
    echo "Использование: sudo ./setup-nginx.sh ort.kg"
    exit 1
fi

echo "🔧 Настройка Nginx для домена: $DOMAIN"

# Создание конфигурации Nginx
NGINX_CONFIG="/etc/nginx/sites-available/ort"

sudo tee $NGINX_CONFIG > /dev/null <<EOF
server {
    listen 80;
    server_name $DOMAIN www.$DOMAIN;

    # Логи
    access_log /var/log/nginx/ort-access.log;
    error_log /var/log/nginx/ort-error.log;

    # Максимальный размер загружаемых файлов
    client_max_body_size 10M;

    # API проксирование
    location /api {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        
        # Таймауты
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Статические файлы React
    location / {
        root /var/www/ort/client/build;
        try_files \$uri \$uri/ /index.html;
        expires 30d;
        add_header Cache-Control "public, immutable";
        
        # Gzip сжатие
        gzip on;
        gzip_vary on;
        gzip_min_length 1024;
        gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml+rss application/json;
    }

    # Статические файлы без кэширования
    location ~* \.(html|json)$ {
        root /var/www/ort/client/build;
        expires -1;
        add_header Cache-Control "no-cache, no-store, must-revalidate";
    }

    # Блокировка доступа к скрытым файлам
    location ~ /\. {
        deny all;
        access_log off;
        log_not_found off;
    }
}
EOF

echo "✅ Конфигурация создана"

# Создание символической ссылки (активация)
if [ -f "/etc/nginx/sites-enabled/ort" ]; then
    echo "ℹ️  Конфигурация уже активирована"
else
    sudo ln -s /etc/nginx/sites-available/ort /etc/nginx/sites-enabled/
    echo "✅ Конфигурация активирована"
fi

# Удаление дефолтной конфигурации (если нужно)
if [ -f "/etc/nginx/sites-enabled/default" ]; then
    read -p "Удалить дефолтную конфигурацию Nginx? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        sudo rm /etc/nginx/sites-enabled/default
        echo "✅ Дефолтная конфигурация удалена"
    fi
fi

# Проверка конфигурации
echo "🔍 Проверка конфигурации Nginx..."
sudo nginx -t

if [ $? -eq 0 ]; then
    echo "✅ Конфигурация валидна"
    
    # Перезагрузка Nginx
    echo "🔄 Перезагрузка Nginx..."
    sudo systemctl reload nginx
    
    echo ""
    echo "✅ Nginx настроен успешно!"
    echo ""
    echo "📋 Следующие шаги:"
    echo "1. Убедитесь, что клиент собран: cd /var/www/ort/client && npm run build"
    echo "2. Убедитесь, что сервер запущен: pm2 status"
    echo "3. Настройте SSL: sudo certbot --nginx -d $DOMAIN"
    echo ""
else
    echo "❌ Ошибка в конфигурации Nginx!"
    exit 1
fi

