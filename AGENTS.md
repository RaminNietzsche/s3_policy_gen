<div dir="rtl" align="right">

# راهنمای agentهای کدنویسی AI

مخزن با مشارکت AI توسعه یافته؛ Pull Requestهای AI پذیرفته می‌شوند.

## معرفی پروژه

- اپ وب فارسی RTL برای فضای ذخیره‌سازی سازگار با S3 آروان
- ماژول‌ها در `js/` بدون bundler
- `server.py` — فایل استاتیک و `/s3-proxy` (فقط localhost)
- `deploy/` — `python3 -m deploy`

## قوانین

1. commit نکردن `.deploy.env` و کلیدها
2. غیرفعال نگه‌داشتن ورود credential روی میزبانی استاتیک بدون تشخیص `server.py`
3. رعایت املای «ذخیره‌سازی ابری» و نام محصولات آروان در UI
4. Lifecycle: عنصر `<Filter></Filter>` اجباری است؛ برخی قابلیت‌های IAM در سرویس پشتیبانی محدود است
5. تغییرات کوچک و هم‌سبک با کد موجود

## دستورات

```bash
make serve
make install && make deploy
make assets
```

## فایل‌های مرجع

- `js/cloud-data.js`
- `js/app.js`
- `js/s3-connection.js`
- `deploy/config.py`

## سیاست دسترسی

اصل کمترین دسترسی (least privilege). موارد `Principal: "*"` را در UI یا توضیحات شفاف کنید.

</div>
