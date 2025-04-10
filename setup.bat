@echo off
setlocal enabledelayedexpansion

:: Настройки
set REPO_URL=https://github.com/AlexRahvalov/SwooMiner
set BRANCH=main
set TEMP_DIR=swoominer_temp
set TARGET_DIR=%CD%\SwooMiner

:: Цвета для текста
set GREEN=[32m
set YELLOW=[33m
set RED=[31m
set NC=[0m

echo %GREEN%=== SwooMiner - Автоматическая установка ===%NC%

:: Проверка наличия Git
echo Проверка наличия Git...
where git >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo %RED%Git не найден. Загружаем и устанавливаем Git...%NC%
    :: Скачиваем установщик Git
    powershell -Command "(New-Object Net.WebClient).DownloadFile('https://github.com/git-for-windows/git/releases/download/v2.39.0.windows.1/Git-2.39.0-64-bit.exe', 'git-installer.exe')"
    :: Запускаем установку
    echo Устанавливаем Git...
    start /wait git-installer.exe /VERYSILENT /NORESTART
    :: Удаляем установщик
    del git-installer.exe
    echo %GREEN%Git успешно установлен!%NC%
    :: Добавляем Git в текущую сессию PATH
    set "PATH=%PATH%;C:\Program Files\Git\cmd"
)

:: Проверка наличия Bun
echo Проверка наличия Bun...
where bun >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo %YELLOW%Bun не установлен! Устанавливаем...%NC%
    powershell -c "irm bun.sh/install.ps1 | iex"
    echo %YELLOW%Bun требует перезапуска терминала для применения.%NC%
    echo %YELLOW%Пожалуйста, выполните этот скрипт снова после закрытия.%NC%
    pause
    exit
)

:: Клонирование репозитория
echo %YELLOW%Скачиваем последнюю версию SwooMiner...%NC%
if exist %TEMP_DIR% (
    rmdir /S /Q %TEMP_DIR%
)
mkdir %TEMP_DIR%
git clone --depth 1 --branch %BRANCH% %REPO_URL% %TEMP_DIR%

:: Проверка успешности клонирования
if not exist %TEMP_DIR%\package.json (
    echo %RED%Не удалось скачать репозиторий. Проверьте соединение с интернетом.%NC%
    pause
    exit /b 1
)

:: Создаем целевую директорию
if not exist %TARGET_DIR% (
    mkdir %TARGET_DIR%
)

:: Копируем файлы
echo %YELLOW%Копируем файлы проекта...%NC%
xcopy /E /I /Y %TEMP_DIR%\* %TARGET_DIR%\
if exist %TEMP_DIR%\.gitignore (
    copy /Y %TEMP_DIR%\.gitignore %TARGET_DIR%\
)

:: Удаляем временную директорию
rmdir /S /Q %TEMP_DIR%

:: Переходим в директорию проекта
cd %TARGET_DIR%

echo %GREEN%Проект успешно скачан в директорию %TARGET_DIR%%NC%

:: Копирование конфигурации TypeScript для Bun
echo %YELLOW%Настраиваем TypeScript для Bun...%NC%
copy tsconfig-bun.json tsconfig.json

:: Установка зависимостей
echo %YELLOW%Устанавливаем зависимости...%NC%
bun install

:: Создание директории для логов
echo %YELLOW%Создаем директорию для логов...%NC%
if not exist logs mkdir logs

:: Проверка наличия и создание config.json
echo %YELLOW%Проверяем наличие config.json...%NC%
if not exist config.json (
    echo %YELLOW%Создаем config.json из примера...%NC%
    copy config.example.json config.json
    echo %RED%ВНИМАНИЕ: Откройте файл config.json и настройте его перед продолжением!%NC%
    start notepad config.json
    echo %YELLOW%Нажмите любую клавишу после редактирования config.json...%NC%
    pause >nul
)

:: Запуск проекта
echo %GREEN%Все готово! Запускаем SwooMiner...%NC%
bun run start

pause 