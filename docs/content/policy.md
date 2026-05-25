# آموزش Bucket Policy

Bucket Policy سند JSON است که روی **خود bucket** تعریف می‌شود و مشخص می‌کند **چه کسی** (Principal) **چه کاری** (Action) روی **کدام منابع** (Resource) مجاز یا ممنوع است. این لایهٔ اصلی کنترل دسترسی در API سازگار با S3 است.

> **تفاوت با CORS:** Policy به **سرور S3** می‌گوید درخواست را بپذیرد یا نه. CORS فقط به **مرورگر** می‌گوید اجازهٔ ارسال درخواست cross-origin را دارد. برای وب‌اپ معمولاً **هر دو** لازم است.

---

## ساختار JSON

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "AllowPublicRead",
      "Effect": "Allow",
      "Principal": "*",
      "Action": ["s3:GetObject"],
      "Resource": ["arn:aws:s3:::my-bucket/*"]
    }
  ]
}
```

| فیلد | معنی |
|------|------|
| `Version` | همیشه `2012-10-17` در S3 |
| `Statement[]` | آرایهٔ قوانین — ترتیب مهم است |
| `Sid` | نام اختیاری برای شناسایی قانون |
| `Effect` | `Allow` یا `Deny` |
| `Principal` | کاربر/نقش/`*` (همه) |
| `Action` | عملیات S3 مثل `s3:GetObject` |
| `Resource` | ARNهای bucket و اشیاء |
| `Condition` | اختیاری — IP، prefix مسیر و … |

---

## Effect: Allow و Deny

- **Allow:** اگر شرط‌ها برقرار باشند، دسترسی داده می‌شود.
- **Deny:** همیشه بر Allowهای سازگار **اولویت** دارد (explicit deny).

**قانون طلایی:** قوانین **Deny** را برای محدودیت‌های سخت (IP، مسیر حساس) **بالای** Allowهای بازتر قرار دهید.

---

## Principal (برای چه کسی)

| حالت در پنل | معادل JSON |
|-------------|------------|
| همه — بدون ورود (`*`) | `"Principal": "*"` |
| یک کاربر مشخص (ARN) | `"Principal": { "AWS": ["arn:aws:iam:::user/…"] }` |
| هر کسی که کلید S3 دارد | `"Principal": { "AWS": "*" }` با Action محدود |

در آروان، ARN کاربر معمولاً به شکل `arn:aws:iam:::user/<uuid>` است.

---

## Resource (روی چه بخشی)

| حالت | Resource نمونه |
|------|----------------|
| فقط فایل‌ها | `arn:aws:s3:::bucket-name/*` |
| فقط bucket (لیست، تنظیمات) | `arn:aws:s3:::bucket-name` |
| bucket و همهٔ فایل‌ها | هر دو ARN بالا |

---

## Action (چه کارهایی)

نمونه‌های رایج:

| Action | کاربرد |
|--------|--------|
| `s3:GetObject` | دانلود / خواندن فایل |
| `s3:PutObject` | آپلود |
| `s3:DeleteObject` | حذف فایل |
| `s3:ListBucket` | لیست prefixها |
| `s3:*` | همهٔ عملیات روی منبع (خطرناک برای `*`) |

در پنل، presetهای «فقط خواندن»، «خواندن/نوشتن» و … Actionها را یکجا انتخاب می‌کنند.

---

## Condition (شرط اختیاری)

مثال‌ها:

- **IpAddress** — فقط از IPهای مشخص
- **StringLike** + `s3:prefix` — فقط مسیر `logs/*`
- **Bool** + `aws:SecureTransport` — فقط HTTPS

---

## Account ID و قانون مالک

در تب Policy، فیلد **Account ID** شناسهٔ مالک bucket در آروان است. ابزار به‌صورت خودکار یک Statement **دسترسی کامل** برای همان حساب اضافه می‌کند تا با قوانین محدودکننده، خودتان از bucket قفل نشوید.

---

## الگوهای آماده در پنل

| الگو | کاربرد |
|------|--------|
| خواندن عمومی | `GetObject` برای `Principal: *` روی `/*` |
| آپلود محدود | Put/Get برای کاربر یا prefix مشخص |
| مسدود IP | Deny برای IPهای غیرمجاز |

پس از انتخاب الگو، فیلدها را بازبینی کنید و **افزودن قانون** را بزنید.

---

## تصویر تب Policy

<figure class="figure">
<img src="assets/img/ui-policy.png" alt="تب Bucket Policy در s3_policy_gen" />
<figcaption>شکل ۱ — تب Policy: الگوها، فرم قانون، لیست Statementها</figcaption>
</figure>

### گام‌های پنل

1. نام **bucket** را در بالای صفحه وارد کنید.
2. **Account ID** را پر کنید (توصیه‌شده).
3. الگو بزنید یا قانون دستی بسازید: Effect → Principal → Resource → Action → Condition.
4. **افزودن قانون** — قانون در لیست «قوانین اضافه‌شده» ظاهر می‌شود.
5. در ستون چپ **خروجی JSON** را کپی یا دانلود کنید (`bucket-policy.json`).

---

## سناریوهای رایج

### ۱. استاتیک عمومی (فقط خواندن)

- Allow: `Principal *`, `s3:GetObject`, `arn:aws:s3:::bucket/*`
- CORS جداگانه اگر از JS در دامنهٔ دیگر لود می‌کنید.

### ۲. وب‌اپ با کلید در backend

- Policy برای کاربر IAM یا بدون public read.
- مرورگر از API شما pre-signed URL می‌گیرد؛ CORS روی bucket برای Origin اپ.

### ۳. مسدود کردن IP

- Deny با `aws:SourceIp` برای همهٔ Actionها (با احتیاط — خودتان را مسدود نکنید).

---

## اعمال Policy

- **استاتیک:** کپی JSON → پنل آروان یا `aws s3api put-bucket-policy`
- **لوکال + server.py:** «اعمال مستقیم» در بخش خروجی

راهنمای پنل: [راهنمای پنل](guide.html) · اعمال: [کلاینت‌ها](clients.html) · CORS: [آموزش CORS](cors.html)
