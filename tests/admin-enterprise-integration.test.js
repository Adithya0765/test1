const assert = require('assert');
const crypto = require('crypto');
const path = require('path');
const { spawn } = require('child_process');
const WebSocket = require('ws');

const PORT = Number(process.env.TEST_PORT || (3900 + Math.floor(Math.random() * 800)));
const BASE_URL = `http://127.0.0.1:${PORT}`;
const SERVER_PATH = path.join(__dirname, '..', 'server.js');
const TEST_SECRET = 'integration-test-secret';

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function base64UrlEncode(value) {
  return Buffer.from(value).toString('base64').replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
}

function signToken(payload, secret) {
  const encoded = base64UrlEncode(JSON.stringify(payload));
  const sig = crypto.createHmac('sha256', secret).update(encoded).digest('base64url');
  return `${encoded}.${sig}`;
}

async function waitForHealth(timeoutMs = 20000, startupLogs = { stdout: '', stderr: '' }) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(`${BASE_URL}/`);
      if (res.ok) return;
    } catch (_e) {}
    await sleep(300);
  }
  throw new Error(
    'Server did not become healthy in time.\n' +
    'stdout:\n' + (startupLogs.stdout || '(empty)') + '\n' +
    'stderr:\n' + (startupLogs.stderr || '(empty)')
  );
}

async function loginAndGetToken() {
  const email = 'admin@qauliumai.in';
  const password = 'test-pass';

  const step1Res = await fetch(`${BASE_URL}/api/admin/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  const step1 = await step1Res.json();
  assert.strictEqual(step1Res.ok, true, `Login step1 failed: ${JSON.stringify(step1)}`);
  assert.strictEqual(step1.requiresOtp, true, 'Expected OTP challenge in step1.');
  assert.ok(step1.requestId, 'Expected requestId for OTP step.');

  const step2Res = await fetch(`${BASE_URL}/api/admin/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, requestId: step1.requestId, otp: '000000' })
  });
  const step2 = await step2Res.json();
  assert.strictEqual(step2Res.ok, true, `Login step2 failed: ${JSON.stringify(step2)}`);
  assert.strictEqual(step2.success, true, 'Expected successful OTP verification.');
  assert.ok(step2.token, 'Expected bearer token from login step2.');
  return step2.token;
}

function openAdminSocket(token) {
  return new Promise((resolve, reject) => {
    const events = [];
    const ws = new WebSocket(`ws://127.0.0.1:${PORT}/ws/admin?token=${encodeURIComponent(token)}`);

    const timeout = setTimeout(() => {
      ws.terminate();
      reject(new Error('Timed out connecting websocket.'));
    }, 10000);

    ws.on('message', (buf) => {
      try {
        const evt = JSON.parse(buf.toString('utf8'));
        events.push(evt);
      } catch (_e) {}
    });

    ws.on('open', () => {
      clearTimeout(timeout);
      resolve({ ws, events });
    });

    ws.on('error', (err) => {
      clearTimeout(timeout);
      reject(err);
    });
  });
}

async function apiPost(pathname, token, body) {
  const res = await fetch(`${BASE_URL}${pathname}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(body || {})
  });
  const data = await res.json();
  return { res, data };
}

async function apiDelete(pathname, token) {
  const res = await fetch(`${BASE_URL}${pathname}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  const data = await res.json();
  return { res, data };
}

async function run() {
  const server = spawn(process.execPath, [SERVER_PATH], {
    env: {
      ...process.env,
      PORT: String(PORT),
      ADMIN_TOKEN_SECRET: TEST_SECRET,
      ADMIN_LOGIN_EMAIL: 'admin@qauliumai.in',
      ADMIN_LOGIN_PASSWORD: 'test-pass',
      ADMIN_LOGIN_ROLE: 'admin',
      ADMIN_DEV_OTP_BYPASS: '1'
    },
    stdio: ['ignore', 'pipe', 'pipe']
  });

  let stdout = '';
  let stderr = '';
  server.stdout.on('data', (d) => { stdout += d.toString(); });
  server.stderr.on('data', (d) => { stderr += d.toString(); });

  try {
    await waitForHealth(20000, { stdout, stderr });

    const token = await loginAndGetToken();
    const { ws, events } = await openAdminSocket(token);

    const suffix = `${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const deptName = `Integration Dept ${suffix}`;
    const projectName = `Integration Project ${suffix}`;
    const taskTitle = `Integration Task ${suffix}`;

    const created = [];

    const dept = await apiPost('/api/admin/org/departments', token, {
      name: deptName,
      lead: 'Integration Lead',
      parent: '-',
      region: 'IN'
    });
    assert.strictEqual(dept.res.ok, true, `Create department failed: ${JSON.stringify(dept.data)}`);
    assert.strictEqual(dept.data.success, true);
    created.push({ type: 'department', id: dept.data.id });

    const project = await apiPost('/api/admin/projects', token, {
      name: projectName,
      owner: 'Integration Owner',
      status: 'On Track',
      progress: 10
    });
    assert.strictEqual(project.res.ok, true, `Create project failed: ${JSON.stringify(project.data)}`);
    assert.strictEqual(project.data.success, true);

    const task = await apiPost('/api/admin/tasks', token, {
      title: taskTitle,
      project: projectName,
      assignee: 'Integration User',
      priority: 'High',
      status: 'todo'
    });
    assert.strictEqual(task.res.ok, true, `Create task failed: ${JSON.stringify(task.data)}`);
    assert.strictEqual(task.data.success, true);

    await sleep(1200);

    const eventTypes = events.map((e) => e.eventType);
    assert.ok(eventTypes.includes('organization.department.created'), `Missing department websocket event. got=${eventTypes.join(',')}`);
    assert.ok(eventTypes.includes('project.created'), `Missing project websocket event. got=${eventTypes.join(',')}`);
    assert.ok(eventTypes.includes('task.created'), `Missing task websocket event. got=${eventTypes.join(',')}`);

    const analystToken = signToken({
      email: 'analyst@qauliumai.in',
      role: 'analyst',
      otpVerified: true,
      exp: Date.now() + 3600 * 1000
    }, TEST_SECRET);

    const forbiddenProject = await apiPost('/api/admin/projects', analystToken, {
      name: `Should Fail ${suffix}`,
      owner: 'Analyst',
      status: 'On Track',
      progress: 0
    });
    assert.strictEqual(forbiddenProject.res.status, 403, `Expected 403 for analyst create project, got ${forbiddenProject.res.status}`);

    if (created.length) {
      await apiDelete(`/api/admin/org/departments/${created[0].id}`, token);
    }

    ws.close();

    console.log('PASS: login + create department/project/task + websocket live updates + RBAC 403 validated.');
  } finally {
    server.kill('SIGTERM');
    await sleep(500);
    if (server.exitCode === null) {
      server.kill('SIGKILL');
    }
    if (stderr.trim()) {
      // Keep stderr visible if something failed; harmless logs may exist.
      console.error(stderr.trim());
    }
  }
}

run().catch((err) => {
  console.error('FAIL:', err && err.stack ? err.stack : err);
  process.exit(1);
});
