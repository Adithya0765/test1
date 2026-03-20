/*
  ================================================================
  QAULIUM AI ADMIN PORTAL — APPLICATION LOGIC
  ================================================================
  World-class SaaS product logic: smooth interactions, state
  management, real-time feedback, and intelligent UX.
  ================================================================
*/

(function () {
  'use strict';

  // ════════════════════════════════════════════════════════════
  // STATE MANAGEMENT
  // ════════════════════════════════════════════════════════════

  const state = {
    auth: {
      isLoggedIn: false,
      user: null,
      token: localStorage.getItem('admin_token') || null,
      apiBase: localStorage.getItem('admin_api_base') || window.location.origin,
    },
    ui: {
      currentView: 'dashboard',
      sidebarOpen: window.innerWidth > 768,
      theme: localStorage.getItem('admin_theme') || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'),
    },
    data: {
      users: [],
      registrations: [],
      contacts: [],
      careers: [],
      projects: [],
      notifications: [],
      analytics: {},
    },
    session: {
      lastActivityTime: Date.now(),
      inactivityTimeout: 15 * 60 * 1000, // 15 minutes in milliseconds
      warningTimeout: 2 * 60 * 1000, // Show warning at 2 minutes before logout
      warningShown: false,
      inactivityCheckInterval: null,
    },
  };

  // ════════════════════════════════════════════════════════════
  // DOM REFERENCES
  // ════════════════════════════════════════════════════════════

  const DOM = {};

  function cacheDOMElements() {
    // Auth
    DOM.authView = document.getElementById('authView');
    DOM.authForm = document.getElementById('authForm');
    DOM.authSubmitBtn = document.getElementById('authSubmitBtn');
    DOM.authStatus = document.getElementById('authStatus');
    DOM.adminEmail = document.getElementById('adminEmail');
    DOM.adminPassword = document.getElementById('adminPassword');
    DOM.adminOtp = document.getElementById('adminOtp');
    DOM.otpGroup = document.getElementById('otpGroup');

    // App
    DOM.appView = document.getElementById('appView');
    DOM.sidebar = document.getElementById('sidebar');
    DOM.sidebarBackdrop = document.getElementById('sidebarBackdrop');
    DOM.sidebarToggle = document.querySelector('.topbar-toggle');
    DOM.sidebarClose = document.querySelector('.sidebar-close');
    DOM.viewsContainer = document.querySelector('.views-container');
    DOM.pageTitle = document.getElementById('pageTitle');
    DOM.pageSubtitle = document.getElementById('pageSubtitle');

    // Nav
    DOM.navItems = document.querySelectorAll('.nav-item');
    DOM.themeToggle = document.getElementById('themeToggle');
    DOM.logoutBtn = document.getElementById('logoutBtn');

    // User Menu
    DOM.userMenuBtn = document.querySelector('.user-btn');
    DOM.userDropdown = document.getElementById('userDropdown');

    // Dashboard
    DOM.statUsers = document.getElementById('statUsers');
    DOM.activityFeed = document.getElementById('activityFeed');

    // Tables
    DOM.usersBody = document.getElementById('usersBody');
    DOM.registrationsBody = document.getElementById('registrationsBody');
  }

  // ════════════════════════════════════════════════════════════
  // SESSION INACTIVITY MANAGEMENT
  // ════════════════════════════════════════════════════════════

  /**
   * Update last activity time - called on user interaction
   */
  function updateLastActivityTime() {
    if (state.auth.isLoggedIn) {
      state.session.lastActivityTime = Date.now();
      state.session.warningShown = false;
    }
  }

  /**
   * Show session timeout warning dialog
   */
  function showSessionWarning() {
    if (state.session.warningShown || !state.auth.isLoggedIn) return;
    
    state.session.warningShown = true;
    
    const warningHtml = `
      <div style="position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 9999;" id="sessionWarningOverlay">
        <div style="background: white; border-radius: 12px; padding: 32px; max-width: 400px; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1); color: #1f2937; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;">
          <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 16px;">
            <div style="width: 44px; height: 44px; background: #fef08a; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 24px;">⏱️</div>
            <div>
              <h3 style="margin: 0; font-size: 18px; font-weight: 600;">Session Timeout</h3>
            </div>
          </div>
          <p style="margin: 0 0 24px 0; font-size: 14px; color: #6b7280; line-height: 1.5;">
            Your session will expire in <strong>2 minutes</strong> due to inactivity. Click below to stay logged in.
          </p>
          <div style="display: flex; gap: 12px;">
            <button id="sessionExtendBtn" style="flex: 1; padding: 10px 16px; background: #2563eb; color: white; border: none; border-radius: 6px; font-weight: 500; cursor: pointer; font-size: 14px;">Stay Logged In</button>
            <button id="sessionLogoutBtn" style="flex: 1; padding: 10px 16px; background: #e5e7eb; color: #374151; border: none; border-radius: 6px; font-weight: 500; cursor: pointer; font-size: 14px;">Logout Now</button>
          </div>
        </div>
      </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', warningHtml);
    
    // Event listeners for warning buttons
    document.getElementById('sessionExtendBtn')?.addEventListener('click', () => {
      updateLastActivityTime();
      document.getElementById('sessionWarningOverlay')?.remove();
    });
    
    document.getElementById('sessionLogoutBtn')?.addEventListener('click', () => {
      document.getElementById('sessionWarningOverlay')?.remove();
      handleLogout();
    });
  }

  /**
   * Check for session inactivity and auto-logout
   */
  function checkSessionInactivity() {
    if (!state.auth.isLoggedIn) return;
    
    const now = Date.now();
    const inactiveTime = now - state.session.lastActivityTime;
    const timeUntilLogout = state.session.inactivityTimeout - inactiveTime;
    const timeUntilWarning = state.session.inactivityTimeout - state.session.warningTimeout - inactiveTime;
    
    // Show warning when 2 minutes remain
    if (timeUntilWarning <= 0 && !state.session.warningShown) {
      showSessionWarning();
    }
    
    // Auto-logout when timeout exceeded
    if (inactiveTime >= state.session.inactivityTimeout) {
      handleLogout();
      showAuthStatus('Your session has expired due to inactivity. Please log in again.', 'info');
    }
  }

  /**
   * Start session inactivity monitoring
   */
  function startSessionMonitoring() {
    // Check inactivity every 30 seconds
    state.session.inactivityCheckInterval = setInterval(checkSessionInactivity, 30 * 1000);
    
    // Reset activity time on user interaction
    ['mousedown', 'keydown', 'scroll', 'touchstart', 'click'].forEach(event => {
      document.addEventListener(event, updateLastActivityTime, true);
    });
  }

  /**
   * Stop session inactivity monitoring
   */
  function stopSessionMonitoring() {
    if (state.session.inactivityCheckInterval) {
      clearInterval(state.session.inactivityCheckInterval);
      state.session.inactivityCheckInterval = null;
    }
    
    ['mousedown', 'keydown', 'scroll', 'touchstart', 'click'].forEach(event => {
      document.removeEventListener(event, updateLastActivityTime, true);
    });
  }

  // ════════════════════════════════════════════════════════════
  // AUTHENTICATION
  // ════════════════════════════════════════════════════════════

  function showAuthView() {
    DOM.authView.classList.remove('hidden');
    DOM.appView.classList.add('hidden');
  }

  function showAppView() {
    DOM.authView.classList.add('hidden');
    DOM.appView.classList.remove('hidden');
  }

  async function handleLogin(e) {
    e.preventDefault();

    const email = DOM.adminEmail.value.trim();
    const password = DOM.adminPassword.value;

    if (!email || !password) {
      showAuthStatus('Please enter email and password', 'error');
      return;
    }

    try {
      setLoading(true);

      // Simulate login (replace with real API)
      const response = await loginUser(email, password);

      if (response.success) {
        state.auth.isLoggedIn = true;
        state.auth.user = response.user;
        state.auth.token = response.token;

        localStorage.setItem('admin_token', response.token);
        localStorage.setItem('admin_user', JSON.stringify(response.user));

        showAppView();
        updateAppUI();
        startSessionMonitoring(); // Start inactivity monitoring after login
        showAuthStatus('Welcome back!', 'success');
        await loadDashboardData();
      } else {
        showAuthStatus(response.message || 'Login failed', 'error');
      }
    } catch (err) {
      showAuthStatus('An error occurred. Please try again.', 'error');
      console.error('Login error:', err);
    } finally {
      setLoading(false);
    }
  }

  async function loginUser(email, password) {
    // Mock API call - replace with real backend
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          success: true,
          user: {
            id: '1',
            email: email,
            name: email.split('@')[0],
            role: 'Admin',
          },
          token: 'mock_token_' + Date.now(),
        });
      }, 800);
    });
  }

  function showAuthStatus(message, type) {
    DOM.authStatus.textContent = message;
    DOM.authStatus.classList.add('show', type);
    setTimeout(() => {
      DOM.authStatus.classList.remove('show', type);
    }, 4000);
  }

  function setLoading(isLoading) {
    DOM.authSubmitBtn.disabled = isLoading;
    document.getElementById('authSubmitText').classList.toggle('hidden', isLoading);
    document.getElementById('authSubmitLoader').classList.toggle('hidden', !isLoading);
  }

  // ════════════════════════════════════════════════════════════
  // NAVIGATION
  // ════════════════════════════════════════════════════════════

  function initNavigation() {
    DOM.navItems.forEach((item) => {
      item.addEventListener('click', (e) => {
        e.preventDefault();
        const viewName = item.dataset.view;
        switchView(viewName);
        item.parentElement.querySelectorAll('.nav-item').forEach((n) => {
          n.classList.remove('active');
        });
        item.classList.add('active');

        // Close sidebar on mobile
        if (window.innerWidth <= 768) {
          closeSidebar();
        }
      });
    });
  }

  function switchView(viewName) {
    // Hide all views
    document.querySelectorAll('.view').forEach((v) => {
      v.classList.remove('active');
    });

    // Show target view
    const targetView = document.getElementById(`view-${viewName}`);
    if (targetView) {
      targetView.classList.add('active');
      state.ui.currentView = viewName;
      updatePageTitle(viewName);

      // Load view-specific data
      loadViewData(viewName);
    }
  }

  function updatePageTitle(viewName) {
    const titles = {
      dashboard: {
        title: 'Dashboard',
        subtitle: 'Welcome back. Here\'s what\'s happening.',
      },
      users: {
        title: 'Users & Teams',
        subtitle: 'Manage team members and permissions',
      },
      projects: {
        title: 'Projects',
        subtitle: 'Track active projects and tasks',
      },
      notifications: {
        title: 'Notifications',
        subtitle: 'Send messages to your team and community',
      },
      analytics: {
        title: 'Analytics & Insights',
        subtitle: 'Data-driven insights and reporting',
      },
      registrations: {
        title: 'Registrations',
        subtitle: 'Intake and lead management',
      },
      contacts: {
        title: 'Contacts',
        subtitle: 'Community inquiries and feedback',
      },
      careers: {
        title: 'Career Applications',
        subtitle: 'Manage job applicants',
      },
      settings: {
        title: 'Settings & Configuration',
        subtitle: 'Organization and security settings',
      },
      reports: {
        title: 'Reports',
        subtitle: 'Generate and view custom reports',
      },
    };

    const config = titles[viewName] || { title: 'Page', subtitle: '' };
    DOM.pageTitle.textContent = config.title;
    DOM.pageSubtitle.textContent = config.subtitle;
  }

  async function loadViewData(viewName) {
    // Load data specific to the view
    switch (viewName) {
      case 'dashboard':
        await loadDashboardData();
        break;
      case 'users':
        await loadUsersData();
        break;
      case 'registrations':
        await loadRegistrationsData();
        break;
      case 'contacts':
        await loadContactsData();
        break;
      case 'careers':
        await loadCareersData();
        break;
      case 'analytics':
        await loadAnalyticsData();
        break;
    }
  }

  // ════════════════════════════════════════════════════════════
  // DATA LOADING
  // ════════════════════════════════════════════════════════════

  async function loadDashboardData() {
    try {
      // Comprehensive Mock Data
      state.data.users = [
        { id: '1', name: 'Alice Johnson', email: 'alice@qaulium.ai', role: 'Admin', status: 'Active', joined: '2024-01-15' },
        { id: '2', name: 'Bob Smith', email: 'bob@qaulium.ai', role: 'Manager', status: 'Active', joined: '2024-02-20' },
        { id: '3', name: 'Carol Davis', email: 'carol@qaulium.ai', role: 'Developer', status: 'Active', joined: '2024-03-10' },
        { id: '4', name: 'David Wilson', email: 'david@qaulium.ai', role: 'Designer', status: 'Inactive', joined: '2024-01-08' },
        { id: '5', name: 'Eve Martinez', email: 'eve@qaulium.ai', role: 'Developer', status: 'Active', joined: '2024-02-14' },
      ];

      state.data.registrations = [
        { id: '101', name: 'John Doe', email: 'john@example.com', status: 'Pending', date: '2024-03-18', phone: '+1-555-0101' },
        { id: '102', name: 'Jane Smith', email: 'jane@example.com', status: 'Approved', date: '2024-03-17', phone: '+1-555-0102' },
        { id: '103', name: 'Mike Johnson', email: 'mike@example.com', status: 'Pending', date: '2024-03-16', phone: '+1-555-0103' },
        { id: '104', name: 'Sarah Lee', email: 'sarah@example.com', status: 'Approved', date: '2024-03-15', phone: '+1-555-0104' },
      ];

      state.data.projects = [
        { id: '1', name: 'AI Integration', status: 'In Progress', completion: 65, team: 4, dueDate: '2024-04-15' },
        { id: '2', name: 'Mobile App', status: 'Planning', completion: 20, team: 3, dueDate: '2024-05-01' },
        { id: '3', name: 'Analytics Platform', status: 'Completed', completion: 100, team: 5, dueDate: '2024-03-10' },
      ];

      state.data.notifications = [
        { id: '1', type: 'info', title: 'New registration received', time: '2 hours ago' },
        { id: '2', type: 'success', title: 'Project milestone completed', time: '4 hours ago' },
        { id: '3', type: 'warning', title: 'Upcoming maintenance window', time: '1 day ago' },
      ];

      state.data.contacts = [
        { id: '201', name: 'Thomas Brown', email: 'thomas@contact.com', subject: 'Partnership Inquiry', date: '2024-03-18', status: 'New' },
        { id: '202', name: 'Lisa Anderson', email: 'lisa@contact.com', subject: 'Support Request', date: '2024-03-17', status: 'In Progress' },
        { id: '203', name: 'Robert Taylor', email: 'robert@contact.com', subject: 'Feature Request', date: '2024-03-16', status: 'Resolved' },
      ];

      state.data.careers = [
        { id: '301', name: 'Jennifer White', position: 'Senior Engineer', applied: '2024-03-18', status: 'Under Review' },
        { id: '302', name: 'Mark Harris', position: 'Product Manager', applied: '2024-03-16', status: 'Interview Scheduled' },
        { id: '303', name: 'Patricia Clark', position: 'UX Designer', applied: '2024-03-15', status: 'Interview Scheduled' },
      ];

      state.data.analytics = {
        totalUsers: state.data.users.length,
        activeUsers: state.data.users.filter(u => u.status === 'Active').length,
        totalRegistrations: state.data.registrations.length,
        pendingRegistrations: state.data.registrations.filter(r => r.status === 'Pending').length,
        activeProjects: state.data.projects.filter(p => p.status === 'In Progress').length,
        completedProjects: state.data.projects.filter(p => p.status === 'Completed').length,
      };

      updateDashboardUI();
    } catch (err) {
      console.error('Failed to load dashboard:', err);
    }
  }

  async function loadUsersData() {
    try {
      // Ensure data is loaded
      await loadDashboardData();
      renderUsersTable();
    } catch (err) {
      console.error('Failed to load users:', err);
    }
  }

  async function loadRegistrationsData() {
    try {
      // Ensure data is loaded
      await loadDashboardData();
      renderRegistrationsTable();
    } catch (err) {
      console.error('Failed to load registrations:', err);
    }
  }

  async function loadContactsData() {
    try {
      // Ensure data is loaded
      await loadDashboardData();
      renderContactsTable();
    } catch (err) {
      console.error('Failed to load contacts:', err);
    }
  }

  async function loadCareersData() {
    try {
      // Ensure data is loaded
      await loadDashboardData();
      renderCareersTable();
    } catch (err) {
      console.error('Failed to load careers:', err);
    }
  }

  async function loadAnalyticsData() {
    try {
      // Ensure data is loaded
      await loadDashboardData();
      renderAnalyticsContent();
    } catch (err) {
      console.error('Failed to load analytics:', err);
    }
  }

  function updateDashboardUI() {
    // Update hero stats
    DOM.statUsers.textContent = state.data.users.length;

    // Update activity feed
    renderActivityFeed();
  }

  function renderActivityFeed() {
    const activities = [
      {
        icon: '👤',
        title: 'New user registered',
        time: '2 hours ago',
      },
      {
        icon: '📝',
        title: 'Form submission received',
        time: '4 hours ago',
      },
      {
        icon: '✅',
        title: 'Project milestone completed',
        time: '1 day ago',
      },
    ];

    DOM.activityFeed.innerHTML = activities
      .map(
        (a) => `
      <div class="activity-item">
        <div class="activity-icon">${a.icon}</div>
        <div class="activity-content">
          <p>${a.title}</p>
          <span class="activity-time">${a.time}</span>
        </div>
      </div>
    `
      )
      .join('');
  }

  function renderUsersTable() {
    const html = state.data.users
      .map(
        (u) => `
      <tr>
        <td>${u.name}</td>
        <td>${u.email}</td>
        <td>${u.role}</td>
        <td>
          <span class="status-badge status-${u.status.toLowerCase()}">${u.status}</span>
        </td>
        <td>${new Date(u.joined).toLocaleDateString()}</td>
        <td>
          <div class="row-actions">
            <button class="icon-btn small" title="Edit">✎</button>
            <button class="icon-btn small" title="Delete">🗑</button>
          </div>
        </td>
      </tr>
    `
      )
      .join('');

    DOM.usersBody.innerHTML = html || '<tr class="empty-row"><td colspan="6">No users</td></tr>';
  }

  function renderRegistrationsTable() {
    const html = state.data.registrations
      .map(
        (r) => `
      <tr>
        <td>${r.name || '—'}</td>
        <td>${r.email || '—'}</td>
        <td>${r.phone || '—'}</td>
        <td>${r.date || '—'}</td>
        <td><span class="status-badge status-${(r.status || '').toLowerCase()}">${r.status || '—'}</span></td>
        <td>
          <div class="row-actions">
            <button class="icon-btn small" title="View">👁</button>
            <button class="icon-btn small" title="Approve">✓</button>
          </div>
        </td>
      </tr>
    `
      )
      .join('');

    DOM.registrationsBody.innerHTML = html || '<tr class="empty-row"><td colspan="6">No registrations</td></tr>';
  }

  function renderContactsTable() {
    const html = state.data.contacts
      .map(
        (c) => `
      <tr>
        <td>${c.name || '—'}</td>
        <td>${c.email || '—'}</td>
        <td>${c.subject || '—'}</td>
        <td>${c.date || '—'}</td>
        <td><span class="status-badge status-${(c.status || '').toLowerCase()}">${c.status || '—'}</span></td>
        <td>
          <div class="row-actions">
            <button class="icon-btn small" title="View">👁</button>
            <button class="icon-btn small" title="Reply">✉</button>
          </div>
        </td>
      </tr>
    `
      )
      .join('');

    const contactsBody = document.getElementById('contactsBody');
    if (contactsBody) {
      contactsBody.innerHTML = html || '<tr class="empty-row"><td colspan="6">No contacts</td></tr>';
    }
  }

  function renderCareersTable() {
    const html = state.data.careers
      .map(
        (c) => `
      <tr>
        <td>${c.name || '—'}</td>
        <td>${c.position || '—'}</td>
        <td>${c.applied || '—'}</td>
        <td><span class="status-badge status-${(c.status || '').toLowerCase().replace(/\s+/g, '-')}">${c.status || '—'}</span></td>
        <td>
          <div class="row-actions">
            <button class="icon-btn small" title="View">👁</button>
            <button class="icon-btn small" title="Interview">📞</button>
          </div>
        </td>
      </tr>
    `
      )
      .join('');

    const careersBody = document.getElementById('careersBody');
    if (careersBody) {
      careersBody.innerHTML = html || '<tr class="empty-row"><td colspan="5">No applications</td></tr>';
    }
  }

  function renderAnalyticsContent() {
    const analId = document.getElementById('analyticsContent');
    if (analId) {
      analId.innerHTML = `
        <div class="analytics-grid">
          <div class="stat-card">
            <div class="stat-label">Total Users</div>
            <div class="stat-value">${state.data.analytics.totalUsers || 0}</div>
            <div class="stat-change">↑ ${state.data.analytics.activeUsers || 0} active</div>
          </div>
          <div class="stat-card">
            <div class="stat-label">Total Registrations</div>
            <div class="stat-value">${state.data.analytics.totalRegistrations || 0}</div>
            <div class="stat-change">⏳ ${state.data.analytics.pendingRegistrations || 0} pending</div>
          </div>
          <div class="stat-card">
            <div class="stat-label">Active Projects</div>
            <div class="stat-value">${state.data.analytics.activeProjects || 0}</div>
            <div class="stat-change">✅ ${state.data.analytics.completedProjects || 0} completed</div>
          </div>
        </div>
      `;
    }
  }

  // ════════════════════════════════════════════════════════════
  // UI INTERACTIONS
  // ════════════════════════════════════════════════════════════

  function initSidebar() {
    DOM.sidebarToggle?.addEventListener('click', toggleSidebar);
    DOM.sidebarClose?.addEventListener('click', closeSidebar);
    DOM.sidebarBackdrop?.addEventListener('click', closeSidebar);
  }

  function toggleSidebar() {
    state.ui.sidebarOpen = !state.ui.sidebarOpen;
    DOM.sidebar.classList.toggle('active', state.ui.sidebarOpen);
    DOM.sidebarBackdrop.classList.toggle('show', state.ui.sidebarOpen);
  }

  function closeSidebar() {
    state.ui.sidebarOpen = false;
    DOM.sidebar.classList.remove('active');
    DOM.sidebarBackdrop.classList.remove('show');
  }

  function initThemeToggle() {
    DOM.themeToggle?.addEventListener('click', () => {
      const currentTheme = document.documentElement.getAttribute('data-theme');
      const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
      setTheme(newTheme);
    });
  }

  function setTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('admin_theme', theme);
    state.ui.theme = theme;
  }

  function initUserMenu() {
    DOM.userMenuBtn?.addEventListener('click', () => {
      DOM.userDropdown.classList.toggle('show');
    });

    document.addEventListener('click', (e) => {
      if (!DOM.userMenuBtn?.contains(e.target) && !DOM.userDropdown?.contains(e.target)) {
        DOM.userDropdown?.classList.remove('show');
      }
    });
  }

  function updateAppUI() {
    if (state.auth.user) {
      const userInitials = state.auth.user.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase();
      document.getElementById('userInitials').textContent = userInitials;
      document.getElementById('userEmail').textContent = state.auth.user.email;
    }
  }

  function handleLogout() {
    stopSessionMonitoring(); // Stop inactivity monitoring before logout
    state.auth.isLoggedIn = false;
    state.auth.user = null;
    state.auth.token = null;
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_user');
    showAuthView();
    // Reset form
    DOM.authForm.reset();
  }

  // ════════════════════════════════════════════════════════════
  // INITIALIZATION
  // ════════════════════════════════════════════════════════════

  function init() {
    cacheDOMElements();
    initThemeToggle();
    setTheme(state.ui.theme);

    // Check if already logged in
    if (state.auth.token && localStorage.getItem('admin_user')) {
      try {
        state.auth.user = JSON.parse(localStorage.getItem('admin_user'));
        state.auth.isLoggedIn = true;
        showAppView();
        updateAppUI();
        startSessionMonitoring(); // Start inactivity monitoring for persistent login
        loadDashboardData();
      } catch (e) {
        showAuthView();
      }
    } else {
      showAuthView();
    }

    // Auth events
    DOM.authForm?.addEventListener('submit', handleLogin);

    // Navigation events
    initNavigation();
    initSidebar();
    initUserMenu();

    // Logout events
    DOM.logoutBtn?.addEventListener('click', handleLogout);
    document.getElementById('logoutBtn2')?.addEventListener('click', handleLogout);

    // Set initial active nav item
    document.querySelector('[data-view="dashboard"]')?.classList.add('active');

    // Quick action buttons
    document.querySelectorAll('.action-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const view = btn.dataset.view;
        const navItem = document.querySelector(`[data-view="${view}"]`);
        navItem?.click();
      });
    });
  }

  // Start when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
