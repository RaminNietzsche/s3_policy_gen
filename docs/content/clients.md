# آموزش اعمال با کلاینت‌ها

پس از ساخت **Bucket Policy**، **CORS** یا **Lifecycle** در ابزار s3_policy_gen، خروجی را روی bucket واقعی در [فضای ذخیره‌سازی ابری آروان](https://www.arvancloud.ir/fa/products/cloud-storage) اعمال کنید.

> **در پنل:** بخش **اعمال روی bucket** → انتخاب کلاینت → راهنما در پنجره.

---

## قبل از اعمال

1. **نام bucket** درست باشد.
2. خروجی **کپی** یا **دانلود** شود.
3. **Endpoint** از جدول زیر.
4. تست روی bucket آزمایشی.

### فایل‌های خروجی

| تب | فرمت | نام فایل |
|----|------|----------|
| Bucket Policy | JSON | `bucket-policy.json` |
| CORS | XML | `cors-configuration.xml` |
| Lifecycle | XML | `lifecycle-configuration.xml` |

### Endpointهای آروان

| کلاستر | Endpoint |
|--------|----------|
| سیمین | `https://s3.ir-thr-at1.arvanstorage.ir` |
| شهریار | `https://s3.ir-tbz-sh1.arvanstorage.ir` |
| هات SSD | `https://hot.ir-central1.arvanstorage.ir` |

---

## مقایسهٔ روش‌ها

| روش | Policy | CORS | Lifecycle | لوکال |
|-----|--------|------|-----------|-------|
| اعمال مستقیم آروان | ✅ | ✅ | ✅ | بله |
| AWS CLI | ✅ | ✅ | ✅ | خیر |
| s3cmd | ✅ | ✅ | ✅ | خیر |
| mc | ⚠️ | ✅ | ✅ | خیر |
| rclone | ❌ | محدود | ❌ | خیر |

---

## ۱. اعمال مستقیم روی آروان

```bash
git clone https://github.com/RaminNietzsche/s3_policy_gen.git
cd s3_policy_gen && make install && make serve
```

`http://localhost:8080` — اتصال → ساخت خروجی → **اعمال مستقیم** → تأیید.

<figure class="figure">
<img src="assets/img/ui-apply-arvan.png" alt="اعمال مستقیم" />
<figcaption>localhost + server.py</figcaption>
</figure>

---

## ۲. AWS CLI

```bash
aws configure --profile arvan
```

Policy:

```bash
aws s3api put-bucket-policy --bucket BUCKETNAME --policy file://bucket-policy.json --endpoint-url https://s3.ir-thr-at1.arvanstorage.ir --profile arvan
```

CORS:

```bash
aws s3api put-bucket-cors --bucket BUCKETNAME --cors-configuration file://cors-configuration.xml --endpoint-url https://s3.ir-thr-at1.arvanstorage.ir --profile arvan
```

Lifecycle:

```bash
aws s3api put-bucket-lifecycle-configuration --bucket BUCKETNAME --lifecycle-configuration file://lifecycle-configuration.xml --endpoint-url https://s3.ir-thr-at1.arvanstorage.ir --profile arvan
```

---

## ۳. MinIO Client (mc)

```bash
mc alias set arvan https://s3.ir-thr-at1.arvanstorage.ir ACCESS_KEY SECRET_KEY
mc ilm import arvan/BUCKETNAME lifecycle-configuration.xml
mc cors set arvan/BUCKETNAME cors-configuration.xml
```

Policy: از AWS CLI.

<figure class="figure">
<img src="assets/img/ui-apply-client.png" alt="راهنمای کلاینت" />
<figcaption>راهنمای پنل</figcaption>
</figure>

---

## ۴. s3cmd

```ini
[default]
access_key = ACCESS_KEY
secret_key = SECRET_KEY
host_base = s3.ir-thr-at1.arvanstorage.ir
host_bucket = %(bucket)s.s3.ir-thr-at1.arvanstorage.ir
use_https = True
signature_v2 = False
```

```bash
s3cmd setpolicy bucket-policy.json s3://BUCKETNAME
s3cmd setcors cors-configuration.xml s3://BUCKETNAME
s3cmd setlifecycle lifecycle-configuration.xml s3://BUCKETNAME
```

---

## ۵. rclone

تنظیمات bucket-level: از AWS CLI یا اعمال مستقیم.

---

## عیب‌یابی

| مشکل | راه‌حل |
|------|--------|
| AccessDenied | دسترسی Put؛ کلید |
| InvalidPolicy | ARN و bucket |
| SSL | endpoint |
| اعمال غیرفعال | make serve |
| CORS | [cors.html](cors.html) |

---

## پیوندهای مرتبط

- [guide.html](guide.html)
- [policy.html](policy.html) · [cors.html](cors.html) · [lifecycle.html](lifecycle.html)
- [security.html](security.html)
