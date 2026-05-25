/**
 * S3 bucket policy, CORS & lifecycle subsets for Arvan Cloud Object Storage (S3-compatible API).
 */

export const POLICY_VERSION = '2012-10-17';

/** s3:* actions supported on object storage. */
export const S3_ACTIONS = [
  { id: 's3:AbortMultipartUpload', label: 'AbortMultipartUpload', group: 'multipart' },
  { id: 's3:CreateBucket', label: 'CreateBucket', group: 'bucket' },
  { id: 's3:DeleteBucket', label: 'DeleteBucket', group: 'bucket' },
  { id: 's3:DeleteBucketPolicy', label: 'DeleteBucketPolicy', group: 'policy' },
  { id: 's3:DeleteBucketWebsite', label: 'DeleteBucketWebsite', group: 'bucket' },
  { id: 's3:DeleteObject', label: 'DeleteObject', group: 'object' },
  { id: 's3:DeleteObjectVersion', label: 'DeleteObjectVersion', group: 'object' },
  { id: 's3:DeleteReplicationConfiguration', label: 'DeleteReplicationConfiguration', group: 'bucket' },
  { id: 's3:GetAccelerateConfiguration', label: 'GetAccelerateConfiguration', group: 'bucket' },
  { id: 's3:GetBucketAcl', label: 'GetBucketAcl', group: 'acl' },
  { id: 's3:GetBucketCORS', label: 'GetBucketCORS', group: 'bucket' },
  { id: 's3:GetBucketLocation', label: 'GetBucketLocation', group: 'bucket' },
  { id: 's3:GetBucketLogging', label: 'GetBucketLogging', group: 'bucket' },
  { id: 's3:GetBucketNotification', label: 'GetBucketNotification', group: 'bucket' },
  { id: 's3:GetBucketPolicy', label: 'GetBucketPolicy', group: 'policy' },
  { id: 's3:GetBucketRequestPayment', label: 'GetBucketRequestPayment', group: 'bucket' },
  { id: 's3:GetBucketTagging', label: 'GetBucketTagging', group: 'bucket' },
  { id: 's3:GetBucketVersioning', label: 'GetBucketVersioning', group: 'bucket' },
  { id: 's3:GetBucketWebsite', label: 'GetBucketWebsite', group: 'bucket' },
  { id: 's3:GetLifecycleConfiguration', label: 'GetLifecycleConfiguration', group: 'bucket' },
  { id: 's3:GetObject', label: 'GetObject', group: 'object' },
  { id: 's3:GetObjectAcl', label: 'GetObjectAcl', group: 'acl' },
  { id: 's3:GetObjectTorrent', label: 'GetObjectTorrent', group: 'object' },
  { id: 's3:GetObjectVersion', label: 'GetObjectVersion', group: 'object' },
  { id: 's3:GetObjectVersionAcl', label: 'GetObjectVersionAcl', group: 'acl' },
  { id: 's3:GetObjectVersionTorrent', label: 'GetObjectVersionTorrent', group: 'object' },
  { id: 's3:GetReplicationConfiguration', label: 'GetReplicationConfiguration', group: 'bucket' },
  { id: 's3:ListAllMyBuckets', label: 'ListAllMyBuckets', group: 'bucket' },
  { id: 's3:ListBucket', label: 'ListBucket', group: 'bucket' },
  { id: 's3:ListBucketMultipartUploads', label: 'ListBucketMultipartUploads', group: 'multipart' },
  { id: 's3:ListBucketVersions', label: 'ListBucketVersions', group: 'bucket' },
  { id: 's3:ListMultipartUploadParts', label: 'ListMultipartUploadParts', group: 'multipart' },
  { id: 's3:PutAccelerateConfiguration', label: 'PutAccelerateConfiguration', group: 'bucket' },
  { id: 's3:PutBucketAcl', label: 'PutBucketAcl', group: 'acl' },
  { id: 's3:PutBucketCORS', label: 'PutBucketCORS', group: 'bucket' },
  { id: 's3:PutBucketLogging', label: 'PutBucketLogging', group: 'bucket' },
  { id: 's3:PutBucketNotification', label: 'PutBucketNotification', group: 'bucket' },
  { id: 's3:PutBucketPolicy', label: 'PutBucketPolicy', group: 'policy' },
  { id: 's3:PutBucketRequestPayment', label: 'PutBucketRequestPayment', group: 'bucket' },
  { id: 's3:PutBucketTagging', label: 'PutBucketTagging', group: 'bucket' },
  { id: 's3:PutBucketVersioning', label: 'PutBucketVersioning', group: 'bucket' },
  { id: 's3:PutBucketWebsite', label: 'PutBucketWebsite', group: 'bucket' },
  { id: 's3:PutLifecycleConfiguration', label: 'PutLifecycleConfiguration', group: 'bucket' },
  { id: 's3:PutObject', label: 'PutObject', group: 'object' },
  { id: 's3:PutObjectAcl', label: 'PutObjectAcl', group: 'acl' },
  { id: 's3:PutObjectVersionAcl', label: 'PutObjectVersionAcl', group: 'acl' },
  { id: 's3:PutReplicationConfiguration', label: 'PutReplicationConfiguration', group: 'bucket' },
  { id: 's3:RestoreObject', label: 'RestoreObject', group: 'object' },
];

