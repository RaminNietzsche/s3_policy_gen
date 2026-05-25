# s3_policy_gen

[![License: MIT](https://img.shields.io/badge/License-MIT-teal.svg)](LICENSE)
[![Python](https://img.shields.io/badge/python-3.10+-blue.svg)](https://www.python.org/)
[![Arvan Cloud](https://img.shields.io/badge/S3-Arvan%20Cloud-00baba.svg)](https://www.arvancloud.ir/fa/products/cloud-storage)

**رابط وب فارسی، بدون build** برای ساخت تنظیمات **Bucket Policy**، **CORS** و **Lifecycle** روی [فضای ذخیره‌سازی ابری آروان](https://www.arvancloud.ir/fa/products/cloud-storage) (API سازگار با S3؛ در عمل Ceph).

نه webpack، نه `npm install` برای خود اپ. `index.html` را باز کنید، یا `make serve` — تمام.

**نسخهٔ استاتیک (مثال):** با [`DEPLOY.md`](DEPLOY.md) روی bucket خودتان — مثلاً `https://policygen.s3-website.ir-thr-at1.arvanstorage.ir/`

**مخزن:** [github.com/RaminNietzsche/s3_policy_gen](https://github.com/RaminNietzsche/s3_policy_gen)

---

## 🤖 با هوش مصنوعی ساخته شده (جدی می‌گوییم)

این پروژه **با کمک زیاد دستیارهای کدنویسی AI** توسعه داده شده (pair-programming، refactor، deploy، مستندات). انسان مسیر را تعیین می‌کند؛ مدل‌ها تایپ می‌کنند.

**از PRهایی که با AI کمک شده‌اند شدیداً استقبال می‌کنیم** — Copilot، Cursor، Claude، ChatGPT، یا LLM روی Raspberry Pi در homelab. اگر patch منسجم، تست‌شده و بدون leak کردن secret باشد، مهم نیست کدام GPU خواب دیده. در PR بگویید از چه ابزاری استفاده کردید؛ دوست داریم بدانیم چه چیزی جواب می‌دهد.

جزئیات: [`CONTRIBUTING.md`](CONTRIBUTING.md) و [`AGENTS.md`](AGENTS.md).

---

## امکانات

| بخش | چه می‌دهد |
|-----|----------|
| **Bucket Policy** | سازندهٔ بصری قانون، الگوها، قانون مالک، شرط‌ها مطابق قابلیت واقعی آروان |
| **CORS** | سازندهٔ XML + راهنمای ترتیب (چون `*` بالای لیست هنوز روز را خراب می‌کند) |
| **Lifecycle** | قوانین با `<Filter>` اجباری برای Ceph؛ انتقال کلاس جایی که پلتفرم نمی‌دهد غیرفعال |
| **بارگذاری از bucket** | پس از اتصال لوکال، policy / CORS / lifecycle موجود را در UI می‌کشد |
| **اعمال / حذف** | مستقیم روی آروان **فقط** با `server.py` روی localhost (کلید به استاتیک نمی‌رود) |
| **Deploy** | `make deploy` — ویزارد TUI، object عمومی، CORS باکت، ساخت باکت در صورت نبود |

زبان UI: **فارسی (RTL)**. کامنت کد: ترکیب فارسی و انگلیسی. Issue/PR: فارسی یا انگلیسی هر دو خوب است.

---

## شروع سریع

### مرورگر (لوکال، قابلیت کامل)

```bash
git clone https://github.com/RaminNietzsche/s3_policy_gen.git
cd s3_policy_gen
make install    # venv + boto3 + questionary (فقط deploy)
make serve      # http://localhost:8080
```

اختیاری: Access Key / Secret در UI → فهرست bucket → بارگذاری یا اعمال تنظیمات.  
Secret فقط در **حافظهٔ همان تب** می‌ماند؛ [`SECURITY.md`](SECURITY.md).

### میزبانی استاتیک (وب‌سایت S3)

```bash
make assets
cp .deploy.env.example .deploy.env   # کلیدها را پر کنید
make deploy-quick    # یا: make deploy (ویزارد)
```

جزئیات: [`DEPLOY.md`](DEPLOY.md).

### فقط سازنده (بدون Python)

`index.html` را از سرور استاتیک یا S3 باز کنید. **ساخت و کپی** JSON/XML کار می‌کند؛ اعمال زنده و کلیدها نیاز به `make serve` دارند.

---

## معماری (۳۰ ثانیه)

```
index.html + css/styles.css + js/*.js   ← اپ استاتیک (ES modules)
server.py                               ← فایل استاتیک + POST /s3-proxy (فرار از CORS)
deploy/                                 ← آپلود boto3، policy باکت، CORS، ویزارد
```

سایت استاتیک CSS را با `fetch()` می‌گیرد تا `Content-Type` اشتباه آروان (`text/plain` به‌جای `text/css`) layout را نکشد. این را رفته‌ایم.

---

## ساختار پروژه

```
├── index.html
├── server.py
├── css/styles.css
├── js/                    # ماژول‌های اپ + vendor/aws4fetch.mjs
├── assets/fonts/          # Vazirmatn، JetBrains Mono (OFL)
├── deploy/                # پکیج پایتون: python3 -m deploy
├── Makefile
├── requirements.txt
├── DEPLOY.md
└── THIRD_PARTY.md
```

---

## دستورات Make

| دستور | توضیح |
|--------|--------|
| `make serve` | سرور توسعه + پروکسی S3 |
| `make deploy` | ویزارد تعاملی آپلود |
| `make deploy-quick` | آپلود با `.deploy.env` |
| `make fix-mime` | اصلاح Content-Type روی css/html |
| `make assets` | دانلود فونت و vendor JS |

---

## امنیت

- `.deploy.env` و کلید واقعی را commit نکنید (در gitignore است).
- کلید production را روی **سایت استاتیک عمومی** وارد نکنید — فقط **localhost** با `server.py`.
- قبل از اعمال، خروجی policy را بخوانید. این ابزار دریل است، نه مدل دسترسی.

---

## مشارکت

گزارش باگ، الگو، مستندات و **patchهای AI** خوش‌آمدند. [`CONTRIBUTING.md`](CONTRIBUTING.md).

---

## مجوز

[MIT](LICENSE) — فونت‌ها و aws4fetch: [`THIRD_PARTY.md`](THIRD_PARTY.md).
