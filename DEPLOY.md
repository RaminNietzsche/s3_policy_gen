# استقرار استاتیک روی S3 آروان

بخشی از [s3_policy_gen](https://github.com/RaminNietzsche/s3_policy_gen).

اعمال مستقیم روی آروان و وارد کردن کلید S3 **فقط** با `make serve` روی localhost کار می‌کند.

## پیش‌نیاز

```bash
make install
make assets    # یک‌بار
make deploy    # ویزارد TUI
```

deploy این کارها را انجام می‌دهد: ساخت باکت در صورت نبود، policy خواندن عمومی + ACL، CORS باکت، تنظیم وب‌سایت استاتیک، آپلود همه فایل‌ها با MIME درست.

## توسعهٔ لوکال

```bash
make serve
# http://localhost:8080
```

## بدون ویزارد (سریع)

```bash
export S3_BUCKET=my-bucket
export S3_ACCESS_KEY_ID=...
export S3_SECRET_ACCESS_KEY=...
export S3_ENDPOINT=https://s3.ir-thr-at1.arvanstorage.ir   # اختیاری

make deploy-quick
```

یا:

```bash
.venv/bin/python -m deploy deploy BUCKET ACCESS_KEY SECRET_KEY [ENDPOINT]
```

### فایل `.deploy.env` (اختیاری، در gitignore)

برای `make deploy-quick` هر سه مقدار لازم است:

```
S3_BUCKET=...
S3_ACCESS_KEY_ID=...
S3_SECRET_ACCESS_KEY=...
S3_ENDPOINT=https://s3.ir-thr-at1.arvanstorage.ir
```

ویزارد TUI معمولاً bucket / endpoint / access را ذخیره می‌کند؛ خط **Secret** را خودتان برای deploy غیرتعاملی اضافه کنید.

## محتوای bucket

```
index.html
css/styles.css
assets/fonts/**/*.woff2
js/*.js
js/vendor/aws4fetch.mjs
```

اگر API وب‌سایت استاتیک جواب نداد، در پنل آروان **Static website** را فعال کنید (index: `index.html`).

## اصلاح MIME پس از آپلود دستی

آپلود از پنل آروان اغلب `text/plain` می‌گذارد:

```bash
make fix-mime
```

## CLI

| دستور | کار |
|--------|-----|
| `python3 -m deploy wizard deploy` | ویزارد آپلود |
| `python3 -m deploy wizard fix-mime` | ویزارد اصلاح MIME |
| `python3 -m deploy assets` | دانلود فونت/vendor |
| `python3 -m deploy deploy ...` | آپلود با آرگومان |
