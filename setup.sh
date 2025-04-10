#!/bin/bash

# Настройки
REPO_URL="https://github.com/AlexRahvalov/SwooMiner"
BRANCH="main"
TEMP_DIR="swoominer_temp"
TARGET_DIR="$HOME/SwooMiner"

# Цвета для текста
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Функция для проверки наличия команды
check_command() {
    command -v $1 >/dev/null 2>&1
}

echo -e "${GREEN}=== SwooMiner - Автоматическая установка ===${NC}"

# Проверка наличия Git
echo -e "Проверка наличия Git..."
if ! check_command git; then
    echo -e "${RED}Git не найден. Устанавливаем...${NC}"
    
    if [[ "$OSTYPE" == "linux-gnu"* ]]; then
        # Linux
        if check_command apt-get; then
            sudo apt-get update && sudo apt-get install -y git
        elif check_command dnf; then
            sudo dnf install -y git
        elif check_command yum; then
            sudo yum install -y git
        elif check_command pacman; then
            sudo pacman -S --noconfirm git
        else
            echo -e "${RED}Не удалось определить пакетный менеджер. Установите Git вручную.${NC}"
            exit 1
        fi
    elif [[ "$OSTYPE" == "darwin"* ]]; then
        # Mac OS
        if check_command brew; then
            brew install git
        else
            echo -e "${YELLOW}Homebrew не найден. Устанавливаем Homebrew...${NC}"
            /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
            brew install git
        fi
    else
        echo -e "${RED}Неподдерживаемая операционная система: $OSTYPE${NC}"
        exit 1
    fi
    
    if ! check_command git; then
        echo -e "${RED}Не удалось установить Git. Установите его вручную и запустите скрипт снова.${NC}"
        exit 1
    fi
    
    echo -e "${GREEN}Git успешно установлен!${NC}"
fi

# Проверка наличия Bun
echo -e "Проверка наличия Bun..."
if ! check_command bun; then
    echo -e "${YELLOW}Bun не установлен! Устанавливаем...${NC}"
    
    curl -fsSL https://bun.sh/install | bash
    
    # Обновление PATH для текущей сессии
    export BUN_INSTALL="$HOME/.bun"
    export PATH="$BUN_INSTALL/bin:$PATH"
    
    # Проверка установки
    if ! check_command bun; then
        echo -e "${RED}Не удалось установить Bun. Запустите скрипт снова после перезапуска терминала или установите вручную:${NC}"
        echo -e "${YELLOW}curl -fsSL https://bun.sh/install | bash${NC}"
        exit 1
    fi
    
    echo -e "${GREEN}Bun успешно установлен!${NC}"
fi

# Клонирование репозитория
echo -e "${YELLOW}Скачиваем последнюю версию SwooMiner...${NC}"
if [ -d "$TEMP_DIR" ]; then
    rm -rf "$TEMP_DIR"
fi
mkdir -p "$TEMP_DIR"
git clone --depth 1 --branch $BRANCH $REPO_URL $TEMP_DIR

# Проверка успешности клонирования
if [ ! -f "$TEMP_DIR/package.json" ]; then
    echo -e "${RED}Не удалось скачать репозиторий. Проверьте соединение с интернетом.${NC}"
    exit 1
fi

# Создаем целевую директорию
mkdir -p "$TARGET_DIR"

# Копируем файлы
echo -e "${YELLOW}Копируем файлы проекта...${NC}"
cp -r $TEMP_DIR/* $TARGET_DIR/
if [ -f "$TEMP_DIR/.gitignore" ]; then
    cp -r $TEMP_DIR/.gitignore $TARGET_DIR/
fi

# Удаляем временную директорию
rm -rf "$TEMP_DIR"

# Переходим в директорию проекта
cd "$TARGET_DIR"

echo -e "${GREEN}Проект успешно скачан в директорию $TARGET_DIR${NC}"

# Копирование конфигурации TypeScript для Bun
echo -e "${YELLOW}Настраиваем TypeScript для Bun...${NC}"
cp tsconfig-bun.json tsconfig.json

# Установка зависимостей
echo -e "${YELLOW}Устанавливаем зависимости...${NC}"
bun install

# Создание директории для логов
echo -e "${YELLOW}Создаем директорию для логов...${NC}"
mkdir -p logs

# Проверка наличия и создание config.json
echo -e "${YELLOW}Проверяем наличие config.json...${NC}"
if [ ! -f "config.json" ]; then
    echo -e "${YELLOW}Создаем config.json из примера...${NC}"
    cp config.example.json config.json
    echo -e "${RED}ВНИМАНИЕ: Откройте файл config.json и настройте его перед продолжением!${NC}"
    
    # Выбор редактора
    EDITOR=""
    for editor in nano vim vi code gedit; do
        if check_command $editor; then
            EDITOR=$editor
            break
        fi
    done
    
    if [ -n "$EDITOR" ]; then
        $EDITOR config.json
    else
        echo -e "${YELLOW}Не найден текстовый редактор. Пожалуйста, отредактируйте config.json вручную перед запуском.${NC}"
        read -p "Нажмите Enter, когда будете готовы продолжить..."
    fi
fi

# Запуск проекта
echo -e "${GREEN}Все готово! Запускаем SwooMiner...${NC}"
bun run start 