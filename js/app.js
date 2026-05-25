import {
  S3_ACTIONS,
  ACTION_GROUPS,
  ACTION_PRESETS,
  AWS_CONDITION_KEYS,
  S3_CONDITION_KEYS,
  CORS_METHODS,
  CORS_TEMPLATES,
  LIFECYCLE_TEMPLATES,
  LIFECYCLE_STORAGE_CLASSES,
  POLICY_TEMPLATES,
  ARVAN_CLUSTERS,
  DEFAULT_CLUSTER_ID,
  getClusterById,
  clusterOptionLabel,
} from './cloud-data.js';
import {
  statementFromForm,
  buildPolicy,
  parseConditionsFromRows,
  formatPolicyJson,
  buildPrincipalArn,
  buildUserPrincipal,
  buildPrincipalFromArns,
  parsePrincipalArns,
} from './policy-builder.js';
import { buildCorsXml, parseCorsConfigurationXml } from './cors-builder.js';
import { buildLifecycleXml, parseLifecycleConfigurationXml } from './lifecycle-builder.js';
import { parseBucketPolicyDocument } from './policy-parser.js';
import {
  connect,
  disconnect,
  isConnected,
  listBuckets,
  getBucketPolicy,
  getBucketCors,
  getBucketLifecycle,
  putBucketPolicy,
  putBucketCors,
  putBucketLifecycle,
  deleteBucketPolicy,
  deleteBucketCors,
  deleteBucketLifecycle,
  normalizeEndpoint,
  isLocalDevRuntime,
  probeLocalDevServer,
} from './s3-connection.js';
import {
  APPLY_CLIENTS,
  PANEL_APPLY_ID,
  PIVEST_MODAL_TITLE,
  buildClientGuideHtml,
  buildPivestLocalWarningHtml,
  buildPivestConfirmBodyHtml,
  buildPivestDeleteBodyHtml,
  buildPivestAcceptLabel,
  buildPivestDeleteAcceptLabel,
  getConfigMeta,
} from './client-guides.js';
import { initTheme } from './theme.js';

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

const PREFS_KEY = 'arvan_policy_gen_prefs';

/** اعداد فارسی در متن رابط کاربری */
function faNum(n) {
  return String(n).replace(/\d/g, (d) => '۰۱۲۳۴۵۶۷۸۹'[Number(d)]);
}

let statements = [];
let statementCounter = 0;
let corsRules = [];
let lifecycleRules = [];
let cachedBuckets = [];
let accountIdTouched = false;
let pendingPolicyTemplate = null;
let loadBucketConfigSeq = 0;
let bucketLoadTimer = null;
let lastLoadedBucket = '';
/** تب‌ای که هنگام باز کردن راهنمای اعمال فعال بود (تا با عوض کردن تب اشتباه اعمال نشود) */
let applyPanelContext = null;
/** مودال تأیید: apply | delete */
let pivestConfirmMode = 'apply';
/** پروکسی server.py در دسترس است */
let devServerReady = false;
/** تنظیماتی که از bucket روی آروان لود شده‌اند (برای نمایش حذف) */
let remoteConfigPresent = { policy: false, cors: false, lifecycle: false };

function init() {
  try {
    initTheme();
    bindTabs();
    populateActionSelect();
    initTemplates();
    initCorsTemplates();
    initLifecycleTemplates();
    populateCorsMethods();
    populateLcStorageClass();
    populateClusterSelect();
    bindConnection();
    bindPolicyForm();
    bindCorsForm();
    bindLifecycleForm();
    bindGlobalActions();
    bindTemplateModal();
    initApplyClients();
    bindClientGuideModal();
    bindPivestConfirmModal();
    bindPivestDeleteButton();
    refreshDevServerCapability();
    loadRememberedPrefs();
    updatePrincipalFieldsVisibility();
    renderStatements();
    renderCorsRules();
    renderLifecycleRules();
    updateOutput();
    window.addEventListener('beforeunload', () => disconnect());
  } catch (err) {
    console.error(err);
    showToast('خطا در بارگذاری ابزار: ' + err.message, 'error');
  }
}

function bindTabs() {
  $$('.tab').forEach((tab) => {
    tab.addEventListener('click', () => {
      $$('.tab').forEach((t) => t.classList.remove('active'));
      $$('.panel').forEach((p) => p.classList.remove('active'));
      tab.classList.add('active');
      $(`#panel-${tab.dataset.panel}`).classList.add('active');
      updateOutput();
      updatePivestDeleteButton();
    });
  });
}

function populateActionSelect() {
  const wrap = $('#stmt-actions-list');
  if (!wrap) return;
  wrap.innerHTML = '';

  ACTION_GROUPS.forEach((group) => {
    const actions = S3_ACTIONS.filter((a) => a.group === group.id);
    if (!actions.length) return;

    const section = document.createElement('section');
    section.className = 'action-group';
    section.innerHTML = `<h3 class="action-group-title">${group.label}</h3>`;

    const list = document.createElement('div');
    list.className = 'action-checkboxes';

    actions.forEach((a) => {
      const label = document.createElement('label');
      label.className = 'action-check';
      const cb = document.createElement('input');
      cb.type = 'checkbox';
      cb.value = a.id;
      cb.dataset.action = a.id;
      cb.addEventListener('change', updateActionCount);
      const span = document.createElement('span');
      span.dir = 'ltr';
      span.textContent = a.id;
      label.appendChild(cb);
      label.appendChild(span);
      list.appendChild(label);
    });

    section.appendChild(list);
    wrap.appendChild(section);
  });

  setSelectedActions(['s3:GetObject']);
  updateActionCount();
}

function getSelectedActions() {
  return $$('#stmt-actions-list input[type="checkbox"]:checked').map((cb) => cb.value);
}

function setSelectedActions(actionIds) {
  const ids = new Set(actionIds || []);
  $$('#stmt-actions-list input[type="checkbox"]').forEach((cb) => {
    cb.checked = ids.has(cb.value);
  });
  updateActionCount();
}

function updateActionCount() {
  const n = getSelectedActions().length;
  const el = $('#actions-selected-count');
  if (el) el.textContent = `${faNum(n)} مورد انتخاب شده`;
}

function populateConditionKeySelect(sel) {
  if (!sel) return;
  const groups = [
    { label: 'AWS (همهٔ درخواست‌ها)', keys: AWS_CONDITION_KEYS },
    { label: 'S3 (عملیات ویژه)', keys: S3_CONDITION_KEYS },
  ];
  sel.innerHTML = '<option value="">— انتخاب کلید —</option>';
  groups.forEach(({ label, keys }) => {
    const og = document.createElement('optgroup');
    og.label = label;
    keys.forEach((k) => {
      const opt = document.createElement('option');
      opt.value = k.id;
      opt.textContent = k.id;
      opt.dataset.operators = JSON.stringify(k.operators);
      og.appendChild(opt);
    });
    sel.appendChild(og);
  });
}

function initTemplates() {
  const wrap = $('#template-list');
  if (!wrap) return;

  const byId = Object.fromEntries(POLICY_TEMPLATES.map((t) => [t.id, t]));
  const buttons = $$('[data-template-id]', wrap);

  if (!buttons.length) {
    POLICY_TEMPLATES.forEach((t) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'template-chip';
      btn.dataset.templateId = t.id;
      btn.title = t.description;
      btn.textContent = t.name;
      btn.addEventListener('click', () => openPolicyTemplateModal(t));
      wrap.appendChild(btn);
    });
    return;
  }

  buttons.forEach((btn) => {
    const t = byId[btn.dataset.templateId];
    if (!t) return;
    btn.title = t.description;
    btn.addEventListener('click', () => openPolicyTemplateModal(t));
  });
}

