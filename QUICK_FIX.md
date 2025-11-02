# Быстрое исправление проблемы с подключением к базе данных

## Проблема

PM2 не загружает `.env` файл правильно, из-за чего сервер пытается подключиться с неправильным пользователем (например, `root` вместо `ort_user`).

## Решение

### Шаг 1: Проверьте и исправьте файл `.env`

```bash
cd /var/www/ort/server

# Проверьте, существует ли файл .env (ВАЖНО: с точкой в начале!)
ls -la | grep "\.env"

# Если файла нет, создайте его из примера
cp .env.example .env

# Или если есть env.example (без точки):
cp env.example .env

# Отредактируйте файл
nano .env
```

**КРИТИЧЕСКИ ВАЖНО:** В файле `.env` должно быть:

```env
DB_USER=ort_user
```

**НЕ:**
- `DB_USER=root`
- `DB_USER=postgres`

### Шаг 2: Проверьте настройки

```bash
# Проверьте содержимое .env файла
cat .env | grep DB_USER

# Должно быть: DB_USER=ort_user
```

### Шаг 3: Проверьте подключение

```bash
# Проверьте настройки
node check-env.js

# Проверьте подключение к базе данных
node test-db-connection.js
```

Если видите ошибку о пользователе "root", значит `.env` файл все еще содержит `DB_USER=root`.

### Шаг 4: Исправьте и перезапустите PM2

```bash
# После исправления .env файла
cd /var/www/ort

# Остановите PM2
pm2 stop ort-server

# Удалите процесс (чтобы пересоздать с правильными настройками)
pm2 delete ort-server

# Запустите снова
pm2 start ecosystem.config.js

# Проверьте логи
pm2 logs ort-server --lines 50
```

### Шаг 5: Если проблема сохраняется

Проверьте, что PM2 загружает `.env` файл:

```bash
# Проверьте переменные окружения процесса
pm2 describe ort-server | grep env

# Или проверьте напрямую через PM2
pm2 env ort-server
```

Если переменные не загружаются, обновите ecosystem.config.js:

```bash
cd /var/www/ort
git pull origin main  # Получить обновленную конфигурацию
pm2 delete ort-server
pm2 start ecosystem.config.js
```

## Быстрая проверка

```bash
cd /var/www/ort/server

# 1. Проверьте .env файл
echo "DB_USER из .env:"
grep "^DB_USER=" .env

# 2. Проверьте подключение
node test-db-connection.js

# 3. Если всё ОК, синхронизируйте БД
node sync-db.js alter
```

Если всё работает, запустите через PM2:

```bash
cd /var/www/ort
pm2 restart ort-server
```

