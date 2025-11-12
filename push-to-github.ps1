# Скрипт для загрузки проекта в GitHub
# Запустите этот скрипт из папки ort/ort

Write-Host "Инициализация git репозитория..." -ForegroundColor Green
git init

Write-Host "Добавление файлов..." -ForegroundColor Green
git add .

Write-Host "Создание коммита..." -ForegroundColor Green
git commit -m "Initial commit: ORT testing platform with universities, rewards system, and subscription"

Write-Host "`nСледующие шаги:" -ForegroundColor Yellow
Write-Host "1. Создайте репозиторий на GitHub (https://github.com/new)" -ForegroundColor Cyan
Write-Host "2. Выполните следующие команды (замените YOUR_USERNAME и YOUR_REPO_NAME):" -ForegroundColor Cyan
Write-Host "   git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git" -ForegroundColor White
Write-Host "   git branch -M main" -ForegroundColor White
Write-Host "   git push -u origin main" -ForegroundColor White