function initCorsTemplates() {
  const wrap = $('#cors-template-list');
  if (!wrap) return;
  const byId = Object.fromEntries(CORS_TEMPLATES.map((t) => [t.id, t]));
  $$('[data-cors-template-id]', wrap).forEach((btn) => {
    const t = byId[btn.dataset.corsTemplateId];
    if (!t) return;
    btn.title = t.description;
    btn.addEventListener('click', () => applyCorsTemplate(t));
  });
}

function initLifecycleTemplates() {
  const wrap = $('#lifecycle-template-list');
  if (!wrap) return;
  const byId = Object.fromEntries(LIFECYCLE_TEMPLATES.map((t) => [t.id, t]));
  $$('[data-lifecycle-template-id]', wrap).forEach((btn) => {
    const t = byId[btn.dataset.lifecycleTemplateId];
    if (!t) return;
    btn.title = t.description;
    btn.addEventListener('click', () => applyLifecycleTemplate(t));
  });
}

function populateCorsMethods() {
  const wrap = $('#cors-methods-list');
  if (!wrap || wrap.children.length) return;
  CORS_METHODS.forEach((method) => {
    const label = document.createElement('label');
    label.className = 'action-check';
    const cb = document.createElement('input');
    cb.type = 'checkbox';
    cb.value = method;
    cb.dataset.corsMethod = method;
    if (['GET', 'PUT', 'POST', 'HEAD'].includes(method)) cb.checked = true;
    const span = document.createElement('span');
    span.dir = 'ltr';
    span.textContent = method;
    label.appendChild(cb);
    label.appendChild(span);
    wrap.appendChild(label);
  });
}

function populateLcStorageClass() {
  const sel = $('#lc-storage-class');
  if (!sel || sel.options.length > 1) return;
  LIFECYCLE_STORAGE_CLASSES.forEach((sc) => {
    const opt = document.createElement('option');
    opt.value = sc.id;
    opt.textContent = sc.label;
    sel.appendChild(opt);
  });
}

