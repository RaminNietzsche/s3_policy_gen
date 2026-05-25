# مشارکت

از مشارکت در **s3_policy_gen** استقبال می‌شود.

---

## مشارکت با هوش مصنوعی

Pull Requestهای تهیه‌شده یا تکمیل‌شده با دستیارهای AI **پذیرفته می‌شوند**.

الزامات:

- توضیح روشن تغییرات
- عدم commit کردن secret
- تست `make serve` (و در صورت نیاز `make deploy` روی bucket آزمایشی)
- رعایت املای فارسی و نام‌گذاری محصولات آروان در UI

بازبینی امنیت سیاست‌های پیشنهادی بر عهدهٔ ارسال‌کننده است.

---

## مراحل

1. Fork: [RaminNietzsche/s3_policy_gen](https://github.com/RaminNietzsche/s3_policy_gen)
2. شاخهٔ feature یا fix
3. تست لوکال
4. Pull Request به `main`

---

## مستندات

محتوای کامل فارسی در `docs/content/` است. پس از ویرایش:

```bash
make docs
```

---

## سبک کد

- JavaScript: ماژول ES، بدون bundler
- Python: پکیج `deploy/`
- UI: فارسی RTL؛ شناسه‌های فنی LTR در فرم
