# HealthSync Backend

This backend is a Laravel API that powers HealthSync profile data, manual vital readings, alerts, Telegram linking, Telegram messaging, and the temporary mock AI analysis preview.

## Stack

- Laravel 12
- Sanctum token auth
- Eloquent models
- Laravel migrations
- Laravel services for Telegram handling and health rules

## Local Setup

1. Install PHP dependencies:

```bash
composer install
```

2. Create `.env` from `.env.example`:

```bash
copy .env.example .env
```

3. Generate the app key:

```bash
php artisan key:generate
```

4. Local development is expected to use SQLite by default.

Create the local SQLite file if it does not exist yet:

```bash
type nul > database\database.sqlite
```

5. Confirm the default local DB settings in `.env`:

```bash
DB_CONNECTION=sqlite
DB_DATABASE=database/database.sqlite
```

6. Run migrations:

```bash
php artisan migrate
```

7. Start the Laravel API:

```bash
php artisan serve
```

The API will be available at [http://localhost:8000](http://localhost:8000).

## Required Environment Variables

These values are defined or referenced by the current MVP implementation:

### Core Laravel

- `APP_NAME`
- `APP_ENV`
- `APP_KEY`
- `APP_DEBUG`
- `APP_URL`
- `APP_TIMEZONE`
- `DB_CONNECTION`
- `DB_DATABASE`
- `DB_HOST`
- `DB_PORT`
- `DB_USERNAME`
- `DB_PASSWORD`

Local expectation:
- the current backend is set up to run with SQLite locally
- `database/database.sqlite` must exist before the first `php artisan migrate`
- MySQL settings are only needed if you intentionally switch the driver away from SQLite

### Frontend / Backend Linking

- `BACKEND_BASE_URL`
  Example: `http://localhost:8000`
- `FRONTEND_APP_URL`
  Example: `http://localhost:5173`

### Telegram

- `TELEGRAM_BOT_TOKEN`
- `TELEGRAM_BOT_USERNAME`
- `TELEGRAM_CONNECT_TOKEN_EXPIRATION_MINUTES`
- `TELEGRAM_POLLING_TIMEOUT`
- `TELEGRAM_POLLING_SLEEP_SECONDS`
- `TELEGRAM_VERIFY_SSL`

Do not commit a real Telegram bot token.

Important:
- `TELEGRAM_BOT_TOKEN` is the BotFather HTTP API token
- `TELEGRAM_BOT_USERNAME` is only the bot username used for deep links and display
- do not swap those two values

## Telegram Bot Local Run

For local development, this MVP uses polling instead of webhooks.

1. Set the Telegram env vars in `.env`.
2. Start the Laravel API:

```bash
php artisan serve
```

3. In a second terminal, start the polling loop:

```bash
php artisan telegram:poll
```

4. Keep both processes running while testing the app and the bot.

If Windows local SSL inspection causes `cURL error 60`, this project now supports a local-only config toggle:

```bash
TELEGRAM_VERIFY_SSL=false
```

This should stay `true` outside local development.

### Polling vs Webhook

- Local development: polling via `php artisan telegram:poll`
- Future-friendly structure: the same bot update handler is also exposed at `POST /api/telegram/webhook`, so the bot can be switched to webhook mode later without rewriting the core bot logic

## API Areas Added For This MVP

Authenticated endpoints:
- `GET /api/profile`
- `PATCH /api/profile`
- `GET /api/dashboard`
- `GET /api/vitals`
- `POST /api/vitals`
- `GET /api/alerts`
- `GET /api/recommendations/latest`
- `GET /api/summary/today`
- `GET /api/telegram/status`
- `POST /api/telegram/connect-token`
- `PATCH /api/telegram/preferences`
- `POST /api/telegram/test-message`
- `DELETE /api/telegram/disconnect`

Bot endpoint:
- `POST /api/telegram/webhook`

## Telegram Connection Flow

1. The signed-in frontend calls `POST /api/telegram/connect-token`.
2. Laravel creates a one-time hashed connect token with an expiry.
3. The frontend opens:

```text
https://t.me/<TELEGRAM_BOT_USERNAME>?start=<token>
```

4. The user presses `Start` in Telegram.
5. The bot receives `/start <token>`.
6. Laravel verifies the token and links:
   - user account
   - Telegram `chat_id`
   - Telegram username when available
7. The bot sends a success message and returns the main keyboard.

## Manual Reading / Alert / Recommendation Testing

### Manual reading persistence

1. Sign in from the frontend.
2. Add a reading from the dashboard or a vital page.
3. Confirm the request reaches `POST /api/vitals`.
4. Confirm the reading appears in:
   - `GET /api/dashboard`
   - `GET /api/vitals`
   - `GET /api/summary/today`

### Alert generation

Save an elevated or critical reading, then confirm:
- a notification record is created
- `GET /api/alerts` returns it

### Recommendation generation

After each saved manual reading, confirm:
- the response includes `recommendation`
- the user's `latest_recommendation` is updated
- `GET /api/recommendations/latest` returns it

### Telegram delivery

After Telegram is connected and polling is running:
- `POST /api/telegram/test-message` should send a test message
- elevated or critical readings should send alert text when `critical_alerts` is enabled
- every manual reading should send recommendation text when `recommendations` is enabled

## Verification

Backend verification performed during implementation:

```bash
php artisan test
php artisan route:list --path=telegram
```

Important testing note:
- live Telegram delivery was not verified against a real production bot token in this environment
- verification used Laravel feature tests and HTTP fakes for Telegram API calls
- local polling may still require a valid Telegram token and outbound network access on your machine

## What Remains Mock

- AI analysis remains temporary mock logic and is not powered by a real AI backend
- device ingestion is still not connected to real devices
- scheduled daily Telegram summary delivery is not yet automated, even though the user preference is stored

## Related Files

- [../README.md](C:\Users\M.Alaa\Desktop\fin%20shourk\frontend-demo-main\README.md)
- [../IMPLEMENTATION_UPDATES.md](C:\Users\M.Alaa\Desktop\fin%20shourk\frontend-demo-main\IMPLEMENTATION_UPDATES.md)
- [DEPLOYMENT_HOSTINGER.md](C:\Users\M.Alaa\Desktop\fin%20shourk\frontend-demo-main\backend\DEPLOYMENT_HOSTINGER.md)