function splitLines(text) {
  return String(text || '')
    .split(/[\n,]+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function splitComma(text) {
  return String(text || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

function getSelectedCorsMethods() {
  return $$('#cors-methods-list input[type="checkbox"]:checked').map((cb) => cb.value);
}

const BUCKET_MANUAL = '__manual__';

function getBucketName() {
  const select = $('#app-bucket-select');
  const input = $('#app-bucket');
  if (select && !select.hidden && select.value && select.value !== BUCKET_MANUAL) {
    return select.value.trim();
  }
  return input?.value.trim() || '';
}

function getAccountId() {
  return $('#account-id')?.value.trim() || '';
}

function syncAccountIdFromAccessKey() {
  if (accountIdTouched) return;
  const key = $('#access-key')?.value.trim();
  if (key) $('#account-id').value = key;
}

function getOwnerStatement() {
  const bucket = getBucketName();
  const accountId = getAccountId();
  if (!accountId || !bucket) return null;

  const principal = buildUserPrincipal(accountId);
  if (!principal) return null;

  return {
    Sid: 'Object-storage-user-owner-full-access',
    Effect: 'Allow',
    Principal: principal,
    Action: ['s3:*'],
    Resource: [`arn:aws:s3:::${bucket}`, `arn:aws:s3:::${bucket}/*`],
  };
}

function resolvePrincipalUser() {
  return buildUserPrincipal(getAccountId()) || '*';
}

function populateClusterSelect() {
  const sel = $('#cluster-select');
  if (!sel) return;
  const prev = sel.value;
  sel.innerHTML = '';
  ARVAN_CLUSTERS.forEach((c) => {
    const opt = document.createElement('option');
    opt.value = c.id;
    opt.textContent = clusterOptionLabel(c);
    sel.appendChild(opt);
  });
  const hasPrev = [...sel.options].some((o) => o.value === prev);
  sel.value = hasPrev ? prev : DEFAULT_CLUSTER_ID;
  updateClusterEndpointHint();
}

function updateClusterEndpointHint() {
  const cluster = getClusterById($('#cluster-select').value);
  $('#cluster-endpoint-hint').textContent = cluster.url;
}

function canUseLocalCredentials() {
  return isLocalDevRuntime() && devServerReady;
}

async function refreshDevServerCapability() {
  devServerReady = await probeLocalDevServer();
  if (!canUseLocalCredentials() && isConnected()) {
    handleDisconnect();
  }
  updateLocalDevUi();
}

function bindConnection() {
  $('#connect-panel')?.addEventListener('toggle', () => {
    if ($('#connect-panel')?.open) refreshDevServerCapability();
  });

  $('#cluster-select').addEventListener('change', () => {
    updateClusterEndpointHint();
    if (isConnected()) showToast('برای اعمال کلاستر جدید دوباره متصل شوید.', 'warn');
  });

  $('#btn-toggle-secret').addEventListener('click', () => {
    const inp = $('#secret-key');
    inp.type = inp.type === 'password' ? 'text' : 'password';
  });

  $('#btn-connect').addEventListener('click', handleConnect);
  $('#btn-disconnect').addEventListener('click', handleDisconnect);
  $('#btn-refresh-buckets').addEventListener('click', () => refreshBuckets(true));

  $('#remember-access-key').addEventListener('change', saveRememberedPrefs);

  $('#access-key')?.addEventListener('input', () => {
    syncAccountIdFromAccessKey();
    renderStatements();
    updateOutput();
  });

  $('#account-id')?.addEventListener('input', () => {
    accountIdTouched = true;
    renderStatements();
    updateOutput();
  });

  $('#app-bucket-select')?.addEventListener('change', onBucketSelectChange);

  $('#app-bucket')?.addEventListener('input', onBucketNameChanged);
  $('#app-bucket')?.addEventListener('change', onBucketNameChanged);
}

function onBucketNameChanged() {
  renderStatements();
  updatePivestDeleteButton();
  if (isConnected()) scheduleLoadBucketConfiguration();
  else updateOutput();
}

function onBucketSelectChange() {
  const select = $('#app-bucket-select');
  const input = $('#app-bucket');
  if (!select || !input) return;

  if (select.value === BUCKET_MANUAL) {
    input.hidden = false;
    if (!input.value.trim()) input.value = '';
    input.focus();
  } else if (select.value) {
    input.hidden = true;
    input.value = select.value;
  } else {
    input.hidden = false;
  }
  onBucketNameChanged();
}

function scheduleLoadBucketConfiguration() {
  if (!isConnected()) return;
  clearTimeout(bucketLoadTimer);
  bucketLoadTimer = setTimeout(() => {
    const bucket = getBucketName();
    if (bucket && bucket !== lastLoadedBucket) loadBucketConfiguration();
  }, 400);
}

async function loadBucketConfiguration() {
  if (!isConnected()) return;
  const bucket = getBucketName();
  if (!bucket) return;

  const seq = ++loadBucketConfigSeq;
  setOutputHint('در حال بارگذاری تنظیمات bucket از آروان…');

  try {
    const [policyText, corsXml, lifecycleXml] = await Promise.all([
      getBucketPolicy(bucket),
      getBucketCors(bucket),
      getBucketLifecycle(bucket),
    ]);
    if (seq !== loadBucketConfigSeq) return;

    if (policyText) {
      try {
        const { accountId, statements: loaded } = parseBucketPolicyDocument(policyText, bucket);
        if (accountId && !accountIdTouched) {
          $('#account-id').value = accountId;
        }
        statements = loaded;
      } catch (parseErr) {
        statements = [];
        showToast(`Policy قابل parse نیست: ${parseErr.message}`, 'warn');
      }
    } else {
      statements = [];
    }

    corsRules = corsXml ? parseCorsConfigurationXml(corsXml) : [];
    lifecycleRules = lifecycleXml ? parseLifecycleConfigurationXml(lifecycleXml) : [];

    remoteConfigPresent = {
      policy: Boolean(policyText),
      cors: Boolean(corsXml),
      lifecycle: Boolean(lifecycleXml),
    };

    lastLoadedBucket = bucket;
    renderStatements();
    renderCorsRules();
    renderLifecycleRules();
    updateOutput();

    const parts = [];
    if (policyText) parts.push('Policy');
    if (corsXml) parts.push('CORS');
    if (lifecycleXml) parts.push('Lifecycle');
    if (parts.length) {
      showToast(`تنظیمات «${bucket}» بارگذاری شد (${parts.join('، ')})`);
    } else {
      showToast(`bucket «${bucket}» تنظیم قبلی نداشت.`);
    }
    updatePivestDeleteButton();
  } catch (err) {
    if (seq !== loadBucketConfigSeq) return;
    remoteConfigPresent = { policy: false, cors: false, lifecycle: false };
    setOutputHint('');
    showToast(err.message, 'error');
    updatePivestDeleteButton();
  }
}

function resetLoadedBucketState() {
  loadBucketConfigSeq++;
  lastLoadedBucket = '';
  remoteConfigPresent = { policy: false, cors: false, lifecycle: false };
  clearTimeout(bucketLoadTimer);
  statements = [];
  corsRules = [];
  lifecycleRules = [];
  renderStatements();
  renderCorsRules();
  renderLifecycleRules();
  updateOutput();
  updatePivestDeleteButton();
}

function getEndpointUrl() {
  return normalizeEndpoint(getClusterById($('#cluster-select').value).url);
}

function loadRememberedPrefs() {
  try {
    const raw = sessionStorage.getItem(PREFS_KEY);
    if (!raw) return;
    const prefs = JSON.parse(raw);
    if (prefs.clusterId) {
      const sel = $('#cluster-select');
      if ([...sel.options].some((o) => o.value === prefs.clusterId)) {
        sel.value = prefs.clusterId;
        updateClusterEndpointHint();
      }
    }
    if (prefs.accessKeyId) {
      $('#access-key').value = prefs.accessKeyId;
      $('#remember-access-key').checked = true;
      syncAccountIdFromAccessKey();
    }
  } catch {
    /* ignore */
  }
}

function saveRememberedPrefs() {
  if (!$('#remember-access-key').checked) {
    sessionStorage.removeItem(PREFS_KEY);
    return;
  }
  sessionStorage.setItem(
    PREFS_KEY,
    JSON.stringify({
      clusterId: $('#cluster-select').value,
      accessKeyId: $('#access-key').value.trim(),
    }),
  );
}

async function handleConnect() {
  await refreshDevServerCapability();
  if (!canUseLocalCredentials()) {
    showToast(
      isLocalDevRuntime()
        ? 'ابتدا در پوشهٔ پروژه python3 server.py را اجرا کنید، سپس صفحه را از http://localhost:8080 باز کنید.'
        : 'اتصال با کلید فقط روی localhost و پس از اجرای python3 server.py مجاز است.',
      'error',
    );
    $('#connect-panel').open = true;
    return;
  }

  const msg = $('#connect-message');
  msg.hidden = true;
  $('#btn-connect').disabled = true;
  try {
    await connect({
      endpoint: getEndpointUrl(),
      accessKeyId: $('#access-key').value,
      secretAccessKey: $('#secret-key').value,
    });
    saveRememberedPrefs();
    await refreshBuckets(false);
    setConnectUI(true);
    syncAccountIdFromAccessKey();
    renderStatements();
    updatePivestDeleteButton();
    showToast(`${faNum(cachedBuckets.length)} bucket بارگذاری شد`);
    lastLoadedBucket = '';
    if (getBucketName()) await loadBucketConfiguration();
    $('#connect-panel').open = true;
  } catch (err) {
    disconnect();
    setConnectUI(false);
    msg.textContent = err.message;
    msg.hidden = false;
    showToast(err.message, 'error');
  } finally {
    updateLocalDevUi();
  }
}

function handleDisconnect() {
  disconnect();
  $('#secret-key').value = '';
  cachedBuckets = [];
  fillBucketLists([]);
  setConnectUI(false);
  resetLoadedBucketState();
  updatePivestDeleteButton();
  showToast('اتصال قطع شد؛ کلیدها از حافظه پاک شد.');
}

async function refreshBuckets(showToastOnSuccess) {
  const buckets = await listBuckets();
  cachedBuckets = buckets;
  fillBucketLists(buckets);
  if (showToastOnSuccess) showToast('فهرست bucket به‌روز شد.');
}

function fillBucketLists(buckets) {
  const select = $('#app-bucket-select');
  const input = $('#app-bucket');
  if (!input) return;

  const prev = getBucketName();

  if (!select) {
    if (buckets.length && !prev) {
      input.value = buckets[0];
    }
    renderStatements();
    if (isConnected() && getBucketName()) {
      lastLoadedBucket = '';
      scheduleLoadBucketConfiguration();
    } else {
      updateOutput();
    }
    return;
  }

  select.innerHTML = '';

  if (!buckets.length) {
    select.hidden = true;
    input.hidden = false;
    return;
  }

  select.hidden = false;
  select.appendChild(new Option('— انتخاب bucket —', ''));
  buckets.forEach((name) => {
    select.appendChild(new Option(name, name));
  });
  select.appendChild(new Option('نام دیگر (دستی)...', BUCKET_MANUAL));

  if (prev && buckets.includes(prev)) {
    select.value = prev;
    input.value = prev;
    input.hidden = true;
  } else if (prev) {
    select.value = BUCKET_MANUAL;
    input.hidden = false;
    input.value = prev;
  } else if (buckets.length) {
    select.value = buckets[0];
    input.value = buckets[0];
    input.hidden = true;
  }

  renderStatements();
  if (isConnected() && getBucketName()) {
    lastLoadedBucket = '';
    scheduleLoadBucketConfiguration();
  } else {
    updateOutput();
  }
}

function setConnectUI(connected) {
  const status = $('#connect-status');
  status.textContent = connected ? `متصل · ${faNum(cachedBuckets.length)} bucket` : 'قطع';
  status.classList.toggle('connected', connected);
  $('#btn-disconnect').hidden = !connected;
  $('#btn-refresh-buckets').hidden = !connected;
}

function escapeAttr(s) {
  return String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
}

function getTemplateFieldDefault(field) {
  if (field.defaultFrom === 'accountId') {
    const arn = buildPrincipalArn({ tenantId: '', userId: getAccountId(), subuser: '' });
    return arn || '';
  }
  return field.defaultValue ?? '';
}

function openPolicyTemplateModal(template) {
  if ((template.needsBucket || templateNeedsBucket(template)) && !getBucketName()) {
    $('#app-bucket')?.focus();
    showToast('ابتدا نام bucket را وارد کنید.', 'warn');
    return;
  }

  pendingPolicyTemplate = template;
  $('#template-modal-title').textContent = template.name;
  $('#template-modal-desc').textContent = template.description;

  const fieldsEl = $('#template-modal-fields');
  fieldsEl.innerHTML = '';

  (template.modalFields || []).forEach((field) => {
    const wrap = document.createElement('label');
    wrap.className = 'field';
    const span = document.createElement('span');
    span.textContent = field.label + (field.required ? ' *' : '');
    wrap.appendChild(span);

    let input;
    if (field.type === 'arns') {
      input = document.createElement('textarea');
      input.rows = 3;
      input.dir = 'ltr';
      input.spellcheck = false;
    } else {
      input = document.createElement('input');
      input.type = 'text';
      input.dir = 'ltr';
      input.spellcheck = false;
    }
    input.dataset.fieldId = field.id;
    input.value = getTemplateFieldDefault(field);
    if (field.placeholder) input.placeholder = field.placeholder;
    wrap.appendChild(input);

    if (field.hint) {
      const hint = document.createElement('p');
      hint.className = 'card-hint';
      hint.textContent = field.hint;
      wrap.appendChild(hint);
    }
    fieldsEl.appendChild(wrap);
  });

  $('#template-modal').showModal();
}

function collectTemplateModalValues(template) {
  const values = {};
  (template.modalFields || []).forEach((field) => {
    const el = $(`[data-field-id="${field.id}"]`, $('#template-modal-fields'));
    values[field.id] = el?.value ?? '';
  });
  return values;
}

function validateTemplateModalValues(template, values) {
  for (const field of template.modalFields || []) {
    if (!field.required) continue;
    const raw = values[field.id]?.trim();
    if (field.type === 'arns') {
      if (!parsePrincipalArns(raw).length) throw new Error(`«${field.label}» را وارد کنید.`);
    } else if (!raw) {
      throw new Error(`«${field.label}» را وارد کنید.`);
    }
  }
}

function templateStatementList(template) {
  return template.statements?.length ? template.statements : [template.statement];
}

function templateNeedsBucket(template) {
  return templateStatementList(template).some((s) =>
    ['BUCKET', 'OBJECTS', 'BOTH'].includes(s.Resource),
  );
}

function enrichTemplateStatement(stmt, template, values) {
  const copy = JSON.parse(JSON.stringify(stmt));

  if (copy.Principal === 'USER') {
    copy._principalArns = parsePrincipalArns(values.principalArns);
    copy._principalType = 'user';
  } else if (copy.Principal === '*') {
    copy._principalType = 'anonymous';
  } else if (copy.Principal?.AWS === '*') {
    copy._principalType = 'authenticated';
  }

  if (values.sourceIp && (copy._conditionIpAllow || copy._conditionIpDeny)) {
    const ips = splitComma(values.sourceIp);
    copy.Condition = copy._conditionIpDeny
      ? { NotIpAddress: { 'aws:SourceIp': ips } }
      : { IpAddress: { 'aws:SourceIp': ips } };
  }

  if (values.prefix && copy._usePrefixCondition) {
    const p = values.prefix.trim().replace(/^\//, '');
    const pattern = p.endsWith('*') ? p : `${p}*`;
    copy.Condition = { StringLike: { 's3:prefix': [pattern] } };
  }

  if (values.referer && template.id === 'referer-read') {
    const host = values.referer.trim().replace(/^https?:\/\//, '').replace(/\/+$/, '');
    copy.Condition = {
      StringLike: {
        'aws:Referer': [`https://${host}/*`, `http://${host}/*`, `https://*.${host}/*`],
      },
    };
  }

  delete copy._conditionIpAllow;
  delete copy._conditionIpDeny;
  delete copy._usePrefixCondition;

  return copy;
}

function buildStatementsFromTemplate(template, values) {
  return templateStatementList(template).map((raw) =>
    enrichTemplateStatement(raw, template, values),
  );
}

function bindTemplateModal() {
  const dialog = $('#template-modal');
  const form = $('#template-modal-form');
  if (!dialog || !form) return;

  const closeModal = () => {
    dialog.close();
    pendingPolicyTemplate = null;
  };

  $('#template-modal-cancel')?.addEventListener('click', closeModal);
  $('#template-modal-close')?.addEventListener('click', closeModal);
  dialog.addEventListener('cancel', () => {
    pendingPolicyTemplate = null;
  });

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!pendingPolicyTemplate) return;
    const template = pendingPolicyTemplate;
    try {
      const values = collectTemplateModalValues(template);
      validateTemplateModalValues(template, values);
      const stmts = buildStatementsFromTemplate(template, values);
      stmts.forEach((stmt) => {
        stmt.id = ++statementCounter;
        statements.push(stmt);
      });
      renderStatements();
      updateOutput();
      const n = stmts.length;
      showToast(
        n > 1
          ? `الگوی «${template.name}» — ${faNum(n)} قانون اضافه شد.`
          : `الگوی «${template.name}» اضافه شد.`,
      );
      dialog.close();
    } catch (err) {
      showToast(err.message, 'error');
      return;
    }
    pendingPolicyTemplate = null;
  });
}

function updatePrincipalFieldsVisibility() {
  const box = $('#principal-user-fields');
  if (!box) return;
  box.hidden = $('#principal-type')?.value !== 'user';
}

function getStmtPrincipalArns() {
  const parsed = parsePrincipalArns($('#stmt-principal-arns')?.value);
  if (parsed.length) return parsed;
  const accountId = getAccountId();
  if (!accountId) return [];
  const arn = buildPrincipalArn({ tenantId: '', userId: accountId, subuser: '' });
  return arn ? [arn] : [];
}

function fillArnFromAccount() {
  const accountId = getAccountId();
  if (!accountId) {
    showToast('Account ID را در بخش مالک وارد کنید.', 'warn');
    return;
  }
  const arn = buildPrincipalArn({ tenantId: '', userId: accountId, subuser: '' });
  if (arn) $('#stmt-principal-arns').value = arn;
}

function bindPolicyForm() {
  $('#btn-add-statement').addEventListener('click', addStatementFromForm);
  $('#btn-clear-statements').addEventListener('click', () => {
    statements = [];
    renderStatements();
    updateOutput();
  });

  $('#principal-type').addEventListener('change', updatePrincipalFieldsVisibility);
  $('#btn-fill-arn-from-account')?.addEventListener('click', fillArnFromAccount);

  $$('[data-action-preset]').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const preset = ACTION_PRESETS[btn.dataset.actionPreset];
      if (!preset) return;
      setSelectedActions(preset);
    });
  });

  $('#btn-actions-clear')?.addEventListener('click', (e) => {
    e.preventDefault();
    setSelectedActions([]);
  });

  $('#btn-add-condition').addEventListener('click', addConditionRow);

}

