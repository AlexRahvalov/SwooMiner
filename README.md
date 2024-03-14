# SwooMiner РУС (Windows)
Бот для отправки SMS для Swoo Pay

Приложение Swoo Pay вознаграждает пользователей внутренней криптовалютой (SWOO) при получении SMS, которую можно обменять на Bitcoin, Ethereum и другие криптовалюты.

В настоящее время приложение Swoo Pay доступно в:

1. Республике Беларусь - **работает.**
2. Российская Федерация - **не работает.**
3. Украина - **не работает.**


Что бы начать работу, необходимо:
1. Установить [NodeJS](https://nodejs.org/en).
2. Возможно надо будет установить [PowerShell](https://learn.microsoft.com/ru-ru/powershell/scripting/install/installing-powershell-on-windows?view=powershell-7.4#msi).
3. Скачать данный [проект](https://github.com/AlexRahvalov/SwooMiner/releases).
4. Распакуйте скачанный архив в удобную для вас папку.
5. Скопируйте файл `config.example.json` в `config.json`, настройте на свои данные. Получить rucaptcha API key можно на сайте [рукапчи](https://rucaptcha.com/).
6. В папке с проектом нажмите ПКМ > Открыть в терминале.
7. В открывшейся консоли введите `npm install`.

Для запуска скрипта введите `npm run start`

Так же вам необходимо скачать приложение [Swoo Pay](https://play.google.com/store/apps/details?id=com.cardsmobile.swoo&hl=ru&gl=US).
И пройти регистрацию на тот номер на который вы будете отсылать смс сообщения.
