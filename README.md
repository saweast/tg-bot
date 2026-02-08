# Telegram Video Download Bot

Бот завантажує відео з YouTube Shorts, Instagram Reels та TikTok і відправляє їх у чат. Ліміти: 50 MB, до 60 сек. Одне посилання за повідомлення.

## Токен бота

1. Відкрий [@BotFather](https://t.me/BotFather) в Telegram.
2. Команда `/newbot` — вкажи ім’я та username бота.
3. Скопіюй отриманий токен.
4. Створи файл `.env` в корені проєкту:
   ```
   BOT_TOKEN=твій_токен
   ```

## Локальний запуск

- Потрібні: Node.js 20+, [yt-dlp](https://github.com/yt-dlp/yt-dlp) у PATH.
- Встановлення залежностей та запуск:
  ```bash
  npm install
  npm start
  ```

## Docker

```bash
docker compose up --build
```

Контейнер містить Node та yt-dlp, достатньо мати `.env` з `BOT_TOKEN`.

## Використання

1. Знайди бота в Telegram за username (з BotFather).
2. Натисни **Start** або надішли `/start` — побачиш інструкцію.
3. Надішли **одне** посилання на Shorts / Reels / TikTok — бот завантажить відео і надішле його в чат.

**У групах:** додай бота в групу; коли хтось надішле посилання на Shorts/Reels/TikTok, бот відповість у треді цим відео. У групах бот не відповідає на повідомлення без посилань. Якщо бот не реагує на посилання: у **@BotFather** → `/mybots` → твій бот → **Bot Settings** → **Group Privacy** → **Turn off** (щоб бот бачив усі повідомлення в групі).

## Cookies (опційно)

Якщо YouTube повертає 403 або Instagram вимагає вхід — можна підключити cookies у форматі Netscape.

1. **Експорт з браузера**
   - Розширення: [Get cookies.txt LOCALLY](https://chromewebstore.google.com/detail/get-cookiestxt-locally/cclelndahbckbenkjhflpdbgdldlbecc) (Chrome) або [cookies.txt](https://addons.mozilla.org/en-US/firefox/addon/cookies-txt/) (Firefox).
   - Відкрий youtube.com (або instagram.com), залогінься, експортуй cookies у форматі **Netscape** і збережи як `cookies.txt`.

2. **Локально**
   - Поклади `cookies.txt` у корінь проєкту (або вкажи шлях у `.env`).
   - У `.env`: `COOKIES_FILE=./cookies.txt` (абсолютний або відносний шлях).

3. **Docker**
   - Поклади `cookies.txt` у папку з проєктом.
   - У `docker-compose.yml` розкоментуй:
     ```yaml
     volumes:
       - ./cookies.txt:/app/cookies.txt
     ```
     (Без `:ro`, щоб yt-dlp міг оновлювати cookies.)
   - У `.env`: `COOKIES_FILE=/app/cookies.txt`.
   - Перезапусти: `ERROR   failed to get image vdev/tg-bot:latest: failed to pull image vdev/tg-bot:latest: GET https://index.docker.io/v2/vdev/tg-bot/manifests/latest: UNAUTHORIZED: authentication required; [map[Action:pull Class: Name:vdev/tg-bot Type:repository]]  up -d --force-recreate`.

Бот передає cookies в yt-dlp лише якщо файл існує і не порожній.

## Якщо відео не завантажується

- **Docker:** переглянь логи — там буде реальна помилка yt-dlp: `docker compose logs -f`.
- **YouTube** — спробуй cookies (див. вище) або інший мережевий вихід.
- **Instagram** часто вимагає cookies (експорт у Netscape-формат).
- **TikTok** іноді блокує за IP; спробуй оновити yt-dlp у образі (перезібрати образ).