function bindCorsForm() {
  $('#btn-add-cors-rule').addEventListener('click', addCorsRuleFromForm);
  $('#btn-clear-cors').addEventListener('click', () => {
    corsRules = [];
    renderCorsRules();
    updateOutput();
  });
}

function bindLifecycleForm() {
  $('#btn-add-lifecycle-rule').addEventListener('click', addLifecycleRuleFromForm);
  $('#btn-clear-lifecycle').addEventListener('click', () => {
    lifecycleRules = [];
    renderLifecycleRules();
    updateOutput();
  });
}

function initApplyClients() {
  const wrap = $('#apply-clients-list');
  if (!wrap) return;
  wrap.innerHTML = '';
  APPLY_CLIENTS.forEach((client) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'apply-client-chip' + (client.isPanel ? ' apply-client-chip-pivest' : '');
    btn.textContent = client.name;
    btn.title = client.description;
    btn.addEventListener('click', () => openClientGuideModal(client.id));
    wrap.appendChild(btn);
  });
}

function buildOutputForPanel(panel) {
  const bucket = getBucketName();
  try {
    if (panel === 'policy') {
      const resolved = statements.map((s) => {
        if (typeof s.Resource === 'string' && ['BUCKET', 'OBJECTS', 'BOTH'].includes(s.Resource)) {
          const copy = { ...s };
          delete copy.id;
          delete copy._principalType;
          delete copy._principalArns;
          const scope = s.Resource;
          const resources =
            scope === 'BUCKET'
              ? [`arn:aws:s3:::${bucket}`]
              : scope === 'OBJECTS'
                ? [`arn:aws:s3:::${bucket}/*`]
                : [`arn:aws:s3:::${bucket}`, `arn:aws:s3:::${bucket}/*`];
          copy.Resource = resources;
          if (copy.Principal === 'USER') {
            copy.Principal = s._principalArns?.length
              ? buildPrincipalFromArns(s._principalArns)
              : resolvePrincipalUser();
          }
          if (s._principalType === 'authenticated') {
            copy.Principal = { AWS: '*' };
          }
          return copy;
        }
        const { id, _principalType, _principalArns, ...rest } = s;
        return rest;
      });

      const owner = getOwnerStatement();
      const allStatements = owner ? [owner, ...resolved] : resolved;
      if (!allStatements.length) {
        return { text: '', error: 'Account ID و bucket را وارد کنید.' };
      }
      return { text: formatPolicyJson(buildPolicy(allStatements)), error: null };
    }
    if (panel === 'cors') {
      if (!bucket) return { text: '', error: 'نام bucket را وارد کنید.' };
      return { text: buildCorsXml(corsRules), error: null };
    }
    if (panel === 'lifecycle') {
      if (!bucket) return { text: '', error: 'نام bucket را وارد کنید.' };
      if (!lifecycleRules.length) {
        return { text: '', error: 'حداقل یک قانون Lifecycle اضافه کنید.' };
      }
      return { text: buildLifecycleXml(lifecycleRules), error: null };
    }
    return { text: '', error: null };
  } catch (err) {
    return { text: '', error: err.message };
  }
}

