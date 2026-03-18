const assert = require('assert');
const crypto = require('crypto');
const path = require('path');
const { spawn } = require('child_process');

const PORT = Number(process.env.TEST_PORT || (4800 + Math.floor(Math.random() * 700)));
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

function tokenForRole(role) {
  return signToken({
    email: `${role}@qauliumai.in`,
    role,
    otpVerified: true,
    exp: Date.now() + 60 * 60 * 1000
  }, TEST_SECRET);
}

async function waitForServer(timeoutMs = 20000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(`${BASE_URL}/`);
      if (res.ok) return;
    } catch (_err) {}
    await sleep(250);
  }
  throw new Error('Server did not become ready in time.');
}

async function call(method, pathname, token, body) {
  const res = await fetch(`${BASE_URL}${pathname}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: body ? JSON.stringify(body) : undefined
  });

  let data = null;
  try {
    data = await res.json();
  } catch (_e) {
    data = null;
  }

  return { status: res.status, ok: res.ok, data };
}

const endpoints = {
  organizationManage: {
    method: 'POST',
    path: '/api/admin/org/departments',
    body: { name: 'RBAC Test Dept', lead: 'Lead', parent: '-', region: 'IN' },
    permission: 'organization.manage'
  },
  projectsManage: {
    method: 'POST',
    path: '/api/admin/projects',
    body: { name: 'RBAC Test Project', owner: 'Owner', status: 'On Track', progress: 1 },
    permission: 'projects.manage'
  },
  tasksManage: {
    method: 'POST',
    path: '/api/admin/tasks',
    body: { title: 'RBAC Test Task', project: 'RBAC Test Project', assignee: 'User', priority: 'Medium', status: 'todo' },
    permission: 'tasks.manage'
  },
  notificationsManage: {
    method: 'POST',
    path: '/api/admin/notifications',
    body: { title: 'RBAC notification', channel: 'email', status: 'queued', audience: 'all' },
    permission: 'notifications.manage'
  },
  settingsManage: {
    method: 'PATCH',
    path: '/api/admin/settings',
    body: { locale: 'en', country: 'all', realtimeEnabled: true },
    permission: 'settings.manage'
  }
};

const roleExpected = {
  org_admin: {
    organizationManage: 200,
    projectsManage: 200,
    tasksManage: 200,
    notificationsManage: 200,
    settingsManage: 403
  },
  analyst: {
    organizationManage: 403,
    projectsManage: 403,
    tasksManage: 403,
    notificationsManage: 403,
    settingsManage: 403
  },
  support_agent: {
    organizationManage: 403,
    projectsManage: 403,
    tasksManage: 403,
    notificationsManage: 200,
    settingsManage: 403
  },
  auditor: {
    organizationManage: 403,
    projectsManage: 403,
    tasksManage: 403,
    notificationsManage: 403,
    settingsManage: 403
  }
};

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

  let stderr = '';
  server.stderr.on('data', (d) => {
    stderr += d.toString();
  });

  try {
    await waitForServer();

    for (const [role, expectations] of Object.entries(roleExpected)) {
      const token = tokenForRole(role);

      for (const [key, endpoint] of Object.entries(endpoints)) {
        const result = await call(endpoint.method, endpoint.path, token, endpoint.body);
        const expectedStatus = expectations[key];
        assert.strictEqual(
          result.status,
          expectedStatus,
          `Role ${role} -> ${key} expected ${expectedStatus}, got ${result.status}, body=${JSON.stringify(result.data)}`
        );
      }
    }

    console.log('PASS: role matrix 403/200 assertions validated for protected enterprise endpoints.');
  } finally {
    server.kill('SIGTERM');
    await sleep(500);
    if (server.exitCode === null) {
      server.kill('SIGKILL');
    }
    if (stderr.trim()) {
      console.error(stderr.trim());
    }
  }
}

run().catch((err) => {
  console.error('FAIL:', err && err.stack ? err.stack : err);
  process.exit(1);
});
