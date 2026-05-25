# آموزش Lifecycle

**Lifecycle** قوانین خودکار روی **اشیاء داخل bucket** است: حذف بعد از N روز، پاک‌سازی آپلودهای **multipart** ناقص، و (در برخی سرویس‌ها) انتقال به کلاس ارزان‌تر.

خروجی ابزار: فایل XML (`lifecycle-configuration.xml`) مطابق API S3.

---

## چه مشکلی را حل می‌کند؟

| نیاز | قانون Lifecycle |
|------|-----------------|
| لاگ‌ها بعد از ۳۰ روز پاک شوند | `Expiration` + `Days` |
| آپلود نیمه‌کاره گیر نکند | `AbortIncompleteMultipartUpload` |
| آرشیو به storage ارزان‌تر | `Transition` — در آروان از این ابزار **غیرفعال** |

---

## ساختار XML

```xml
<LifecycleConfiguration>
  <Rule>
    <ID>expire-logs</ID>
    <Status>Enabled</Status>
    <Filter>
      <Prefix>logs/</Prefix>
    </Filter>
    <Expiration>
      <Days>30</Days>
    </Expiration>
  </Rule>
  <Rule>
    <ID>abort-mpu</ID>
    <Status>Enabled</Status>
    <AbortIncompleteMultipartUpload>
      <DaysAfterInitiation>7</DaysAfterInitiation>
    </AbortIncompleteMultipartUpload>
  </Rule>
</LifecycleConfiguration>
```

---

## فیلدهای پنل

| فیلد | توضیح |
|------|--------|
| **شناسهٔ قانون (ID)** | نام یکتا — مثلاً `expire-logs` |
| **وضعیت** | `Enabled` / `Disabled` |
| **مسیر پوشه (Prefix)** | اختیاری — فقط `logs/` یا `temp/` |
| **حذف بعد از (روز)** | اشیاء قدیمی‌تر از N روز حذف می‌شوند |
| **پاک‌سازی multipart** | آپلودهای چندبخشی ناتمام بعد از N روز |

**قانون:** هر Rule باید **حداقل یکی** از «حذف بعد از N روز» یا «پاک‌سازی multipart» را داشته باشد.

---

## محدودیت‌های آروان / این ابزار

- **انتقال به کلاس ذخیره‌سازی دیگر** (`Transition`) در پنل غیرفعال است — پشتیبانی سرویس محدود است.
- Lifecycle روی **bucket** است، نه حساب کلی.
- با Policy می‌توانید **حذف** را برای برخی prefixها ممنوع کنید؛ Lifecycle مستقل عمل می‌کند مگر Policy صریحاً مانع شود.

<figure class="figure">
<img src="assets/img/ui-lifecycle.png" alt="تب Lifecycle در s3_policy_gen" />
<figcaption>شکل ۱ — تب Lifecycle: شناسه، prefix، انقضا، multipart</figcaption>
</figure>

---

## الگوهای آماده

| الگو | رفتار |
|------|--------|
| حذف پس از ۳۰ روز | `Expiration` 30 روز |
| پاک‌سازی multipart ناقص | `AbortIncompleteMultipartUpload` 7 روز |

---

## سناریوها

### لاگ روزانه در `logs/`

- Prefix: `logs/`
- Expiration: 90 روز
- Rule جدا برای `AbortIncompleteMultipartUpload` روی کل bucket

### bucket موقت آپلود

- Prefix: `uploads/tmp/`
- Expiration: 1 روز
- Policy جدا: فقط اپ اجازه Put دارد

### فقط multipart، بدون حذف اشیاء

- فقط فیلد «پاک‌سازی multipart» — بدون Expiration

---

## Lifecycle و نسخه‌بندی

اگر **Versioning** روی bucket فعال باشد، رفتار حذف ممکن است **Delete Marker** بسازد نه حذف فیزیکی فوری — بسته به تنظیمات سرویس. قبل از قانون تهاجمی روی production تست کنید.

---

## گام‌های پنل

1. تب **Lifecycle** را باز کنید.
2. الگو بزنید یا ID، وضعیت، prefix و روزها را پر کنید.
3. **افزودن قانون** — چند Rule مجاز است.
4. XML را از خروجی دانلود (`lifecycle-configuration.xml`).
5. اعمال: پنل آروان، `put-bucket-lifecycle-configuration`، یا اعمال مستقیم لوکال.

---

## عیب‌یابی

| مشکل | بررسی |
|------|--------|
| فایل‌ها حذف نمی‌شوند | Status=Enabled؟ Prefix درست؟ روزها گذشته؟ |
| Rule رد می‌شود | حداقل Expiration یا Abort پر شده؟ |
| هزینه multipart بالا | Rule Abort با روز کم (مثلاً ۷) |

راهنمای کامل UI: [راهنمای پنل](guide.html) · اعمال: [کلاینت‌ها](clients.html)
