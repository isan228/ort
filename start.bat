@echo off
REM Batch скрипт для запуска backend и frontend одновременно
REM Использование: start.bat

echo ========================================
echo   Запуск платформы ОРТ
echo ========================================
echo.

REM Проверка наличия node_modules
if not exist "node_modules" (
    echo Установка зависимостей корневого проекта...
    call npm install
)

if not exist "server\node_modules" (
    echo Установка зависимостей backend...
    cd server
    call npm install
    cd ..
)

if not exist "client\node_modules" (
    echo Установка зависимостей frontend...
    cd client
    call npm install
    cd ..
)

echo.
echo Запуск backend и frontend...
echo.

REM Проверка установлен ли concurrently
where npm >nul 2>&1
if %errorlevel% neq 0 (
    echo Ошибка: npm не найден
    pause
    exit /b 1
)

call npm run dev

pause

