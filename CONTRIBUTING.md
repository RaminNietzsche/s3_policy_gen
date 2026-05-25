# مشارکت در s3_policy_gen

ممنون که سر زدید. این repo هم برای انسان دوست است هم برای **ربات**.

## مشارکت با AI (تشویق می‌شود)

**Pull Requestهایی که با AI ساخته یا به‌طور جدی کمک شده‌اند صریحاً خوش‌آمدند.**

نشان «فقط انسان» لازم نیست. لازم است:

- توضیح روشن *چه* عوض شد و *چرا*
- بدون secret در commit (`.deploy.env`، کلید، توکن)
- رفتار درست روی S3 آروان / سرور لوکال
- متن فارسی UI مطابق [نام‌گذاری محصولات آروان](https://www.arvancloud.ir) (در صورت وجود `.cursor/rules/` رعایت شود)

اختیاری ولی مفید در bodyی PR:

- ابزار(ها): Cursor، Copilot، Claude و غیره
- چه چیزی دستی تست شد (`make serve`، `make deploy` روی bucket آزمایشی)

اگر AI چیز ناامن پیشنهاد داد (`Principal: *` خیلی باز، write عمومی و …)، **شما** reviewer نهایی‌اید — vibe merge نکنید، diff merge کنید.

## مراحل مشارکت

1. Fork کنید: [RaminNietzsche/s3_policy_gen](https://github.com/RaminNietzsche/s3_policy_gen)
2. شاخه بسازید (`fix/cors-preflight-typo`، `feat/new-preset`، …)
3. لوکال تست کنید:
   ```bash
   make install
   make serve
   # اختیاری:
   make assets
   make deploy    # روی bucket *آزمایشی*
   ```
4. PR به `main` باز کنید

## سبک کد

- **JavaScript:** ES modules، بدون bundler؛ ماژول‌های کوچک (`js/policy-builder.js` و …)
- **Python:** پکیج `deploy/`، type hint در جاهای مفید، پیام لاگ انگلیسی
- **متن UI:** فارسی، RTL؛ توکن‌های فنی (`ARN`، `GET`) در UI LTR بمانند
- PRهای کوچک بهتر از refactor غول‌آسا

## گزارش باگ

از [قالب باگ](.github/ISSUE_TEMPLATE/bug_report.yml) استفاده کنید:

- مرورگر / OS
- `make serve` یا URL استاتیک S3
- خطای Console (کلیدها redact شوند!)

## ایدهٔ feature

الگوی lifecycle، قالب policy جدید، یادداشت Ceph — برای کار بزرگ اول issue باز کنید.

## امنیت

[`SECURITY.md`](SECURITY.md). Issue عمومی با credential واقعی باز نکنید.
