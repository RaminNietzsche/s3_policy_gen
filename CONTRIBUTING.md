<div dir="rtl" align="right">

# مشارکت در s3_policy_gen

از مشارکت شما استقبال می‌شود.

## مشارکت با هوش مصنوعی

Pull Requestهایی که با دستیارهای کدنویسی مبتنی بر AI تهیه یا تکمیل شده‌اند، صریحاً پذیرفته می‌شوند.

الزامات:

- توضیح روشن تغییرات و دلیل آن
- عدم commit کردن secret (`.deploy.env`، کلید، توکن)
- رفتار صحیح در محیط لوکال و سرویس S3 آروان
- رعایت املای فارسی و نام‌گذاری محصولات [ابر آروان](https://www.arvancloud.ir) در UI

در صورت امکان در PR ذکر کنید: ابزار استفاده‌شده و موارد تست‌شده (`make serve`، `make deploy` روی bucket آزمایشی).

بازبینی نهایی امنیت سیاست‌های تولیدشده (مثلاً `Principal: *` یا دسترسی نوشتن عمومی) بر عهدهٔ ارسال‌کننده است.

## مراحل

1. Fork: [RaminNietzsche/s3_policy_gen](https://github.com/RaminNietzsche/s3_policy_gen)
2. ایجاد شاخه
3. تست لوکال:
   ```bash
   make install
   make serve
   ```
4. ارسال Pull Request به `main`

## سبک کد

- **JavaScript:** ماژول ES، بدون bundler
- **Python:** پکیج `deploy/`؛ پیام‌های لاگ به انگلیسی
- **UI:** فارسی، RTL؛ شناسه‌های فنی (`ARN`، `GET`) در بلوک LTR
- Pull Requestهای کوچک و متمرکز

## گزارش باگ

[قالب گزارش باگ](.github/ISSUE_TEMPLATE/bug_report.yml) — بدون درج کلید واقعی.

## امنیت

[`SECURITY.md`](SECURITY.md)

</div>
