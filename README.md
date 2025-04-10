# SwooMiner РУС (Windows/Linux/macOS)

Бот для отправки SMS для Swoo Pay

Приложение Swoo Pay вознаграждает пользователей внутренней криптовалютой (SWOO) при получении SMS, которую можно обменять на Bitcoin, Ethereum и другие криптовалюты.

В настоящее время приложение Swoo Pay доступно в:

1. Республике Беларусь - **работает.**
2. Российская Федерация - **не работает.**
3. Украина - **не работает.**

## Запуск через Node.js

Что бы начать работу, необходимо:
1. Установить [NodeJS](https://nodejs.org/en) 16+.
2. Возможно надо будет установить [PowerShell](https://learn.microsoft.com/ru-ru/powershell/scripting/install/installing-powershell-on-windows?view=powershell-7.4#msi).
3. Скачать данный [проект](https://github.com/AlexRahvalov/SwooMiner/releases).
4. Распакуйте скачанный архив в удобную для вас папку.
5. Скопируйте файл `config.example.json` в `config.json`, настройте на свои данные. Получить rucaptcha API key можно на сайте [рукапчи](https://rucaptcha.com/).
6. В папке с проектом нажмите ПКМ > Открыть в терминале.
7. В открывшейся консоли введите `npm install`.

Для запуска скрипта введите `npm run start`

## Запуск через Bun (рекомендуется)

[Bun](https://bun.sh) - это быстрый JavaScript рантайм, который ускоряет работу проекта и упрощает настройку.

### Преимущества Bun
- Значительно быстрее Node.js
- Встроенные TypeScript, менеджер пакетов и тестирование
- Минимальная настройка и установка зависимостей
- Поддержка всех основных платформ

### Установка Bun

**Windows (через PowerShell):**
```powershell
powershell -c "irm bun.sh/install.ps1 | iex"
```

**macOS/Linux:**
```bash
curl -fsSL https://bun.sh/install | bash
```

### Запуск проекта с Bun

1. **Настройка:**
   Скопируйте специальную конфигурацию для TypeScript:
   ```bash
   cp tsconfig-bun.json tsconfig.json
   ```

2. **Установка зависимостей:**
   ```bash
   bun install
   ```

3. **Создание директории для логов:**
   ```bash
   mkdir -p logs   # Linux/macOS
   # или
   md logs         # Windows
   ```

4. **Запуск проекта:**
   ```bash
   bun run start
   ```

### Решение проблем с Bun

Если возникают ошибки связанные с типами:
```bash
bun add -d bun-types
```

Для отладки можно запустить с дополнительными флагами:
```bash
BUN_DEBUG=1 bun run src/index.ts
```

## Настройка config.json

Основные параметры конфигурации:
- `anticaptcha`: настройки сервиса распознавания капчи
- `phones`: список номеров телефонов для отправки SMS
- `limits`: настройки задержек между действиями
- `plugins`: настройки плагинов (adblock и др.)
- `sites`: активация сайтов (premier, tinkoff)
- `browser`: настройки браузера (headless режим и т.д.)

## Требования

Перед использованием необходимо скачать приложение [Swoo Pay](https://play.google.com/store/apps/details?id=com.cardsmobile.swoo) и зарегистрироваться, используя те же номера телефонов, которые будут указаны в config.json.

## Версия
Текущая версия: 0.1.0 (см. [CHANGELOG.md](CHANGELOG.md) для деталей)
