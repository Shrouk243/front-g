# Hostinger Deployment Notes

Recommended production layout:

- Deploy Laravel API in a dedicated subdomain such as `api.your-domain.com`
- Point the subdomain document root to Laravel `public/`
- Keep the full Laravel project one level above the public document root

Basic production flow:

1. Upload the full `backend/` project to your hosting account.
2. Make sure `.env` is created from `.env.hostinger.example`.
3. Set `APP_KEY` using `php artisan key:generate --show`.
4. Run:
   - `composer install --no-dev --optimize-autoloader`
   - `php artisan migrate --force`
   - `php artisan storage:link`
   - `php artisan config:cache`
   - `php artisan route:cache`
   - `php artisan view:cache`
5. Point the public document root to the Laravel `public/` folder.

Temporary MVP behaviors included:

- `TEMP MOCK` rule-based AI analysis
- manual vital entry fallback when device APIs are unavailable
- optional demo seeder via `php artisan db:seed --class=DemoDataSeeder`
