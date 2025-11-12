# Быстрое исправление проблем на продакшене

## Проблема 1: Отсутствуют колонки в базе данных

**Ошибка:** `errorMissingColumn` - колонки `coins`, `referralCode`, `referredBy` отсутствуют

**Решение:**
```bash
cd /var/www/ort/server
node sync-db.js alter
```

## Проблема 2: Ошибка JWT expiresIn

**Ошибка:** `"expiresIn" should be a number of seconds or string representing a timespan`

**Решение:**
1. Убедитесь, что в `server/.env` есть переменная:
   ```env
   JWT_EXPIRES_IN=7d
   ```
   Или используйте формат в секундах: `JWT_EXPIRES_IN=604800` (7 дней)

2. После исправления кода (git pull) перезапустите сервер:
   ```bash
   pm2 restart ort-server
   ```

## Полная последовательность исправления:

```bash
# 1. Обновите код
cd /var/www/ort
git pull

# 2. Синхронизируйте базу данных
cd server
node sync-db.js alter

# 3. Проверьте .env файл
# Убедитесь, что есть: JWT_EXPIRES_IN=7d

# 4. Перезапустите сервер
pm2 restart ort-server

# 5. Проверьте логи
pm2 logs ort-server --lines 50
```

