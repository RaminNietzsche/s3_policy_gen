<div dir="rtl" align="right">

# استقرار استاتیک روی S3 آروان

بخشی از [s3_policy_gen](https://github.com/RaminNietzsche/s3_policy_gen).

اعمال مستقیم تنظیمات و وارد کردن کلید S3 **فقط** با `make serve` روی localhost امکان‌پذیر است.

## پیش‌نیاز

```bash
make install
make assets
make deploy
```

فرایند deploy شامل: ایجاد باکت در صورت نبود، سیاست خواندن عمومی، CORS باکت، پیکربندی وب‌سایت استاتیک، و آپلود فایل‌ها با MIME صحیح است.

## توسعهٔ لوکال

```bash
make serve
```

آدرس: `http://localhost:8080`

## استقرار غیرتعاملی

```bash
export S3_BUCKET=my-bucket
export S3_ACCESS_KEY_ID=...
export S3_SECRET_ACCESS_KEY=...
export S3_ENDPOINT=https://s3.ir-thr-at1.arvanstorage.ir

make deploy-quick
```

### فایل `.deploy.env`

```
S3_BUCKET=...
S3_ACCESS_KEY_ID=...
S3_SECRET_ACCESS_KEY=...
S3_ENDPOINT=https://s3.ir-thr-at1.arvanstorage.ir
```

## محتوای باکت

```
index.html
css/styles.css
assets/fonts/**/*.woff2
js/*.js
js/vendor/aws4fetch.mjs
```

در پنل آروان، در صورت نیاز **Static website** را فعال کنید (فهرست: `index.html`).

## اصلاح MIME

```bash
make fix-mime
```

## رابط خط فرمان

| دستور | کار |
|--------|-----|
| `python3 -m deploy wizard deploy` | ویزارد آپلود |
| `python3 -m deploy wizard fix-mime` | اصلاح MIME |
| `python3 -m deploy assets` | دریافت فونت و vendor |
| `python3 -m deploy deploy ...` | آپلود با آرگومان |

## مستندات (GitHub Pages)

پس از push به `main`، workflow [`static.yml`](.github/workflows/static.yml) سایت مستندات را می‌سازد.

لوکال:

```bash
make docs
make docs-serve   # http://localhost:8081
```

آدرس منتشرشده (پس از فعال‌سازی Pages در تنظیمات مخزن):

`https://raminnietzsche.github.io/s3_policy_gen/`

</div>
