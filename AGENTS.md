# یادداشت برای agentهای کدنویسی AI

این مخزن **AI-native** است: نگهدارندگان از دستیار استفاده می‌کنند؛ **PRهای AI خوش‌آمدند**.

## این پروژه چیست

- اپ وب **فارسی RTL** استاتیک برای فضای ذخیره‌سازی سازگار با S3 آروان
- ماژول‌ها در `js/` (بدون bundler)
- `server.py` — سرور فایل + `/s3-proxy` برای اعمال مستقیم S3 فقط روی localhost
- `deploy/` — پکیج پایتون (`python3 -m deploy`) برای آپلود وب‌سایت استاتیک

## قوانین سخت

1. **هرگز** `.deploy.env`، API key یا secret را commit نکنید.
2. **هرگز** ورود credential روی میزبانی فقط-استاتیک بدون probeی `server.py` فعال نکنید.
3. **املای محصول آروان** در UI فارسی (ذخیره‌سازی ابری، نه تبلیغات ژنریک «S3»).
4. نکات Ceph: Lifecycle به `<Filter></Filter>` نیاز دارد؛ بعضی قابلیت‌های IAM پشتیبانی نمی‌شوند — پنل محدودیت‌ها در اپ.
5. PR کوچک؛ سبک موجود (ES modules، بدون React، بدون build برای اپ).

## دستورات مفید

```bash
make serve
make install && make deploy    # نیاز به .deploy.env با S3_*
make assets
```

## فایل‌های اولویت‌دار

- `js/cloud-data.js` — actionها، کلاسترها، الگوها
- `js/app.js` — اتصال UI
- `js/s3-connection.js` — کلاینت S3 + تشخیص لوکال
- `deploy/config.py` — آپلود، CORS، ACL عمومی

## پیشنهاد policy

کمترین دسترسی (least privilege). `Principal: "*"` و resourceهای wildcard را در UI یا کامنت واضح علامت بزنید.