function getApplyGuideContext() {
  const configType = applyPanelContext || $('.tab.active')?.dataset.panel || 'policy';
  const { text, error } = buildOutputForPanel(configType);
  return {
    bucket: getBucketName(),
    endpoint: getEndpointUrl(),
    configType,
    outputText: text?.trim() || '',
    outputError: error,
    isLocal: canUseLocalCredentials(),
    isLocalHost: isLocalDevRuntime(),
    devServerReady,
  };
}

function clearApplyPanelContext() {
  applyPanelContext = null;
  pivestConfirmMode = 'apply';
}

function getPivestActionContext() {
  const configType = applyPanelContext || $('.tab.active')?.dataset.panel || 'policy';
  return {
    bucket: getBucketName(),
    endpoint: getEndpointUrl(),
    configType,
    isLocal: canUseLocalCredentials(),
    isLocalHost: isLocalDevRuntime(),
    devServerReady,
  };
}

function updatePivestDeleteButton() {
  const btn = $('#btn-pivest-delete');
  const block = document.querySelector('.bucket-delete-block');
  const panel = $('.tab.active')?.dataset.panel || 'policy';
  const meta = getConfigMeta(panel);
  const hasRemote = Boolean(remoteConfigPresent[panel]);
  const canDelete =
    canUseLocalCredentials() && isConnected() && Boolean(getBucketName()) && hasRemote;

  if (block) block.hidden = !canDelete;
  if (!btn) return;

  btn.disabled = false;
  btn.textContent = `حذف ${meta.label} از آروان`;
  btn.title = `حذف ${meta.label} از bucket روی آروان`;
}

function setPivestConfirmModalMode(mode) {
  pivestConfirmMode = mode;
  const applyBtn = $('#pivest-confirm-apply');
  const title = $('#pivest-confirm-title');
  if (mode === 'delete') {
    if (title) title.textContent = 'تأیید حذف از آروان';
    if (applyBtn) {
      applyBtn.classList.add('btn-danger');
      applyBtn.textContent = 'حذف از آروان';
    }
  } else {
    if (title) title.textContent = 'تأیید اعمال مستقیم روی آروان';
    if (applyBtn) {
      applyBtn.classList.remove('btn-danger');
      applyBtn.textContent = 'اعمال روی آروان';
    }
  }
}

function clearLocalConfigAfterRemoteDelete(configType) {
  const meta = getConfigMeta(configType);
  if (configType === 'policy') {
    statements = [];
    renderStatements();
  } else if (configType === 'cors') {
    corsRules = [];
    renderCorsRules();
  } else if (configType === 'lifecycle') {
    lifecycleRules = [];
    renderLifecycleRules();
  }

  lastLoadedBucket = '';
  remoteConfigPresent[configType] = false;
  const active = $('.tab.active')?.dataset.panel;
  if (active === configType) {
    $('#output').value = '';
    setOutputHint(`روی آروان ${meta.label} حذف شد.`);
  } else {
    updateOutput();
  }
  updatePivestDeleteButton();
}

function updateLocalDevUi() {
  const isLocal = isLocalDevRuntime();
  const allowKeys = canUseLocalCredentials();
  const warning = $('#connect-local-warning');
  const fieldset = $('#connect-pivest-fields');
  const connectBtn = $('#btn-connect');
  const accessKey = $('#access-key');
  const secretKey = $('#secret-key');
  const toggleSecret = $('#btn-toggle-secret');
  const rememberKey = $('#remember-access-key');

  if (warning) {
    warning.innerHTML = buildPivestLocalWarningHtml(isLocal, devServerReady);
  }

  const staticHint = $('#static-host-hint');
  if (staticHint) staticHint.hidden = isLocal;

  const serverStatus = $('#connect-server-status');
  if (serverStatus) {
    if (!isLocal) {
      serverStatus.hidden = true;
    } else if (!devServerReady) {
      serverStatus.hidden = false;
      serverStatus.className = 'pivest-local-status pivest-local-bad';
      serverStatus.textContent =
        'سرور python3 server.py روی این آدرس در حال اجرا نیست — فیلدهای Access Key و Secret غیرفعال‌اند.';
    } else {
      serverStatus.hidden = false;
      serverStatus.className = 'pivest-local-status pivest-local-ok';
      serverStatus.textContent = 'سرور لوکال فعال است — می‌توانید کلیدها را وارد کنید.';
    }
  }

  if (fieldset) {
    fieldset.classList.toggle('is-disabled', !allowKeys);
  }

  [accessKey, secretKey, toggleSecret, rememberKey].forEach((el) => {
    if (el) {
      el.disabled = !allowKeys;
      if (!allowKeys && el !== rememberKey) el.value = '';
    }
  });

  if (!allowKeys) {
    if (secretKey) secretKey.value = '';
  }

  if (connectBtn) {
    connectBtn.disabled = !allowKeys;
    connectBtn.title = allowKeys
      ? ''
      : isLocal
        ? 'ابتدا python3 server.py را در پوشهٔ پروژه اجرا کنید'
        : 'فقط پس از اجرای لوکال با python3 server.py';
  }

  updatePivestDeleteButton();
}

function openClientGuideModal(clientId) {
  const client = APPLY_CLIENTS.find((c) => c.id === clientId);
  if (!client) return;

  applyPanelContext = $('.tab.active')?.dataset.panel || 'policy';
  const ctx = getApplyGuideContext();
  const meta = getConfigMeta(ctx.configType);

  if (!ctx.outputText) {
    clearApplyPanelContext();
    showToast(ctx.outputError || `ابتدا ${meta.label} را بسازید.`, 'warn');
    return;
  }

  const isPivest = clientId === PANEL_APPLY_ID;

  $('#client-guide-title').textContent = isPivest ? PIVEST_MODAL_TITLE : client.name;
  $('#client-guide-subtitle').textContent = isPivest
    ? `${meta.label} — ${client.description}`
    : `${client.description} — ${meta.label}`;

  $('#client-guide-body').innerHTML = buildClientGuideHtml(clientId, ctx);

  const pivestBtn = $('#btn-pivest-apply');
  if (pivestBtn) {
    pivestBtn.hidden = !isPivest;
    pivestBtn.disabled = !ctx.isLocal;
    pivestBtn.textContent = 'ادامه — تأیید و اعمال';
    pivestBtn.title = ctx.isLocal
      ? ''
      : 'فقط روی localhost پس از python3 server.py';
  }

  $('#client-guide-modal').showModal();
}

function openPivestConfirmModal() {
  setPivestConfirmModalMode('apply');
  const ctx = getApplyGuideContext();
  const meta = getConfigMeta(ctx.configType);
  const dialog = $('#pivest-confirm-modal');
  if (!dialog) return;

  if (!ctx.isLocal) {
    showToast(
      'اعمال مستقیم روی آروان فقط با python3 server.py و آدرس localhost روی سیستم خودتان کار می‌کند.',
      'error',
    );
    $('#connect-panel').open = true;
    return;
  }

  if (!isConnected()) {
    showToast('ابتدا در بخش اتصال، Access Key و Secret را وارد و متصل شوید.', 'warn');
    $('#connect-panel').open = true;
    return;
  }
  if (!ctx.bucket) {
    showToast('نام bucket را وارد کنید.', 'warn');
    $('#app-bucket')?.focus();
    return;
  }
  if (!ctx.outputText) {
    showToast(`خروجی ${meta.label} خالی است.`, 'warn');
    return;
  }

  $('#pivest-confirm-subtitle').textContent = `${PIVEST_MODAL_TITLE} — ${meta.label}`;
  $('#pivest-confirm-body').innerHTML = buildPivestConfirmBodyHtml(ctx);

  const accept = $('#pivest-accept-checkbox');
  const applyBtn = $('#pivest-confirm-apply');
  const acceptLabel = $('#pivest-accept-label');
  if (accept) accept.checked = false;
  if (applyBtn) applyBtn.disabled = true;
  if (acceptLabel) acceptLabel.textContent = buildPivestAcceptLabel(ctx.bucket);

  $('#client-guide-modal')?.close();
  dialog.showModal();
}

