# مشروع شروق

ده مشروع Frontend معمول بـ React + Vite، ومعاه Backend معمول بـ Laravel.

الفولدر ده نسخة جاهزة للرفع على GitHub. الاعتماديات والملفات المحلية زي `node_modules` و`vendor` و`.env` وملفات الداتابيز مش موجودة هنا، وكل واحد يشغل المشروع على جهازه هيعملها من الأول بخطوات التشغيل اللي تحت.

## المطلوب يكون متثبت على الجهاز

- Node.js
- npm
- PHP 8.2 أو أحدث
- Composer

## تشغيل المشروع لوكال

افتح Terminal جوه فولدر المشروع، يعني جوه فولدر `بروجكت شروق`.

### 1. شغل الـ Backend

ادخل على فولدر الباك إند:

```bash
cd backend
```

ثبت مكتبات Laravel:

```bash
composer install
```

اعمل ملف الإعدادات:

```bash
copy .env.example .env
```

لو على Mac أو Linux استخدم:

```bash
cp .env.example .env
```

طلع مفتاح التطبيق:

```bash
php artisan key:generate
```

اعمل ملف الداتابيز SQLite:

```bash
type nul > database/database.sqlite
```

لو على Mac أو Linux استخدم:

```bash
touch database/database.sqlite
```

شغل المايجريشن:

```bash
php artisan migrate
```

شغل سيرفر Laravel:

```bash
php artisan serve
```

سيبه شغال. غالبا هيشتغل على:

```text
http://localhost:8000
```

### 2. شغل الـ Frontend

افتح Terminal تاني جديد جوه فولدر `بروجكت شروق`.

ثبت مكتبات الفرونت:

```bash
npm install
```

اعمل ملف إعدادات الفرونت:

```bash
copy .env.example .env
```

لو على Mac أو Linux استخدم:

```bash
cp .env.example .env
```

شغل المشروع:

```bash
npm run dev
```

افتح اللينك اللي هيظهرلك في التيرمينال، غالبا:

```text
http://localhost:5173
```

## ملاحظات مهمة قبل الرفع على GitHub

- متعملش رفع لفولدر `node_modules`.
- متعملش رفع لفولدر `backend/vendor`.
- متعملش رفع لملفات `.env`.
- متعملش رفع لملفات الداتابيز زي `database.sqlite`.
- الملفات دي متساب لها `package-lock.json` و`composer.lock` عشان نفس الإصدارات تتثبت عند أي حد يشغل المشروع.

## أوامر مفيدة

تشغيل الفرونت:

```bash
npm run dev
```

تجهيز نسخة إنتاج من الفرونت:

```bash
npm run build
```

تشغيل الباك إند:

```bash
cd backend
php artisan serve
```

تشغيل اختبارات Laravel لو محتاج:

```bash
cd backend
php artisan test
```
