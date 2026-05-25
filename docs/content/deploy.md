# استقرار

راهنمای استقرار **ابزار** (فایل‌های HTML/JS/CSS) و **سایت مستندات** روی فضای ذخیره‌سازی S3 آروان.

---

## ابزار (وب‌سایت استاتیک)

### پیش‌نیاز

```bash
make install
make assets    # فونت‌ها و aws4fetch — یک‌بار
```

### ویزارد تعاملی

```bash
make deploy
```

ویزارد از شما می‌پرسد: نام bucket، endpoint، Access Key، Secret Key.

فرایند deploy:

1. ایجاد bucket در صورت نبودن
2. سیاست خواندن عمومی و ACL `public-read` روی اشیاء
3. تنظیم CORS باکت
4. فعال‌سازی وب‌سایت استاتیک (`index.html`)
5. آپلود فایل‌ها با `Content-Type` صحیح

### استقرار سریع با `.deploy.env`

```bash
cp .deploy.env.example .deploy.env
# پر کردن S3_BUCKET، S3_ACCESS_KEY_ID، S3_SECRET_ACCESS_KEY
make deploy-quick
```

### اصلاح MIME

پس از آپلود دستی در پنل آروان، اگر CSS/JS کار نکرد:

```bash
make fix-mime
```

---

## ساختار فایل‌های bucket (ابزار)

```
index.html
css/styles.css
assets/fonts/**/*.woff2
js/*.js
js/vendor/aws4fetch.mjs
assets/favicon.svg
```

در پنل آروان: **Static website** → فهرست: `index.html`.

---

## سایت مستندات

### لوکال

```bash
make docs
make docs-serve    # http://localhost:8081
```

### انتشار خودکار

با push به `main`، workflow `static.yml` سایت را در `docs/_site` می‌سازد و روی GitHub Pages منتشر می‌کند.

**تنظیم مخزن:** Settings → Pages → Source: **GitHub Actions**

نمونهٔ استقرار مستقل: [policygen.ceph-s3.ir](https://policygen.ceph-s3.ir/)

### محتوای مستندات

منبع اصلی: پوشهٔ `docs/content/` (Markdown فارسی).  
فایل‌های `.md` در ریشهٔ پروژه فقط خلاصه و لینک به مستندات هستند.

---

## CLI

| دستور | کار |
|--------|-----|
| `python3 -m deploy wizard deploy` | ویزارد آپلود ابزار |
| `python3 -m deploy wizard fix-mime` | اصلاح MIME |
| `python3 -m deploy assets` | دانلود فونت/vendor |
| `python3 -m deploy deploy BUCKET KEY SECRET [ENDPOINT]` | آپلود مستقیم |