export const ACTION_GROUPS = [
  { id: 'object', label: 'Object' },
  { id: 'bucket', label: 'Bucket' },
  { id: 'acl', label: 'ACL' },
  { id: 'policy', label: 'Policy' },
  { id: 'multipart', label: 'Multipart' },
];

/** Common quick-pick action sets. */
export const ACTION_PRESETS = {
  readOnly: ['s3:GetObject', 's3:GetObjectVersion', 's3:ListBucket'],
  readWrite: ['s3:GetObject', 's3:PutObject', 's3:DeleteObject', 's3:ListBucket'],
  uploadOnly: ['s3:PutObject', 's3:AbortMultipartUpload', 's3:ListMultipartUploadParts'],
  listOnly: ['s3:ListBucket'],
  fullObject: ['s3:GetObject', 's3:PutObject', 's3:DeleteObject', 's3:GetObjectAcl', 's3:PutObjectAcl'],
};

/** aws:* and s3:* condition keys supported. */
export const AWS_CONDITION_KEYS = [
  { id: 'aws:CurrentTime', label: 'CurrentTime', operators: ['DateEquals', 'DateGreaterThan', 'DateGreaterThanEquals', 'DateLessThan', 'DateLessThanEquals', 'DateNotEquals'] },
  { id: 'aws:EpochTime', label: 'EpochTime', operators: ['NumericEquals', 'NumericGreaterThan', 'NumericGreaterThanEquals', 'NumericLessThan', 'NumericLessThanEquals', 'NumericNotEquals'] },
  { id: 'aws:PrincipalType', label: 'PrincipalType', operators: ['StringEquals', 'StringNotEquals'] },
  { id: 'aws:Referer', label: 'Referer', operators: ['StringEquals', 'StringNotEquals', 'StringLike', 'StringNotLike'] },
  { id: 'aws:SecureTransport', label: 'SecureTransport', operators: ['Bool'] },
  { id: 'aws:SourceIp', label: 'SourceIp', operators: ['IpAddress', 'NotIpAddress'] },
  { id: 'aws:UserAgent', label: 'UserAgent', operators: ['StringEquals', 'StringNotEquals', 'StringLike', 'StringNotLike'] },
  { id: 'aws:username', label: 'username', operators: ['StringEquals', 'StringNotEquals', 'StringLike', 'StringNotLike'] },
];

