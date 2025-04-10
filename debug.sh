#!/bin/bash

# Цвета для текста
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Функция для проверки наличия команды
check_command() {
    command -v $1 >/dev/null 2>&1
}

echo -e "${GREEN}Запуск в режиме отладки...${NC}"
export BUN_DEBUG=1
export BUN_INSPECT=1

echo -e "${YELLOW}Проверка наличия Bun...${NC}"
if ! check_command bun; then
    echo -e "${RED}Bun не установлен! Устанавливаем...${NC}"
    curl -fsSL https://bun.sh/install | bash
    
    # Обновление PATH для текущей сессии
    export BUN_INSTALL="$HOME/.bun"
    export PATH="$BUN_INSTALL/bin:$PATH"
    
    # Проверка установки
    if ! check_command bun; then
        echo -e "${RED}Не удалось установить Bun. Запустите скрипт снова после перезапуска терминала.${NC}"
        exit 1
    fi
fi

echo -e "${YELLOW}Проверка конфигурации TypeScript...${NC}"
if [ ! -f "tsconfig.json" ] || ! grep -q "bun-types" "tsconfig.json"; then
    echo -e "${YELLOW}Копирование конфигурации TypeScript для Bun...${NC}"
    cp tsconfig-bun.json tsconfig.json
fi

echo -e "${YELLOW}Установка зависимостей...${NC}"
bun install

echo -e "${YELLOW}Создание директории для логов...${NC}"
mkdir -p logs

echo -e "${GREEN}Запуск проекта в режиме отладки...${NC}"
bun run src/index.ts > logs/debug.log 2>&1

echo -e "${GREEN}Завершено. Логи сохранены в logs/debug.log${NC}" 