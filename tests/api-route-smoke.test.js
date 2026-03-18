const assert = require('assert');
const path = require('path');
const { spawn } = require('child_process');

const PORT = Number(process.env.TEST_PORT || (5300 + Math.floor(Math.random() * 700)));
const BASE_URL = `http://127.0.0.1:${PORT}`;
const SERVER_PATH = path.join(__dirname, '..', 'server.js');

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitForHealth(timeoutMs = 20000, startupLogs = { stdout: '', stderr: '' }) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(`${BASE_URL}/api/health`);
      if (res.ok) return;
    } catch (_e) {}
    await sleep(250);
  }

  throw new Error(
    'Server did not become healthy in time.\n' +
    'stdout:\n' + (startupLogs.stdout || '(empty)') + '\n' +
    'stderr:\n' + (startupLogs.stderr || '(empty)')
  );
}

async function request(method, pathname, body, headers = {}) {
  const res = await fetch(`${BASE_URL}${pathname}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...headers
    },
    body: body ? JSON.stringify(body) : undefined
  });

  let data = null;
  try {
    data = await res.json();
  } catch (_e) {
    data = null;
  }

  return { res, data };
}

async function adminLogin() {
  const email = 'admin@qauliumai.in';
  const password = 'test-pass';

  const step1 = await request('POST', '/api/admin/login', { email, password });
  assert.strictEqual(step1.res.status, 200, `Login step1 failed: ${JSON.stringify(step1.data)}`);
  assert.strictEqual(step1.data.requiresOtp, true, 'Expected OTP challenge from step1');
  assert.ok(step1.data.requestId, 'Expected requestId in login step1 response');

  const step2 = await request('POST', '/api/admin/login', {
    email,
    password,
    requestId: step1.data.requestId,
    otp: '000000'
  });

  assert.strictEqual(step2.res.status, 200, `Login step2 failed: ${JSON.stringify(step2.data)}`);
  assert.ok(step2.data.token, 'Expected token in login step2 response');
  return step2.data.token;
}

async function run() {
  const server = spawn(process.execPath, [SERVER_PATH], {
    env: {
      ...process.env,
      PORT: String(PORT),
      ADMIN_TOKEN_SECRET: 'route-smoke-test-secret',
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

    const health = await fetch(`${BASE_URL}/api/health`);
    assert.strictEqual(health.status, 200, 'Expected /api/health to return 200');
    assert.strictEqual(health.headers.get('x-content-type-options'), 'nosniff');
    assert.strictEqual(health.headers.get('x-frame-options'), 'SAMEORIGIN');
    assert.strictEqual(health.headers.get('referrer-policy'), 'strict-origin-when-cross-origin');

    for (const route of ['/', '/careers', '/careers/apply', '/registration', '/pre-register']) {
      const page = await fetch(`${BASE_URL}${route}`);
      assert.strictEqual(page.status, 200, `Expected ${route} to return 200`);
    }

    let result = await request('POST', '/api/register', {
      firstName: 'Invalid',
      lastName: 'Email',
      email: 'not-an-email'
    });
    assert.strictEqual(result.res.status, 400, 'Expected invalid registration email to fail with 400');

    result = await request('POST', '/api/register', {
      firstName: 'Route',
      lastName: 'Smoke',
      email: `route-smoke-${Date.now()}@test.com`,
      phone: '+1234567890',
      company: 'Qaulium',
      role: 'Engineer',
      useCase: 'Platform testing',
      source: 'landing_modal'
    });
    assert.strictEqual(result.res.status, 200, `Expected valid registration to pass. body=${JSON.stringify(result.data)}`);

    const duplicateEmail = `dup-${Date.now()}@test.com`;
    const firstContact = await request('POST', '/api/contact', {
      name: 'Contact User',
      email: duplicateEmail,
      company: 'Qaulium',
      message: 'Testing contact route behavior.'
    });
    assert.strictEqual(firstContact.res.status, 200, `Expected first contact submission to pass. body=${JSON.stringify(firstContact.data)}`);

    const secondContact = await request('POST', '/api/contact', {
      name: 'Contact User',
      email: duplicateEmail,
      company: 'Qaulium',
      message: 'Duplicate contact route behavior.'
    });
    assert.strictEqual(secondContact.res.status, 409, 'Expected duplicate contact email to return 409');

    const invalidCareer = await request('POST', '/api/careers/apply', {
      firstName: 'Route',
      lastName: 'Tester',
      email: 'tester@test.com'
    });
    assert.strictEqual(invalidCareer.res.status, 400, 'Expected incomplete career payload to fail with 400');

    const careerOk = await request('POST', '/api/careers/apply', {
      firstName: 'Career',
      lastName: 'Tester',
      email: `career-${Date.now()}@test.com`,
      phone: '+1987654321',
      roleApplied: 'AI Intern',
      location: 'India',
      university: 'Qaulium University',
      degree: 'B.Tech',
      graduationYear: 2028,
      availability: 'Immediate',
      linkedinUrl: 'https://linkedin.com/in/example',
      portfolioUrl: 'https://example.com/portfolio',
      resumeUrl: 'https://example.com/resume.pdf',
      coverLetter: 'I am excited to contribute to this team with production-focused testing and engineering.'
    });
    assert.strictEqual(careerOk.res.status, 200, `Expected valid career submission to pass. body=${JSON.stringify(careerOk.data)}`);

    const noAuthStats = await request('GET', '/api/admin/stats');
    assert.strictEqual(noAuthStats.res.status, 401, 'Expected /api/admin/stats without token to return 401');

    const token = await adminLogin();

    const stats = await request('GET', '/api/admin/stats', undefined, { Authorization: `Bearer ${token}` });
    assert.strictEqual(stats.res.status, 200, `Expected authed /api/admin/stats to succeed. body=${JSON.stringify(stats.data)}`);
    assert.strictEqual(typeof stats.data.totals, 'object');

    const dashboard = await request('GET', '/api/admin/dashboard', undefined, { Authorization: `Bearer ${token}` });
    assert.strictEqual(dashboard.res.status, 200, `Expected authed /api/admin/dashboard to succeed. body=${JSON.stringify(dashboard.data)}`);
    assert.strictEqual(dashboard.data.success, true, 'Expected dashboard bootstrap success flag');
    assert.strictEqual(typeof dashboard.data.data, 'object', 'Expected dashboard payload object');
    assert.strictEqual(typeof dashboard.data.data.monitoring, 'object', 'Expected live monitoring payload in dashboard response');
    assert.strictEqual(typeof dashboard.data.data.summary, 'object', 'Expected summary payload in dashboard response');
    assert.ok(Array.isArray(dashboard.data.data.forms), 'Expected forms array in dashboard response');

    const formCreate = await request('POST', '/api/admin/forms', {
      title: 'Route Smoke Form',
      description: 'Validation form',
      sections: [
        {
          title: 'Basics',
          fields: [
            { id: 'full_name', label: 'Full Name', type: 'text', required: true },
            { id: 'skills', label: 'Skills', type: 'textarea', required: false }
          ]
        }
      ]
    }, { Authorization: `Bearer ${token}` });

    assert.strictEqual(formCreate.res.status, 200, `Expected form creation to succeed. body=${JSON.stringify(formCreate.data)}`);
    assert.ok(formCreate.data.form && formCreate.data.form.slug, 'Expected created form slug');

    const formId = formCreate.data.form.id;
    const slug = formCreate.data.form.slug;

    const publicForm = await request('GET', `/api/forms/${slug}`);
    assert.strictEqual(publicForm.res.status, 200, 'Expected public form fetch to succeed');

    const missingRequired = await request('POST', `/api/forms/${slug}/submit`, {
      email: 'submitter@test.com',
      responses: {}
    });
    assert.strictEqual(missingRequired.res.status, 400, 'Expected missing required form field to fail');

    const submitOk = await request('POST', `/api/forms/${slug}/submit`, {
      email: 'submitter@test.com',
      responses: { full_name: 'Route Tester', skills: 'Node.js, QA' }
    });
    assert.strictEqual(submitOk.res.status, 200, `Expected form submit to succeed. body=${JSON.stringify(submitOk.data)}`);

    const responses = await request('GET', `/api/admin/forms/${formId}/responses`, undefined, { Authorization: `Bearer ${token}` });
    assert.strictEqual(responses.res.status, 200, 'Expected admin form responses fetch to succeed');
    assert.ok(Array.isArray(responses.data.data), 'Expected response data array');
    assert.ok(responses.data.data.length >= 1, 'Expected at least one form response');

    const deactivate = await request('PUT', `/api/admin/forms/${formId}`, {
      title: 'Route Smoke Form',
      description: 'Validation form disabled',
      sections: [
        {
          title: 'Basics',
          fields: [
            { id: 'full_name', label: 'Full Name', type: 'text', required: true },
            { id: 'skills', label: 'Skills', type: 'textarea', required: false }
          ]
        }
      ],
      is_active: false
    }, { Authorization: `Bearer ${token}` });
    assert.strictEqual(deactivate.res.status, 200, 'Expected form deactivation to succeed');

    const blockedSubmit = await request('POST', `/api/forms/${slug}/submit`, {
      email: 'submitter2@test.com',
      responses: { full_name: 'Route Tester 2' }
    });
    assert.strictEqual(blockedSubmit.res.status, 403, 'Expected inactive form submission to be blocked with 403');

    console.log('PASS: route smoke + auth flow + forms flow + security headers validated.');
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
