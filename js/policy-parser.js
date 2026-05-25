const OWNER_SID = 'Object-storage-user-owner-full-access';

function toArray(v) {
  if (v == null) return [];
  return Array.isArray(v) ? v : [v];
}

function extractUserIdFromArn(arn) {
  const m = String(arn || '').match(/:user\/([^:/]+)/);
  return m ? m[1] : null;
}

function inferResourceScope(resources, bucket) {
  const name = bucket?.trim();
  if (!name) return null;
  const bucketArn = `arn:aws:s3:::${name}`;
  const objectsArn = `${bucketArn}/*`;
  const res = toArray(resources);
  const hasB = res.includes(bucketArn);
  const hasO = res.includes(objectsArn);
  if (hasB && hasO) return 'BOTH';
  if (hasO) return 'OBJECTS';
  if (hasB) return 'BUCKET';
  return null;
}

function inferPrincipal(principal) {
  if (principal === '*') {
    return { type: 'anonymous', arns: [] };
  }
  if (principal && typeof principal === 'object') {
    const aws = principal.AWS;
    if (aws === '*') return { type: 'authenticated', arns: [] };
    const arns = toArray(aws).filter(Boolean);
    if (arns.length) return { type: 'user', arns };
  }
  return { type: 'user', arns: [] };
}

export function isOwnerStatement(stmt, bucket) {
  if (!stmt || stmt.Effect !== 'Allow') return false;
  if (stmt.Sid === OWNER_SID) return true;
  const actions = toArray(stmt.Action);
  if (!actions.includes('s3:*')) return false;
  const name = bucket?.trim();
  if (!name) return false;
  const resources = toArray(stmt.Resource);
  const b = `arn:aws:s3:::${name}`;
  return resources.includes(b) && resources.includes(`${b}/*`);
}

export function extractAccountIdFromStatement(stmt) {
  const p = stmt?.Principal;
  if (!p || typeof p !== 'object') return null;
  const arns = toArray(p.AWS);
  for (const arn of arns) {
    const id = extractUserIdFromArn(arn);
    if (id) return id;
  }
  return null;
}

export function statementFromAws(stmt, bucket) {
  const scope = inferResourceScope(stmt.Resource, bucket);
  const { type, arns } = inferPrincipal(stmt.Principal);
  const out = {
    Effect: stmt.Effect || 'Allow',
    Action: toArray(stmt.Action),
  };
  if (stmt.Sid) out.Sid = stmt.Sid;
  if (stmt.Condition && Object.keys(stmt.Condition).length) {
    out.Condition = stmt.Condition;
  }

  if (scope) {
    out.Resource = scope;
    if (type === 'user') {
      out.Principal = 'USER';
      out._principalArns = arns;
      out._principalType = 'user';
    } else if (type === 'anonymous') {
      out.Principal = '*';
      out._principalType = 'anonymous';
    } else if (type === 'authenticated') {
      out.Principal = { AWS: '*' };
      out._principalType = 'authenticated';
    }
  } else {
    out.Resource = toArray(stmt.Resource);
    out.Principal = stmt.Principal;
    const inf = inferPrincipal(stmt.Principal);
    if (inf.type !== 'anonymous') out._principalType = inf.type;
    if (inf.arns.length) out._principalArns = inf.arns;
  }

  return out;
}

/**
 * @param {string|object} policyJson
 * @param {string} bucket
 * @returns {{ accountId: string|null, statements: object[] }}
 */
export function parseBucketPolicyDocument(policyJson, bucket) {
  const policy = typeof policyJson === 'string' ? JSON.parse(policyJson) : policyJson;
  const rawList = policy?.Statement;
  const normalized = rawList ? (Array.isArray(rawList) ? rawList : [rawList]) : [];

  let accountId = null;
  const statements = [];

  for (const raw of normalized) {
    if (isOwnerStatement(raw, bucket)) {
      accountId = extractAccountIdFromStatement(raw) || accountId;
      continue;
    }
    statements.push(statementFromAws(raw, bucket));
  }

  return { accountId, statements };
}