/** s3 condition keys tied to specific actions. */
export const S3_CONDITION_KEYS = [
  { id: 's3:prefix', label: 'prefix', operators: ['StringEquals', 'StringNotEquals', 'StringLike', 'StringNotLike'], actions: ['s3:ListBucket', 's3:ListBucketVersions'] },
  { id: 's3:delimiter', label: 'delimiter', operators: ['StringEquals', 'StringNotEquals'], actions: ['s3:ListBucket', 's3:ListBucketVersions'] },
  { id: 's3:max-keys', label: 'max-keys', operators: ['NumericEquals', 'NumericGreaterThan', 'NumericLessThan'], actions: ['s3:ListBucket', 's3:ListBucketVersions'] },
  { id: 's3:x-amz-acl', label: 'x-amz-acl', operators: ['StringEquals', 'StringNotEquals'], actions: ['s3:CreateBucket', 's3:PutBucketAcl', 's3:PutObject', 's3:PutObjectAcl', 's3:PutObjectVersionAcl'] },
  { id: 's3:x-amz-copy-source', label: 'x-amz-copy-source', operators: ['StringEquals', 'StringLike'], actions: ['s3:PutObject'] },
  { id: 's3:x-amz-server-side-encryption', label: 'x-amz-server-side-encryption', operators: ['StringEquals', 'StringNotEquals'], actions: ['s3:PutObject'] },
  { id: 's3:x-amz-metadata-directive', label: 'x-amz-metadata-directive', operators: ['StringEquals'], actions: ['s3:PutObject'] },
];

export const CORS_METHODS = ['GET', 'PUT', 'POST', 'DELETE', 'HEAD'];

export const LIFECYCLE_STORAGE_CLASSES = [
  { id: 'STANDARD_IA', label: 'STANDARD_IA' },
  { id: 'GLACIER', label: 'GLACIER' },
];

export const CORS_TEMPLATES = [
  {
    id: 'web-app',
    name: 'وب‌اپ — آپلود از مرورگر',
    description: 'برای سایت یا پنلی که از مرورگر مستقیم به bucket وصل می‌شود',
    rule: {
      allowedOrigins: ['*'],
      allowedMethods: ['GET', 'PUT', 'POST', 'HEAD'],
      allowedHeaders: ['*'],
      exposeHeaders: ['ETag'],
      maxAgeSeconds: 3000,
    },
  },
  {
    id: 'read-only-cdn',
    name: 'فقط دانلود عمومی',
    description: 'هر سایتی بتواند فایل‌ها را بخواند (بدون آپلود از مرورگر)',
    rule: {
      allowedOrigins: ['*'],
      allowedMethods: ['GET', 'HEAD'],
      allowedHeaders: ['*'],
      maxAgeSeconds: 86400,
    },
  },
];

export const LIFECYCLE_TEMPLATES = [
  {
    id: 'expire-30d',
    name: 'حذف خودکار بعد از ۳۰ روز',
    description: 'فایل‌های قدیمی‌تر از ۳۰ روز به‌طور خودکار پاک شوند',
    rule: {
      id: 'expire-after-30-days',
      status: 'Enabled',
      prefix: '',
      expirationDays: 30,
    },
  },
  {
    id: 'abort-multipart-7d',
    name: 'پاک‌سازی آپلود ناقص',
    description: 'آپلودهای چندبخشی ناتمام بعد از ۷ روز حذف شوند',
    rule: {
      id: 'abort-incomplete-multipart',
      status: 'Enabled',
      prefix: '',
      abortIncompleteDays: 7,
    },
  },
];

/** فیلدهای مشترک مودال الگو */
const MODAL_ARN = {
  id: 'principalArns',
  type: 'arns',
  label: 'ARN کاربر',
  hint: 'هر خط یک ARN — مثلاً arn:aws:iam:::user/UUID',
  required: true,
  defaultFrom: 'accountId',
};

const MODAL_IP = {
  id: 'sourceIp',
  type: 'text',
  label: 'IPهای مجاز',
  placeholder: '203.0.113.0/24',
  hint: 'مثلاً یک IP یا محدوده CIDR — چند مورد را با ویرگول جدا کنید',
  required: true,
  defaultValue: '203.0.113.0/24',
};

