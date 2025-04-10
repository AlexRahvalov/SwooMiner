@echo off
echo Запуск в режиме отладки...
set BUN_DEBUG=1
set BUN_INSPECT=1

echo Проверка наличия Bun...
where bun >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo Bun не установлен! Устанавливаем...
    powershell -c "irm bun.sh/install.ps1 | iex"
    echo Перезапустите этот скрипт после установки Bun
    pause
    exit
)

echo Копирование конфигурации TypeScript для Bun...
copy tsconfig-bun.json tsconfig.json

echo Установка зависимостей...
bun install

echo Создание директории для логов...
if not exist logs mkdir logs

echo Запуск проекта в режиме отладки...
bun run src/index.ts > logs/debug.log 2>&1

echo Завершено. Логи сохранены в logs/debug.log
notepad logs\debug.log
pause 