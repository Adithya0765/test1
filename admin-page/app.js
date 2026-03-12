(function () {
  'use strict';

  const state = {
    apiBase: localStorage.getItem('qaulium_admin_api_base') || 'https://qauliumai.in',
    token: localStorage.getItem('qaulium_admin_token') || '',
    admin: null
  };

  const templates = {
    'internship-offer': {
      subject: 'Internship Offer - Qaulium AI',
      body: '<div style="font-family:Arial,sans-serif;line-height:1.6;color:#1f2937"><h2 style="margin:0 0 12px">Internship Offer Letter</h2><p>Dear Candidate,</p><p>{{CONTENT}}</p><p>Regards,<br>Qaulium AI Hiring Team</p></div>'
    },
    'interview-invite': {
      subject: 'Interview Invitation - Qaulium AI',
      body: '<div style="font-family:Arial,sans-serif;line-height:1.6;color:#1f2937"><h2 style="margin:0 0 12px">Interview Invitation</h2><p>Hello,</p><p>{{CONTENT}}</p><p>Regards,<br>Qaulium AI Team</p></div>'
    },
    'profile-followup': {
      subject: 'Application Follow-up - Qaulium AI',
      body: '<div style="font-family:Arial,sans-serif;line-height:1.6;color:#1f2937"><h2 style="margin:0 0 12px">Application Follow-up</h2><p>Hello,</p><p>{{CONTENT}}</p><p>Regards,<br>Qaulium AI Team</p></div>'
    },
    'company-update': {
      subject: 'Qaulium AI - Important Update',
      body: '<div style="font-family:Arial,sans-serif;line-height:1.6;color:#1f2937"><h2 style="margin:0 0 12px">Company Update</h2><p>Hello,</p><p>{{CONTENT}}</p><p>Regards,<br>Qaulium AI Team</p></div>'
    },
    'blank': {
      subject: 'Qaulium AI Communication',
      body: '<div style="font-family:Arial,sans-serif;line-height:1.6;color:#1f2937"><h2 style="margin:0 0 12px">Message from Qaulium AI</h2><p>Hello,</p><p>{{CONTENT}}</p><p>Regards,<br>Qaulium AI Team</p></div>'
    }
  };

  const loginView = document.getElementById('loginView');
  const appView = document.getElementById('appView');
  const loginForm = document.getElementById('loginForm');
  const loginStatus = document.getElementById('loginStatus');
  const apiBaseInput = document.getElementById('apiBase');
  const adminEmailInput = document.getElementById('adminEmail');
  const adminPasswordInput = document.getElementById('adminPassword');
  const pageTitle = document.getElementById('pageTitle');

  const registrationsBody = document.getElementById('registrationsBody');
  const contactsBody = document.getElementById('contactsBody');
  const careersBody = document.getElementById('careersBody');

  const statRegistrations = document.getElementById('statRegistrations');
  const statContacts = document.getElementById('statContacts');
  const statCareers = document.getElementById('statCareers');
  const statAll = document.getElementById('statAll');

  const audience = document.getElementById('audience');
  const template = document.getElementById('template');
  const customEmailsWrap = document.getElementById('customEmailsWrap');
  const customEmails = document.getElementById('customEmails');
  const emailSubject = document.getElementById('emailSubject');
  const middleContent = document.getElementById('middleContent');
  const emailBody = document.getElementById('emailBody');
  const regenerateTemplate = document.getElementById('regenerateTemplate');
  const composerForm = document.getElementById('composerForm');
  const composerStatus = document.getElementById('composerStatus');

  function setStatus(el, message, type) {
    el.textContent = message;
    el.className = 'status ' + (type || '');
  }

  function authHeaders() {
    return {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + state.token
    };
  }

  async function request(path, options) {
    const res = await fetch(state.apiBase + path, options);
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Request failed');
    return data;
  }

  function formatDate(value) {
    if (!value) return '-';
    const d = new Date(value);
    if (isNaN(d.getTime())) return value;
    return d.toLocaleString();
  }

  function renderRows(target, rows, mapFn) {
    target.innerHTML = rows.map(mapFn).join('') || '<tr><td colspan="10">No records found.</td></tr>';
  }

  function applyTemplate() {
    const def = templates[template.value] || templates.blank;
    emailSubject.value = def.subject;
    emailBody.value = def.body.replace('{{CONTENT}}', middleContent.value || 'Write your message here.');
  }

  async function loadDashboard() {
    const [stats, registrations, contacts, careers] = await Promise.all([
      request('/api/admin/stats', { headers: authHeaders() }),
      request('/api/admin/registrations', { headers: authHeaders() }),
      request('/api/admin/contacts', { headers: authHeaders() }),
      request('/api/admin/careers', { headers: authHeaders() })
    ]);

    statRegistrations.textContent = stats.totals.registrations;
    statContacts.textContent = stats.totals.contacts;
    statCareers.textContent = stats.totals.careers;
    statAll.textContent = stats.totals.allRequests;

    renderRows(registrationsBody, registrations.data || [], function (row) {
      return '<tr>' +
        '<td>' + (row.first_name || '') + ' ' + (row.last_name || '') + '</td>' +
        '<td>' + (row.email || '-') + '</td>' +
        '<td>' + (row.phone || '-') + '</td>' +
        '<td>' + (row.company || '-') + '</td>' +
        '<td>' + (row.role || '-') + '</td>' +
        '<td>' + formatDate(row.registered_at) + '</td>' +
      '</tr>';
    });

    renderRows(contactsBody, contacts.data || [], function (row) {
      return '<tr>' +
        '<td>' + (row.name || '-') + '</td>' +
        '<td>' + (row.email || '-') + '</td>' +
        '<td>' + (row.company || '-') + '</td>' +
        '<td>' + (row.message || '-') + '</td>' +
        '<td>' + formatDate(row.sent_at) + '</td>' +
      '</tr>';
    });

    renderRows(careersBody, careers.data || [], function (row) {
      return '<tr>' +
        '<td>' + (row.first_name || '') + ' ' + (row.last_name || '') + '</td>' +
        '<td>' + (row.email || '-') + '</td>' +
        '<td>' + (row.role_applied || '-') + '</td>' +
        '<td>' + (row.university || '-') + '</td>' +
        '<td>' + (row.degree || '-') + '</td>' +
        '<td>' + (row.graduation_year || '-') + '</td>' +
        '<td>' + formatDate(row.applied_at) + '</td>' +
      '</tr>';
    });
  }

  function switchTab(tab) {
    document.querySelectorAll('.menu-item').forEach(function (item) {
      item.classList.toggle('active', item.getAttribute('data-tab') === tab);
    });
    document.querySelectorAll('.tab-panel').forEach(function (panel) {
      panel.classList.toggle('hidden', panel.id !== 'panel-' + tab);
    });
    pageTitle.textContent = tab.charAt(0).toUpperCase() + tab.slice(1);
  }

  function showApp() {
    loginView.classList.add('hidden');
    appView.classList.remove('hidden');
  }

  function showLogin() {
    appView.classList.add('hidden');
    loginView.classList.remove('hidden');
  }

  async function bootstrap() {
    apiBaseInput.value = state.apiBase;

    if (!state.token) {
      showLogin();
      applyTemplate();
      return;
    }

    try {
      await request('/api/admin/me', { headers: authHeaders() });
      showApp();
      await loadDashboard();
      applyTemplate();
    } catch (e) {
      localStorage.removeItem('qaulium_admin_token');
      state.token = '';
      showLogin();
    }
  }

  loginForm.addEventListener('submit', async function (e) {
    e.preventDefault();
    try {
      state.apiBase = apiBaseInput.value.replace(/\/$/, '');
      localStorage.setItem('qaulium_admin_api_base', state.apiBase);

      const data = await request('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: adminEmailInput.value.trim(),
          password: adminPasswordInput.value
        })
      });

      state.token = data.token;
      localStorage.setItem('qaulium_admin_token', data.token);
      setStatus(loginStatus, 'Login successful.', 'ok');
      showApp();
      await loadDashboard();
    } catch (err) {
      setStatus(loginStatus, err.message, 'err');
    }
  });

  document.getElementById('logoutBtn').addEventListener('click', function () {
    localStorage.removeItem('qaulium_admin_token');
    state.token = '';
    showLogin();
  });

  document.querySelectorAll('.menu-item').forEach(function (item) {
    item.addEventListener('click', function () {
      switchTab(item.getAttribute('data-tab'));
    });
  });

  audience.addEventListener('change', function () {
    customEmailsWrap.classList.toggle('hidden', audience.value !== 'custom');
  });

  middleContent.addEventListener('input', function () {
    const def = templates[template.value] || templates.blank;
    emailBody.value = def.body.replace('{{CONTENT}}', middleContent.value || 'Write your message here.');
  });

  template.addEventListener('change', applyTemplate);
  regenerateTemplate.addEventListener('click', applyTemplate);

  composerForm.addEventListener('submit', async function (e) {
    e.preventDefault();
    try {
      const customList = customEmails.value
        .split(',')
        .map(function (v) { return v.trim(); })
        .filter(Boolean);

      const data = await request('/api/admin/email/send', {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({
          audience: audience.value,
          subject: emailSubject.value.trim(),
          body: emailBody.value,
          customEmails: customList
        })
      });

      setStatus(composerStatus, 'Email sent to ' + data.sent + ' recipients.', 'ok');
    } catch (err) {
      setStatus(composerStatus, err.message, 'err');
    }
  });

  bootstrap();
})();