export const POLICY_TEMPLATES = [
  {
    id: 'public-read',
    name: 'دانلود عمومی فایل‌ها',
    description: 'هر کسی بتواند فایل را دانلود کند؛ بدون دیدن لیست کل bucket',
    needsBucket: true,
    modalFields: [],
    statement: {
      Effect: 'Allow',
      Principal: '*',
      Action: ['s3:GetObject'],
      Resource: 'OBJECTS',
    },
  },
  {
    id: 'public-read-list',
    name: 'دانلود و لیست عمومی',
    description: 'هر کسی بتواند فهرست فایل‌ها را ببیند و دانلود کند',
    needsBucket: true,
    modalFields: [],
    statement: {
      Effect: 'Allow',
      Principal: '*',
      Action: ['s3:ListBucket', 's3:GetObject'],
      Resource: 'BOTH',
    },
  },
  {
    id: 'read-user',
    name: 'خواندن برای یک کاربر',
    description: 'فقط حساب مشخص شما (ARN) بتواند فایل‌ها را ببیند و لیست کند',
    needsBucket: true,
    modalFields: [MODAL_ARN],
    statement: {
      Effect: 'Allow',
      Principal: 'USER',
      Action: ['s3:ListBucket', 's3:GetObject', 's3:GetObjectVersion'],
      Resource: 'BOTH',
    },
  },
  {
    id: 'read-write-user',
    name: 'خواندن و نوشتن برای یک کاربر',
    description: 'یک حساب مشخص: آپلود، دانلود، دیدن فهرست و حذف فایل',
    needsBucket: true,
    modalFields: [MODAL_ARN],
    statement: {
      Effect: 'Allow',
      Principal: 'USER',
      Action: [
        's3:ListBucket',
        's3:GetObject',
        's3:PutObject',
        's3:DeleteObject',
        's3:AbortMultipartUpload',
      ],
      Resource: 'BOTH',
    },
  },
  {
    id: 'full-access-user',
    name: 'همهٔ دسترسی‌ها برای یک کاربر',
    description: 'یک حساب مشخص تمام کارهای مجاز S3 روی این bucket',
    needsBucket: true,
    modalFields: [MODAL_ARN],
    statement: {
      Effect: 'Allow',
      Principal: 'USER',
      Action: ['s3:*'],
      Resource: 'BOTH',
    },
  },
  {
    id: 'upload-only',
    name: 'فقط آپلود برای یک کاربر',
    description: 'یک حساب فقط بتواند فایل بفرستد؛ نه دانلود و نه لیست',
    needsBucket: true,
    modalFields: [MODAL_ARN],
    statement: {
      Effect: 'Allow',
      Principal: 'USER',
      Action: ['s3:PutObject', 's3:AbortMultipartUpload'],
      Resource: 'OBJECTS',
    },
  },
  {
    id: 'read-authenticated',
    name: 'خواندن برای هر کاربر دارای کلید',
    description: 'هر کسی که با Access Key معتبر وصل شود بتواند بخواند',
    needsBucket: true,
    modalFields: [],
    statement: {
      Effect: 'Allow',
      Principal: { AWS: '*' },
      Action: ['s3:ListBucket', 's3:GetObject', 's3:GetObjectVersion'],
      Resource: 'BOTH',
    },
  },
  {
    id: 'prefix-read-user',
    name: 'دسترسی به یک پوشه',
    description: 'فقط مسیر مشخصی از bucket (مثلاً uploads/) قابل لیست و دانلود باشد',
    needsBucket: true,
    modalFields: [
      MODAL_ARN,
      {
        id: 'prefix',
        type: 'text',
        label: 'مسیر پوشه',
        placeholder: 'uploads/',
        hint: 'مثلاً uploads/ یا logs/ — بدون نام bucket در ابتدا',
        required: true,
        defaultValue: 'uploads/',
      },
    ],
    statements: [
      {
        Effect: 'Allow',
        Principal: 'USER',
        Action: ['s3:ListBucket'],
        Resource: 'BUCKET',
        _usePrefixCondition: true,
      },
      {
        Effect: 'Allow',
        Principal: 'USER',
        Action: ['s3:GetObject', 's3:GetObjectVersion'],
        Resource: 'OBJECTS',
      },
    ],
  },
  {
    id: 'https-only',
    name: 'اجبار HTTPS',
    description: 'اتصال ناامن HTTP مسدود شود؛ فقط HTTPS مجاز است',
    needsBucket: true,
    modalFields: [],
    statement: {
      Effect: 'Deny',
      Principal: '*',
      Action: ['s3:*'],
      Resource: 'BOTH',
      Condition: { Bool: { 'aws:SecureTransport': 'false' } },
    },
  },
  {
    id: 'encryption-required',
    name: 'آپلود فقط با رمزنگاری',
    description: 'فایلی که بدون رمزنگاری سمت سرور فرستاده شود پذیرفته نشود',
    needsBucket: true,
    modalFields: [],
    statement: {
      Effect: 'Deny',
      Principal: '*',
      Action: ['s3:PutObject'],
      Resource: 'OBJECTS',
      Condition: { Null: { 's3:x-amz-server-side-encryption': 'true' } },
    },
  },
  {
    id: 'deny-delete',
    name: 'جلوگیری از حذف فایل',
    description: 'هیچ‌کس (حتی مالک) نتواند فایل‌ها را حذف کند',
    needsBucket: true,
    modalFields: [],
    statement: {
      Effect: 'Deny',
      Principal: '*',
      Action: ['s3:DeleteObject', 's3:DeleteObjectVersion'],
      Resource: 'OBJECTS',
    },
  },
  {
    id: 'referer-read',
    name: 'دانلود فقط از یک سایت',
    description: 'فایل فقط وقتی از دامنهٔ مشخص شما باز شود (جلوگیری از لینک مستقیم)',
    needsBucket: true,
    modalFields: [
      {
        id: 'referer',
        type: 'text',
        label: 'نام دامنهٔ سایت',
        placeholder: 'example.com',
        hint: 'فقط example.com — بدون https:// و بدون /',
        required: true,
        defaultValue: 'example.com',
      },
    ],
    statement: {
      Effect: 'Allow',
      Principal: '*',
      Action: ['s3:GetObject'],
      Resource: 'OBJECTS',
    },
  },
  {
    id: 'ip-allow',
    name: 'کاربر مشخص + IP مشخص',
    description: 'یک حساب (ARN) فقط وقتی از IPهای واردشده درخواست بزند مجاز است',
    needsBucket: true,
    modalFields: [MODAL_ARN, MODAL_IP],
    statement: {
      Effect: 'Allow',
      Principal: 'USER',
      Action: ['s3:*'],
      Resource: 'BOTH',
      _conditionIpAllow: true,
    },
  },
  {
    id: 'ip-deny-office',
    name: 'دسترسی از IP مشخص',
    description: 'فقط IPهای واردشده مجازند؛ درخواست از IP دیگر رد می‌شود',
    needsBucket: true,
    modalFields: [MODAL_IP],
    statement: {
      Effect: 'Deny',
      Principal: '*',
      Action: ['s3:*'],
      Resource: 'BOTH',
      _conditionIpDeny: true,
    },
  },
  {
    id: 'public-read-write',
    name: 'خواندن و نوشتن عمومی (خطرناک)',
    description: 'همه بتوانند بخوانند و بنویسند — فقط برای آزمایش، نه تولید',
    needsBucket: true,
    modalFields: [],
    statement: {
      Effect: 'Allow',
      Principal: '*',
      Action: ['s3:GetObject', 's3:PutObject', 's3:DeleteObject', 's3:ListBucket'],
      Resource: 'BOTH',
    },
  },
];