function openPivestDeleteConfirmModal() {
  applyPanelContext = $('.tab.active')?.dataset.panel || 'policy';
  setPivestConfirmModalMode('delete');
  const ctx = getPivestActionContext();
  const meta = getConfigMeta(ctx.configType);
  const dialog = $('#pivest-confirm-modal');
  if (!dialog) return;

  if (!ctx.isLocal) {
    showToast(
      'حذف از آروان فقط با python3 server.py و آدرس localhost روی سیستم خودتان کار می‌کند.',
      'error',
    );
    $('#connect-panel').open = true;
    return;
  }

  if (!isConnected()) {
    showToast('ابتدا در بخش اتصال، Access Key و Secret را وارد و متصل شوید.', 'warn');
    $('#connect-panel').open = true;
    return;
  }
  if (!ctx.bucket) {
    showToast('نام bucket را وارد کنید.', 'warn');
    $('#app-bucket')?.focus();
    return;
  }
  if (!remoteConfigPresent[ctx.configType]) {
    showToast(
      `${meta.label} از آروان برای این bucket بارگذاری نشده — ابتدا متصل شوید تا تنظیم فعلی لود شود.`,
      'warn',
    );
    return;
  }

  $('#pivest-confirm-subtitle').textContent = `${PIVEST_MODAL_TITLE} — حذف ${meta.label}`;
  $('#pivest-confirm-body').innerHTML = buildPivestDeleteBodyHtml(ctx);

  const accept = $('#pivest-accept-checkbox');
  const applyBtn = $('#pivest-confirm-apply');
  const acceptLabel = $('#pivest-accept-label');
  if (accept) accept.checked = false;
  if (applyBtn) applyBtn.disabled = true;
  if (acceptLabel) {
    acceptLabel.textContent = buildPivestDeleteAcceptLabel(ctx.bucket, meta.label);
  }

  dialog.showModal();
}

function bindPivestDeleteButton() {
  $('#btn-pivest-delete')?.addEventListener('click', () => openPivestDeleteConfirmModal());
}

function bindClientGuideModal() {
  const dialog = $('#client-guide-modal');
  if (!dialog) return;

  const close = () => {
    dialog.close();
    clearApplyPanelContext();
  };

  $('#client-guide-close')?.addEventListener('click', close);
  $('#client-guide-dismiss')?.addEventListener('click', close);
  dialog.addEventListener('cancel', close);

  $('#btn-pivest-apply')?.addEventListener('click', () => openPivestConfirmModal());
}

function bindPivestConfirmModal() {
  const dialog = $('#pivest-confirm-modal');
  if (!dialog) return;

  const close = () => {
    dialog.close();
    clearApplyPanelContext();
  };
  const accept = $('#pivest-accept-checkbox');
  const applyBtn = $('#pivest-confirm-apply');

  const syncApplyEnabled = () => {
    if (applyBtn) applyBtn.disabled = !accept?.checked;
  };

  accept?.addEventListener('change', syncApplyEnabled);

  $('#pivest-confirm-close')?.addEventListener('click', close);
  $('#pivest-confirm-cancel')?.addEventListener('click', close);
  dialog.addEventListener('cancel', close);

  applyBtn?.addEventListener('click', () => {
    if (!accept?.checked) {
      showToast(
        pivestConfirmMode === 'delete'
          ? 'برای حذف، ابتدا تأیید مسئولیت را بزنید.'
          : 'برای اعمال، ابتدا رفع مسئولیت را بپذیرید.',
        'warn',
      );
      return;
    }
    if (pivestConfirmMode === 'delete') deleteViaPivest();
    else applyViaPivest();
  });
}

async function deleteViaPivest() {
  const btn = $('#pivest-confirm-apply');
  const ctx = getPivestActionContext();
  const meta = getConfigMeta(ctx.configType);

  if (!ctx.isLocal) {
    showToast('حذف از آروان فقط روی localhost پس از python3 server.py کار می‌کند.', 'error');
    return;
  }
  if (!isConnected()) {
    showToast('ابتدا متصل شوید.', 'warn');
    return;
  }
  if (!ctx.bucket) {
    showToast('نام bucket را وارد کنید.', 'warn');
    return;
  }

  const accept = $('#pivest-accept-checkbox');
  if (!accept?.checked) {
    showToast('برای حذف، ابتدا تأیید مسئولیت را بزنید.', 'warn');
    return;
  }

  if (btn) {
    btn.disabled = true;
    btn.textContent = 'در حال حذف…';
  }
  if (accept) accept.disabled = true;

  try {
    if (ctx.configType === 'policy') {
      await deleteBucketPolicy(ctx.bucket);
    } else if (ctx.configType === 'cors') {
      await deleteBucketCors(ctx.bucket);
    } else if (ctx.configType === 'lifecycle') {
      await deleteBucketLifecycle(ctx.bucket);
    } else {
      throw new Error('این تب از حذف مستقیم پشتیبانی نمی‌کند.');
    }

    clearLocalConfigAfterRemoteDelete(ctx.configType);
    showToast(`${meta.label} روی «${ctx.bucket}» از آروان حذف شد.`);
    $('#pivest-confirm-modal')?.close();
    clearApplyPanelContext();
  } catch (err) {
    showToast(err.message, 'error');
  } finally {
    if (accept) accept.disabled = false;
    if (btn) {
      btn.disabled = !accept?.checked;
      setPivestConfirmModalMode('delete');
    }
  }
}

async function applyViaPivest() {
  const btn = $('#pivest-confirm-apply');
  const ctx = getApplyGuideContext();
  const meta = getConfigMeta(ctx.configType);

  if (!ctx.isLocal) {
    showToast(
      'اعمال مستقیم روی آروان فقط با python3 server.py و آدرس localhost روی سیستم خودتان کار می‌کند.',
      'error',
    );
    $('#connect-panel').open = true;
    return;
  }

  if (!isConnected()) {
    showToast('ابتدا در بخش اتصال، Access Key و Secret را وارد و متصل شوید.', 'warn');
    $('#connect-panel').open = true;
    return;
  }
  if (!ctx.bucket) {
    showToast('نام bucket را وارد کنید.', 'warn');
    $('#app-bucket')?.focus();
    return;
  }
  if (!ctx.outputText) {
    showToast(`خروجی ${meta.label} خالی است.`, 'warn');
    return;
  }

  const accept = $('#pivest-accept-checkbox');
  if (!accept?.checked) {
    showToast('برای اعمال، ابتدا رفع مسئولیت را بپذیرید.', 'warn');
    return;
  }

  if (btn) {
    btn.disabled = true;
    btn.textContent = 'در حال اعمال…';
  }
  if (accept) accept.disabled = true;

  try {
    if (ctx.configType === 'policy') {
      await putBucketPolicy(ctx.bucket, ctx.outputText);
    } else if (ctx.configType === 'cors') {
      await putBucketCors(ctx.bucket, ctx.outputText);
    } else if (ctx.configType === 'lifecycle') {
      await putBucketLifecycle(ctx.bucket, ctx.outputText);
      const verified = await getBucketLifecycle(ctx.bucket);
      if (!verified) {
        throw new Error(
          'درخواست ارسال شد اما Lifecycle روی bucket دیده نشد. دسترسی s3:PutLifecycleConfiguration و s3:GetLifecycleConfiguration را بررسی کنید.',
        );
      }
    } else {
      throw new Error('این تب از اعمال مستقیم روی آروان پشتیبانی نمی‌شود.');
    }
    showToast(`${meta.label} روی «${ctx.bucket}» اعمال شد.`);
    lastLoadedBucket = '';
    await loadBucketConfiguration();
    $('#pivest-confirm-modal')?.close();
    $('#client-guide-modal')?.close();
    clearApplyPanelContext();
  } catch (err) {
    showToast(err.message, 'error');
  } finally {
    if (accept) accept.disabled = false;
    if (btn) {
      btn.disabled = !accept?.checked;
      setPivestConfirmModalMode('apply');
    }
  }
}

