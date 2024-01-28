# SwooMiner РУС (Windows)
Бот для отправки SMS для Swoo Pay

Приложение Swoo Pay вознаграждает пользователей внутренней криптовалютой (SWOO) при получении SMS, которую можно обменять на Bitcoin, Ethereum и другие криптовалюты.

В настоящее время приложение Swoo Pay доступно в:

1. Республике Беларусь - работает.
2. Российская Федерация - неизвесто.
3. Украина - не работает.


Что бы начать работу, необходимо:
1. Установить [NodeJS](https://nodejs.org/en).
2. Возможно надо будет установить [PowerShell](https://learn.microsoft.com/ru-ru/powershell/scripting/install/installing-powershell-on-windows?view=powershell-7.4#msi).
3. Скачать данный [проект](https://github.com/AlexRahvalov/SwooMiner/releases).
4. Распокуйте скачанный архив в удобную для вас папку.
5. В файле /index.js, найдите и замените на свои данные ("Your rucaptcha API key" и "Your phone number"). Получить rucaptcha API key можно на [сайте](https://rucaptcha.com/).
6. В папке с проектом нажмите ПКМ > Открыть в терминале.
7. В открывшейся консоли введите "npm i".
8. После установки всех пакетов, введите "node ."

Так же вам необходимо скачать приложение [Swoo Pay](https://play.google.com/store/apps/details?id=com.cardsmobile.swoo&hl=ru&gl=US).
И пройти регистрацию на тот номер на который вы будете отсылать смс сообщения.