/** کلاسترهای endpoint ذخیره‌سازی ابری آروان */
export const ARVAN_CLUSTERS = [
  {
    id: 'iran-central1-simin',
    region: 'ایران مرکزی ۱',
    name: 'سیمین',
    host: 's3.ir-thr-at1.arvanstorage.ir',
    url: 'https://s3.ir-thr-at1.arvanstorage.ir',
  },
  {
    id: 'iran-central1-hot',
    region: 'ایران مرکزی ۱',
    name: 'کلاستر هات — SSD',
    host: 'hot.ir-central1.arvanstorage.ir',
    url: 'https://hot.ir-central1.arvanstorage.ir',
  },
  {
    id: 'iran-northwest1-shahriar',
    region: 'ایران غربی ۱',
    name: 'شهریار',
    host: 's3.ir-tbz-sh1.arvanstorage.ir',
    url: 'https://s3.ir-tbz-sh1.arvanstorage.ir',
  },
];

export const DEFAULT_CLUSTER_ID = 'iran-central1-simin';

export function getClusterById(id) {
  return ARVAN_CLUSTERS.find((c) => c.id === id) ?? ARVAN_CLUSTERS[0];
}

export function clusterOptionLabel(cluster) {
  return `${cluster.region} — ${cluster.name} (${cluster.host})`;
}