function bindGlobalActions() {
  $('#btn-copy').addEventListener('click', async () => {
    const text = $('#output').value;
    try {
      await navigator.clipboard.writeText(text);
      showToast('در بریده‌دان کپی شد.');
    } catch {
      $('#output').select();
      document.execCommand('copy');
      showToast('متن انتخاب شد؛ Ctrl+C را بزنید.');
    }
  });

  $('#btn-download').addEventListener('click', () => {
    const active = $('.tab.active').dataset.panel;
    const files = {
      policy: ['bucket-policy.json', 'application/json'],
      cors: ['cors-configuration.xml', 'application/xml'],
      lifecycle: ['lifecycle-configuration.xml', 'application/xml'],
    };
    const [name, mime] = files[active] || files.policy;
    const blob = new Blob([$('#output').value], { type: mime });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = name;
    a.click();
    URL.revokeObjectURL(a.href);
  });
}

function addStatementFromForm() {
  try {
    const actions = getSelectedActions();
    if (!actions.length) {
      showToast('حداقل یک Action انتخاب کنید.', 'warn');
      return;
    }
    const conditionRows = $$('#conditions-list .condition-row').map((row) => ({
      operator: $('.cond-op', row)?.value,
      key: $('.cond-key', row)?.value,
      value: $('.cond-val', row)?.value,
    }));
    const principalType = $('#principal-type').value;
    const principalArns = principalType === 'user' ? getStmtPrincipalArns() : [];

    const stmt = statementFromForm({
      effect: $('#stmt-effect').value,
      principalType,
      principalArns,
      tenantId: '',
      userId: getAccountId(),
      subuser: '',
      actions,
      resourceScope: $('#resource-scope').value,
      bucket: getBucketName(),
      conditions: parseConditionsFromRows(conditionRows),
      sid: $('#stmt-sid').value,
    });
    stmt.id = ++statementCounter;
    if (principalType === 'user' && principalArns.length) {
      stmt._principalArns = principalArns;
      stmt._principalType = 'user';
    }
    statements.push(stmt);
    renderStatements();
    updateOutput();
    showToast('قانون اضافه شد.');
    resetStatementForm();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

function resetStatementForm() {
  $('#stmt-sid').value = '';
  $('#stmt-principal-arns').value = '';
  $('#conditions-list').innerHTML = '';
}

function renderOwnerStatementHtml() {
  const owner = getOwnerStatement();
  if (!owner) {
    return '<p class="empty-hint">Account ID و نام bucket را وارد کنید تا قانون پیش‌فرض مالک ساخته شود.</p>';
  }
  const arn = formatPrincipalAws(owner.Principal.AWS);
  const actions = Array.isArray(owner.Action) ? owner.Action.join(', ') : owner.Action;
  const resources = owner.Resource.join(', ');
  return `
    <article class="statement-card statement-card-default">
      <div class="statement-card-head">
        <span class="badge badge-allow">مجاز</span>
        <span class="badge badge-default">پیش‌فرض · دسترسی کامل</span>
        <span class="sid">${owner.Sid}</span>
      </div>
      <dl class="statement-meta">
        <dt>کاربر</dt><dd>${escapeHtml(String(arn))}</dd>
        <dt>عملیات</dt><dd>${escapeHtml(actions)}</dd>
        <dt>محدوده</dt><dd>${escapeHtml(resources)}</dd>
      </dl>
    </article>`;
}

function renderStatements() {
  const list = $('#statements-list');
  const ownerHtml = renderOwnerStatementHtml();
  const extraHtml = statements.length
    ? statements
    .map((s, idx) => {
      const principal =
        s.Principal === '*'
          ? 'همه (ناشناس)'
          : typeof s.Principal === 'object'
            ? s.Principal.AWS === '*'
              ? 'هر کسی که کلید S3 دارد'
              : formatPrincipalAws(s.Principal.AWS) || JSON.stringify(s.Principal)
            : s.Principal;
      const actions = Array.isArray(s.Action) ? s.Action.join(', ') : s.Action;
      const resources = Array.isArray(s.Resource) ? s.Resource.join(', ') : s.Resource;
      return `
        <article class="statement-card" data-idx="${idx}">
          <div class="statement-card-head">
            <span class="badge badge-${s.Effect === 'Allow' ? 'allow' : 'deny'}">${s.Effect === 'Allow' ? 'مجاز' : 'مسدود'}</span>
            ${s.Sid ? `<span class="sid">${s.Sid}</span>` : ''}
            <button type="button" class="btn-icon btn-remove" data-remove="${idx}" title="حذف">×</button>
          </div>
          <dl class="statement-meta">
            <dt>برای</dt><dd>${escapeHtml(String(principal))}</dd>
            <dt>عملیات</dt><dd>${escapeHtml(actions)}</dd>
            <dt>محدوده</dt><dd>${escapeHtml(resources)}</dd>
          </dl>
        </article>`;
    })
    .join('')
    : '<p class="empty-hint">قوانین دیگر را از فرم بالا یا الگوها اضافه کنید.</p>';

  list.innerHTML = ownerHtml + extraHtml;

  $$('[data-remove]', list).forEach((btn) => {
    btn.addEventListener('click', () => {
      statements.splice(Number(btn.dataset.remove), 1);
      renderStatements();
      updateOutput();
    });
  });
}

function addConditionRow() {
  const row = document.createElement('div');
  row.className = 'condition-row';
  row.innerHTML = `
    <select class="cond-key"></select>
    <select class="cond-op"><option value="">— اپراتور —</option></select>
    <input class="cond-val" type="text" placeholder="مقدار (IP: 1.2.3.0/24,10.0.0.1)" />
    <button type="button" class="btn-icon" title="حذف">×</button>
  `;
  populateConditionKeySelect($('.cond-key', row));
  $('.cond-key', row).addEventListener('change', (e) => {
    const opt = e.target.selectedOptions[0];
    const opSel = $('.cond-op', row);
    opSel.innerHTML = '<option value="">— اپراتور —</option>';
    if (opt?.dataset.operators) {
      JSON.parse(opt.dataset.operators).forEach((op) => {
        const o = document.createElement('option');
        o.value = op;
        o.textContent = op;
        opSel.appendChild(o);
      });
    }
  });
  $('.btn-icon', row).addEventListener('click', () => row.remove());
  $('#conditions-list').appendChild(row);
}

function corsRuleFromForm() {
  const allowedOrigins = splitLines($('#cors-origins')?.value);
  const allowedMethods = getSelectedCorsMethods();
  if (!allowedOrigins.length) throw new Error('حداقل یک Origin وارد کنید.');
  if (!allowedMethods.length) throw new Error('حداقل یک Method انتخاب کنید.');

  const maxAgeRaw = $('#cors-max-age')?.value.trim();
  return {
    allowedOrigins,
    allowedMethods,
    allowedHeaders: splitComma($('#cors-allowed-headers')?.value) || ['*'],
    exposeHeaders: splitComma($('#cors-expose-headers')?.value),
    maxAgeSeconds: maxAgeRaw === '' ? undefined : Number(maxAgeRaw),
  };
}

function addCorsRuleFromForm() {
  try {
    corsRules.push(corsRuleFromForm());
    renderCorsRules();
    updateOutput();
    showToast('قانون CORS اضافه شد.');
  } catch (err) {
    showToast(err.message, 'error');
  }
}

function applyCorsTemplate(template) {
  corsRules.push({ ...template.rule });
  renderCorsRules();
  updateOutput();
  showToast(`الگوی «${template.name}» اضافه شد.`);
}

function renderCorsRules() {
  const list = $('#cors-rules-list');
  if (!list) return;
  if (!corsRules.length) {
    list.innerHTML = '<p class="empty-hint">هنوز قانون CORS اضافه نکرده‌اید.</p>';
    return;
  }
  const total = corsRules.length;
  list.innerHTML = corsRules
    .map((r, idx) => {
      const hasWildcard = r.allowedOrigins.some((o) => o.trim() === '*');
      let orderNote = 'اگر شرایطش بخورد، همین قانون اجرا می‌شود';
      if (idx === 0) orderNote = 'اولین قانون — از اینجا بررسی می‌شود';
      else if (idx === total - 1 && hasWildcard) orderNote = 'آخرین قانون — معمولاً برای همهٔ سایت‌ها (*)';
      else if (hasWildcard) orderNote = 'شامل * — قوانین بعدی ممکن است اجرا نشوند';

      return `
    <article class="config-rule-card" data-idx="${idx}">
      <div class="config-rule-card-head">
        <span class="cors-order-badge" title="ترتیب در XML">#${faNum(idx + 1)}</span>
        <span class="cors-order-note">${escapeHtml(orderNote)}</span>
        <button type="button" class="btn-icon btn-remove" data-remove-cors="${idx}" title="حذف">×</button>
      </div>
      <dl class="config-rule-meta">
        <dt>سایت‌ها</dt><dd>${escapeHtml(r.allowedOrigins.join(', '))}</dd>
        <dt>متدها</dt><dd>${escapeHtml(r.allowedMethods.join(', '))}</dd>
        <dt>هدرهای درخواست</dt><dd>${escapeHtml((r.allowedHeaders || ['*']).join(', '))}</dd>
        ${r.exposeHeaders?.length ? `<dt>هدرهای پاسخ</dt><dd>${escapeHtml(r.exposeHeaders.join(', '))}</dd>` : ''}
        ${r.maxAgeSeconds != null && r.maxAgeSeconds !== '' ? `<dt>کش preflight (ثانیه)</dt><dd>${escapeHtml(String(r.maxAgeSeconds))}</dd>` : ''}
      </dl>
    </article>`;
    })
    .join('');

  $$('[data-remove-cors]', list).forEach((btn) => {
    btn.addEventListener('click', () => {
      corsRules.splice(Number(btn.dataset.removeCors), 1);
      renderCorsRules();
      updateOutput();
    });
  });
}

function lifecycleRuleFromForm() {
  const id = $('#lc-id')?.value.trim();
  if (!id) throw new Error('شناسهٔ قانون را وارد کنید.');

  const expirationRaw = $('#lc-expiration-days')?.value.trim();
  const transitionRaw = $('#lc-transition-days')?.value.trim();
  const storageClass = $('#lc-storage-class')?.value.trim();
  const abortRaw = $('#lc-abort-days')?.value.trim();

  const rule = {
    id,
    status: $('#lc-status')?.value || 'Enabled',
    prefix: $('#lc-prefix')?.value.trim(),
    expirationDays: expirationRaw === '' ? undefined : Number(expirationRaw),
    transitionDays: transitionRaw === '' ? undefined : Number(transitionRaw),
    transitionStorageClass: storageClass || undefined,
    abortIncompleteDays: abortRaw === '' ? undefined : Number(abortRaw),
  };

  buildLifecycleXml([rule]);
  return rule;
}

function addLifecycleRuleFromForm() {
  try {
    lifecycleRules.push(lifecycleRuleFromForm());
    renderLifecycleRules();
    updateOutput();
    showToast('قانون Lifecycle اضافه شد.');
    $('#lc-id').value = '';
    $('#lc-expiration-days').value = '';
    $('#lc-transition-days').value = '';
    $('#lc-abort-days').value = '';
  } catch (err) {
    showToast(err.message, 'error');
  }
}

function applyLifecycleTemplate(template) {
  lifecycleRules.push({ ...template.rule });
  renderLifecycleRules();
  updateOutput();
  showToast(`الگوی «${template.name}» اضافه شد.`);
}

function renderLifecycleRules() {
  const list = $('#lifecycle-rules-list');
  if (!list) return;
  if (!lifecycleRules.length) {
    list.innerHTML = '<p class="empty-hint">هنوز قانون Lifecycle اضافه نکرده‌اید.</p>';
    return;
  }
  list.innerHTML = lifecycleRules
    .map((r, idx) => {
      const statusFa = r.status === 'Enabled' ? 'فعال' : 'غیرفعال';
      const parts = [
        `<dt>وضعیت</dt><dd>${escapeHtml(statusFa)}</dd>`,
        r.prefix ? `<dt>مسیر</dt><dd>${escapeHtml(r.prefix)}</dd>` : '',
        r.expirationDays != null && r.expirationDays !== ''
          ? `<dt>حذف بعد از</dt><dd>${escapeHtml(String(r.expirationDays))} روز</dd>`
          : '',
        r.transitionDays != null &&
        r.transitionDays !== '' &&
        r.transitionStorageClass
          ? `<dt>انتقال</dt><dd>${escapeHtml(String(r.transitionDays))} روز → ${escapeHtml(r.transitionStorageClass)}</dd>`
          : '',
        r.abortIncompleteDays != null && r.abortIncompleteDays !== ''
          ? `<dt>پاک‌سازی آپلود ناقص</dt><dd>${escapeHtml(String(r.abortIncompleteDays))} روز</dd>`
          : '',
      ].join('');
      return `
    <article class="config-rule-card" data-idx="${idx}">
      <div class="config-rule-card-head">
        <strong dir="ltr">${escapeHtml(r.id)}</strong>
        <button type="button" class="btn-icon btn-remove" data-remove-lc="${idx}" title="حذف">×</button>
      </div>
      <dl class="config-rule-meta">${parts}</dl>
    </article>`;
    })
    .join('');

  $$('[data-remove-lc]', list).forEach((btn) => {
    btn.addEventListener('click', () => {
      lifecycleRules.splice(Number(btn.dataset.removeLc), 1);
      renderLifecycleRules();
      updateOutput();
    });
  });
}

function setOutputHint(message) {
  const hint = $('#output-hint');
  if (!hint) return;
  const text = message || '';
  hint.textContent = text;
  hint.hidden = !text;
}

function updateOutput() {
  const out = $('#output');
  const active = $('.tab.active').dataset.panel;
  const { text, error } = buildOutputForPanel(active);
  out.value = text;
  setOutputHint(error || '');
}

function formatPrincipalAws(aws) {
  if (!aws) return '';
  return Array.isArray(aws) ? aws.join(', ') : String(aws);
}

function escapeHtml(s) {
  const d = document.createElement('div');
  d.textContent = s;
  return d.innerHTML;
}

function showToast(msg, type = 'ok') {
  const t = $('#toast');
  if (!t) return;
  t.textContent = msg;
  t.className = `toast toast-${type} show`;
  clearTimeout(t._timer);
  t._timer = setTimeout(() => t.classList.remove('show'), 2800);
}

/** Boot after module load (static host may load script after DOMContentLoaded). */
function startApp() {
  try {
    init();
  } catch (err) {
    console.error('App init failed:', err);
    var banner = document.getElementById('assets-missing-banner');
    if (banner) {
      banner.hidden = false;
      document.documentElement.classList.add('assets-missing');
    }
  }
}
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', startApp);
} else {
  startApp();
}
