# سازنده Bucket Policy، CORS و Lifecycle

ابزار وب **فارسی و راست‌به‌چپ** برای تولید و مدیریت تنظیمات **Bucket Policy**، **CORS** و **Lifecycle** روی [فضای ذخیره‌سازی ابری آروان](https://www.arvancloud.ir/fa/products/cloud-storage) (API سازگار با S3).

> **مستندات:** [policygen.ceph-s3.ir](https://policygen.ceph-s3.ir/)  
> **ابزار (پس از deploy):** آدرس bucket استاتیک شما — مثلاً وب‌سایت S3 آروان  
> **مخزن کد:** [github.com/RaminNietzsche/s3_policy_gen](https://github.com/RaminNietzsche/s3_policy_gen)

---

## این ابزار برای چه کاری است؟

| نیاز شما | بخش در ابزار |
|----------|----------------|
| تعیین اینکه چه کسی به bucket و فایل‌ها دسترسی دارد | **Bucket Policy** |
| اجازهٔ درخواست مرورگر از دامنهٔ دیگر (وب‌اپ، پنل) | **CORS** |
| حذف خودکار فایل‌های قدیمی یا پاک‌سازی آپلود ناقص | **Lifecycle** |

خروجی‌ها آمادهٔ کپی، دانلود، یا (در محیط لوکال) **اعمال مستقیم** روی bucket هستند.

---

## شروع در یک دقیقه

### فقط ساخت تنظیمات (بدون Python)

1. ابزار را روی bucket استاتیک خود باز کنید (یا `make serve` لوکال).
2. نام bucket و در صورت نیاز Account ID را وارد کنید.
3. در تب Policy / CORS / Lifecycle قانون بسازید.
4. خروجی را **کپی** یا **دانلود** کنید و در پنل آروان یا CLI اعمال کنید.

### قابلیت کامل (اتصال، بارگذاری، اعمال)

```bash
git clone https://github.com/RaminNietzsche/s3_policy_gen.git
cd s3_policy_gen
make install
make serve
```

مرورگر: `http://localhost:8080` — سپس [راهنمای کامل استفاده](guide.html).

---

## امکانات اصلی

- **الگوهای آماده** برای Policy، CORS و Lifecycle
- **قانون مالک bucket** به‌صورت خودکار در Policy
- **بارگذاری تنظیمات فعلی** از bucket پس از اتصال (لوکال)
- **اعمال و حذف** مستقیم روی آروان فقط با `server.py` روی localhost
- **استقرار استاتیک** با `make deploy` (ویزارد TUI)

---

## توسعه با کمک هوش مصنوعی

این پروژه با مشارکت گستردهٔ ابزارهای کدنویسی مبتنی بر AI توسعه یافته است.  
ارسال Pull Requestهای کمک‌شده با AI پشتیبانی می‌شود؛ جزئیات در [مشارکت](contributing.html).

---

## فهرست مستندات

| صفحه | موضوع |
|------|--------|
| [راهنمای استفاده](guide.html) | گام‌به‌گام تمام بخش‌های رابط کاربری |
| [استقرار](deploy.html) | آپلود روی S3 و GitHub Pages |
| [امنیت](security.html) | کلیدها، پروکسی لوکال، مسئولیت‌ها |
| [مشارکت](contributing.html) | ارسال PR و مشارکت AI |
| [شخص ثالث](third-party.html) | فونت‌ها و کتابخانه‌ها |
