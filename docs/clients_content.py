"""Markdown source for clients documentation page."""

CLIENTS_MD = """# آموزش اعمال با کلاینت‌ها

پس از ساخت **Bucket Policy**، **CORS** یا **Lifecycle** در ابزار s3_policy_gen، خروجی را روی bucket واقعی در [فضای ذخیره‌سازی ابری آروان](https://www.arvancloud.ir/fa/products/cloud-storage) اعمال کنید.

> **در پنل:** بخش **اعمال روی bucket** در ستون خروجی → انتخاب کلاینت → راهنمای همان کلاینت در پنجره.

---

## قبل از اعمال

1. **نام bucket** را در بالای صفحه درست وارد کنید.
2. خروجی را **کپی** یا **دانلود** کنید.
3. **Endpoint** کلاستر را از جدول زیر بگیرید.
4. روی bucket **آزمایشی** تست کنید.

### فایل‌های خروجی

| تب | فرمت | نام فایل |
|----|------|----------|
| Bucket Policy | JSON | `bucket-policy.json` |
| CORS | XML | `cors-configuration.xml` |
| Lifecycle | XML | `lifecycle-configuration.xml` |

### Endpointهای آروان

| کلاستر | Endpoint |
|--------|----------|
| ایران مرکزی ۱ — سیمین | `https://s3.ir-thr-at1.arvanstorage.ir` |
| ایران شمال‌غربی ۱ — شهریار | `https://s3.ir-tbz-sh1.arvanstorage.ir` |
| ایران مرکزی ۱ — هات (SSD) | `https://hot.ir-central1.arvanstorage.ir` |

---

## مقایسهٔ روش‌ها

| روش | Policy | CORS | Lifecycle | لوکال لازم |
|-----|--------|------|-----------|------------|
| اعمال مستقیم روی آروان | ✅ | ✅ | ✅ | بله |
| AWS CLI | ✅ | ✅ | ✅ | خیر |
| s3cmd | ✅ | ✅ | ✅ | خیر |
| MinIO Client (mc) | ⚠️ | ✅ | ✅ | خیر |
| rclone | ❌ | محدود | ❌ | خیر |

---

## ۱. اعمال مستقیم روی آروان

```bash
git clone https://github.com/RaminNietzsche/s3_policy_gen.git
cd s3_policy_gen
make install && make serve
```

مرورگر: `http://localhost:8080`

### مراحل

1. **اتصال اختیاری** — کلاستر، Access Key، Secret Key.
2. **اتصال و دریافت bucketها**.
3. خروجی تب مورد نظر را بسازید.
4. **اعمال مستقیم روی آروان** → **ادامه — تأیید و اعمال**.

<figure class="figure">
<img src="assets/img/ui-apply-arvan.png" alt="پنجره اعمال مستقیم" />
<figcaption>فقط localhost + server.py</figcaption>
</figure>

- Secret در `localStorage` ذخیره **نمی‌شود**.
- روی سایت استاتیک عمومی **کلید وارد نکنید**.
- **حذف از آروان** فقط اگر همان تنظیم از bucket بارگذاری شده باشد.

---

## ۲. AWS CLI

توصیهٔ اصلی برای هر سه تنظیم.

### نصب و پروفایل

```bash
brew install awscli
aws --version
aws configure --profile arvan
```

### Bucket Policy

```bash
aws s3api put-bucket-policy \\
  --bucket BUCKETNAME \\
  --policy file://bucket-policy.json \\
  --endpoint-url https://s3.ir-thr-at1.arvanstorage.ir \\
  --profile arvan
```

### CORS

```bash
aws s3api put-bucket-cors \\
  --bucket BUCKETNAME \\
  --cors-configuration file://cors-configuration.xml \\
  --endpoint-url https://s3.ir-thr-at1.arvanstorage.ir \\
  --profile arvan
```

### Lifecycle

```bash
aws s3api put-bucket-lifecycle-configuration \\
  --bucket BUCKETNAME \\
  --lifecycle-configuration file://lifecycle-configuration.xml \\
  --endpoint-url https://s3.ir-thr-at1.arvanstorage.ir \\
  --profile arvan
```

### خواندن تنظیم فعلی

```bash
aws s3api get-bucket-policy --bucket BUCKETNAME --endpoint-url ENDPOINT --profile arvan
aws s3api get-bucket-cors --bucket BUCKETNAME --endpoint-url ENDPOINT --profile arvan
aws s3api get-bucket-lifecycle-configuration --bucket BUCKETNAME --endpoint-url ENDPOINT --profile arvan
```

---

## ۳. MinIO Client (mc)

```bash
brew install minio/stable/mc
mc alias set arvan https://s3.ir-thr-at1.arvanstorage.ir ACCESS_KEY SECRET_KEY
```

**Lifecycle:**

```bash
mc ilm import arvan/BUCKETNAME lifecycle-configuration.xml
```

**CORS:**

```bash
mc cors set arvan/BUCKETNAME cors-configuration.xml
```

**Bucket Policy:** از AWS CLI (همان‌طور که در پنل ابزار هم توصیه می‌شود).

<figure class="figure">
<img src="assets/img/ui-apply-client.png" alt="راهنمای کلاینت در پنل" />
<figcaption>راهنمای داخل پنل — mc، AWS CLI و …</figcaption>
</figure>

---

## ۴. s3cmd

### تنظیم `~/.s3cfg`

```ini
[default]
access_key = ACCESS_KEY
secret_key = SECRET_KEY
host_base = s3.ir-thr-at1.arvanstorage.ir
host_bucket = %(bucket)s.s3.ir-thr-at1.arvanstorage.ir
use_https = True
signature_v2 = False
```

یا: `s3cmd --configure` — `host_base` را با endpoint کلاستر bucket هماهنگ کنید.

### اجرا

```bash
s3cmd setpolicy bucket-policy.json s3://BUCKETNAME
s3cmd setcors cors-configuration.xml s3://BUCKETNAME
s3cmd setlifecycle lifecycle-configuration.xml s3://BUCKETNAME
```

---

## ۵. rclone

برای Policy / CORS / Lifecycle سطح bucket ابزار مستقیم ندارد.

```bash
brew install rclone
rclone config
# Storage: s3 — provider: Other — endpoint: s3.ir-thr-at1.arvanstorage.ir
```

فایل خروجی را دانلود کنید و با دستورهای [AWS CLI](#۲-aws-cli) اعمال کنید.

---

## جریان کار پیشنهادی

| وضعیت | روش |
|-------|-----|
| توسعه‌دهنده، لوکال | اعمال مستقیم یا AWS CLI |
| سرور / CI | AWS CLI یا s3cmd |
| Lifecycle خودکار | `mc ilm` یا AWS CLI |

---

## عیب‌یابی

| مشکل | راه‌حل |
|------|--------|
| AccessDenied | دسترسی Put روی bucket؛ کلید درست |
| InvalidPolicy / XML | نام bucket در ARN؛ JSON/XML معتبر |
| SSL / endpoint | endpoint با کلاستر bucket یکی باشد |
| اعمال مستقیم غیرفعال | `make serve` + `localhost:8080` |
| CORS در مرورگر | [آموزش CORS](cors.html) |

---

## پیوندهای مرتبط

- [راهنمای پنل](guide.html)
- [آموزش Bucket Policy](policy.html) · [آموزش CORS](cors.html) · [آموزش Lifecycle](lifecycle.html)
- [امنیت](security.html)
"""
