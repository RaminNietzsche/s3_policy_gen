import { POLICY_VERSION } from './cloud-data.js';

/** Build principal ARN for object storage (tenant خالی → arn:aws:iam:::user/ID). */
export function buildPrincipalArn({ tenantId, userId, subuser }) {
  const user = userId?.trim();
  if (!user) return null;
  const tenant = tenantId?.trim() || '';
  const base = tenant
    ? `arn:aws:iam::${tenant}:user/${user}`
    : `arn:aws:iam:::user/${user}`;
  return subuser?.trim() ? `${base}:${subuser.trim()}` : base;
}

/** Principal کاربر مشخص — AWS به‌صورت آرایه (مطابق سیاست آروان). */
export function buildUserPrincipal(userId, tenantId = '') {
  const arn = buildPrincipalArn({ tenantId, userId, subuser: '' });
  return arn ? { AWS: [arn] } : null;
}

const IAM_ARN_RE = /^arn:aws:iam::/i;

/** یک یا چند ARN از متن (هر خط یا با ویرگول). */
export function parsePrincipalArns(text) {
  return String(text || '')
    .split(/[\n,]+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

/** Principal از لیست ARN — همیشه AWS به‌صورت آرایه. */
export function buildPrincipalFromArns(arns) {
  const list = (arns || []).map((a) => a.trim()).filter(Boolean);
  if (!list.length) return null;
  for (const arn of list) {
    if (!IAM_ARN_RE.test(arn)) {
      throw new Error(`ARN نامعتبر: ${arn}`);
    }
  }
  return { AWS: list };
}

export function buildResourceArn(bucket, suffix = '') {
  const name = bucket?.trim();
  if (!name) return null;
  return `arn:aws:s3:::${name}${suffix}`;
}

export function expandResource(scope, bucket) {
  switch (scope) {
    case 'BUCKET':
      return [buildResourceArn(bucket)];
    case 'OBJECTS':
      return [buildResourceArn(bucket, '/*')];
    case 'BOTH':
      return [buildResourceArn(bucket), buildResourceArn(bucket, '/*')];
    default:
      return [scope].filter(Boolean);
  }
}

export function normalizePrincipal(input) {
  if (!input || input === '*') return '*';
  if (typeof input === 'object') return input;
  const arn = buildPrincipalArn(input);
  if (!arn) return '*';
  return { AWS: arn };
}

export function statementFromForm({
  effect,
  principalType,
  principalArns,
  tenantId,
  userId,
  subuser,
  actions,
  resourceScope,
  bucket,
  conditions,
  sid,
}) {
  let Principal;
  if (principalType === 'anonymous') {
    Principal = '*';
  } else if (principalType === 'any-authenticated') {
    Principal = { AWS: '*' };
  } else {
    const arns = principalArns?.length ? principalArns : null;
    if (arns) {
      Principal = buildPrincipalFromArns(arns);
    } else {
      Principal = buildUserPrincipal(userId, tenantId);
    }
    if (!Principal) throw new Error('حداقل یک ARN کاربر وارد کنید یا Account ID را پر کنید.');
  }

  const Action = actions?.length ? actions : ['s3:GetObject'];
  const Resource = expandResource(resourceScope, bucket).filter(Boolean);
  if (!Resource.length) throw new Error('نام bucket را وارد کنید.');

  const stmt = { Effect: effect, Principal, Action, Resource };
  if (sid?.trim()) stmt.Sid = sid.trim();
  if (conditions && Object.keys(conditions).length) stmt.Condition = conditions;
  return stmt;
}

export function buildPolicy(statements, version = POLICY_VERSION) {
  return {
    Version: version,
    Statement: statements,
  };
}

export function parseConditionsFromRows(rows) {
  const condition = {};
  for (const row of rows) {
    const { operator, key, value } = row;
    if (!operator || !key || value === undefined || value === '') continue;
    if (!condition[operator]) condition[operator] = {};
    let parsed = value;
    if (['IpAddress', 'NotIpAddress'].includes(operator)) {
      parsed = value.split(',').map((v) => v.trim()).filter(Boolean);
    } else if (operator === 'Bool') {
      parsed = String(value).toLowerCase() === 'true' ? 'true' : 'false';
    } else if (['NumericEquals', 'NumericGreaterThan', 'NumericLessThan'].some((o) => operator.startsWith('Numeric'))) {
      parsed = Number(value);
    }
    condition[operator][key] = parsed;
  }
  return Object.keys(condition).length ? condition : undefined;
}

export function formatPolicyJson(policy, pretty = true) {
  return JSON.stringify(policy, null, pretty ? 2 : 0);
}
