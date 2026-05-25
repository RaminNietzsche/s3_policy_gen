<div dir="rtl" align="right">

# s3_policy_gen

</div>

<div dir="ltr" align="left">

[![License: MIT](https://img.shields.io/badge/License-MIT-teal.svg)](LICENSE)
[![Python](https://img.shields.io/badge/python-3.10+-blue.svg)](https://www.python.org/)
[![Arvan Cloud](https://img.shields.io/badge/S3-Arvan%20Cloud-00baba.svg)](https://www.arvancloud.ir/fa/products/cloud-storage)

</div>

<div dir="rtl" align="right">

ابزار وب **فارسی و راست‌به‌چپ** برای تولید تنظیمات **Bucket Policy**، **CORS** و **Lifecycle** در [فضای ذخیره‌سازی ابری آروان](https://www.arvancloud.ir/fa/products/cloud-storage) (رابط S3).

بدون مرحلهٔ build برای خود برنامه؛ کافی است `index.html` را باز کنید یا `make serve` را اجرا کنید.

**مخزن:** [github.com/RaminNietzsche/s3_policy_gen](https://github.com/RaminNietzsche/s3_policy_gen)

**مستندات با فونت وزیرمتن (RTL):** پس از `make serve` → [`docs/index.html`](docs/index.html)

**استقرار استاتیک:** [`DEPLOY.md`](DEPLOY.md)

---

## توسعه با کمک هوش مصنوعی

این پروژه با مشارکت گستردهٔ دستیارهای کدنویسی مبتنی بر هوش مصنوعی توسعه یافته است.

**ارسال Pull Requestهای کمک‌شده با AI** صریحاً پشتیبانی می‌شود، به‌شرط رعایت امنیت، تست و شفافیت در توضیح تغییرات. راهنما: [`CONTRIBUTING.md`](CONTRIBUTING.md) و [`AGENTS.md`](AGENTS.md).

---

## امکانات

| بخش | شرح |
|-----|------|
| **Bucket Policy** | سازندهٔ قانون، الگوهای آماده، قانون مالک، شرط‌ها مطابق قابلیت‌های سرویس آروان |
| **CORS** | تولید XML و راهنمای ترتیب قوانین |
| **Lifecycle** | قوانین با عنصر `<Filter>`؛ انتقال بین کلاس‌های ذخیره‌سازی در UI غیرفعال است |
| **بارگذاری از bucket** | پس از اتصال در محیط لوکال، تنظیمات موجود قابل واکشی است |
| **اعمال و حذف** | اعمال مستقیم روی آروان **فقط** از طریق `server.py` روی localhost |
| **Deploy** | `make deploy` — ویزارد، دسترسی عمومی اشیاء، CORS باکت، ایجاد باکت در صورت نیاز |

زبان رابط کاربری: **فارسی (RTL)**. Issue و Pull Request: فارسی یا انگلیسی.

---

## شروع سریع

### محیط لوکال (قابلیت کامل)

```bash
git clone https://github.com/RaminNietzsche/s3_policy_gen.git
cd s3_policy_gen
make install
make serve
```

اتصال اختیاری با Access Key و Secret در UI؛ کلیدها فقط در حافظهٔ همان تب نگه‌داری می‌شوند. [`SECURITY.md`](SECURITY.md)

### میزبانی استاتیک

```bash
make assets
cp .deploy.env.example .deploy.env
make deploy-quick
```

### بدون Python

فقط ساخت و کپی خروجی JSON/XML؛ اعمال زنده نیاز به `make serve` دارد.

---

## معماری

```
index.html + css/styles.css + js/*.js   ← برنامهٔ استاتیک (ماژول ES)
server.py                               ← فایل‌های استاتیک + POST /s3-proxy
deploy/                                 ← آپلود و پیکربندی باکت (Python)
```

بارگذاری CSS با `fetch()` برای تحمل `Content-Type` نادرست پس از آپلود دستی در پنل.

---

## ساختار پروژه

```
├── index.html
├── server.py
├── css/styles.css
├── js/
├── assets/fonts/          # وزیرمتن، JetBrains Mono
├── docs/                  # مستندات HTML (RTL + فونت)
├── deploy/
├── Makefile
└── DEPLOY.md
```

---

## دستورات Make

| دستور | شرح |
|--------|------|
| `make serve` | سرور توسعه و پروکسی S3 |
| `make deploy` | ویزارد استقرار |
| `make deploy-quick` | استقرار با `.deploy.env` |
| `make fix-mime` | اصلاح Content-Type |
| `make assets` | دریافت فونت‌ها و وابستگی JS |

---

## امنیت

- فایل `.deploy.env` و کلیدها را commit نکنید.
- کلیدهای تولید را در سایت استاتیک عمومی وارد نکنید.
- پیش از اعمال، خروجی سیاست را بازبینی کنید.

---

## مشارکت

[`CONTRIBUTING.md`](CONTRIBUTING.md)

---

## مجوز

[MIT](LICENSE) — فونت‌ها و aws4fetch: [`THIRD_PARTY.md`](THIRD_PARTY.md).

</div>
