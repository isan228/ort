# PowerShell скрипт для запуска backend и frontend одновременно
# Использование: .\start.ps1

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Запуск платформы ОРТ" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Проверка наличия node_modules
if (-not (Test-Path "node_modules")) {
    Write-Host "Установка зависимостей корневого проекта..." -ForegroundColor Yellow
    npm install
}

if (-not (Test-Path "server/node_modules")) {
    Write-Host "Установка зависимостей backend..." -ForegroundColor Yellow
    Set-Location server
    npm install
    Set-Location ..
}

if (-not (Test-Path "client/node_modules")) {
    Write-Host "Установка зависимостей frontend..." -ForegroundColor Yellow
    Set-Location client
    npm install
    Set-Location ..
}

Write-Host ""
Write-Host "Запуск backend и frontend..." -ForegroundColor Green
Write-Host ""

# Запуск через concurrently если установлен, иначе запускаем отдельно
if (Get-Command npm -ErrorAction SilentlyContinue) {
    npm run dev
} else {
    Write-Host "Ошибка: npm не найден" -ForegroundColor Red
    exit 1
}

