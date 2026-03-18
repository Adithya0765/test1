(function () {
  'use strict';

  const PAGE_SIZE = 10;

  function defaultApiBase() {
    const host = (window.location.hostname || '').toLowerCase();
    const port = String(window.location.port || '');
    const isLocalDev5501 = (host === 'localhost' || host === '127.0.0.1' || host === '::1') && port === '5501';

    const saved = localStorage.getItem('qaulium_admin_api_base');
    // If a saved value exists but points to the static server itself (same origin),
    // discard it when we know the real API is on :3001.
    if (saved && isLocalDev5501 && (saved === 'http://127.0.0.1:5501' || saved === 'http://localhost:5501')) {
      localStorage.removeItem('qaulium_admin_api_base');
    } else if (saved) {
      return saved;
    }

    if (isLocalDev5501) {
      return 'http://127.0.0.1:3001';
    }

    return window.location.origin;
  }

  const state = {
    apiBase: defaultApiBase(),
    token: localStorage.getItem('qaulium_admin_token') || '',
    loginOtpRequestId: '',
    currentAdmin: {
      email: '',
      role: 'admin'
    },
    realtimeSocket: null,
    realtimeReconnectTimer: null,
    enterpriseServerReady: false,
    enterpriseSyncTimer: null,
    enterpriseSyncInFlight: false,
    dashboard: {
      generatedAt: '',
      monitoring: {
        apiP95LatencyMs: 0,
        apiErrorRatePercent: 0,
        queueDepth: 0,
        openIncidents: 0,
        uptimeSeconds: 0,
        startedAt: ''
      },
      summary: {
        leadSources: [],
        latestActivityAt: '',
        activeEmployees: 0,
        openTasks: 0,
        queuedNotifications: 0,
        openIncidents: 0,
        formsCount: 0
      },
      forms: []
    },
    tables: {
      registrations: { rows: [], page: 1 },
      contacts: { rows: [], page: 1 },
      careers: { rows: [], page: 1 }
    },
    enterprise: {
      users: [],
      roles: [],
      apiKeys: [],
      security: {
        mfaRequired: true,
        ssoRequired: false,
        sessionLock: true,
        piiMasking: true,
        ipAllowlist: false,
        immutableAudit: true
      },
      notifications: [],
      monitoringIncidents: [],
      billingPlans: [],
      auditLogs: [],
      departments: [],
      employees: [],
      projects: [],
      tasks: [],
      settings: {
        locale: 'en',
        country: 'all',
        realtimeEnabled: true
      }
    }
  };

  const templates = {
    'registration-welcome': {
      subject: 'Welcome to Qaulium AI — Registration Confirmed',
      body: `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><title>Welcome to Qaulium AI</title></head>
<body style="margin:0;padding:0;background-color:#f5f5f5;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f5f5f5;padding:40px 0;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%;">
<tr><td style="background-color:#0A0A0A;padding:28px 40px;border-radius:12px 12px 0 0;">
<table width="100%" cellpadding="0" cellspacing="0" border="0"><tr>
<td><img src="cid:qualium-logo" alt="Qaulium AI" height="36" style="display:block;height:36px;width:auto;border:0;"></td>
<td align="right" style="font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;font-size:12px;color:#888888;letter-spacing:0.05em;text-transform:uppercase;">Registration Confirmed</td>
</tr></table>
</td></tr>
<tr><td style="background-color:#ffffff;padding:48px 40px;">
<h1 style="margin:0 0 8px;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;font-size:26px;font-weight:700;color:#0A0A0A;letter-spacing:-0.03em;line-height:1.2;">Welcome.</h1>
<p style="margin:0 0 28px;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;font-size:15px;color:#6B7280;line-height:1.65;">Your registration has been confirmed.</p>
<hr style="border:none;border-top:1px solid #E5E7EB;margin:0 0 28px;">
<p style="margin:0 0 20px;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;font-size:15px;color:#374151;line-height:1.7;">Thank you for registering with Qaulium AI. {{CONTENT}}</p>
<p style="margin:0 0 16px;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;font-size:14px;color:#374151;line-height:1.6;">If you have questions, reply to this email or reach us at <a href="mailto:admin@qauliumai.in" style="color:#2563EB;text-decoration:none;font-weight:500;">admin@qauliumai.in</a> or visit <a href="https://qauliumai.in" style="color:#2563EB;text-decoration:none;font-weight:500;">qauliumai.in</a>.</p>
<table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:8px 0 0;"><tr><td align="left" style="padding-top:8px;">
<a href="https://discord.gg/gUnhDhh2" style="display:inline-block;margin-right:12px;text-decoration:none;" target="_blank"><img src="https://cdn.jsdelivr.net/gh/simple-icons/simple-icons/icons/discord.svg" width="20" height="20" alt="Discord" style="vertical-align:middle;filter:invert(0);"></a>
<a href="https://www.linkedin.com/company/qalium-ai" style="display:inline-block;margin-right:12px;text-decoration:none;" target="_blank"><img src="https://cdn.jsdelivr.net/gh/simple-icons/simple-icons/icons/linkedin.svg" width="20" height="20" alt="LinkedIn" style="vertical-align:middle;filter:invert(0);"></a>
<a href="https://qauliumai.in" style="display:inline-block;text-decoration:none;" target="_blank"><img src="https://img.icons8.com/material-rounded/48/000000/globe--v1.png" width="20" height="20" alt="Website" style="vertical-align:middle;"></a>
</td></tr></table>
</td></tr>
<tr><td style="background-color:#0A0A0A;padding:24px 40px;border-radius:0 0 12px 12px;">
<table width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td style="font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;font-size:12px;color:#888888;line-height:1.5;">&copy; 2026 Qaulium AI. All rights reserved.<br>Amaravati, Andhra Pradesh, India</td></tr></table>
</td></tr>
</table></td></tr>
</table>
</body></html>`
    },
    'interview-invitation': {
      subject: 'Interview Invitation - Qaulium AI',
      body: `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><title>Interview Invitation</title></head>
<body style="margin:0;padding:0;background-color:#f5f5f5;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f5f5f5;padding:40px 0;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%;">
<tr><td style="background-color:#0A0A0A;padding:28px 40px;border-radius:12px 12px 0 0;">
<table width="100%" cellpadding="0" cellspacing="0" border="0"><tr>
<td><img src="cid:qualium-logo" alt="Qaulium AI" height="36" style="display:block;height:36px;width:auto;border:0;"></td>
<td align="right" style="font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;font-size:12px;color:#888888;letter-spacing:0.05em;text-transform:uppercase;">Interview Invitation</td>
</tr></table>
</td></tr>
<tr><td style="background-color:#ffffff;padding:48px 40px;">
<h1 style="margin:0 0 8px;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;font-size:26px;font-weight:700;color:#0A0A0A;letter-spacing:-0.03em;line-height:1.2;">Interview Invitation</h1>
<p style="margin:0 0 28px;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;font-size:15px;color:#6B7280;line-height:1.65;">We would like to invite you for an interview.</p>
<hr style="border:none;border-top:1px solid #E5E7EB;margin:0 0 28px;">
<p style="margin:0 0 20px;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;font-size:15px;color:#374151;line-height:1.7;">{{CONTENT}}</p>
<p style="margin:0 0 20px;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;font-size:15px;color:#374151;line-height:1.7;">We look forward to speaking with you soon.</p>
<p style="margin:0 0 16px;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;font-size:14px;color:#374151;line-height:1.6;">Questions? Reach us at <a href="mailto:admin@qauliumai.in" style="color:#2563EB;text-decoration:none;font-weight:500;">admin@qauliumai.in</a> or visit <a href="https://qauliumai.in" style="color:#2563EB;text-decoration:none;font-weight:500;">qauliumai.in</a>.</p>
<table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:8px 0 0;"><tr><td align="left" style="padding-top:8px;">
<a href="https://discord.gg/gUnhDhh2" style="display:inline-block;margin-right:12px;text-decoration:none;" target="_blank"><img src="https://cdn.jsdelivr.net/gh/simple-icons/simple-icons/icons/discord.svg" width="20" height="20" alt="Discord" style="vertical-align:middle;filter:invert(0);"></a>
<a href="https://www.linkedin.com/company/qalium-ai" style="display:inline-block;margin-right:12px;text-decoration:none;" target="_blank"><img src="https://cdn.jsdelivr.net/gh/simple-icons/simple-icons/icons/linkedin.svg" width="20" height="20" alt="LinkedIn" style="vertical-align:middle;filter:invert(0);"></a>
<a href="https://qauliumai.in" style="display:inline-block;text-decoration:none;" target="_blank"><img src="https://img.icons8.com/material-rounded/48/000000/globe--v1.png" width="20" height="20" alt="Website" style="vertical-align:middle;"></a>
</td></tr></table>
</td></tr>
<tr><td style="background-color:#0A0A0A;padding:24px 40px;border-radius:0 0 12px 12px;">
<table width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td style="font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;font-size:12px;color:#888888;line-height:1.5;">&copy; 2026 Qaulium AI. All rights reserved.<br>Amaravati, Andhra Pradesh, India</td></tr></table>
</td></tr>
</table></td></tr>
</table>
</body></html>`
    },
    'career-confirmation': {
      subject: 'Application Received - Qaulium AI Careers',
      body: `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><title>Application Received</title></head>
<body style="margin:0;padding:0;background-color:#f5f5f5;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f5f5f5;padding:40px 0;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%;">
<tr><td style="background-color:#0A0A0A;padding:28px 40px;border-radius:12px 12px 0 0;">
<table width="100%" cellpadding="0" cellspacing="0" border="0"><tr>
<td><img src="cid:qualium-logo" alt="Qaulium AI" height="36" style="display:block;height:36px;width:auto;border:0;"></td>
<td align="right" style="font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;font-size:12px;color:#888888;letter-spacing:0.05em;text-transform:uppercase;">Application Received</td>
</tr></table>
</td></tr>
<tr><td style="background-color:#ffffff;padding:48px 40px;">
<h1 style="margin:0 0 8px;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;font-size:26px;font-weight:700;color:#0A0A0A;letter-spacing:-0.03em;line-height:1.2;">Thank You</h1>
<p style="margin:0 0 28px;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;font-size:15px;color:#6B7280;line-height:1.65;">We have received your application.</p>
<hr style="border:none;border-top:1px solid #E5E7EB;margin:0 0 28px;">
<p style="margin:0 0 20px;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;font-size:15px;color:#374151;line-height:1.7;">Our hiring team is reviewing your profile and will get back to you shortly with the next steps. {{CONTENT}}</p>
<p style="margin:0 0 16px;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;font-size:14px;color:#374151;line-height:1.6;">For questions, contact us at <a href="mailto:admin@qauliumai.in" style="color:#2563EB;text-decoration:none;font-weight:500;">admin@qauliumai.in</a> or visit <a href="https://qauliumai.in" style="color:#2563EB;text-decoration:none;font-weight:500;">qauliumai.in</a>.</p>
<table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:8px 0 0;"><tr><td align="left" style="padding-top:8px;">
<a href="https://discord.gg/gUnhDhh2" style="display:inline-block;margin-right:12px;text-decoration:none;" target="_blank"><img src="https://cdn.jsdelivr.net/gh/simple-icons/simple-icons/icons/discord.svg" width="20" height="20" alt="Discord" style="vertical-align:middle;filter:invert(0);"></a>
<a href="https://www.linkedin.com/company/qalium-ai" style="display:inline-block;margin-right:12px;text-decoration:none;" target="_blank"><img src="https://cdn.jsdelivr.net/gh/simple-icons/simple-icons/icons/linkedin.svg" width="20" height="20" alt="LinkedIn" style="vertical-align:middle;filter:invert(0);"></a>
<a href="https://qauliumai.in" style="display:inline-block;text-decoration:none;" target="_blank"><img src="https://img.icons8.com/material-rounded/48/000000/globe--v1.png" width="20" height="20" alt="Website" style="vertical-align:middle;"></a>
</td></tr></table>
</td></tr>
<tr><td style="background-color:#0A0A0A;padding:24px 40px;border-radius:0 0 12px 12px;">
<table width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td style="font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;font-size:12px;color:#888888;line-height:1.5;">&copy; 2026 Qaulium AI. All rights reserved.<br>Amaravati, Andhra Pradesh, India</td></tr></table>
</td></tr>
</table></td></tr>
</table>
</body></html>`
    },
    'contact-response': {
      subject: 'Response from Qaulium AI',
      body: `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><title>Response from Qaulium AI</title></head>
<body style="margin:0;padding:0;background-color:#f5f5f5;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f5f5f5;padding:40px 0;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%;">
<tr><td style="background-color:#0A0A0A;padding:28px 40px;border-radius:12px 12px 0 0;">
<table width="100%" cellpadding="0" cellspacing="0" border="0"><tr>
<td><img src="cid:qualium-logo" alt="Qaulium AI" height="36" style="display:block;height:36px;width:auto;border:0;"></td>
<td align="right" style="font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;font-size:12px;color:#888888;letter-spacing:0.05em;text-transform:uppercase;">Response</td>
</tr></table>
</td></tr>
<tr><td style="background-color:#ffffff;padding:48px 40px;">
<h1 style="margin:0 0 8px;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;font-size:26px;font-weight:700;color:#0A0A0A;letter-spacing:-0.03em;line-height:1.2;">Thank You for Reaching Out</h1>
<p style="margin:0 0 28px;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;font-size:15px;color:#6B7280;line-height:1.65;">We appreciate your inquiry.</p>
<hr style="border:none;border-top:1px solid #E5E7EB;margin:0 0 28px;">
<p style="margin:0 0 20px;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;font-size:15px;color:#374151;line-height:1.7;">{{CONTENT}}</p>
<p style="margin:0 0 16px;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;font-size:14px;color:#374151;line-height:1.6;">Best regards,<br>Qaulium AI Team<br><a href="mailto:admin@qauliumai.in" style="color:#2563EB;text-decoration:none;font-weight:500;">admin@qauliumai.in</a></p>
<table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:8px 0 0;"><tr><td align="left" style="padding-top:8px;">
<a href="https://discord.gg/gUnhDhh2" style="display:inline-block;margin-right:12px;text-decoration:none;" target="_blank"><img src="https://cdn.jsdelivr.net/gh/simple-icons/simple-icons/icons/discord.svg" width="20" height="20" alt="Discord" style="vertical-align:middle;filter:invert(0);"></a>
<a href="https://www.linkedin.com/company/qalium-ai" style="display:inline-block;margin-right:12px;text-decoration:none;" target="_blank"><img src="https://cdn.jsdelivr.net/gh/simple-icons/simple-icons/icons/linkedin.svg" width="20" height="20" alt="LinkedIn" style="vertical-align:middle;filter:invert(0);"></a>
<a href="https://qauliumai.in" style="display:inline-block;text-decoration:none;" target="_blank"><img src="https://img.icons8.com/material-rounded/48/000000/globe--v1.png" width="20" height="20" alt="Website" style="vertical-align:middle;"></a>
</td></tr></table>
</td></tr>
<tr><td style="background-color:#0A0A0A;padding:24px 40px;border-radius:0 0 12px 12px;">
<table width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td style="font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;font-size:12px;color:#888888;line-height:1.5;">&copy; 2026 Qaulium AI. All rights reserved.<br>Amaravati, Andhra Pradesh, India</td></tr></table>
</td></tr>
</table></td></tr>
</table>
</body></html>`
    },
    'company-announcement': {
      subject: 'News from Qaulium AI',
      body: `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><title>News from Qaulium AI</title></head>
<body style="margin:0;padding:0;background-color:#f5f5f5;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f5f5f5;padding:40px 0;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%;">
<tr><td style="background-color:#0A0A0A;padding:28px 40px;border-radius:12px 12px 0 0;">
<table width="100%" cellpadding="0" cellspacing="0" border="0"><tr>
<td><img src="cid:qualium-logo" alt="Qaulium AI" height="36" style="display:block;height:36px;width:auto;border:0;"></td>
<td align="right" style="font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;font-size:12px;color:#888888;letter-spacing:0.05em;text-transform:uppercase;">Announcement</td>
</tr></table>
</td></tr>
<tr><td style="background-color:#ffffff;padding:48px 40px;">
<h1 style="margin:0 0 8px;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;font-size:26px;font-weight:700;color:#0A0A0A;letter-spacing:-0.03em;line-height:1.2;">Important Announcement</h1>
<p style="margin:0 0 28px;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;font-size:15px;color:#6B7280;line-height:1.65;">We have exciting news to share.</p>
<hr style="border:none;border-top:1px solid #E5E7EB;margin:0 0 28px;">
<p style="margin:0 0 20px;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;font-size:15px;color:#374151;line-height:1.7;">{{CONTENT}}</p>
<p style="margin:0 0 16px;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;font-size:14px;color:#374151;line-height:1.6;">Learn more at <a href="https://qauliumai.in" style="color:#2563EB;text-decoration:none;font-weight:500;">qauliumai.in</a></p>
<table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:8px 0 0;"><tr><td align="left" style="padding-top:8px;">
<a href="https://discord.gg/gUnhDhh2" style="display:inline-block;margin-right:12px;text-decoration:none;" target="_blank"><img src="https://cdn.jsdelivr.net/gh/simple-icons/simple-icons/icons/discord.svg" width="20" height="20" alt="Discord" style="vertical-align:middle;filter:invert(0);"></a>
<a href="https://www.linkedin.com/company/qalium-ai" style="display:inline-block;margin-right:12px;text-decoration:none;" target="_blank"><img src="https://cdn.jsdelivr.net/gh/simple-icons/simple-icons/icons/linkedin.svg" width="20" height="20" alt="LinkedIn" style="vertical-align:middle;filter:invert(0);"></a>
<a href="https://qauliumai.in" style="display:inline-block;text-decoration:none;" target="_blank"><img src="https://img.icons8.com/material-rounded/48/000000/globe--v1.png" width="20" height="20" alt="Website" style="vertical-align:middle;"></a>
</td></tr></table>
</td></tr>
<tr><td style="background-color:#0A0A0A;padding:24px 40px;border-radius:0 0 12px 12px;">
<table width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td style="font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;font-size:12px;color:#888888;line-height:1.5;">&copy; 2026 Qaulium AI. All rights reserved.<br>Amaravati, Andhra Pradesh, India</td></tr></table>
</td></tr>
</table></td></tr>
</table>
</body></html>`
    },
    'blank': {
      subject: 'Message from Qaulium AI',
      body: `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><title>Message from Qaulium AI</title></head>
<body style="margin:0;padding:0;background-color:#f5f5f5;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f5f5f5;padding:40px 0;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%;">
<tr><td style="background-color:#0A0A0A;padding:28px 40px;border-radius:12px 12px 0 0;">
<table width="100%" cellpadding="0" cellspacing="0" border="0"><tr>
<td><img src="cid:qualium-logo" alt="Qaulium AI" height="36" style="display:block;height:36px;width:auto;border:0;"></td>
</tr></table>
</td></tr>
<tr><td style="background-color:#ffffff;padding:48px 40px;">
<p style="margin:0 0 20px;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;font-size:15px;color:#374151;line-height:1.7;">{{CONTENT}}</p>
<p style="margin:0 0 16px;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;font-size:14px;color:#374151;line-height:1.6;">Best regards,<br>Qaulium AI Team<br><a href="mailto:admin@qauliumai.in" style="color:#2563EB;text-decoration:none;font-weight:500;">admin@qauliumai.in</a></p>
<table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:8px 0 0;"><tr><td align="left" style="padding-top:8px;">
<a href="https://discord.gg/gUnhDhh2" style="display:inline-block;margin-right:12px;text-decoration:none;" target="_blank"><img src="https://cdn.jsdelivr.net/gh/simple-icons/simple-icons/icons/discord.svg" width="20" height="20" alt="Discord" style="vertical-align:middle;filter:invert(0);"></a>
<a href="https://www.linkedin.com/company/qalium-ai" style="display:inline-block;margin-right:12px;text-decoration:none;" target="_blank"><img src="https://cdn.jsdelivr.net/gh/simple-icons/simple-icons/icons/linkedin.svg" width="20" height="20" alt="LinkedIn" style="vertical-align:middle;filter:invert(0);"></a>
<a href="https://qauliumai.in" style="display:inline-block;text-decoration:none;" target="_blank"><img src="https://img.icons8.com/material-rounded/48/000000/globe--v1.png" width="20" height="20" alt="Website" style="vertical-align:middle;"></a>
</td></tr></table>
</td></tr>
<tr><td style="background-color:#0A0A0A;padding:24px 40px;border-radius:0 0 12px 12px;">
<table width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td style="font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;font-size:12px;color:#888888;line-height:1.5;">&copy; 2026 Qaulium AI. All rights reserved.<br>Amaravati, Andhra Pradesh, India</td></tr></table>
</td></tr>
</table></td></tr>
</table>
</body></html>`
    },
    'intern-confirmation': {
      subject: 'Internship Confirmation - Qaulium AI',
      body: `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><title>Internship Confirmation</title></head><body style="margin:0;padding:0;background-color:#f5f5f5;font-family:Arial,sans-serif;"><table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 0;"><tr><td align="center"><table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;background:#fff;border-radius:12px;overflow:hidden;"><tr><td style="background:#0A0A0A;padding:24px 32px;"><img src="https://qauliumai.in/logo-white.png" alt="Qaulium AI" height="32"></td></tr><tr><td style="padding:32px;"><h2 style="margin:0 0 12px;color:#111;">Internship Confirmation</h2><p style="margin:0;color:#374151;line-height:1.7;">{{CONTENT}}</p></td></tr></table></td></tr></table></body></html>`
    }
  };

  const internRoleMessages = {
    'AI Intern': 'Congratulations. You have been selected as an AI Intern. Please keep your Python and ML projects ready for onboarding.',
    'Frontend Intern': 'Congratulations. You have been selected as a Frontend Intern. Please keep your React/UI projects ready for onboarding.',
    'Backend Intern': 'Congratulations. You have been selected as a Backend Intern. Please keep your API and database projects ready for onboarding.',
    'UI/UX Intern': 'Congratulations. You have been selected as a UI/UX Intern. Please keep your design case studies ready for onboarding.',
    'Testing Intern': 'Congratulations. You have been selected as a Testing Intern. Please keep your QA/automation experience notes ready for onboarding.',
    'Marketing Intern': 'Congratulations. You have been selected as a Marketing Intern. Please keep your campaign/content samples ready for onboarding.',
    'Research Intern': 'Congratulations. You have been selected as a Research Intern. Please keep your research/technical portfolio ready for onboarding.'
  };

  const ROLE_PERMISSIONS = {
    super_admin: ['*'],
    admin: [
      'users.manage',
      'roles.manage',
      'api_keys.manage',
      'security.manage',
      'notifications.manage',
      'organization.manage',
      'projects.manage',
      'tasks.manage',
      'settings.manage',
      'audit.view'
    ],
    org_admin: [
      'users.manage',
      'notifications.manage',
      'organization.manage',
      'projects.manage',
      'tasks.manage',
      'audit.view'
    ],
    analyst: ['analytics.view', 'audit.view'],
    support_agent: ['users.manage', 'notifications.manage'],
    auditor: ['audit.view']
  };

  function normalizeRole(role) {
    return String(role || 'admin').trim().toLowerCase().replace(/\s+/g, '_');
  }

  function getActivePermissions() {
    const key = normalizeRole(state.currentAdmin && state.currentAdmin.role);
    return ROLE_PERMISSIONS[key] || ROLE_PERMISSIONS.admin;
  }

  function can(permission) {
    const perms = getActivePermissions();
    return perms.includes('*') || perms.includes(permission);
  }

  function guardAction(permission, failMessage) {
    if (can(permission)) return true;
    setStatus(composerStatus, failMessage || 'You do not have permission to perform this action.', 'err');
    addAuditLog('permission.denied', 'rbac', 'Denied action: ' + permission, 'high');
    return false;
  }

  const loginView = document.getElementById('loginView');
  const appView = document.getElementById('appView');
  const loginForm = document.getElementById('loginForm');
  const loginStatus = document.getElementById('loginStatus');
  const apiBaseInput = document.getElementById('apiBase');
  const adminEmailInput = document.getElementById('adminEmail');
  const adminPasswordInput = document.getElementById('adminPassword');
  const adminOtpWrap = document.getElementById('adminOtpWrap');
  const adminOtpInput = document.getElementById('adminOtp');
  const loginBtn = document.getElementById('loginBtn');
  const appShell = document.querySelector('.app-shell');
  const adminMenuToggle = document.getElementById('adminMenuToggle');
  const adminSidebarBackdrop = document.getElementById('adminSidebarBackdrop');

  const pageTitle = document.getElementById('pageTitle');
  const pageSubtitle = document.getElementById('pageSubtitle');
  const refreshBtn = document.getElementById('refreshBtn');
  const themeToggleBtn = document.getElementById('themeToggle');
  const languageFilter = document.getElementById('languageFilter');
  const countryFilter = document.getElementById('countryFilter');
  const realtimeToggleBtn = document.getElementById('realtimeToggleBtn');
  const wsStatusDot = document.getElementById('wsStatusDot');

  function setWsStatus(status) {
    if (!wsStatusDot) return;
    wsStatusDot.className = 'ws-status-dot ws-' + status;
    wsStatusDot.title = 'WebSocket: ' + status;
  }

  const registrationsBody = document.getElementById('registrationsBody');
  const contactsBody = document.getElementById('contactsBody');
  const careersBody = document.getElementById('careersBody');

  const statRegistrations = document.getElementById('statRegistrations');
  const statContacts = document.getElementById('statContacts');
  const statCareers = document.getElementById('statCareers');
  const statAll = document.getElementById('statAll');
  const statForms = document.getElementById('statForms');
  const overviewHealthTitle = document.getElementById('overviewHealthTitle');
  const overviewHealthCopy = document.getElementById('overviewHealthCopy');
  const overviewLatestActivity = document.getElementById('overviewLatestActivity');
  const overviewQueueDepth = document.getElementById('overviewQueueDepth');
  const overviewOpenIncidents = document.getElementById('overviewOpenIncidents');
  const overviewLeadSources = document.getElementById('overviewLeadSources');
  const overviewInsights = document.getElementById('overviewInsights');
  const overviewActionItems = document.getElementById('overviewActionItems');

  const registrationsSearch = document.getElementById('registrationsSearch');
  const contactsSearch = document.getElementById('contactsSearch');
  const careersSearch = document.getElementById('careersSearch');
  const careersRoleFilter = document.getElementById('careersRoleFilter');

  const registrationsPrevBtn = document.getElementById('registrationsPrevBtn');
  const registrationsNextBtn = document.getElementById('registrationsNextBtn');
  const registrationsPageInfo = document.getElementById('registrationsPageInfo');
  const contactsPrevBtn = document.getElementById('contactsPrevBtn');
  const contactsNextBtn = document.getElementById('contactsNextBtn');
  const contactsPageInfo = document.getElementById('contactsPageInfo');
  const careersPrevBtn = document.getElementById('careersPrevBtn');
  const careersNextBtn = document.getElementById('careersNextBtn');
  const careersPageInfo = document.getElementById('careersPageInfo');

  const registrationsExportBtn = document.getElementById('registrationsExportBtn');
  const contactsExportBtn = document.getElementById('contactsExportBtn');
  const careersExportBtn = document.getElementById('careersExportBtn');

  const usersSearch = document.getElementById('usersSearch');
  const usersStatusFilter = document.getElementById('usersStatusFilter');
  const usersAddBtn = document.getElementById('usersAddBtn');
  const usersBody = document.getElementById('usersBody');

  const roleNameInput = document.getElementById('roleNameInput');
  const roleCreateBtn = document.getElementById('roleCreateBtn');
  const rolesBody = document.getElementById('rolesBody');

  const apiKeyLabel = document.getElementById('apiKeyLabel');
  const apiKeyScope = document.getElementById('apiKeyScope');
  const createApiKeyBtn = document.getElementById('createApiKeyBtn');
  const apiKeysBody = document.getElementById('apiKeysBody');

  const monLatency = document.getElementById('monLatency');
  const monErrorRate = document.getElementById('monErrorRate');
  const monQueueDepth = document.getElementById('monQueueDepth');
  const monUptime = document.getElementById('monUptime');
  const incidentFeed = document.getElementById('incidentFeed');

  const billingMrr = document.getElementById('billingMrr');
  const billingActiveSubs = document.getElementById('billingActiveSubs');
  const billingChurn = document.getElementById('billingChurn');
  const billingArpa = document.getElementById('billingArpa');
  const billingPlansBody = document.getElementById('billingPlansBody');

  const analyticsSummaryCards = document.getElementById('analyticsSummaryCards');
  const analyticsTrendCards = document.getElementById('analyticsTrendCards');
  const analyticsFunnel = document.getElementById('analyticsFunnel');
  const analyticsDeliveryHealth = document.getElementById('analyticsDeliveryHealth');
  const analyticsWorkforceBars = document.getElementById('analyticsWorkforceBars');
  const analyticsTaskStatusBars = document.getElementById('analyticsTaskStatusBars');
  const analyticsManagerPerformance = document.getElementById('analyticsManagerPerformance');
  const analyticsHiringFunnel = document.getElementById('analyticsHiringFunnel');
  const analyticsWorkloadBars = document.getElementById('analyticsWorkloadBars');
  const analyticsProjectRisks = document.getElementById('analyticsProjectRisks');
  const analyticsRecommendations = document.getElementById('analyticsRecommendations');
  const analyticsInsights = document.getElementById('analyticsInsights');
  const analyticsCountryFilter = document.getElementById('analyticsCountryFilter');
  const analyticsDepartmentFilter = document.getElementById('analyticsDepartmentFilter');
  const analyticsRoleFilter = document.getElementById('analyticsRoleFilter');
  const analyticsTimeFilter = document.getElementById('analyticsTimeFilter');
  const analyticsExportBtn = document.getElementById('analyticsExportBtn');
  const analyticsDetailModal = document.getElementById('analyticsDetailModal');
  const analyticsDetailTitle = document.getElementById('analyticsDetailTitle');
  const analyticsDetailBody = document.getElementById('analyticsDetailBody');
  const analyticsDetailClose = document.getElementById('analyticsDetailClose');

  const deptNameInput = document.getElementById('deptNameInput');
  const deptLeadInput = document.getElementById('deptLeadInput');
  const addDepartmentBtn = document.getElementById('addDepartmentBtn');
  const departmentsBody = document.getElementById('departmentsBody');
  const employeeSearch = document.getElementById('employeeSearch');
  const employeeDeptFilter = document.getElementById('employeeDeptFilter');
  const orgExportBtn = document.getElementById('orgExportBtn');
  const employeesBody = document.getElementById('employeesBody');

  const projectNameInput = document.getElementById('projectNameInput');
  const projectDeadlineInput = document.getElementById('projectDeadlineInput');
  const addProjectBtn = document.getElementById('addProjectBtn');
  const projectsBody = document.getElementById('projectsBody');
  const taskTitleInput = document.getElementById('taskTitleInput');
  const taskProjectFilter = document.getElementById('taskProjectFilter');
  const taskStatusFilter = document.getElementById('taskStatusFilter');
  const addTaskBtn = document.getElementById('addTaskBtn');
  const tasksBody = document.getElementById('tasksBody');

  const auditSearch = document.getElementById('auditSearch');
  const auditSeverityFilter = document.getElementById('auditSeverityFilter');
  const auditExportBtn = document.getElementById('auditExportBtn');
  const auditBody = document.getElementById('auditBody');

  const securityMfaRequired = document.getElementById('securityMfaRequired');
  const securitySsoRequired = document.getElementById('securitySsoRequired');
  const securitySessionLock = document.getElementById('securitySessionLock');
  const securityPiiMasking = document.getElementById('securityPiiMasking');
  const securityIpAllowlist = document.getElementById('securityIpAllowlist');
  const securityImmutableAudit = document.getElementById('securityImmutableAudit');
  const saveSecuritySettingsBtn = document.getElementById('saveSecuritySettingsBtn');

  const notificationTitle = document.getElementById('notificationTitle');
  const notificationChannel = document.getElementById('notificationChannel');
  const queueNotificationBtn = document.getElementById('queueNotificationBtn');
  const notificationsBody = document.getElementById('notificationsBody');
  const announcementTitle = document.getElementById('announcementTitle');
  const announcementAudience = document.getElementById('announcementAudience');
  const meetingTime = document.getElementById('meetingTime');
  const generateMeetingBtn = document.getElementById('generateMeetingBtn');
  const meetingLinkOut = document.getElementById('meetingLinkOut');

  const statActiveEmployees = document.getElementById('statActiveEmployees');
  const statOpenTasks = document.getElementById('statOpenTasks');

  const customEmailsWrap = document.getElementById('customEmailsWrap');
  const customEmails = document.getElementById('customEmails');
  const customEmailsHint = document.getElementById('customEmailsHint');
  const emailSubject = document.getElementById('emailSubject');
  const subjectHint = document.getElementById('subjectHint');
  const middleContent = document.getElementById('middleContent');
  const bodyHint = document.getElementById('bodyHint');
  const emailBody = document.getElementById('emailBody');
  const emailPreviewFrame = document.getElementById('emailPreviewFrame');
  const previewSubject = document.getElementById('previewSubject');
  const previewRecipients = document.getElementById('previewRecipients');
  const regenerateTemplate = document.getElementById('regenerateTemplate');
  const saveDraftBtn = document.getElementById('saveDraftBtn');
  const composerForm = document.getElementById('composerForm');
  const composerStatus = document.getElementById('composerStatus');
  const internRoleWrap = document.getElementById('internRoleWrap');
  const internRoleSelect = document.getElementById('internRoleSelect');

  const recordModal = document.getElementById('recordModal');
  const recordModalTitle = document.getElementById('recordModalTitle');
  const recordForm = document.getElementById('recordForm');
  const recordFormFields = document.getElementById('recordFormFields');
  const recordModalClose = document.getElementById('recordModalClose');
  const recordCancelBtn = document.getElementById('recordCancelBtn');

  const confirmModal = document.getElementById('confirmModal');
  const confirmModalMessage = document.getElementById('confirmModalMessage');
  const confirmModalClose = document.getElementById('confirmModalClose');
  const confirmCancelBtn = document.getElementById('confirmCancelBtn');
  const confirmOkBtn = document.getElementById('confirmOkBtn');

  const subtitleByTab = {
    overview: 'Monitor submissions and send communication.',
    users: 'Manage internal users, access levels, and account status.',
    roles: 'Create and maintain role-based permissions for operations.',
    organization: 'Manage department hierarchy, employee profiles, and reporting structure.',
    projects: 'Manage projects, assign tasks, and track delivery status.',
    'api-access': 'Control API credentials, scopes, and key lifecycle.',
    monitoring: 'Track uptime, latency, queue depth, and incidents in real time.',
    billing: 'Review plan performance and subscription health metrics.',
    analytics: 'Analyze conversion funnel and operational insights.',
    audit: 'Review admin actions and compliance-grade event history.',
    security: 'Set organization-wide security and data protection policy.',
    notifications: 'Queue and manage multi-channel notification delivery.',
    registrations: 'View all platform registrations collected from the landing site.',
    contacts: 'Review contact inquiries and follow up with responses.',
    careers: 'Track internship applications and applicant profiles.',
    forms: 'Create and manage forms, view responses.',
    composer: 'Compose and send professional bulk emails to selected audiences.'
  };

  function escapeHtml(value) {
    return String(value || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function setTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('qaulium_admin_theme', theme);
    if (themeToggleBtn) {
      themeToggleBtn.textContent = theme === 'dark' ? 'Light Theme' : 'Dark Theme';
    }
  }

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

  function normalizeApiBase(value) {
    var raw = String(value || '').trim();
    var host = (window.location.hostname || '').toLowerCase();
    var port = String(window.location.port || '');
    var isAdminStaticLocal = (host === 'localhost' || host === '127.0.0.1' || host === '::1') && port === '5501';

    if (isAdminStaticLocal) {
      if (!raw || raw === '/' || raw === './') {
        return 'http://127.0.0.1:3001';
      }
      var normalizedRaw = raw.replace(/\/$/, '');
      if (normalizedRaw === window.location.origin || normalizedRaw === 'http://127.0.0.1:5501' || normalizedRaw === 'http://localhost:5501') {
        return 'http://127.0.0.1:3001';
      }
      return normalizedRaw;
    }

    if (!raw || raw === '/' || raw === './') {
      return window.location.origin;
    }
    return raw.replace(/\/$/, '');
  }

  function isLocalDevHost() {
    var host = (window.location.hostname || '').toLowerCase();
    return host === 'localhost' || host === '127.0.0.1' || host === '::1';
  }

  function getOriginSafe(value) {
    try {
      return new URL(value, window.location.origin).origin;
    } catch (_e) {
      return '';
    }
  }

  function isSameOriginApiBase(value) {
    return getOriginSafe(value) === window.location.origin;
  }

  function shouldForceLocalProxy(_value) {
    // Allow explicit cross-origin API base in local development (e.g. admin page on :5501, API on :3001).
    return false;
  }

  async function request(path, options, retryMeta) {
    var didFallbackRetry = !!(retryMeta && retryMeta.didFallbackRetry);
    try {
      const fetchOptions = Object.assign({ cache: 'no-store' }, options || {});
      const res = await fetch(state.apiBase + path, fetchOptions);
      const contentType = res.headers.get('content-type') || '';
      const data = contentType.includes('application/json') ? await res.json() : {};
      if (!res.ok) {
        if (res.status === 404) {
          throw new Error('API route not found. Use the correct API base URL or run this admin via `vercel dev` to enable local /api proxy.');
        }
        throw new Error(data.message || 'Request failed');
      }
      return data;
    } catch (err) {
      if (err && err.name === 'TypeError' && !didFallbackRetry && shouldForceLocalProxy(state.apiBase)) {
        state.apiBase = window.location.origin;
        localStorage.setItem('qaulium_admin_api_base', state.apiBase);
        if (apiBaseInput) {
          apiBaseInput.value = state.apiBase;
        }
        return request(path, options, { didFallbackRetry: true });
      }
      if (err && err.name === 'TypeError') {
        throw new Error('Network/CORS error. The API did not allow this origin. Use same-origin `/api` with `vercel dev`, or enable CORS on the backend.');
      }
      throw err;
    }
  }

  function formatDate(value) {
    if (!value) return '-';
    const d = new Date(value);
    if (isNaN(d.getTime())) return value;
    return d.toLocaleString();
  }

  function formatDurationCompact(seconds) {
    const total = Math.max(0, Number(seconds) || 0);
    if (!total) return '0m';
    const days = Math.floor(total / 86400);
    const hours = Math.floor((total % 86400) / 3600);
    const minutes = Math.floor((total % 3600) / 60);
    if (days > 0) return days + 'd ' + hours + 'h';
    if (hours > 0) return hours + 'h ' + minutes + 'm';
    return minutes + 'm';
  }

  function csvEscape(value) {
    const text = String(value || '');
    return '"' + text.replace(/"/g, '""') + '"';
  }

  function excelTextValue(value) {
    const text = String(value || '').trim();
    return text ? '="' + text.replace(/"/g, '""') + '"' : '';
  }

  function downloadCsv(filename, headers, rows) {
    const lines = [headers.map(csvEscape).join(',')];
    rows.forEach(function (row) {
      lines.push(row.map(csvEscape).join(','));
    });
    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  function renderTemplateHtml(def, contentValue, subjectValue) {
    const contentHtml = (contentValue || 'Your message here.').replace(/\n/g, '<br>');
    const safeSubject = subjectValue || def.subject || 'Message from Qaulium AI';
    return def.body
      .replace('{{CONTENT}}', contentHtml)
      // Keep preview/email HTML title aligned with subject field.
      .replace(/<title>[\s\S]*?<\/title>/i, `<title>${safeSubject}</title>`);
  }

  function applyTemplate() {
    const templateValue = document.querySelector('input[name="template"]:checked')?.value || 'blank';
    const def = templates[templateValue] || templates.blank;

    if (internRoleWrap) {
      internRoleWrap.classList.toggle('hidden', templateValue !== 'intern-confirmation');
    }

    if (templateValue === 'intern-confirmation' && internRoleSelect && internRoleSelect.value) {
      middleContent.value = internRoleMessages[internRoleSelect.value] || middleContent.value;
    }

    const existingSubject = (emailSubject.value || '').trim();
    if (!existingSubject) {
      emailSubject.value = def.subject;
    }
    emailBody.value = renderTemplateHtml(def, middleContent.value, emailSubject.value.trim());
    updatePreview();
  }

  function updatePreview() {
    if (!emailPreviewFrame) return;
    // Replace cid:qualium-logo with actual URL for preview rendering
    const previewHtml = (emailBody.value || '<p style="font-family:Arial,sans-serif;padding:20px;color:#999;">Preview will appear here.</p>')
      .replace(/cid:qualium-logo/g, 'https://qauliumai.in/logo-white.png');
    emailPreviewFrame.srcdoc = previewHtml;
    
    // Update preview info
    if (previewSubject) previewSubject.textContent = emailSubject.value || '—';
    if (previewRecipients) {
      const audienceValue = document.querySelector('input[name="audience"]:checked')?.value || 'all';
      const audienceLabel = {
        'all': `All Members (${totals.allRequests || 0})`,
        'registrations': `Registrations (${totals.registrations || 0})`,
        'contacts': `Contacts (${totals.contacts || 0})`,
        'careers': `Careers (${totals.careers || 0})`,
        'custom': `Custom List`
      }[audienceValue] || 'All Members';
      previewRecipients.textContent = audienceLabel;
    }
  }

  let totals = { registrations: 0, contacts: 0, careers: 0, allRequests: 0 };

  let monitoringTick = null;

  function randomKeyPrefix() {
    return 'qa_' + Math.random().toString(36).slice(2, 10);
  }

  function uid(prefix) {
    return prefix + '_' + Math.random().toString(36).slice(2, 10);
  }

  function addAuditLog(action, entity, details, severity) {
    const next = {
      id: uid('log'),
      time: new Date().toISOString(),
      actor: (adminEmailInput && adminEmailInput.value.trim()) || 'admin',
      action: action,
      entity: entity,
      details: details || '-',
      severity: severity || 'low'
    };
    state.enterprise.auditLogs.unshift(next);
    state.enterprise.auditLogs = state.enterprise.auditLogs.slice(0, 300);
    persistEnterpriseState();
    renderAuditTable();
  }

  function defaultEnterpriseState() {
    return {
      users: [],
      roles: [],
      apiKeys: [],
      security: {
        mfaRequired: true,
        ssoRequired: false,
        sessionLock: true,
        piiMasking: true,
        ipAllowlist: false,
        immutableAudit: true
      },
      notifications: [],
      monitoringIncidents: [],
      billingPlans: [],
      departments: [],
      employees: [],
      projects: [],
      tasks: [],
      auditLogs: [],
      settings: {
        locale: 'en',
        country: 'all',
        realtimeEnabled: true
      },
      analyticsHistory: []
    };
  }

  function buildEnterpriseSyncPayload() {
    return {
      users: Array.isArray(state.enterprise.users) ? state.enterprise.users : [],
      roles: Array.isArray(state.enterprise.roles) ? state.enterprise.roles : [],
      apiKeys: Array.isArray(state.enterprise.apiKeys) ? state.enterprise.apiKeys : [],
      security: state.enterprise.security || {},
      billingPlans: Array.isArray(state.enterprise.billingPlans) ? state.enterprise.billingPlans : [],
      auditLogs: Array.isArray(state.enterprise.auditLogs) ? state.enterprise.auditLogs.slice(0, 300) : [],
      analyticsHistory: Array.isArray(state.enterprise.analyticsHistory) ? state.enterprise.analyticsHistory.slice(-20) : []
    };
  }

  async function syncEnterpriseStateToServer(reason) {
    if (!state.token || !state.enterpriseServerReady) return;
    if (state.enterpriseSyncInFlight) return;
    state.enterpriseSyncInFlight = true;
    try {
      await request('/api/admin/enterprise/state', {
        method: 'PUT',
        headers: authHeaders(),
        body: JSON.stringify({ state: buildEnterpriseSyncPayload(), reason: reason || 'sync' })
      });
    } catch (err) {
      // no-op: local state remains available
    } finally {
      state.enterpriseSyncInFlight = false;
    }
  }

  function scheduleEnterpriseStateSync(reason) {
    if (!state.token || !state.enterpriseServerReady) return;
    if (state.enterpriseSyncTimer) {
      clearTimeout(state.enterpriseSyncTimer);
      state.enterpriseSyncTimer = null;
    }
    state.enterpriseSyncTimer = setTimeout(function () {
      syncEnterpriseStateToServer(reason);
      state.enterpriseSyncTimer = null;
    }, 500);
  }

  function persistEnterpriseState(options) {
    const opts = options || {};
    if (!opts.skipRemote) {
      scheduleEnterpriseStateSync(opts.reason || 'local.persist');
    }
  }

  function loadEnterpriseState() {
    state.enterprise = defaultEnterpriseState();
    state.dashboard.forms = [];
    state.dashboard.summary = {
      leadSources: [],
      latestActivityAt: '',
      activeEmployees: 0,
      openTasks: 0,
      queuedNotifications: 0,
      openIncidents: 0,
      formsCount: 0
    };
  }

  function applyEnterprisePayload(incoming) {
    const base = defaultEnterpriseState();
    const payload = incoming || {};
    state.enterprise.users = Array.isArray(payload.users) ? payload.users : base.users;
    state.enterprise.roles = Array.isArray(payload.roles) ? payload.roles : base.roles;
    state.enterprise.apiKeys = Array.isArray(payload.apiKeys) ? payload.apiKeys : base.apiKeys;
    state.enterprise.security = Object.assign({}, base.security, payload.security || {});
    state.enterprise.billingPlans = Array.isArray(payload.billingPlans) ? payload.billingPlans : base.billingPlans;
    state.enterprise.auditLogs = Array.isArray(payload.auditLogs) ? payload.auditLogs.slice(0, 300) : base.auditLogs;
    state.enterprise.analyticsHistory = Array.isArray(payload.analyticsHistory) ? payload.analyticsHistory.slice(-20) : base.analyticsHistory;
    state.enterprise.departments = Array.isArray(payload.departments) ? payload.departments : base.departments;
    state.enterprise.employees = Array.isArray(payload.employees) ? payload.employees : base.employees;
    state.enterprise.projects = Array.isArray(payload.projects) ? payload.projects : base.projects;
    state.enterprise.tasks = Array.isArray(payload.tasks) ? payload.tasks : base.tasks;
    state.enterprise.notifications = Array.isArray(payload.notifications) ? payload.notifications : base.notifications;
    state.enterprise.monitoringIncidents = Array.isArray(payload.incidents) ? payload.incidents : (Array.isArray(payload.monitoringIncidents) ? payload.monitoringIncidents : base.monitoringIncidents);
    state.enterprise.settings = Object.assign({}, base.settings, payload.settings || {});
  }

  async function loadEnterpriseFromApi() {
    const payload = await request('/api/admin/enterprise/bootstrap', { headers: authHeaders() });
    const incoming = (payload && payload.data) || {};

    applyEnterprisePayload(incoming);

    state.enterpriseServerReady = true;
  }

  let enterpriseRealtimeRefreshTimer = null;

  async function refreshEnterprisePanelsFromServer(reason) {
    try {
      await loadDashboard({ forceRefresh: true, silent: true, reason: reason || 'realtime' });
    } catch (err) {
      // no-op: dashboard remains usable with local state
    }
  }

  function scheduleEnterpriseRealtimeRefresh(reason) {
    if (enterpriseRealtimeRefreshTimer) {
      clearTimeout(enterpriseRealtimeRefreshTimer);
    }
    enterpriseRealtimeRefreshTimer = setTimeout(function () {
      refreshEnterprisePanelsFromServer(reason);
      enterpriseRealtimeRefreshTimer = null;
    }, 200);
  }

  function disconnectRealtimeSocket() {
    if (state.realtimeReconnectTimer) {
      clearTimeout(state.realtimeReconnectTimer);
      state.realtimeReconnectTimer = null;
    }
    if (state.realtimeSocket) {
      try { state.realtimeSocket.onclose = null; } catch (e) {}
      try { state.realtimeSocket.close(); } catch (e) {}
      state.realtimeSocket = null;
    }
  }

  function connectRealtimeSocket() {
    disconnectRealtimeSocket();
    if (!state.token) return;
    if (!state.enterprise.settings || state.enterprise.settings.realtimeEnabled === false) return;

    let wsUrl = '';
    try {
      const base = new URL(state.apiBase);
      const protocol = base.protocol === 'https:' ? 'wss:' : 'ws:';
      wsUrl = protocol + '//' + base.host + '/ws/admin?token=' + encodeURIComponent(state.token);
    } catch (e) {
      return;
    }

    let socket = null;
    try {
      socket = new window.WebSocket(wsUrl);
    } catch (e) {
      return;
    }

    state.realtimeSocket = socket;

    socket.onopen = function () {
      setWsStatus('connected');
    };

    socket.onmessage = function (event) {
      try {
        const data = JSON.parse(event.data || '{}');
        const eventType = String(data.eventType || 'admin.event');
        if (eventType === 'ws.connected') {
          setWsStatus('connected');
          return;
        }
        scheduleEnterpriseRealtimeRefresh(eventType);
      } catch (e) {
        // no-op
      }
    };

    socket.onerror = function () {
      setWsStatus('error');
    };

    socket.onclose = function () {
      state.realtimeSocket = null;
      setWsStatus('disconnected');
      if (!state.token) return;
      if (!state.enterprise.settings || state.enterprise.settings.realtimeEnabled === false) return;
      state.realtimeReconnectTimer = setTimeout(connectRealtimeSocket, 2500);
    };
  }

  function filteredUsers() {
    const q = (usersSearch && usersSearch.value || '').trim().toLowerCase();
    const filter = usersStatusFilter ? usersStatusFilter.value : 'all';
    return state.enterprise.users.filter(function (u) {
      const statusOk = filter === 'all' || u.status === filter;
      if (!statusOk) return false;
      if (!q) return true;
      return [u.name, u.email, u.role, u.status].join(' ').toLowerCase().includes(q);
    });
  }

  function renderUsersTable() {
    if (!usersBody) return;
    const rows = filteredUsers();
    if (!rows.length) {
      renderNoRows(usersBody, 7);
      return;
    }
    usersBody.innerHTML = rows.map(function (u) {
      const statusClass = u.status === 'active' ? 'source-badge source-landing' : (u.status === 'suspended' ? 'source-badge source-studio' : 'source-badge source-unknown');
      const canManageUsers = can('users.manage');
      return '<tr>' +
        '<td>' + escapeHtml(u.name) + '</td>' +
        '<td>' + escapeHtml(u.email) + '</td>' +
        '<td>' + escapeHtml(u.role) + '</td>' +
        '<td><span class="' + statusClass + '">' + escapeHtml(u.status) + '</span></td>' +
        '<td>' + (u.mfa ? 'Enabled' : 'Disabled') + '</td>' +
        '<td>' + escapeHtml(formatDate(u.lastLogin)) + '</td>' +
        '<td><div class="row-actions">' +
          (canManageUsers ? '<button class="row-icon-btn" data-action="toggle-user" data-id="' + u.id + '" title="Toggle Status">↺</button>' : '') +
          (canManageUsers ? '<button class="row-icon-btn danger" data-action="remove-user" data-id="' + u.id + '" title="Delete User">✕</button>' : '') +
          (!canManageUsers ? '<span style="color:#64748b;">Read only</span>' : '') +
        '</div></td>' +
      '</tr>';
    }).join('');
  }

  function renderRolesTable() {
    if (!rolesBody) return;
    const rows = state.enterprise.roles || [];
    if (!rows.length) {
      renderNoRows(rolesBody, 4);
      return;
    }

    rolesBody.innerHTML = rows.map(function (r) {
      const perms = (r.permissions || []).slice(0, 5).map(function (p) {
        return '<span class="perm-chip">' + escapeHtml(p) + '</span>';
      }).join('');
      const canManageRoles = can('roles.manage');
      return '<tr>' +
        '<td>' + escapeHtml(r.name) + '</td>' +
        '<td><div class="perm-chip-wrap">' + perms + '</div></td>' +
        '<td>' + escapeHtml(String(r.members || 0)) + '</td>' +
        '<td><div class="row-actions">' +
          (canManageRoles ? '<button class="row-icon-btn danger" data-action="delete-role" data-id="' + r.id + '">✕</button>' : '<span style="color:#64748b;">Read only</span>') +
        '</div></td>' +
      '</tr>';
    }).join('');
  }

  function renderApiKeysTable() {
    if (!apiKeysBody) return;
    const rows = state.enterprise.apiKeys || [];
    if (!rows.length) {
      renderNoRows(apiKeysBody, 7);
      return;
    }
    apiKeysBody.innerHTML = rows.map(function (k) {
      const statusClass = k.status === 'active' ? 'source-badge source-landing' : 'source-badge source-unknown';
      const canManageKeys = can('api_keys.manage');
      return '<tr>' +
        '<td>' + escapeHtml(k.label) + '</td>' +
        '<td>' + escapeHtml(k.scope) + '</td>' +
        '<td>' + escapeHtml(k.prefix) + '••••••••</td>' +
        '<td>' + escapeHtml(formatDate(k.createdAt)) + '</td>' +
        '<td>' + escapeHtml(formatDate(k.lastUsedAt)) + '</td>' +
        '<td><span class="' + statusClass + '">' + escapeHtml(k.status) + '</span></td>' +
        '<td><div class="row-actions">' +
          (canManageKeys ? '<button class="row-icon-btn danger" data-action="revoke-key" data-id="' + k.id + '">Revoke</button>' : '<span style="color:#64748b;">Read only</span>') +
        '</div></td>' +
      '</tr>';
    }).join('');
  }

  function renderMonitoring() {
    const monitoring = state.dashboard.monitoring || {};
    const uptimeSeconds = monitoring.startedAt
      ? Math.max(0, Math.round((Date.now() - new Date(monitoring.startedAt).getTime()) / 1000))
      : (monitoring.uptimeSeconds || 0);

    if (monLatency) monLatency.textContent = String(monitoring.apiP95LatencyMs || 0) + ' ms';
    if (monErrorRate) monErrorRate.textContent = Number(monitoring.apiErrorRatePercent || 0).toFixed(2) + '%';
    if (monQueueDepth) monQueueDepth.textContent = String(monitoring.queueDepth || 0);
    if (monUptime) monUptime.textContent = formatDurationCompact(uptimeSeconds);

    if (incidentFeed) {
      incidentFeed.innerHTML = (state.enterprise.monitoringIncidents || []).slice(0, 8).map(function (inc) {
        return '<div class="incident-item"><strong>' + escapeHtml(formatDate(inc.time)) + '</strong><span>' + escapeHtml(inc.summary) + '</span><span class="incident-severity ' + escapeHtml(inc.severity) + '">' + escapeHtml(inc.severity) + '</span></div>';
      }).join('');
    }
  }

  function renderBilling() {
    const plans = state.enterprise.billingPlans || [];
    const mrr = plans.reduce(function (acc, p) { return acc + (p.price * p.accounts); }, 0);
    const activeSubs = plans.reduce(function (acc, p) { return acc + p.accounts; }, 0);
    const arpa = activeSubs ? (mrr / activeSubs) : 0;
    if (billingMrr) billingMrr.textContent = '$' + mrr.toLocaleString();
    if (billingActiveSubs) billingActiveSubs.textContent = String(activeSubs);
    if (billingChurn) billingChurn.textContent = plans.length ? 'Live' : '--';
    if (billingArpa) billingArpa.textContent = '$' + arpa.toFixed(0);

    if (billingPlansBody) {
      billingPlansBody.innerHTML = plans.map(function (p) {
        return '<tr>' +
          '<td>' + escapeHtml(p.name) + '</td>' +
          '<td>$' + escapeHtml(String(p.price)) + '</td>' +
          '<td>' + escapeHtml(String(p.accounts)) + '</td>' +
          '<td>$' + escapeHtml(String(p.price * p.accounts)) + '</td>' +
        '</tr>';
      }).join('');
    }
  }

  function renderOverviewPanels() {
    const summary = state.dashboard.summary || {};
    const leadSources = Array.isArray(summary.leadSources) ? summary.leadSources : [];
    const activeEmployees = Number(summary.activeEmployees || 0);
    const openTasks = Number(summary.openTasks || 0);
    const queuedNotifications = Number(summary.queuedNotifications || 0);
    const openIncidents = Number(summary.openIncidents || 0);
    const latestActivity = summary.latestActivityAt ? formatDate(summary.latestActivityAt) : '--';

    if (overviewHealthTitle) {
      if (openIncidents > 0) {
        overviewHealthTitle.textContent = 'Attention needed in active operations';
      } else if (openTasks > 0 || queuedNotifications > 0) {
        overviewHealthTitle.textContent = 'Operational flow is active and stable';
      } else {
        overviewHealthTitle.textContent = 'System is idle but healthy';
      }
    }

    if (overviewHealthCopy) {
      overviewHealthCopy.textContent = activeEmployees + ' employees are active in the current org view, ' + openTasks + ' tasks remain open, and ' + queuedNotifications + ' queued notifications are waiting for delivery.';
    }

    if (overviewLatestActivity) overviewLatestActivity.textContent = 'Latest activity: ' + latestActivity;
    if (overviewQueueDepth) overviewQueueDepth.textContent = 'Queued notifications: ' + queuedNotifications;
    if (overviewOpenIncidents) overviewOpenIncidents.textContent = 'Open incidents: ' + openIncidents;

    if (overviewLeadSources) {
      if (!leadSources.length) {
        overviewLeadSources.innerHTML = '<div class="overview-empty">No live registration sources yet.</div>';
      } else {
        const maxCount = leadSources.reduce(function (acc, item) { return Math.max(acc, Number(item.count) || 0); }, 1);
        overviewLeadSources.innerHTML = leadSources.slice(0, 4).map(function (item) {
          const width = Math.max(10, Math.round(((Number(item.count) || 0) / maxCount) * 100));
          const labelMap = {
            landing_modal: 'Landing Page',
            public_registration_portal: 'Pre-Registration Link',
            qstudio_landing: 'QStudio Landing',
            unknown: 'Unknown Source'
          };
          const label = labelMap[item.source] || item.source;
          return '<div class="overview-source-row">' +
            '<div class="overview-source-meta"><strong>' + escapeHtml(label) + '</strong><span>' + escapeHtml(String(item.count)) + ' leads</span></div>' +
            '<div class="overview-source-track"><i style="width:' + width + '%"></i></div>' +
          '</div>';
        }).join('');
      }
    }

    if (overviewInsights) {
      const insights = [
        'Total live intake is ' + (totals.allRequests || 0) + ' records across registrations, contacts, and career applications.',
        activeEmployees + ' employees and ' + openTasks + ' open tasks are currently represented in the enterprise workspace.',
        queuedNotifications + ' queued notifications and ' + openIncidents + ' unresolved incidents require active monitoring.',
        'Forms currently published: ' + Number(summary.formsCount || 0) + '.'
      ];
      overviewInsights.innerHTML = insights.map(function (item) {
        return '<li>' + escapeHtml(item) + '</li>';
      }).join('');
    }

    if (overviewActionItems) {
      const actions = [];
      if (openIncidents > 0) actions.push({ title: 'Review incident feed', body: 'There are unresolved incidents in monitoring. Validate severity and assign an owner.' });
      if (queuedNotifications > 0) actions.push({ title: 'Flush queued notifications', body: 'The delivery queue has pending notifications that may affect response times.' });
      if (openTasks > 5) actions.push({ title: 'Rebalance project load', body: 'Open task volume is elevated. Reassign or advance work in the Tasks & Projects tab.' });
      if (!actions.length) actions.push({ title: 'Monitor live intake', body: 'No urgent actions detected. Continue monitoring lead flow and recent admin activity.' });
      overviewActionItems.innerHTML = actions.map(function (item) {
        return '<div class="overview-action-item"><strong>' + escapeHtml(item.title) + '</strong><p>' + escapeHtml(item.body) + '</p></div>';
      }).join('');
    }
  }

  function renderAnalyticsBars(target, items, emptyText) {
    if (!target) return;
    if (!items.length) {
      target.innerHTML = '<div class="analytics-empty">' + escapeHtml(emptyText || 'No analytics available.') + '</div>';
      return;
    }

    const max = items.reduce(function (acc, item) { return Math.max(acc, Number(item.value) || 0); }, 1);
    target.innerHTML = items.map(function (item) {
      const width = Math.max(6, Math.round(((Number(item.value) || 0) / max) * 100));
      return '<div class="analytics-bar-row">' +
        '<div class="analytics-bar-meta"><strong>' + escapeHtml(item.label) + '</strong><span>' + escapeHtml(item.subtext || '') + '</span></div>' +
        '<div class="analytics-bar-track"><i style="--bar-target-w:' + width + '%;background:' + escapeHtml(item.color || 'linear-gradient(90deg,#2563eb,#0f766e)') + '"></i></div>' +
        '<div class="analytics-bar-value">' + escapeHtml(String(item.displayValue != null ? item.displayValue : item.value)) + '</div>' +
      '</div>';
    }).join('');
  }

  function buildAnalyticsSparkline(points, stroke, fill) {
    const values = (points || []).map(function (value) { return Number(value) || 0; });
    if (!values.length) return '';
    const width = 220;
    const height = 68;
    const min = Math.min.apply(null, values);
    const max = Math.max.apply(null, values);
    const span = Math.max(max - min, 1);
    const xStep = values.length > 1 ? width / (values.length - 1) : width;
    const linePoints = values.map(function (value, index) {
      const x = values.length > 1 ? (index * xStep) : (width / 2);
      const y = height - (((value - min) / span) * (height - 10)) - 5;
      return [x, y];
    });
    const polyline = linePoints.map(function (point) { return point[0].toFixed(1) + ',' + point[1].toFixed(1); }).join(' ');
    const area = '0,' + height + ' ' + polyline + ' ' + width + ',' + height;
     return '<svg class="analytics-sparkline" viewBox="0 0 ' + width + ' ' + height + '" preserveAspectRatio="none" aria-hidden="true">' +
       '<polygon points="' + area + '" fill="' + escapeHtml(fill || 'rgba(37,99,235,0.12)') + '"></polygon>' +
       '<polyline points="' + polyline + '" fill="none" stroke="' + escapeHtml(stroke || '#2563eb') + '" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"></polyline>' +
     '</svg>';
   }

   function renderAnalyticsTrendCards(cards) {
     if (!analyticsTrendCards) return;
     if (!cards.length) {
       analyticsTrendCards.innerHTML = '<div class="analytics-empty">No trend snapshots available.</div>';
       return;
     }

     analyticsTrendCards.innerHTML = cards.map(function (card) {
       return '<div class="analytics-trend-card">' +
         '<div class="analytics-trend-head"><span>' + escapeHtml(card.label) + '</span><strong>' + escapeHtml(String(card.value)) + '</strong></div>' +
         buildAnalyticsSparkline(card.points, card.stroke, card.fill) +
         '<p>' + escapeHtml(card.note) + '</p>' +
       '</div>';
     }).join('');
   }

   function getCareerStageSnapshot() {
     const careers = state.tables.careers.rows || [];
     const auditLogs = state.enterprise.auditLogs || [];
     const actionIds = { interview: {}, accepted: {} };

     auditLogs.forEach(function (log) {
       if (log.action !== 'career.status.email') return;
       const details = String(log.details || '').toLowerCase();
       const match = String(log.details || '').match(/career id\s+([^\.\s]+)/i);
       if (!match) return;
       if (details.includes(' interview ' ) || details.includes('sent interview email')) actionIds.interview[match[1]] = true;
       if (details.includes(' accepted ') || details.includes('sent accepted email')) actionIds.accepted[match[1]] = true;
     });

     const interviewCount = Object.keys(actionIds.interview).length;
     const acceptedCount = Object.keys(actionIds.accepted).length;
     const actionedIds = {};
     Object.keys(actionIds.interview).forEach(function (id) { actionedIds[id] = true; });
     Object.keys(actionIds.accepted).forEach(function (id) { actionedIds[id] = true; });
     const actionedCount = Object.keys(actionedIds).length;
     const applicants = careers.length;
     const pending = Math.max(applicants - actionedCount, 0);

     return {
       applicants: applicants,
       pending: pending,
       interviewed: interviewCount,
       accepted: acceptedCount
     };
   }

   function recordAnalyticsHistoryPoint() {
     var allTasks = state.enterprise.tasks || [];
     var doneCnt = allTasks.filter(function (t) { return t.status === 'done'; }).length;
     var allProjects = state.enterprise.projects || [];
     var point = {
       ts: Date.now(),
       leads: totals.allRequests || 0,
       open: allTasks.filter(function (t) { return t.status !== 'done'; }).length,
       done: allTasks.length ? Math.round((doneCnt / allTasks.length) * 100) : 0,
       progress: allProjects.length
         ? Math.round(allProjects.reduce(function (s, p) { return s + (Number(p.progress) || 0); }, 0) / allProjects.length)
         : 0
     };
     if (!state.enterprise.analyticsHistory) state.enterprise.analyticsHistory = [];
     var hist = state.enterprise.analyticsHistory;
     var last = hist.length ? hist[hist.length - 1] : null;
     if (last && (point.ts - last.ts) < 30000) {
       hist[hist.length - 1] = point;
     } else {
       hist.push(point);
       state.enterprise.analyticsHistory = hist.slice(-20);
     }
     persistEnterpriseState();
   }

   function buildAnalyticsSnapshot() {
     const scopedCountry = (analyticsCountryFilter && analyticsCountryFilter.value) || (state.enterprise.settings && state.enterprise.settings.country) || 'all';
     const deptValue = (analyticsDepartmentFilter && analyticsDepartmentFilter.value) || 'all';
     const roleValue = (analyticsRoleFilter && analyticsRoleFilter.value) || 'all';
     const timeValue = (analyticsTimeFilter && analyticsTimeFilter.value) || '30d';

     const employeeMap = {};
     (state.enterprise.employees || []).forEach(function (employee) {
       employeeMap[String(employee.name || '').toLowerCase()] = employee;
     });

     const employees = (state.enterprise.employees || []).filter(function (employee) {
       const countryOk = scopedCountry === 'all' || employee.country === scopedCountry;
       const deptOk = deptValue === 'all' || employee.department === deptValue;
       const roleOk = roleValue === 'all' || employee.role === roleValue;
       return countryOk && deptOk && roleOk;
     });

     const tasks = (state.enterprise.tasks || []).filter(function (task) {
       const owner = employeeMap[String(task.assignee || '').toLowerCase()];
       const countryOk = scopedCountry === 'all' || !owner || owner.country === scopedCountry;
       const deptOk = deptValue === 'all' || !owner || owner.department === deptValue;
       const roleOk = roleValue === 'all' || !owner || owner.role === roleValue;
       return countryOk && deptOk && roleOk;
     });

     const projects = (state.enterprise.projects || []).filter(function (project) {
       const owner = employeeMap[String(project.owner || '').toLowerCase()];
       const countryOk = scopedCountry === 'all' || !owner || owner.country === scopedCountry;
       const deptOk = deptValue === 'all' || !owner || owner.department === deptValue;
       const roleOk = roleValue === 'all' || !owner || owner.role === roleValue;
       return countryOk && deptOk && roleOk;
     });

     const stages = [
       { label: 'Registrations', value: totals.registrations || 0, color: '#0f766e' },
       { label: 'Contacts', value: totals.contacts || 0, color: '#1d4ed8' },
       { label: 'Careers', value: totals.careers || 0, color: '#b45309' }
     ];

     const totalLeadVolume = Math.max(totals.allRequests || 0, 1);
     const openTasks = tasks.filter(function (task) { return task.status !== 'done'; });
     const overdueTasks = tasks.filter(function (task) {
       if (!task.dueDate || task.status === 'done') return false;
       const due = new Date(task.dueDate).getTime();
       return !isNaN(due) && due < Date.now();
     });
     const completedTasks = tasks.filter(function (task) { return task.status === 'done'; });
     const atRiskProjects = projects.filter(function (project) { return String(project.status || '').toLowerCase() === 'at risk'; });
     const avgProjectProgress = projects.length
       ? Math.round(projects.reduce(function (sum, project) { return sum + (Number(project.progress) || 0); }, 0) / projects.length)
       : 0;
     const doneRate = tasks.length ? Math.round((completedTasks.length / tasks.length) * 100) : 0;

     const workloadCounts = {};
     openTasks.forEach(function (task) {
       const assignee = task.assignee || 'Unassigned';
       workloadCounts[assignee] = (workloadCounts[assignee] || 0) + 1;
     });
     const workloadEntries = Object.keys(workloadCounts).map(function (name) {
       return { label: name, value: workloadCounts[name] };
     }).sort(function (a, b) { return b.value - a.value; });
     const maxWorkload = workloadEntries.length ? workloadEntries[0].value : 0;
     const minWorkload = workloadEntries.length ? workloadEntries[workloadEntries.length - 1].value : 0;
     const workloadGap = maxWorkload - minWorkload;
     const healthScore = Math.max(18, Math.min(98, Math.round(100 - (overdueTasks.length * 12) - (atRiskProjects.length * 15) + (doneRate * 0.25))));

     const deptCounts = {};
     employees.forEach(function (employee) {
       const department = employee.department || 'Unassigned';
       deptCounts[department] = (deptCounts[department] || 0) + 1;
     });

     const taskStates = ['todo', 'in_progress', 'review', 'done'];
     const taskLabels = { todo: 'To Do', in_progress: 'In Progress', review: 'Review', done: 'Done' };
     const taskStatusBars = taskStates.map(function (status, index) {
       const count = tasks.filter(function (task) { return task.status === status; }).length;
       const colors = ['linear-gradient(90deg,#94a3b8,#cbd5e1)', 'linear-gradient(90deg,#2563eb,#38bdf8)', 'linear-gradient(90deg,#f59e0b,#fbbf24)', 'linear-gradient(90deg,#059669,#10b981)'];
       return {
         label: taskLabels[status],
         value: count,
         displayValue: count,
         subtext: tasks.length ? Math.round((count / tasks.length) * 100) + '% of task portfolio' : '0% of task portfolio',
         color: colors[index]
       };
     });

     const managerMap = {};
     employees.forEach(function (employee) {
       const manager = employee.manager || 'No Manager';
       if (!managerMap[manager]) {
         managerMap[manager] = { manager: manager, reports: [], open: 0, overdue: 0, completed: 0 };
       }
       managerMap[manager].reports.push(employee.name);
     });
     tasks.forEach(function (task) {
       const owner = employeeMap[String(task.assignee || '').toLowerCase()];
       const manager = owner && owner.manager ? owner.manager : 'No Manager';
       if (!managerMap[manager]) {
         managerMap[manager] = { manager: manager, reports: [], open: 0, overdue: 0, completed: 0 };
       }
       if (task.status === 'done') {
         managerMap[manager].completed += 1;
       } else {
         managerMap[manager].open += 1;
       }
       if (task.dueDate && task.status !== 'done' && !isNaN(new Date(task.dueDate).getTime()) && new Date(task.dueDate).getTime() < Date.now()) {
         managerMap[manager].overdue += 1;
       }
     });
     const managerPerformance = Object.keys(managerMap).map(function (manager) {
       const item = managerMap[manager];
       const score = Math.max(0, Math.min(100, 100 - (item.overdue * 18) - (item.open * 4) + (item.completed * 8)));
       return {
         label: manager,
         teamSize: item.reports.length,
         open: item.open,
         overdue: item.overdue,
         completed: item.completed,
         score: score,
         points: [item.reports.length, item.open, item.completed, item.overdue]
       };
     }).sort(function (a, b) { return b.score - a.score; });

     const careerStages = getCareerStageSnapshot();

     const recommendations = [];
     if (overdueTasks.length > 0) recommendations.push({
       title: 'Task SLA Command Center',
       body: 'You have overdue work. Add an escalation view with owners, breach timers, and recovery actions.'
     });
     if (workloadGap >= 2) recommendations.push({
       title: 'Capacity Planner',
       body: 'Assignee load is uneven. Add a planner that redistributes tasks and forecasts team capacity.'
     });
     if (atRiskProjects.length > 0) recommendations.push({
       title: 'Project Risk Review',
       body: 'At-risk projects exist. Add a milestone risk section with blockers, confidence scores, and owner updates.'
     });
     if ((totals.careers || 0) > 0) recommendations.push({
       title: 'Hiring Pipeline Scorecard',
       body: 'Career applications are active. Add recruiter throughput, interview conversion, and offer acceptance views.'
     });
     recommendations.push({
       title: 'Manager Effectiveness Panel',
       body: 'Track team size, open work, overdue load, and completion rate by manager to spot weak operating zones.'
     });
     recommendations.push({
       title: 'Automation Coverage Map',
       body: 'Show which workflows are still manual across intake, routing, approvals, and follow-ups.'
     });

     return {
       scopedCountry: scopedCountry,
       deptValue: deptValue,
       roleValue: roleValue,
       timeValue: timeValue,
       employees: employees,
       tasks: tasks,
       projects: projects,
       stages: stages,
       totalLeadVolume: totalLeadVolume,
       openTasks: openTasks,
       overdueTasks: overdueTasks,
       completedTasks: completedTasks,
       atRiskProjects: atRiskProjects,
       avgProjectProgress: avgProjectProgress,
       workloadEntries: workloadEntries,
       workloadGap: workloadGap,
       doneRate: doneRate,
       healthScore: healthScore,
       deptCounts: deptCounts,
       taskStatusBars: taskStatusBars,
       managerPerformance: managerPerformance,
       careerStages: careerStages,
       recommendations: recommendations,
       trendCards: (function () {
         var history = state.enterprise.analyticsHistory || [];
         var hasHistory = history.length >= 3;
         return [
           {
             label: 'Lead Volume Trend',
             value: totalLeadVolume,
             note: hasHistory
               ? 'Historical lead intake over last ' + history.length + ' check-ins.'
               : 'Current intake volume split across registrations, contacts, and careers.',
             points: hasHistory ? history.map(function (h) { return h.leads; }) : stages.map(function (stage) { return stage.value; }),
             stroke: '#0f766e',
             fill: 'rgba(15,118,110,0.12)'
           },
           {
             label: 'Open-Task Trend',
             value: openTasks.length + ' open',
             note: hasHistory
               ? 'Open task count history across last ' + history.length + ' analytics renders.'
               : 'Tasks currently open across all assignees.',
             points: hasHistory ? history.map(function (h) { return h.open; }) : taskStatusBars.map(function (item) { return item.value; }),
             stroke: '#2563eb',
             fill: 'rgba(37,99,235,0.12)'
           },
           {
             label: 'Project Momentum',
             value: avgProjectProgress + '%',
             note: hasHistory
               ? 'Avg project progress history across last ' + history.length + ' check-ins.'
               : 'Average project progress across the filtered portfolio.',
             points: hasHistory ? history.map(function (h) { return h.progress; }) : (projects.length ? projects : [{ progress: 0 }]).map(function (project) { return Number(project.progress) || 0; }),
             stroke: '#d97706',
             fill: 'rgba(217,119,6,0.12)'
           }
         ];
       }())
     };
   }

   function exportAnalyticsSnapshot() {
     const snapshot = state.analyticsSnapshot || buildAnalyticsSnapshot();
     const rows = [];

     rows.push(['summary', 'workforce_in_scope', snapshot.employees.length, 'Employees visible under active filters']);
     rows.push(['summary', 'open_tasks', snapshot.openTasks.length, 'Tasks not yet completed']);
     rows.push(['summary', 'overdue_tasks', snapshot.overdueTasks.length, 'Tasks past due date']);
     rows.push(['summary', 'project_health_avg_progress', snapshot.avgProjectProgress + '%', 'Average project progress']);
     rows.push(['summary', 'execution_rate', snapshot.doneRate + '%', 'Completed task percentage']);
     rows.push(['summary', 'lead_volume', totals.allRequests || 0, 'Registrations + contacts + careers']);

     snapshot.trendCards.forEach(function (card) {
       rows.push(['trend', card.label, card.value, card.note]);
     });

     Object.keys(snapshot.deptCounts).forEach(function (department) {
       rows.push(['workforce', department, snapshot.deptCounts[department], 'Employees in department']);
     });

     snapshot.taskStatusBars.forEach(function (item) {
       rows.push(['task_flow', item.label, item.value, item.subtext]);
     });

     snapshot.managerPerformance.forEach(function (manager) {
       rows.push(['manager', manager.label, manager.score, 'team=' + manager.teamSize + '; open=' + manager.open + '; overdue=' + manager.overdue + '; completed=' + manager.completed]);
     });

     rows.push(['hiring', 'applicants', snapshot.careerStages.applicants, 'Career applications']);
     rows.push(['hiring', 'pending_review', snapshot.careerStages.pending, 'No interview/accept action recorded yet']);
     rows.push(['hiring', 'interviewed', snapshot.careerStages.interviewed, 'Interview action logged']);
     rows.push(['hiring', 'accepted', snapshot.careerStages.accepted, 'Accepted action logged']);

     snapshot.workloadEntries.forEach(function (entry) {
       rows.push(['workload', entry.label, entry.value, 'Open tasks assigned']);
     });

     snapshot.projects.forEach(function (project) {
       rows.push(['project', project.name || 'Untitled Project', (Number(project.progress) || 0) + '%', (project.status || 'Unknown') + ' • owner=' + (project.owner || 'No owner')]);
     });

     snapshot.recommendations.forEach(function (item) {
       rows.push(['recommendation', item.title, 'needed', item.body]);
     });

     downloadCsv('analytics-overview.csv', ['Section', 'Metric', 'Value', 'Note'], rows);
     addAuditLog('export.csv', 'analytics', 'Analytics overview exported.', 'medium');
   }

   function openAnalyticsDetailModal(title, html) {
     if (!analyticsDetailModal || !analyticsDetailTitle || !analyticsDetailBody) return;
     analyticsDetailTitle.textContent = title;
     analyticsDetailBody.innerHTML = html;
     openModal(analyticsDetailModal);
   }

   function openManagerDetailModal(managerKey) {
     var allEmployees = state.enterprise.employees || [];
     var allTasks = state.enterprise.tasks || [];
     var teamMembers = allEmployees.filter(function (e) { return e.manager === managerKey; });
     var teamNameSet = {};
     teamMembers.forEach(function (e) { teamNameSet[String(e.name || '').toLowerCase()] = true; });
     var teamTasks = allTasks.filter(function (t) { return teamNameSet[String(t.assignee || '').toLowerCase()]; });
     var openTasks = teamTasks.filter(function (t) { return t.status !== 'done'; });
     var overdueTasks = openTasks.filter(function (t) {
       return t.dueDate && !isNaN(new Date(t.dueDate).getTime()) && new Date(t.dueDate).getTime() < Date.now();
     });
     var doneTasks = teamTasks.filter(function (t) { return t.status === 'done'; });
     var score = Math.max(0, Math.min(100, 100 - (overdueTasks.length * 18) - (openTasks.length * 4) + (doneTasks.length * 8)));
     var mgrData = state.analyticsSnapshot && state.analyticsSnapshot.managerPerformance
       ? state.analyticsSnapshot.managerPerformance.find(function (m) { return m.label === managerKey; })
       : null;
     var strokeColor = score >= 70 ? '#0f766e' : (score >= 50 ? '#d97706' : '#dc2626');
     var fillColor = score >= 70 ? 'rgba(15,118,110,0.10)' : (score >= 50 ? 'rgba(217,119,6,0.10)' : 'rgba(220,38,38,0.10)');
     var sparklineHTML = mgrData ? buildAnalyticsSparkline(mgrData.points, strokeColor, fillColor) : '';
     var statusColors = { todo: '#94a3b8', in_progress: '#2563eb', review: '#f59e0b', done: '#059669' };
     var statusLabels = { todo: 'To Do', in_progress: 'In Progress', review: 'Review', done: 'Done' };
     var teamHTML = teamMembers.length
       ? teamMembers.map(function (e) {
           return '<div class="adetail-team-member">' +
             '<strong>' + escapeHtml(e.name || 'Unknown') + '</strong>' +
             '<span>' + escapeHtml((e.department || 'No dept') + ' \u2022 ' + (e.role || 'No role')) + '</span>' +
           '</div>';
         }).join('')
       : '<div class="analytics-empty">No direct reports found.</div>';
     var openTasksHTML = openTasks.length
       ? openTasks.slice(0, 8).map(function (t) {
           var overdue = t.dueDate && new Date(t.dueDate).getTime() < Date.now();
           return '<div class="adetail-task-row' + (overdue ? ' adetail-task-overdue' : '') + '">' +
             '<span>' + escapeHtml(t.title || 'Untitled') + '</span>' +
             '<div><em style="color:' + (statusColors[t.status] || '#888') + '">' + escapeHtml(statusLabels[t.status] || String(t.status)) + '</em>' +
             (t.dueDate ? '<small>' + escapeHtml(formatDate(t.dueDate)) + (overdue ? ' \u26a0' : '') + '</small>' : '') +
             '</div>' +
           '</div>';
         }).join('')
       : '<div class="analytics-empty">No open tasks.</div>';
     var html = '<div class="adetail-score-row">' +
       sparklineHTML +
       '<div class="adetail-metrics">' +
       '<div class="adetail-metric"><span>Score</span><strong>' + score + '</strong></div>' +
       '<div class="adetail-metric"><span>Team</span><strong>' + teamMembers.length + '</strong></div>' +
       '<div class="adetail-metric"><span>Open</span><strong>' + openTasks.length + '</strong></div>' +
       '<div class="adetail-metric"><span>Overdue</span><strong class="' + (overdueTasks.length ? 'adetail-alert' : '') + '">' + overdueTasks.length + '</strong></div>' +
       '<div class="adetail-metric"><span>Done</span><strong>' + doneTasks.length + '</strong></div>' +
       '</div>' +
       '</div>' +
       '<h4 class="adetail-section-head">Team Members</h4>' + teamHTML +
       '<h4 class="adetail-section-head">Open Work</h4>' + openTasksHTML;
     openAnalyticsDetailModal('Manager: ' + managerKey, html);
   }

   function openProjectDetailModal(projectId) {
     var project = (state.enterprise.projects || []).find(function (p) { return String(p.id) === String(projectId); });
     if (!project) return;
     var relatedTasks = (state.enterprise.tasks || []).filter(function (t) { return (t.project || '') === (project.name || ''); });
     var openTasks = relatedTasks.filter(function (t) { return t.status !== 'done'; });
     var overdueTasks = openTasks.filter(function (t) {
       return t.dueDate && !isNaN(new Date(t.dueDate).getTime()) && new Date(t.dueDate).getTime() < Date.now();
     });
     var doneTasks = relatedTasks.filter(function (t) { return t.status === 'done'; });
     var statusColors = { todo: '#94a3b8', in_progress: '#2563eb', review: '#f59e0b', done: '#059669' };
     var statusLabels = { todo: 'To Do', in_progress: 'In Progress', review: 'Review', done: 'Done' };
     var progressPct = Number(project.progress) || 0;
     var riskTone = String(project.status || '').toLowerCase() === 'at risk' || progressPct < 45 ? 'danger' : (progressPct < 70 ? 'warn' : 'ok');
     var progressColor = riskTone === 'danger' ? 'linear-gradient(90deg,#dc2626,#f97316)' : (riskTone === 'warn' ? 'linear-gradient(90deg,#d97706,#fbbf24)' : 'linear-gradient(90deg,#059669,#34d399)');
     var tasksHTML = relatedTasks.length
       ? relatedTasks.slice(0, 10).map(function (t) {
           var overdue = t.status !== 'done' && t.dueDate && new Date(t.dueDate).getTime() < Date.now();
           return '<div class="adetail-task-row' + (overdue ? ' adetail-task-overdue' : '') + '">' +
             '<span>' + escapeHtml(t.title || 'Untitled') + '</span>' +
             '<div><em style="color:' + (statusColors[t.status] || '#888') + '">' + escapeHtml(statusLabels[t.status] || String(t.status)) + '</em>' +
             (t.assignee ? '<small>' + escapeHtml(t.assignee) + '</small>' : '') +
             '</div>' +
           '</div>';
         }).join('')
       : '<div class="analytics-empty">No tasks linked to this project.</div>';
     var html = '<div class="adetail-project-head">' +
       '<div class="adetail-metrics">' +
       '<div class="adetail-metric"><span>Owner</span><strong>' + escapeHtml(project.owner || 'Unassigned') + '</strong></div>' +
       '<div class="adetail-metric"><span>Status</span><strong>' + escapeHtml(project.status || 'Unknown') + '</strong></div>' +
       '<div class="adetail-metric"><span>Deadline</span><strong>' + escapeHtml(project.deadline ? formatDate(project.deadline) : 'No deadline') + '</strong></div>' +
       '<div class="adetail-metric"><span>Open</span><strong>' + openTasks.length + '</strong></div>' +
       '<div class="adetail-metric"><span>Overdue</span><strong class="' + (overdueTasks.length ? 'adetail-alert' : '') + '">' + overdueTasks.length + '</strong></div>' +
       '<div class="adetail-metric"><span>Done</span><strong>' + doneTasks.length + '</strong></div>' +
       '</div>' +
       '<div class="adetail-progress-row">' +
       '<label>Progress</label>' +
       '<div class="analytics-bar-track" style="flex:1;max-width:320px;"><i style="--bar-target-w:' + progressPct + '%;background:' + progressColor + '"></i></div>' +
       '<strong>' + progressPct + '%</strong>' +
       '</div>' +
       '</div>' +
       '<h4 class="adetail-section-head">Linked Tasks</h4>' + tasksHTML;
     openAnalyticsDetailModal('Project: ' + escapeHtml(project.name || 'Untitled'), html);
   }

   function renderAnalytics() {
     if (!analyticsFunnel || !analyticsInsights) return;
     recordAnalyticsHistoryPoint();
     const snapshot = buildAnalyticsSnapshot();
     state.analyticsSnapshot = snapshot;

     analyticsFunnel.innerHTML = snapshot.stages.map(function (stage) {
       const pct = Math.round((stage.value / snapshot.totalLeadVolume) * 100);
       return '<div class="funnel-item"><span>' + escapeHtml(stage.label) + ' (' + escapeHtml(String(stage.value)) + ')</span><div class="funnel-bar"><i style="width:' + pct + '%;background:' + stage.color + '"></i></div><span>' + pct + '%</span></div>';
     }).join('');

     if (analyticsSummaryCards) {
       analyticsSummaryCards.innerHTML = [
         { label: 'Workforce In Scope', value: snapshot.employees.length, note: 'Employees visible under current filters' },
         { label: 'Open Work', value: snapshot.openTasks.length, note: 'Tasks still in motion across teams' },
         { label: 'Overdue Tasks', value: snapshot.overdueTasks.length, note: snapshot.overdueTasks.length ? 'Escalation needed now' : 'No overdue work right now' },
         { label: 'Project Health', value: snapshot.avgProjectProgress + '%', note: snapshot.atRiskProjects.length + ' at-risk projects in view' },
         { label: 'Execution Rate', value: snapshot.doneRate + '%', note: 'Tasks completed in selected scope' },
         { label: 'Lead Volume', value: totals.allRequests || 0, note: 'Registrations, contacts, and careers combined' }
       ].map(function (card) {
         return '<div class="analytics-summary-card">' +
           '<span>' + escapeHtml(card.label) + '</span>' +
           '<strong>' + escapeHtml(String(card.value)) + '</strong>' +
           '<small>' + escapeHtml(card.note) + '</small>' +
         '</div>';
       }).join('');
     }

     renderAnalyticsTrendCards(snapshot.trendCards);

     if (analyticsDeliveryHealth) {
       analyticsDeliveryHealth.innerHTML = '<div class="analytics-health-score">' +
         '<div class="analytics-health-ring"><i style="height:' + snapshot.healthScore + '%"></i><span>' + escapeHtml(String(snapshot.healthScore)) + '</span></div>' +
         '<div class="analytics-health-copy">' +
           '<strong>' + (snapshot.healthScore >= 80 ? 'Strong delivery rhythm' : (snapshot.healthScore >= 60 ? 'Watch delivery pressure' : 'Immediate delivery risk')) + '</strong>' +
           '<p>' + escapeHtml(snapshot.overdueTasks.length + ' overdue tasks, ' + snapshot.atRiskProjects.length + ' at-risk projects, ' + snapshot.doneRate + '% execution rate.') + '</p>' +
           '<div class="analytics-health-tags">' +
             '<span>' + escapeHtml(snapshot.openTasks.length + ' open tasks') + '</span>' +
             '<span>' + escapeHtml(snapshot.projects.length + ' active projects') + '</span>' +
             '<span>' + escapeHtml(snapshot.workloadGap + ' workload spread') + '</span>' +
           '</div>' +
         '</div>' +
       '</div>';
     }

     renderAnalyticsBars(analyticsWorkforceBars, Object.keys(snapshot.deptCounts).map(function (department) {
       return {
         label: department,
         value: snapshot.deptCounts[department],
         displayValue: snapshot.deptCounts[department] + ' people',
         subtext: Math.round((snapshot.deptCounts[department] / Math.max(snapshot.employees.length, 1)) * 100) + '% of scoped workforce',
         color: 'linear-gradient(90deg,#2563eb,#60a5fa)'
       };
     }).sort(function (a, b) { return b.value - a.value; }), 'No employee distribution available for this scope.');

     renderAnalyticsBars(analyticsTaskStatusBars, snapshot.taskStatusBars, 'No task execution data available for this scope.');

     if (analyticsManagerPerformance) {
       if (!snapshot.managerPerformance.length) {
         analyticsManagerPerformance.innerHTML = '<div class="analytics-empty">No manager performance data available.</div>';
       } else {
         analyticsManagerPerformance.innerHTML = snapshot.managerPerformance.slice(0, 6).map(function (manager) {
           return '<div class="analytics-manager-item" data-manager-key="' + escapeHtml(manager.label) + '">' +
             '<div class="analytics-manager-head"><strong>' + escapeHtml(manager.label) + '</strong><span>Score ' + escapeHtml(String(manager.score)) + '</span></div>' +
             buildAnalyticsSparkline(manager.points, manager.score >= 70 ? '#0f766e' : (manager.score >= 50 ? '#d97706' : '#dc2626'), manager.score >= 70 ? 'rgba(15,118,110,0.10)' : (manager.score >= 50 ? 'rgba(217,119,6,0.10)' : 'rgba(220,38,38,0.10)')) +
             '<div class="analytics-manager-metrics">' +
               '<span>Team ' + escapeHtml(String(manager.teamSize)) + '</span>' +
               '<span>Open ' + escapeHtml(String(manager.open)) + '</span>' +
               '<span>Overdue ' + escapeHtml(String(manager.overdue)) + '</span>' +
               '<span>Done ' + escapeHtml(String(manager.completed)) + '</span>' +
             '</div>' +
           '</div>';
         }).join('');
       }
     }

     if (analyticsHiringFunnel) {
       analyticsHiringFunnel.innerHTML = [
         { label: 'Applicants', value: snapshot.careerStages.applicants, note: 'Career applications received', tone: 'stage-blue' },
         { label: 'Pending Review', value: snapshot.careerStages.pending, note: 'Awaiting recruiter action', tone: 'stage-slate' },
         { label: 'Interviewed', value: snapshot.careerStages.interviewed, note: 'Interview action logged', tone: 'stage-amber' },
         { label: 'Accepted', value: snapshot.careerStages.accepted, note: 'Acceptance action logged', tone: 'stage-green' }
       ].map(function (stage) {
         return '<div class="analytics-stage-card ' + stage.tone + '">' +
           '<span>' + escapeHtml(stage.label) + '</span>' +
           '<strong>' + escapeHtml(String(stage.value)) + '</strong>' +
           '<small>' + escapeHtml(stage.note) + '</small>' +
         '</div>';
       }).join('');
     }

     renderAnalyticsBars(analyticsWorkloadBars, snapshot.workloadEntries.slice(0, 6).map(function (entry) {
       return {
         label: entry.label,
         value: entry.value,
         displayValue: entry.value + ' open',
         subtext: entry.value >= 4 ? 'Potential overload' : (entry.value === 0 ? 'Idle capacity' : 'Healthy load'),
         color: entry.value >= 4 ? 'linear-gradient(90deg,#dc2626,#f97316)' : 'linear-gradient(90deg,#0f766e,#14b8a6)'
       };
     }), 'No assignee workload data available.');

     if (analyticsProjectRisks) {
       if (!snapshot.projects.length) {
         analyticsProjectRisks.innerHTML = '<div class="analytics-empty">No projects available for this scope.</div>';
       } else {
         analyticsProjectRisks.innerHTML = snapshot.projects.slice().sort(function (a, b) {
           return (Number(a.progress) || 0) - (Number(b.progress) || 0);
         }).map(function (project) {
           const deadlineText = project.deadline ? formatDate(project.deadline) : 'No deadline';
           const riskTone = String(project.status || '').toLowerCase() === 'at risk' || (Number(project.progress) || 0) < 45 ? 'risk-high' : ((Number(project.progress) || 0) < 70 ? 'risk-medium' : 'risk-low');
           return '<div class="analytics-risk-item ' + riskTone + '" data-project-id="' + escapeHtml(String(project.id || '')) + '">' +
             '<div><strong>' + escapeHtml(project.name || 'Untitled Project') + '</strong><span>' + escapeHtml((project.owner || 'No owner') + ' • ' + deadlineText) + '</span></div>' +
             '<div class="analytics-risk-meta"><em>' + escapeHtml(project.status || 'Unknown') + '</em><b>' + escapeHtml(String(Number(project.progress) || 0)) + '%</b></div>' +
           '</div>';
         }).join('');
       }
     }

     if (analyticsRecommendations) {
       analyticsRecommendations.innerHTML = snapshot.recommendations.map(function (item) {
         return '<div class="analytics-recommendation-item">' +
           '<strong>' + escapeHtml(item.title) + '</strong>' +
           '<p>' + escapeHtml(item.body) + '</p>' +
         '</div>';
       }).join('');
     }

     const strongestLead = snapshot.stages.slice().sort(function (a, b) { return b.value - a.value; })[0];
     analyticsInsights.innerHTML = [
       'Highest intake source: ' + strongestLead.label + ' with ' + strongestLead.value + ' entries in the current window.',
       'Scoped workforce includes ' + snapshot.employees.length + ' employees across ' + Object.keys(snapshot.deptCounts).length + ' departments.',
       'Execution posture: ' + snapshot.openTasks.length + ' open tasks, ' + snapshot.overdueTasks.length + ' overdue, and ' + snapshot.doneRate + '% completed.',
       'Hiring funnel: ' + snapshot.careerStages.applicants + ' applicants, ' + snapshot.careerStages.interviewed + ' interviewed, ' + snapshot.careerStages.accepted + ' accepted.',
       'Project portfolio average progress is ' + snapshot.avgProjectProgress + '%, with ' + snapshot.atRiskProjects.length + ' projects flagged at risk.',
       'Filters: country=' + snapshot.scopedCountry + ', department=' + snapshot.deptValue + ', role=' + snapshot.roleValue + ', period=' + snapshot.timeValue + '.',
       'Recommended operating move: focus first on overdue-task reduction, then rebalance assignee load where open work is concentrated.'
     ].map(function (v) { return '<li>' + escapeHtml(v) + '</li>'; }).join('');
   }

  function syncFilterSources() {
    const departments = (state.enterprise.departments || []).map(function (d) { return d.name; });
    const roles = (state.enterprise.roles || []).map(function (r) { return r.name; });
    const projects = (state.enterprise.projects || []).map(function (p) { return p.name; });

    if (employeeDeptFilter) {
      employeeDeptFilter.innerHTML = ['<option value="all">All Departments</option>'].concat(
        departments.map(function (d) { return '<option value="' + escapeHtml(d) + '">' + escapeHtml(d) + '</option>'; })
      ).join('');
    }

    if (analyticsDepartmentFilter) {
      analyticsDepartmentFilter.innerHTML = ['<option value="all">All Departments</option>'].concat(
        departments.map(function (d) { return '<option value="' + escapeHtml(d) + '">' + escapeHtml(d) + '</option>'; })
      ).join('');
    }

    if (analyticsRoleFilter) {
      analyticsRoleFilter.innerHTML = ['<option value="all">All Roles</option>'].concat(
        roles.map(function (r) { return '<option value="' + escapeHtml(r) + '">' + escapeHtml(r) + '</option>'; })
      ).join('');
    }

    if (taskProjectFilter) {
      taskProjectFilter.innerHTML = ['<option value="all">All Projects</option>'].concat(
        projects.map(function (p) { return '<option value="' + escapeHtml(p) + '">' + escapeHtml(p) + '</option>'; })
      ).join('');
    }
  }

  function renderOrganization() {
    if (departmentsBody) {
      const rows = state.enterprise.departments || [];
      if (!rows.length) {
        renderNoRows(departmentsBody, 6);
      } else {
        departmentsBody.innerHTML = rows.map(function (d) {
          const members = (state.enterprise.employees || []).filter(function (e) { return e.department === d.name; }).length;
          const canManageOrg = can('organization.manage');
          return '<tr>' +
            '<td>' + escapeHtml(d.name) + '</td>' +
            '<td>' + escapeHtml(d.lead || '-') + '</td>' +
            '<td>' + escapeHtml(d.parent || '-') + '</td>' +
            '<td>' + members + '</td>' +
            '<td>' + escapeHtml(d.region || '-') + '</td>' +
            '<td>' +
              (canManageOrg ? '<button class="row-icon-btn danger" data-action="delete-dept" data-id="' + d.id + '">✕</button>' : '<span style="color:#64748b;">Read only</span>') +
            '</td>' +
          '</tr>';
        }).join('');
      }
    }

    if (employeesBody) {
      const q = (employeeSearch && employeeSearch.value || '').trim().toLowerCase();
      const dept = (employeeDeptFilter && employeeDeptFilter.value) || 'all';
      const country = (countryFilter && countryFilter.value) || 'all';
      const rows = (state.enterprise.employees || []).filter(function (e) {
        const deptOk = dept === 'all' || e.department === dept;
        const countryOk = country === 'all' || e.country === country;
        const qOk = !q || [e.name, e.email, e.manager, e.department].join(' ').toLowerCase().includes(q);
        return deptOk && countryOk && qOk;
      });

      if (!rows.length) {
        renderNoRows(employeesBody, 6);
      } else {
        employeesBody.innerHTML = rows.map(function (e) {
          return '<tr>' +
            '<td>' + escapeHtml(e.name) + '</td>' +
            '<td>' + escapeHtml(e.email) + '</td>' +
            '<td>' + escapeHtml(e.department) + '</td>' +
            '<td>' + escapeHtml(e.manager) + '</td>' +
            '<td>' + escapeHtml(e.country) + '</td>' +
            '<td>' + escapeHtml(e.phone || '-') + '</td>' +
          '</tr>';
        }).join('');
      }
    }
  }

  function renderProjects() {
    if (projectsBody) {
      const rows = state.enterprise.projects || [];
      if (!rows.length) {
        renderNoRows(projectsBody, 5);
      } else {
        projectsBody.innerHTML = rows.map(function (p) {
          return '<tr>' +
            '<td>' + escapeHtml(p.name) + '</td>' +
            '<td>' + escapeHtml(p.owner || '-') + '</td>' +
            '<td>' + escapeHtml(p.status || '-') + '</td>' +
            '<td>' + escapeHtml(formatDate(p.deadline)) + '</td>' +
            '<td>' + escapeHtml(String(p.progress || 0)) + '%</td>' +
          '</tr>';
        }).join('');
      }
    }

    if (tasksBody) {
      const proj = (taskProjectFilter && taskProjectFilter.value) || 'all';
      const rows = (state.enterprise.tasks || []).filter(function (t) {
        return proj === 'all' || t.project === proj;
      });
      if (!rows.length) {
        renderNoRows(tasksBody, 7);
      } else {
        tasksBody.innerHTML = rows.map(function (t) {
          const canManageTasks = can('tasks.manage');
          return '<tr>' +
            '<td>' + escapeHtml(t.title) + '</td>' +
            '<td>' + escapeHtml(t.project) + '</td>' +
            '<td>' + escapeHtml(t.assignee || '-') + '</td>' +
            '<td>' + escapeHtml(t.priority || 'Medium') + '</td>' +
            '<td><span class="source-badge source-pre">' + escapeHtml(t.status || 'todo') + '</span></td>' +
            '<td>' + escapeHtml(formatDate(t.dueDate)) + '</td>' +
            '<td>' +
              (canManageTasks ? '<button class="row-icon-btn" data-action="advance-task" data-id="' + t.id + '">Advance</button>' : '<span style="color:#64748b;">Read only</span>') +
            '</td>' +
          '</tr>';
        }).join('');
      }
    }
  }

  function renderEnterpriseOverviewStats() {
    if (statActiveEmployees) {
      statActiveEmployees.textContent = String((state.enterprise.employees || []).length);
    }
    if (statOpenTasks) {
      const openTasks = (state.enterprise.tasks || []).filter(function (t) { return t.status !== 'done'; }).length;
      statOpenTasks.textContent = String(openTasks);
    }
  }

  function getFilteredAuditLogs() {
    const q = (auditSearch && auditSearch.value || '').trim().toLowerCase();
    const sev = auditSeverityFilter ? auditSeverityFilter.value : 'all';
    return (state.enterprise.auditLogs || []).filter(function (log) {
      const sevOk = sev === 'all' || log.severity === sev;
      if (!sevOk) return false;
      if (!q) return true;
      return [log.actor, log.action, log.entity, log.details].join(' ').toLowerCase().includes(q);
    });
  }

  function renderAuditTable() {
    if (!auditBody) return;
    const rows = getFilteredAuditLogs();
    if (!rows.length) {
      renderNoRows(auditBody, 6);
      return;
    }
    auditBody.innerHTML = rows.map(function (log) {
      const sevClass = log.severity === 'high' ? 'source-badge source-studio' : (log.severity === 'medium' ? 'source-badge source-pre' : 'source-badge source-landing');
      return '<tr>' +
        '<td>' + escapeHtml(formatDate(log.time)) + '</td>' +
        '<td>' + escapeHtml(log.actor) + '</td>' +
        '<td>' + escapeHtml(log.action) + '</td>' +
        '<td>' + escapeHtml(log.entity) + '</td>' +
        '<td><span class="' + sevClass + '">' + escapeHtml(log.severity) + '</span></td>' +
        '<td>' + escapeHtml(log.details) + '</td>' +
      '</tr>';
    }).join('');
  }

  function renderSecuritySettings() {
    if (!securityMfaRequired) return;
    const s = state.enterprise.security || {};
    securityMfaRequired.checked = !!s.mfaRequired;
    securitySsoRequired.checked = !!s.ssoRequired;
    securitySessionLock.checked = !!s.sessionLock;
    securityPiiMasking.checked = !!s.piiMasking;
    securityIpAllowlist.checked = !!s.ipAllowlist;
    securityImmutableAudit.checked = !!s.immutableAudit;
  }

  function renderNotifications() {
    if (!notificationsBody) return;
    const rows = state.enterprise.notifications || [];
    if (!rows.length) {
      renderNoRows(notificationsBody, 6);
      return;
    }

    notificationsBody.innerHTML = rows.map(function (n) {
      const statusClass = n.status === 'sent' ? 'source-badge source-landing' : 'source-badge source-pre';
      const canManageNotifications = can('notifications.manage');
      return '<tr>' +
        '<td>' + escapeHtml(formatDate(n.time)) + '</td>' +
        '<td>' + escapeHtml(n.title) + '</td>' +
        '<td>' + escapeHtml(n.channel) + '</td>' +
        '<td><span class="' + statusClass + '">' + escapeHtml(n.status) + '</span></td>' +
        '<td>' + escapeHtml(n.audience) + '</td>' +
        '<td><div class="row-actions">' +
          (canManageNotifications ? '<button class="row-icon-btn danger" data-action="delete-notification" data-id="' + n.id + '">✕</button>' : '<span style="color:#64748b;">Read only</span>') +
        '</div></td>' +
      '</tr>';
    }).join('');
  }

  function applyPermissionGuards() {
    if (usersAddBtn) usersAddBtn.disabled = !can('users.manage');
    if (roleCreateBtn) roleCreateBtn.disabled = !can('roles.manage');
    if (createApiKeyBtn) createApiKeyBtn.disabled = !can('api_keys.manage');
    if (saveSecuritySettingsBtn) saveSecuritySettingsBtn.disabled = !can('security.manage');
    if (queueNotificationBtn) queueNotificationBtn.disabled = !can('notifications.manage');
    if (addDepartmentBtn) addDepartmentBtn.disabled = !can('organization.manage');
    if (addProjectBtn) addProjectBtn.disabled = !can('projects.manage');
    if (addTaskBtn) addTaskBtn.disabled = !can('tasks.manage');
    if (generateMeetingBtn) generateMeetingBtn.disabled = !can('notifications.manage');
    if (languageFilter) languageFilter.disabled = !can('settings.manage');
    if (countryFilter) countryFilter.disabled = !can('settings.manage');
    if (realtimeToggleBtn) realtimeToggleBtn.disabled = !can('settings.manage');
  }

  function renderEnterprisePanels() {
    syncFilterSources();
    renderOverviewPanels();
    renderUsersTable();
    renderRolesTable();
    renderOrganization();
    renderProjects();
    renderApiKeysTable();
    renderMonitoring();
    renderBilling();
    renderAnalytics();
    renderAuditTable();
    renderSecuritySettings();
    renderNotifications();
    renderEnterpriseOverviewStats();
    applyPermissionGuards();
  }

  function pageSlice(rows, page) {
    const totalPages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
    const safePage = Math.min(Math.max(page, 1), totalPages);
    const start = (safePage - 1) * PAGE_SIZE;
    return {
      page: safePage,
      totalPages: totalPages,
      rows: rows.slice(start, start + PAGE_SIZE)
    };
  }

  function renderNoRows(body, colCount) {
    body.innerHTML = '<tr><td colspan="' + colCount + '">No records found.</td></tr>';
  }

  function rowActions(type, id) {
    return '<div class="row-actions">' +
      '<button class="row-icon-btn" type="button" title="Edit" aria-label="Edit" data-action="edit" data-type="' + type + '" data-id="' + id + '">' +
        '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zm14.71-9.04a1.003 1.003 0 0 0 0-1.42l-2.5-2.5a1.003 1.003 0 0 0-1.42 0l-1.96 1.96 3.75 3.75 2.13-1.79z"></path></svg>' +
      '</button>' +
      '<button class="row-icon-btn danger" type="button" title="Delete" aria-label="Delete" data-action="delete" data-type="' + type + '" data-id="' + id + '">' +
        '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M6 7h12l-1 14H7L6 7zm3-3h6l1 2h4v2H4V6h4l1-2z"></path></svg>' +
      '</button>' +
      '</div>';
  }

  function careerStatusActions(id) {
    return '<div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:6px;">' +
      '<button class="career-action-btn interview" type="button" data-action="interview" data-type="careers" data-id="' + id + '">Interview Schedule</button>' +
      '<button class="career-action-btn accepted" type="button" data-action="accepted" data-type="careers" data-id="' + id + '">Accepted</button>' +
      '</div>';
  }

  function getRegistrationSourceLabel(source) {
    var value = String(source || '').trim().toLowerCase();
    if (value === 'public_registration_portal') {
      return { text: 'Pre-Registration Link', className: 'source-badge source-pre' };
    }
    if (value === 'qstudio_landing') {
      return { text: 'QStudio Landing', className: 'source-badge source-studio' };
    }
    if (value === 'landing_modal') {
      return { text: 'Landing Page', className: 'source-badge source-landing' };
    }
    return { text: 'Unknown', className: 'source-badge source-unknown' };
  }

  function getFilteredRegistrations() {
    const q = (registrationsSearch && registrationsSearch.value || '').trim().toLowerCase();
    return state.tables.registrations.rows.filter(function (row) {
      if (!q) return true;
      const hay = [row.first_name, row.last_name, row.email, row.phone, row.company, row.role, row.use_case, row.source].join(' ').toLowerCase();
      return hay.includes(q);
    });
  }

  function getFilteredContacts() {
    const q = (contactsSearch && contactsSearch.value || '').trim().toLowerCase();
    return state.tables.contacts.rows.filter(function (row) {
      if (!q) return true;
      const hay = [row.name, row.email, row.company, row.message].join(' ').toLowerCase();
      return hay.includes(q);
    });
  }

  function getFilteredCareers() {
    const q = (careersSearch && careersSearch.value || '').trim().toLowerCase();
    const roleFilter = careersRoleFilter ? careersRoleFilter.value : 'all';
    return state.tables.careers.rows.filter(function (row) {
      const roleOk = roleFilter === 'all' || (row.role_applied || '') === roleFilter;
      if (!roleOk) return false;
      if (!q) return true;
      const hay = [row.first_name, row.last_name, row.email, row.role_applied, row.university, row.degree].join(' ').toLowerCase();
      return hay.includes(q);
    });
  }

  function renderRegistrationsTable() {
    const filtered = getFilteredRegistrations();
    const paged = pageSlice(filtered, state.tables.registrations.page);
    state.tables.registrations.page = paged.page;

    if (!paged.rows.length) {
      renderNoRows(registrationsBody, 8);
    } else {
      registrationsBody.innerHTML = paged.rows.map(function (row) {
        var sourceMeta = getRegistrationSourceLabel(row.source);
        return '<tr>' +
          '<td>' + escapeHtml((row.first_name || '') + ' ' + (row.last_name || '')) + '</td>' +
          '<td>' + escapeHtml(row.email || '-') + '</td>' +
          '<td>' + escapeHtml(row.phone || '-') + '</td>' +
          '<td>' + escapeHtml(row.company || '-') + '</td>' +
          '<td>' + escapeHtml(row.role || '-') + '</td>' +
          '<td><span class="' + sourceMeta.className + '">' + escapeHtml(sourceMeta.text) + '</span></td>' +
          '<td>' + escapeHtml(formatDate(row.registered_at)) + '</td>' +
          '<td>' + rowActions('registrations', row.id) + '</td>' +
        '</tr>';
      }).join('');
    }

    registrationsPageInfo.textContent = 'Page ' + paged.page + ' of ' + paged.totalPages + ' • ' + filtered.length + ' results';
    registrationsPrevBtn.disabled = paged.page <= 1;
    registrationsNextBtn.disabled = paged.page >= paged.totalPages;
  }

  function renderContactsTable() {
    const filtered = getFilteredContacts();
    const paged = pageSlice(filtered, state.tables.contacts.page);
    state.tables.contacts.page = paged.page;

    if (!paged.rows.length) {
      renderNoRows(contactsBody, 6);
    } else {
      contactsBody.innerHTML = paged.rows.map(function (row) {
        return '<tr>' +
          '<td>' + escapeHtml(row.name || '-') + '</td>' +
          '<td>' + escapeHtml(row.email || '-') + '</td>' +
          '<td>' + escapeHtml(row.company || '-') + '</td>' +
          '<td>' + escapeHtml(row.message || '-') + '</td>' +
          '<td>' + escapeHtml(formatDate(row.sent_at)) + '</td>' +
          '<td>' + rowActions('contacts', row.id) + '</td>' +
        '</tr>';
      }).join('');
    }

    contactsPageInfo.textContent = 'Page ' + paged.page + ' of ' + paged.totalPages + ' • ' + filtered.length + ' results';
    contactsPrevBtn.disabled = paged.page <= 1;
    contactsNextBtn.disabled = paged.page >= paged.totalPages;
  }

  function renderCareersTable() {
    const filtered = getFilteredCareers();
    const paged = pageSlice(filtered, state.tables.careers.page);
    state.tables.careers.page = paged.page;

    if (!paged.rows.length) {
      renderNoRows(careersBody, 8);
    } else {
      careersBody.innerHTML = paged.rows.map(function (row) {
        return '<tr>' +
          '<td>' + escapeHtml((row.first_name || '') + ' ' + (row.last_name || '')) + '</td>' +
          '<td>' + escapeHtml(row.email || '-') + '</td>' +
          '<td>' + escapeHtml(row.role_applied || '-') + '</td>' +
          '<td>' + escapeHtml(row.university || '-') + '</td>' +
          '<td>' + escapeHtml(row.degree || '-') + '</td>' +
          '<td>' + escapeHtml(row.graduation_year || '-') + '</td>' +
          '<td>' + escapeHtml(formatDate(row.applied_at)) + '</td>' +
          '<td>' + careerStatusActions(row.id) + rowActions('careers', row.id) + '</td>' +
        '</tr>';
      }).join('');
    }

    careersPageInfo.textContent = 'Page ' + paged.page + ' of ' + paged.totalPages + ' • ' + filtered.length + ' results';
    careersPrevBtn.disabled = paged.page <= 1;
    careersNextBtn.disabled = paged.page >= paged.totalPages;
  }

  function renderTables() {
    renderRegistrationsTable();
    renderContactsTable();
    renderCareersTable();
  }

  function getRowsByType(type) {
    if (type === 'registrations') return state.tables.registrations.rows;
    if (type === 'contacts') return state.tables.contacts.rows;
    if (type === 'careers') return state.tables.careers.rows;
    return [];
  }

  function getEditablePayload(type, row) {
    if (type === 'registrations') {
      return {
        first_name: row.first_name || '',
        last_name: row.last_name || '',
        email: row.email || '',
        phone: row.phone || '',
        company: row.company || '',
        role: row.role || '',
        use_case: row.use_case || ''
      };
    }
    if (type === 'contacts') {
      return {
        name: row.name || '',
        email: row.email || '',
        company: row.company || '',
        message: row.message || ''
      };
    }
    return {
      first_name: row.first_name || '',
      last_name: row.last_name || '',
      email: row.email || '',
      phone: row.phone || '',
      role_applied: row.role_applied || '',
      location: row.location || '',
      university: row.university || '',
      degree: row.degree || '',
      graduation_year: row.graduation_year || 0,
      availability: row.availability || '',
      linkedin_url: row.linkedin_url || '',
      portfolio_url: row.portfolio_url || '',
      resume_url: row.resume_url || '',
      cover_letter: row.cover_letter || '',
      current_company: row.current_company || '',
      experience_years: row.experience_years || 0
    };
  }

  const fieldConfig = {
    registrations: [
      { key: 'first_name', label: 'First Name' },
      { key: 'last_name', label: 'Last Name' },
      { key: 'email', label: 'Email' },
      { key: 'phone', label: 'Phone' },
      { key: 'company', label: 'Company' },
      { key: 'role', label: 'Role' },
      { key: 'use_case', label: 'Use Case', multiline: true }
    ],
    contacts: [
      { key: 'name', label: 'Name' },
      { key: 'email', label: 'Email' },
      { key: 'company', label: 'Company' },
      { key: 'message', label: 'Message', multiline: true }
    ],
    careers: [
      { key: 'first_name', label: 'First Name' },
      { key: 'last_name', label: 'Last Name' },
      { key: 'email', label: 'Email' },
      { key: 'phone', label: 'Phone' },
      { key: 'role_applied', label: 'Role Applied' },
      { key: 'location', label: 'Location' },
      { key: 'university', label: 'University' },
      { key: 'degree', label: 'Degree' },
      { key: 'graduation_year', label: 'Graduation Year', numeric: true },
      { key: 'availability', label: 'Availability' },
      { key: 'linkedin_url', label: 'LinkedIn URL' },
      { key: 'portfolio_url', label: 'Portfolio URL' },
      { key: 'resume_url', label: 'Resume URL' },
      { key: 'current_company', label: 'Current Company' },
      { key: 'experience_years', label: 'Experience Years', numeric: true },
      { key: 'cover_letter', label: 'Cover Letter', multiline: true }
    ]
  };

  let activeEditContext = null;
  let activeConfirmAction = null;

  function openModal(modal) {
    modal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
  }

  function closeModal(modal) {
    modal.classList.add('hidden');
    document.body.style.overflow = '';
  }

  function openEditModal(type, row) {
    const payload = getEditablePayload(type, row);
    const fields = fieldConfig[type] || [];

    recordModalTitle.textContent = 'Edit ' + type.slice(0, -1).replace(/^./, function (c) { return c.toUpperCase(); });
    recordFormFields.innerHTML = fields.map(function (field) {
      const value = payload[field.key] == null ? '' : payload[field.key];
      const inputHtml = field.multiline
        ? '<textarea rows="4" name="' + field.key + '" spellcheck="true">' + escapeHtml(String(value)) + '</textarea>'
        : '<input type="' + (field.numeric ? 'number' : 'text') + '" name="' + field.key + '" value="' + escapeHtml(String(value)) + '">';

      return '<div class="modal-field">' +
        '<label>' + escapeHtml(field.label) + '</label>' +
        inputHtml +
      '</div>';
    }).join('');

    activeEditContext = { type: type, id: row.id };
    openModal(recordModal);
  }

  function openConfirmModal(message, actionFn) {
    confirmModalMessage.textContent = message;
    activeConfirmAction = actionFn;
    openModal(confirmModal);
  }

  async function editRecord(type, id) {
    const rows = getRowsByType(type);
    const row = rows.find(function (item) { return String(item.id) === String(id); });
    if (!row) {
      setStatus(composerStatus, 'Record not found.', 'err');
      return;
    }

    openEditModal(type, row);
  }

  async function deleteRecord(type, id) {
    openConfirmModal('Delete this record? This action cannot be undone.', async function () {
      try {
        await request('/api/admin/' + type + '/' + id, {
          method: 'DELETE',
          headers: authHeaders()
        });
        await loadDashboard();
        setStatus(composerStatus, 'Record deleted successfully.', 'ok');
        addAuditLog('record.deleted', type, 'Deleted record id ' + id + '.', 'high');
      } catch (err) {
        setStatus(composerStatus, err.message || 'Delete failed.', 'err');
      }
    });
  }

  async function sendCareerActionEmail(id, action) {
    try {
      const data = await request('/api/admin/careers/' + id + '/action', {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ action: action })
      });
      setStatus(composerStatus, data.message || 'Status email sent.', 'ok');
      addAuditLog('career.status.email', 'careers', 'Sent ' + action + ' email for career id ' + id + '.', 'medium');
    } catch (err) {
      setStatus(composerStatus, err.message || 'Failed to send status email.', 'err');
    }
  }

  function applyDashboardPayload(payload, options) {
    const opts = options || {};
    const totalsPayload = payload.totals || {};
    const summary = payload.summary || {};
    const monitoring = payload.monitoring || {};
    const tables = payload.tables || {};
    const forms = Array.isArray(payload.forms) ? payload.forms : [];

    totals = {
      registrations: totalsPayload.registrations || 0,
      contacts: totalsPayload.contacts || 0,
      careers: totalsPayload.careers || 0,
      allRequests: totalsPayload.allRequests || 0
    };

    if (statRegistrations) statRegistrations.textContent = totals.registrations;
    if (statContacts) statContacts.textContent = totals.contacts;
    if (statCareers) statCareers.textContent = totals.careers;
    if (statAll) statAll.textContent = totals.allRequests;
    if (statForms) statForms.textContent = String(summary.formsCount != null ? summary.formsCount : forms.length);

    ['registrations', 'contacts', 'careers'].forEach(function (type) {
      const countEl = document.getElementById('audienceCount-' + type);
      if (countEl) countEl.textContent = totals[type];
    });
    const audienceAll = document.getElementById('audienceCount-all');
    if (audienceAll) audienceAll.textContent = totals.allRequests;

    state.tables.registrations.rows = Array.isArray(tables.registrations) ? tables.registrations : [];
    state.tables.contacts.rows = Array.isArray(tables.contacts) ? tables.contacts : [];
    state.tables.careers.rows = Array.isArray(tables.careers) ? tables.careers : [];
    state.tables.registrations.page = 1;
    state.tables.contacts.page = 1;
    state.tables.careers.page = 1;

    state.dashboard.generatedAt = payload.generatedAt || '';
    state.dashboard.forms = forms;
    state.dashboard.monitoring = Object.assign({
      apiP95LatencyMs: 0,
      apiErrorRatePercent: 0,
      queueDepth: 0,
      openIncidents: 0,
      uptimeSeconds: 0,
      startedAt: ''
    }, monitoring || {});
    state.dashboard.summary = Object.assign({
      leadSources: [],
      latestActivityAt: '',
      activeEmployees: 0,
      openTasks: 0,
      queuedNotifications: 0,
      openIncidents: 0,
      formsCount: forms.length
    }, summary || {});

    applyEnterprisePayload(payload.enterprise || {});
    state.enterpriseServerReady = true;

    if (!opts.skipRender) {
      renderTables();
      renderFormsList(forms);
      renderEnterprisePanels();
    }
  }

  async function loadDashboardLegacy() {
    const [stats, registrations, contacts, careers, formsData] = await Promise.all([
      request('/api/admin/stats', { headers: authHeaders() }),
      request('/api/admin/registrations', { headers: authHeaders() }),
      request('/api/admin/contacts', { headers: authHeaders() }),
      request('/api/admin/careers', { headers: authHeaders() }),
      request('/api/admin/forms', { headers: authHeaders() }).catch(function () { return { data: [] }; })
    ]);

    await loadEnterpriseFromApi();

    applyDashboardPayload({
      totals: Object.assign({ forms: (formsData.data || []).length }, stats.totals || {}),
      tables: {
        registrations: registrations.data || [],
        contacts: contacts.data || [],
        careers: careers.data || []
      },
      forms: formsData.data || [],
      enterprise: state.enterprise,
      monitoring: state.dashboard.monitoring,
      summary: Object.assign({}, state.dashboard.summary, {
        formsCount: (formsData.data || []).length,
        activeEmployees: (state.enterprise.employees || []).length,
        openTasks: (state.enterprise.tasks || []).filter(function (task) { return task.status !== 'done'; }).length,
        queuedNotifications: (state.enterprise.notifications || []).filter(function (item) { return item.status === 'queued'; }).length,
        openIncidents: (state.enterprise.monitoringIncidents || []).length
      })
    });
  }

  async function loadDashboard(options) {
    const opts = options || {};
    try {
      const suffix = opts.forceRefresh ? '?refresh=true' : '';
      const dashboard = await request('/api/admin/dashboard' + suffix, { headers: authHeaders() });
      applyDashboardPayload((dashboard && dashboard.data) || {});
    } catch (err) {
      await loadDashboardLegacy();
      if (!opts.silent) {
        setStatus(composerStatus, 'Loaded dashboard using compatibility fallback.', 'ok');
      }
    }
  }

  function switchTab(tab) {
    document.querySelectorAll('.menu-item').forEach(function (item) {
      item.classList.toggle('active', item.getAttribute('data-tab') === tab);
    });
    document.querySelectorAll('.tab-panel').forEach(function (panel) {
      panel.classList.toggle('hidden', panel.id !== 'panel-' + tab);
    });
    const tabTitleMap = {
      overview: 'Overview',
      users: 'User Management',
      roles: 'Roles & Permissions',
      organization: 'Organization Structure',
      projects: 'Tasks & Projects',
      'api-access': 'API Access',
      monitoring: 'System Monitoring',
      billing: 'Billing',
      analytics: 'Analytics',
      audit: 'Audit Logs',
      security: 'Security Settings',
      notifications: 'Notifications',
      registrations: 'Registrations',
      contacts: 'Contacts',
      careers: 'Careers',
      forms: 'Forms',
      composer: 'Email Composer',
      'form-builder': 'Form Builder',
      'form-responses': 'Form Responses'
    };
    const displayName = tabTitleMap[tab] || (tab.charAt(0).toUpperCase() + tab.slice(1));
    pageTitle.textContent = displayName;
    if (pageSubtitle) {
      pageSubtitle.textContent = subtitleByTab[tab] || subtitleByTab.overview;
    }
  }

  function showApp() {
    loginView.classList.add('hidden');
    appView.classList.remove('hidden');
    if (monitoringTick) {
      clearInterval(monitoringTick);
    }
    if (state.enterprise.settings && state.enterprise.settings.realtimeEnabled) {
      monitoringTick = setInterval(renderMonitoring, 8000);
    }
    connectRealtimeSocket();
  }

  function showLogin() {
    appView.classList.add('hidden');
    loginView.classList.remove('hidden');
    disconnectRealtimeSocket();
    if (monitoringTick) {
      clearInterval(monitoringTick);
      monitoringTick = null;
    }
  }

  async function bootstrap() {
    state.apiBase = normalizeApiBase(state.apiBase);
    if (shouldForceLocalProxy(state.apiBase)) {
      state.apiBase = window.location.origin;
      localStorage.setItem('qaulium_admin_api_base', state.apiBase);
    }
    apiBaseInput.value = state.apiBase;
    loadEnterpriseState();

    if (languageFilter) {
      languageFilter.value = (state.enterprise.settings && state.enterprise.settings.locale) || 'en';
    }
    if (countryFilter) {
      countryFilter.value = (state.enterprise.settings && state.enterprise.settings.country) || 'all';
    }
    if (realtimeToggleBtn) {
      const enabled = !state.enterprise.settings || state.enterprise.settings.realtimeEnabled !== false;
      realtimeToggleBtn.textContent = enabled ? 'Realtime: On' : 'Realtime: Off';
    }

    const savedTheme = localStorage.getItem('qaulium_admin_theme') || 'light';
    setTheme(savedTheme);
    // Restore saved draft if exists
    const savedDraft = localStorage.getItem('qaulium_admin_draft');
    if (savedDraft) {
      try {
        const draft = JSON.parse(savedDraft);
        const tplRadio = document.querySelector(`input[name="template"][value="${draft.template}"]`);
        if (tplRadio) tplRadio.checked = true;
        const audRadio = document.querySelector(`input[name="audience"][value="${draft.audience}"]`);
        if (audRadio) { audRadio.checked = true; customEmailsWrap.classList.toggle('hidden', draft.audience !== 'custom'); }
        if (draft.subject) emailSubject.value = draft.subject;
        if (draft.body) middleContent.value = draft.body;
        if (draft.customEmails) customEmails.value = draft.customEmails;
      } catch (e) { /* ignore corrupt draft */ }
    }
    applyTemplate();
    renderEnterprisePanels();

    if (!state.token) {
      showLogin();
      return;
    }

    try {
      const me = await request('/api/admin/me', { headers: authHeaders() });
      if (me && me.admin) {
        state.currentAdmin.email = me.admin.email || '';
        state.currentAdmin.role = me.admin.role || 'admin';
      }
      showApp();
      await loadDashboard();
      addAuditLog('session.restored', 'auth', 'Existing admin session restored.', 'low');
    } catch (e) {
      localStorage.removeItem('qaulium_admin_token');
      state.token = '';
      showLogin();
    }
  }

  loginForm.addEventListener('submit', async function (e) {
    e.preventDefault();
    try {
      state.apiBase = normalizeApiBase(apiBaseInput.value);
      if (shouldForceLocalProxy(state.apiBase)) {
        state.apiBase = window.location.origin;
      }
      localStorage.setItem('qaulium_admin_api_base', state.apiBase);
      apiBaseInput.value = state.apiBase;

      if (loginBtn) loginBtn.disabled = true;

      const data = await request('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: adminEmailInput.value.trim(),
          password: adminPasswordInput.value,
          requestId: state.loginOtpRequestId || undefined,
          otp: adminOtpInput ? adminOtpInput.value.trim() : undefined
        })
      });

      if (data.requiresOtp) {
        state.loginOtpRequestId = data.requestId || '';
        if (adminOtpWrap) adminOtpWrap.classList.remove('hidden');
        if (adminOtpInput) {
          adminOtpInput.required = true;
          adminOtpInput.value = '';
          adminOtpInput.focus();
        }
        if (loginBtn) loginBtn.textContent = 'Verify OTP';
        setStatus(loginStatus, data.message || 'OTP sent.', 'ok');
        if (loginBtn) loginBtn.disabled = false;
        return;
      }

      state.token = data.token;
      state.loginOtpRequestId = '';
      localStorage.setItem('qaulium_admin_token', data.token);
      if (data && data.admin) {
        state.currentAdmin.email = data.admin.email || '';
        state.currentAdmin.role = data.admin.role || 'admin';
      }
      setStatus(loginStatus, 'Login successful.', 'ok');
      showApp();
      await loadDashboard();
      addAuditLog('login.success', 'auth', 'Admin authenticated successfully.', 'low');
    } catch (err) {
      setStatus(loginStatus, err.message, 'err');
      addAuditLog('login.failed', 'auth', err.message || 'Authentication failed.', 'high');
    } finally {
      if (loginBtn) loginBtn.disabled = false;
    }
  });

  document.getElementById('logoutBtn').addEventListener('click', function () {
    addAuditLog('logout', 'auth', 'Admin session ended.', 'low');
    localStorage.removeItem('qaulium_admin_token');
    state.token = '';
    state.enterpriseServerReady = false;
    state.currentAdmin = { email: '', role: 'admin' };
    showLogin();
  });

  document.querySelectorAll('.menu-item').forEach(function (item) {
    item.addEventListener('click', function () {
      switchTab(item.getAttribute('data-tab'));
      if (appShell) appShell.classList.remove('sidebar-open');
      if (adminSidebarBackdrop) adminSidebarBackdrop.classList.add('hidden');
    });
  });

  if (adminMenuToggle) {
    adminMenuToggle.addEventListener('click', function () {
      if (!appShell) return;
      appShell.classList.toggle('sidebar-open');
      if (adminSidebarBackdrop) {
        adminSidebarBackdrop.classList.toggle('hidden', !appShell.classList.contains('sidebar-open'));
      }
    });
  }

  if (adminSidebarBackdrop) {
    adminSidebarBackdrop.addEventListener('click', function () {
      if (appShell) appShell.classList.remove('sidebar-open');
      adminSidebarBackdrop.classList.add('hidden');
    });
  }

  if (refreshBtn) {
    refreshBtn.addEventListener('click', async function () {
      if (!state.token) return;
      refreshBtn.disabled = true;
      refreshBtn.textContent = 'Refreshing...';
      try {
        await loadDashboard();
      } catch (err) {
        // no-op
      }
      refreshBtn.textContent = 'Refresh Data';
      refreshBtn.disabled = false;
    });
  }

  if (themeToggleBtn) {
    themeToggleBtn.addEventListener('click', function () {
      const current = document.documentElement.getAttribute('data-theme') || 'light';
      setTheme(current === 'dark' ? 'light' : 'dark');
    });
  }

  if (languageFilter) {
    languageFilter.addEventListener('change', async function () {
      if (!guardAction('settings.manage', 'Only admins with settings permission can change locale.')) {
        this.value = (state.enterprise.settings && state.enterprise.settings.locale) || 'en';
        return;
      }
      state.enterprise.settings.locale = this.value;
      persistEnterpriseState();
      try {
        await request('/api/admin/settings', {
          method: 'PATCH',
          headers: authHeaders(),
          body: JSON.stringify({ locale: state.enterprise.settings.locale, country: state.enterprise.settings.country, realtimeEnabled: state.enterprise.settings.realtimeEnabled })
        });
      } catch (err) {
        setStatus(composerStatus, err.message || 'Unable to update locale.', 'err');
      }
      addAuditLog('locale.updated', 'settings', 'UI language set to ' + this.value + '.', 'low');
    });
  }

  if (countryFilter) {
    countryFilter.addEventListener('change', async function () {
      if (!guardAction('settings.manage', 'Only admins with settings permission can change country scope.')) {
        this.value = (state.enterprise.settings && state.enterprise.settings.country) || 'all';
        return;
      }
      state.enterprise.settings.country = this.value;
      if (analyticsCountryFilter) analyticsCountryFilter.value = this.value;
      persistEnterpriseState();
      renderEnterprisePanels();
      try {
        await request('/api/admin/settings', {
          method: 'PATCH',
          headers: authHeaders(),
          body: JSON.stringify({ locale: state.enterprise.settings.locale, country: state.enterprise.settings.country, realtimeEnabled: state.enterprise.settings.realtimeEnabled })
        });
      } catch (err) {
        setStatus(composerStatus, err.message || 'Unable to update country scope.', 'err');
      }
      addAuditLog('country.scope.updated', 'settings', 'Country scope set to ' + this.value + '.', 'medium');
    });
  }

  if (realtimeToggleBtn) {
    realtimeToggleBtn.addEventListener('click', async function () {
      if (!guardAction('settings.manage', 'Only admins with settings permission can toggle realtime mode.')) {
        return;
      }
      const next = !(state.enterprise.settings && state.enterprise.settings.realtimeEnabled);
      state.enterprise.settings.realtimeEnabled = next;
      realtimeToggleBtn.textContent = next ? 'Realtime: On' : 'Realtime: Off';
      if (monitoringTick) {
        clearInterval(monitoringTick);
        monitoringTick = null;
      }
      if (next) {
        monitoringTick = setInterval(renderMonitoring, 8000);
        connectRealtimeSocket();
      } else {
        disconnectRealtimeSocket();
      }
      persistEnterpriseState();
      try {
        await request('/api/admin/settings', {
          method: 'PATCH',
          headers: authHeaders(),
          body: JSON.stringify({ locale: state.enterprise.settings.locale, country: state.enterprise.settings.country, realtimeEnabled: state.enterprise.settings.realtimeEnabled })
        });
      } catch (err) {
        setStatus(composerStatus, err.message || 'Unable to update realtime settings.', 'err');
      }
      addAuditLog('realtime.toggled', 'monitoring', 'Realtime updates ' + (next ? 'enabled' : 'disabled') + '.', 'low');
    });
  }

  if (addDepartmentBtn) {
    addDepartmentBtn.addEventListener('click', async function () {
      if (!guardAction('organization.manage', 'You do not have permission to create departments.')) return;
      const name = (deptNameInput && deptNameInput.value || '').trim();
      const lead = (deptLeadInput && deptLeadInput.value || '').trim();
      if (!name) return;
      try {
        await request('/api/admin/org/departments', {
          method: 'POST',
          headers: authHeaders(),
          body: JSON.stringify({
            name: name,
            lead: lead || 'Unassigned',
            parent: '-',
            region: (countryFilter && countryFilter.value !== 'all') ? countryFilter.value : 'IN'
          })
        });
        if (deptNameInput) deptNameInput.value = '';
        if (deptLeadInput) deptLeadInput.value = '';
        await refreshEnterprisePanelsFromServer('organization.department.created');
        addAuditLog('department.created', 'organization', 'Added department ' + name + '.', 'medium');
      } catch (err) {
        setStatus(composerStatus, err.message || 'Unable to create department.', 'err');
      }
    });
  }

  if (departmentsBody) {
    departmentsBody.addEventListener('click', function (e) {
      const btn = e.target.closest('button[data-action="delete-dept"][data-id]');
      if (!btn) return;
      const id = btn.getAttribute('data-id');
      const dept = (state.enterprise.departments || []).find(function (d) { return d.id === id; });
      if (!dept) return;
      openConfirmModal('Delete department ' + dept.name + '?', function () {
        if (!guardAction('organization.manage', 'You do not have permission to delete departments.')) return;
        request('/api/admin/org/departments/' + id, {
          method: 'DELETE',
          headers: authHeaders()
        }).then(function () {
          refreshEnterprisePanelsFromServer('organization.department.deleted');
          addAuditLog('department.deleted', 'organization', 'Deleted department ' + dept.name + '.', 'high');
        }).catch(function (err) {
          setStatus(composerStatus, err.message || 'Unable to delete department.', 'err');
        });
      });
    });
  }

  if (employeeSearch) employeeSearch.addEventListener('input', renderOrganization);
  if (employeeDeptFilter) employeeDeptFilter.addEventListener('change', renderOrganization);

  if (orgExportBtn) {
    orgExportBtn.addEventListener('click', function () {
      const rows = state.enterprise.employees || [];
      downloadCsv('organization-employees.csv',
        ['Name', 'Email', 'Department', 'Manager', 'Country', 'Phone', 'Role'],
        rows.map(function (r) { return [r.name, r.email, r.department, r.manager, r.country, r.phone, r.role]; })
      );
      addAuditLog('export.csv', 'organization', 'Exported organization directory (' + rows.length + ' rows).', 'medium');
    });
  }

  if (addProjectBtn) {
    addProjectBtn.addEventListener('click', async function () {
      if (!guardAction('projects.manage', 'You do not have permission to create projects.')) return;
      const name = (projectNameInput && projectNameInput.value || '').trim();
      if (!name) return;
      const deadline = (projectDeadlineInput && projectDeadlineInput.value) ? new Date(projectDeadlineInput.value).toISOString() : new Date(Date.now() + 1000 * 60 * 60 * 24 * 14).toISOString();
      try {
        await request('/api/admin/projects', {
          method: 'POST',
          headers: authHeaders(),
          body: JSON.stringify({ name: name, owner: 'Platform Owner', status: 'On Track', deadline: deadline, progress: 0 })
        });
        if (projectNameInput) projectNameInput.value = '';
        await refreshEnterprisePanelsFromServer('project.created');
        addAuditLog('project.created', 'projects', 'Created project ' + name + '.', 'medium');
      } catch (err) {
        setStatus(composerStatus, err.message || 'Unable to create project.', 'err');
      }
    });
  }

  if (addTaskBtn) {
    addTaskBtn.addEventListener('click', async function () {
      if (!guardAction('tasks.manage', 'You do not have permission to create tasks.')) return;
      const title = (taskTitleInput && taskTitleInput.value || '').trim();
      if (!title) return;
      const selectedProject = (taskProjectFilter && taskProjectFilter.value && taskProjectFilter.value !== 'all')
        ? taskProjectFilter.value
        : ((state.enterprise.projects && state.enterprise.projects[0] && state.enterprise.projects[0].name) || 'General');
      try {
        await request('/api/admin/tasks', {
          method: 'POST',
          headers: authHeaders(),
          body: JSON.stringify({
            title: title,
            project: selectedProject,
            assignee: 'Unassigned',
            priority: 'Medium',
            status: (taskStatusFilter && taskStatusFilter.value) || 'todo',
            dueDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7).toISOString()
          })
        });
        if (taskTitleInput) taskTitleInput.value = '';
        await refreshEnterprisePanelsFromServer('task.created');
        addAuditLog('task.created', 'projects', 'Created task ' + title + '.', 'medium');
      } catch (err) {
        setStatus(composerStatus, err.message || 'Unable to create task.', 'err');
      }
    });
  }

  if (taskProjectFilter) taskProjectFilter.addEventListener('change', renderProjects);

  if (tasksBody) {
    tasksBody.addEventListener('click', function (e) {
      const btn = e.target.closest('button[data-action="advance-task"][data-id]');
      if (!btn) return;
      if (!guardAction('tasks.manage', 'You do not have permission to transition tasks.')) return;
      const id = btn.getAttribute('data-id');
      const task = (state.enterprise.tasks || []).find(function (t) { return String(t.id) === String(id); });
      request('/api/admin/tasks/' + id + '/advance', {
        method: 'POST',
        headers: authHeaders()
      }).then(function (data) {
        refreshEnterprisePanelsFromServer('task.status.changed');
        addAuditLog('task.status.changed', 'projects', 'Task "' + ((task && task.title) || id) + '" moved to ' + (data.status || 'next') + '.', 'medium');
      }).catch(function (err) {
        setStatus(composerStatus, err.message || 'Unable to transition task.', 'err');
      });
    });
  }

  [analyticsCountryFilter, analyticsDepartmentFilter, analyticsRoleFilter, analyticsTimeFilter].forEach(function (el) {
    if (!el) return;
    el.addEventListener('change', renderAnalytics);
  });

  if (analyticsExportBtn) {
    analyticsExportBtn.addEventListener('click', function () {
      exportAnalyticsSnapshot();
    });
  }

  if (analyticsManagerPerformance) {
    analyticsManagerPerformance.addEventListener('click', function (e) {
      var item = e.target.closest('.analytics-manager-item[data-manager-key]');
      if (!item) return;
      openManagerDetailModal(item.dataset.managerKey);
    });
  }

  if (analyticsProjectRisks) {
    analyticsProjectRisks.addEventListener('click', function (e) {
      var item = e.target.closest('.analytics-risk-item[data-project-id]');
      if (!item) return;
      openProjectDetailModal(item.dataset.projectId);
    });
  }

  if (analyticsDetailClose) {
    analyticsDetailClose.addEventListener('click', function () {
      closeModal(analyticsDetailModal);
    });
  }

  if (generateMeetingBtn) {
    generateMeetingBtn.addEventListener('click', async function () {
      if (!guardAction('notifications.manage', 'You do not have permission to generate meeting links.')) return;
      const title = (announcementTitle && announcementTitle.value || '').trim() || 'Team Sync';
      const audience = (announcementAudience && announcementAudience.value) || 'all';
      const slot = (meetingTime && meetingTime.value) || new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString().slice(0, 16);
      try {
        const data = await request('/api/admin/meeting-links', {
          method: 'POST',
          headers: authHeaders(),
          body: JSON.stringify({ title: title, audience: audience, meetingTime: slot })
        });
        if (meetingLinkOut) {
          const link = data.link || '#';
          const mt = data.meetingTime || slot;
          meetingLinkOut.innerHTML = '<a href="' + link + '" target="_blank">' + link + '</a> • ' + escapeHtml(mt);
        }
        await refreshEnterprisePanelsFromServer('meeting.link.generated');
        addAuditLog('meeting.link.generated', 'communications', 'Created meeting link for ' + audience + ' audience.', 'medium');
      } catch (err) {
        setStatus(composerStatus, err.message || 'Unable to generate meeting link.', 'err');
      }
    });
  }

  registrationsSearch.addEventListener('input', function () {
    state.tables.registrations.page = 1;
    renderRegistrationsTable();
  });
  contactsSearch.addEventListener('input', function () {
    state.tables.contacts.page = 1;
    renderContactsTable();
  });
  careersSearch.addEventListener('input', function () {
    state.tables.careers.page = 1;
    renderCareersTable();
  });
  careersRoleFilter.addEventListener('change', function () {
    state.tables.careers.page = 1;
    renderCareersTable();
  });

  registrationsPrevBtn.addEventListener('click', function () {
    state.tables.registrations.page -= 1;
    renderRegistrationsTable();
  });
  registrationsNextBtn.addEventListener('click', function () {
    state.tables.registrations.page += 1;
    renderRegistrationsTable();
  });
  contactsPrevBtn.addEventListener('click', function () {
    state.tables.contacts.page -= 1;
    renderContactsTable();
  });
  contactsNextBtn.addEventListener('click', function () {
    state.tables.contacts.page += 1;
    renderContactsTable();
  });
  careersPrevBtn.addEventListener('click', function () {
    state.tables.careers.page -= 1;
    renderCareersTable();
  });
  careersNextBtn.addEventListener('click', function () {
    state.tables.careers.page += 1;
    renderCareersTable();
  });

  registrationsExportBtn.addEventListener('click', function () {
    const rows = getFilteredRegistrations();
    downloadCsv('registrations.csv',
      ['First Name', 'Last Name', 'Email', 'Phone', 'Company', 'Role', 'Use Case', 'Source', 'Registered At'],
      rows.map(function (r) { return [r.first_name, r.last_name, r.email, excelTextValue(r.phone), r.company, r.role, r.use_case, r.source || 'unknown', r.registered_at]; })
    );
    addAuditLog('export.csv', 'registrations', 'Registrations CSV exported (' + rows.length + ' rows).', 'medium');
  });

  contactsExportBtn.addEventListener('click', function () {
    const rows = getFilteredContacts();
    downloadCsv('contacts.csv',
      ['Name', 'Email', 'Company', 'Message', 'Sent At'],
      rows.map(function (r) { return [r.name, r.email, r.company, r.message, r.sent_at]; })
    );
    addAuditLog('export.csv', 'contacts', 'Contacts CSV exported (' + rows.length + ' rows).', 'medium');
  });

  careersExportBtn.addEventListener('click', function () {
    const rows = getFilteredCareers();
    downloadCsv('careers.csv',
      ['First Name', 'Last Name', 'Email', 'Phone', 'Role', 'Location', 'University', 'Degree', 'Graduation Year', 'Availability', 'LinkedIn', 'Portfolio', 'Resume URL', 'Applied At'],
      rows.map(function (r) {
        return [r.first_name, r.last_name, r.email, excelTextValue(r.phone), r.role_applied, r.location, r.university, r.degree, r.graduation_year, r.availability, r.linkedin_url, r.portfolio_url, r.resume_url, r.applied_at];
      })
    );
    addAuditLog('export.csv', 'careers', 'Career CSV exported (' + rows.length + ' rows).', 'medium');
  });

  if (usersSearch) {
    usersSearch.addEventListener('input', renderUsersTable);
  }
  if (usersStatusFilter) {
    usersStatusFilter.addEventListener('change', renderUsersTable);
  }
  if (usersAddBtn) {
    usersAddBtn.addEventListener('click', function () {
      if (!guardAction('users.manage', 'You do not have permission to invite users.')) return;
      const name = window.prompt('Full name');
      if (!name) return;
      const email = window.prompt('Work email');
      if (!email) return;
      const role = window.prompt('Role', 'Support Manager') || 'Support Manager';
      state.enterprise.users.unshift({
        id: uid('usr'),
        name: name.trim(),
        email: email.trim(),
        role: role.trim(),
        status: 'invited',
        mfa: false,
        lastLogin: ''
      });
      persistEnterpriseState();
      renderUsersTable();
      addAuditLog('user.invited', 'users', 'Invited ' + email.trim() + ' with role ' + role.trim() + '.', 'medium');
    });
  }

  if (usersBody) {
    usersBody.addEventListener('click', function (e) {
      const btn = e.target.closest('button[data-action][data-id]');
      if (!btn) return;
      const id = btn.getAttribute('data-id');
      const action = btn.getAttribute('data-action');
      const user = state.enterprise.users.find(function (u) { return u.id === id; });
      if (!user) return;

      if (action === 'toggle-user') {
        if (!guardAction('users.manage', 'You do not have permission to update users.')) return;
        user.status = user.status === 'active' ? 'suspended' : 'active';
        persistEnterpriseState();
        renderUsersTable();
        addAuditLog('user.status.changed', 'users', user.email + ' -> ' + user.status, 'medium');
      }

      if (action === 'remove-user') {
        if (!guardAction('users.manage', 'You do not have permission to delete users.')) return;
        openConfirmModal('Delete user ' + user.email + '?', function () {
          state.enterprise.users = state.enterprise.users.filter(function (u) { return u.id !== id; });
          persistEnterpriseState();
          renderUsersTable();
          addAuditLog('user.deleted', 'users', 'Removed user ' + user.email + '.', 'high');
        });
      }
    });
  }

  if (roleCreateBtn) {
    roleCreateBtn.addEventListener('click', function () {
      if (!guardAction('roles.manage', 'You do not have permission to create roles.')) return;
      const name = (roleNameInput && roleNameInput.value || '').trim();
      if (!name) return;
      const basePerms = ['analytics.view', 'audit.view'];
      state.enterprise.roles.unshift({ id: uid('role'), name: name, permissions: basePerms, members: 0 });
      roleNameInput.value = '';
      persistEnterpriseState();
      renderRolesTable();
      addAuditLog('role.created', 'roles', 'Created role ' + name + '.', 'medium');
    });
  }

  if (rolesBody) {
    rolesBody.addEventListener('click', function (e) {
      const btn = e.target.closest('button[data-action="delete-role"][data-id]');
      if (!btn) return;
      const id = btn.getAttribute('data-id');
      const role = state.enterprise.roles.find(function (r) { return r.id === id; });
      if (!role) return;
      if (!guardAction('roles.manage', 'You do not have permission to delete roles.')) return;
      openConfirmModal('Delete role ' + role.name + '?', function () {
        state.enterprise.roles = state.enterprise.roles.filter(function (r) { return r.id !== id; });
        persistEnterpriseState();
        renderRolesTable();
        addAuditLog('role.deleted', 'roles', 'Deleted role ' + role.name + '.', 'high');
      });
    });
  }

  if (createApiKeyBtn) {
    createApiKeyBtn.addEventListener('click', function () {
      if (!guardAction('api_keys.manage', 'You do not have permission to create API keys.')) return;
      const label = (apiKeyLabel && apiKeyLabel.value || '').trim();
      if (!label) return;
      const scope = (apiKeyScope && apiKeyScope.value) || 'read';
      state.enterprise.apiKeys.unshift({
        id: uid('key'),
        label: label,
        scope: scope,
        prefix: randomKeyPrefix(),
        createdAt: new Date().toISOString(),
        lastUsedAt: '',
        status: 'active'
      });
      apiKeyLabel.value = '';
      persistEnterpriseState();
      renderApiKeysTable();
      addAuditLog('api_key.created', 'api-access', 'Key generated for ' + label + ' (' + scope + ').', 'high');
    });
  }

  if (apiKeysBody) {
    apiKeysBody.addEventListener('click', function (e) {
      const btn = e.target.closest('button[data-action="revoke-key"][data-id]');
      if (!btn) return;
      const id = btn.getAttribute('data-id');
      const key = state.enterprise.apiKeys.find(function (k) { return k.id === id; });
      if (!key) return;
      if (!guardAction('api_keys.manage', 'You do not have permission to revoke API keys.')) return;
      openConfirmModal('Revoke API key ' + key.label + '?', function () {
        key.status = 'revoked';
        persistEnterpriseState();
        renderApiKeysTable();
        addAuditLog('api_key.revoked', 'api-access', 'Revoked key ' + key.label + '.', 'high');
      });
    });
  }

  if (auditSearch) {
    auditSearch.addEventListener('input', renderAuditTable);
  }
  if (auditSeverityFilter) {
    auditSeverityFilter.addEventListener('change', renderAuditTable);
  }
  if (auditExportBtn) {
    auditExportBtn.addEventListener('click', function () {
      const rows = getFilteredAuditLogs();
      downloadCsv('audit-logs.csv',
        ['Time', 'Actor', 'Action', 'Entity', 'Severity', 'Details'],
        rows.map(function (r) { return [r.time, r.actor, r.action, r.entity, r.severity, r.details]; })
      );
      addAuditLog('export.csv', 'audit', 'Audit log exported (' + rows.length + ' rows).', 'medium');
    });
  }

  if (saveSecuritySettingsBtn) {
    saveSecuritySettingsBtn.addEventListener('click', function () {
      if (!guardAction('security.manage', 'You do not have permission to update security settings.')) return;
      state.enterprise.security = {
        mfaRequired: !!(securityMfaRequired && securityMfaRequired.checked),
        ssoRequired: !!(securitySsoRequired && securitySsoRequired.checked),
        sessionLock: !!(securitySessionLock && securitySessionLock.checked),
        piiMasking: !!(securityPiiMasking && securityPiiMasking.checked),
        ipAllowlist: !!(securityIpAllowlist && securityIpAllowlist.checked),
        immutableAudit: !!(securityImmutableAudit && securityImmutableAudit.checked)
      };
      persistEnterpriseState();
      setStatus(composerStatus, 'Security settings saved.', 'ok');
      addAuditLog('security.policy.updated', 'security', 'Security policy controls updated.', 'high');
    });
  }

  if (queueNotificationBtn) {
    queueNotificationBtn.addEventListener('click', async function () {
      if (!guardAction('notifications.manage', 'You do not have permission to queue notifications.')) return;
      const title = (notificationTitle && notificationTitle.value || '').trim();
      const channel = (notificationChannel && notificationChannel.value) || 'email';
      if (!title) return;
      try {
        await request('/api/admin/notifications', {
          method: 'POST',
          headers: authHeaders(),
          body: JSON.stringify({ title: title, channel: channel, status: 'queued', audience: 'all users' })
        });
        notificationTitle.value = '';
        await refreshEnterprisePanelsFromServer('notification.created');
        addAuditLog('notification.queued', 'notifications', 'Queued ' + channel + ' message: ' + title, 'medium');
      } catch (err) {
        setStatus(composerStatus, err.message || 'Unable to queue notification.', 'err');
      }
    });
  }

  if (notificationsBody) {
    notificationsBody.addEventListener('click', function (e) {
      const btn = e.target.closest('button[data-action="delete-notification"][data-id]');
      if (!btn) return;
      const id = btn.getAttribute('data-id');
      const item = state.enterprise.notifications.find(function (n) { return n.id === id; });
      if (!item) return;
      openConfirmModal('Delete this notification item?', function () {
        if (!guardAction('notifications.manage', 'You do not have permission to delete notifications.')) return;
        request('/api/admin/notifications/' + id, {
          method: 'DELETE',
          headers: authHeaders()
        }).then(function () {
          refreshEnterprisePanelsFromServer('notification.deleted');
          addAuditLog('notification.deleted', 'notifications', 'Removed notification: ' + item.title, 'medium');
        }).catch(function (err) {
          setStatus(composerStatus, err.message || 'Unable to delete notification.', 'err');
        });
      });
    });
  }

  [registrationsBody, contactsBody, careersBody].forEach(function (tbody) {
    tbody.addEventListener('click', function (e) {
      const btn = e.target.closest('button[data-action][data-type][data-id]');
      if (!btn) return;

      const action = btn.getAttribute('data-action');
      const type = btn.getAttribute('data-type');
      const id = btn.getAttribute('data-id');

      if (action === 'edit') {
        editRecord(type, id);
      } else if (action === 'delete') {
        deleteRecord(type, id);
      } else if (type === 'careers' && (action === 'interview' || action === 'accepted')) {
        sendCareerActionEmail(id, action);
      }
    });
  });

  recordForm.addEventListener('submit', async function (e) {
    e.preventDefault();
    if (!activeEditContext) return;

    const formData = new FormData(recordForm);
    const fields = fieldConfig[activeEditContext.type] || [];
    const payload = {};
    fields.forEach(function (field) {
      const raw = formData.get(field.key);
      payload[field.key] = field.numeric ? (parseInt(raw || '0', 10) || 0) : String(raw || '').trim();
    });

    try {
      await request('/api/admin/' + activeEditContext.type + '/' + activeEditContext.id, {
        method: 'PUT',
        headers: authHeaders(),
        body: JSON.stringify(payload)
      });
      closeModal(recordModal);
      addAuditLog('record.updated', activeEditContext.type, 'Updated record id ' + activeEditContext.id + '.', 'medium');
      activeEditContext = null;
      await loadDashboard();
      setStatus(composerStatus, 'Record updated successfully.', 'ok');
    } catch (err) {
      setStatus(composerStatus, err.message || 'Update failed.', 'err');
    }
  });

  [recordModalClose, recordCancelBtn].forEach(function (el) {
    el.addEventListener('click', function () {
      closeModal(recordModal);
      activeEditContext = null;
    });
  });

  [confirmModalClose, confirmCancelBtn].forEach(function (el) {
    el.addEventListener('click', function () {
      closeModal(confirmModal);
      activeConfirmAction = null;
    });
  });

  confirmOkBtn.addEventListener('click', async function () {
    if (!activeConfirmAction) return;
    const action = activeConfirmAction;
    activeConfirmAction = null;
    closeModal(confirmModal);
    await action();
  });

  [recordModal, confirmModal].forEach(function (modal) {
    modal.addEventListener('click', function (e) {
      if (e.target === modal) {
        closeModal(modal);
      }
    });
  });

  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape') return;
    if (!recordModal.classList.contains('hidden')) {
      closeModal(recordModal);
      activeEditContext = null;
    }
    if (!confirmModal.classList.contains('hidden')) {
      closeModal(confirmModal);
      activeConfirmAction = null;
    }
  });

  // Audience radio button listeners
  document.querySelectorAll('input[name="audience"]').forEach(function (radio) {
    radio.addEventListener('change', function () {
      customEmailsWrap.classList.toggle('hidden', this.value !== 'custom');
      updatePreview();
    });
  });

  // Custom emails input hint
  if (customEmails) {
    customEmails.addEventListener('input', function () {
      const count = this.value.split(',').filter(function (e) { return e.trim(); }).length;
      if (customEmailsHint) {
        customEmailsHint.textContent = count > 0 ? `${count} email${count !== 1 ? 's' : ''} will be sent` : '';
      }
    });
  }

  // Middle content and updates
  if (middleContent) {
    middleContent.addEventListener('input', function () {
      const templateValue = document.querySelector('input[name="template"]:checked')?.value || 'blank';
      const def = templates[templateValue] || templates.blank;
      emailBody.value = renderTemplateHtml(def, this.value, emailSubject.value.trim());
      updatePreview();
      
      // Update body hint
      const wordCount = this.value.trim().split(/\s+/).filter(function(w) { return w; }).length;
      if (bodyHint) {
        bodyHint.textContent = wordCount > 0 ? `${wordCount} word${wordCount !== 1 ? 's' : ''}` : '';
      }
    });
  }

  // Subject line hint — also rebuild body so preview iframe reflects subject
  if (emailSubject) {
    emailSubject.addEventListener('input', function () {
      if (subjectHint) {
        subjectHint.textContent = this.value.length > 0 ? `${this.value.length} character${this.value.length !== 1 ? 's' : ''}` : '';
      }
      const templateValue = document.querySelector('input[name="template"]:checked')?.value || 'blank';
      const def = templates[templateValue] || templates.blank;
      emailBody.value = renderTemplateHtml(def, middleContent.value, this.value.trim());
      updatePreview();
    });
  }
  
  // Template radio button listeners
  document.querySelectorAll('input[name="template"]').forEach(function (radio) {
    radio.addEventListener('change', applyTemplate);
  });

  if (internRoleSelect) {
    internRoleSelect.addEventListener('change', function () {
      if ((document.querySelector('input[name="template"]:checked')?.value || 'blank') !== 'intern-confirmation') return;
      middleContent.value = internRoleMessages[this.value] || '';
      applyTemplate();
    });
  }
  
  if (regenerateTemplate) regenerateTemplate.addEventListener('click', applyTemplate);

  // HTML Source Code Editor
  const toggleHtmlEditor = document.getElementById('toggleHtmlEditor');
  const htmlEditorContainer = document.getElementById('htmlEditorContainer');
  const htmlSourceEditor = document.getElementById('htmlSourceEditor');
  const applyHtmlBtn = document.getElementById('applyHtmlBtn');
  const copyHtmlBtn = document.getElementById('copyHtmlBtn');
  const loadCurrentHtmlBtn = document.getElementById('loadCurrentHtmlBtn');

  if (toggleHtmlEditor) {
    toggleHtmlEditor.addEventListener('click', function () {
      const isHidden = htmlEditorContainer.classList.contains('hidden');
      htmlEditorContainer.classList.toggle('hidden');
      toggleHtmlEditor.textContent = isHidden ? 'Hide HTML Source' : 'Edit HTML Source';
      if (isHidden) {
        // Load current template HTML into editor
        htmlSourceEditor.value = emailBody.value || '';
      }
    });
  }

  if (applyHtmlBtn) {
    applyHtmlBtn.addEventListener('click', function () {
      emailBody.value = htmlSourceEditor.value;
      updatePreview();
      setStatus(composerStatus, 'HTML applied to preview', 'ok');
      setTimeout(function () { composerStatus.innerHTML = ''; }, 2000);
    });
  }

  if (copyHtmlBtn) {
    copyHtmlBtn.addEventListener('click', function () {
      navigator.clipboard.writeText(htmlSourceEditor.value).then(function () {
        setStatus(composerStatus, 'HTML copied to clipboard', 'ok');
        setTimeout(function () { composerStatus.innerHTML = ''; }, 2000);
      });
    });
  }

  if (loadCurrentHtmlBtn) {
    loadCurrentHtmlBtn.addEventListener('click', function () {
      htmlSourceEditor.value = emailBody.value || '';
      setStatus(composerStatus, 'Current template HTML loaded into editor', 'ok');
      setTimeout(function () { composerStatus.innerHTML = ''; }, 2000);
    });
  }

  // Allow Tab key in HTML editor for indentation
  if (htmlSourceEditor) {
    htmlSourceEditor.addEventListener('keydown', function (e) {
      if (e.key === 'Tab') {
        e.preventDefault();
        const start = this.selectionStart;
        const end = this.selectionEnd;
        this.value = this.value.substring(0, start) + '  ' + this.value.substring(end);
        this.selectionStart = this.selectionEnd = start + 2;
      }
    });
  }

  // Save draft functionality
  if (saveDraftBtn) {
    saveDraftBtn.addEventListener('click', function () {
      const draft = {
        template: document.querySelector('input[name="template"]:checked')?.value || 'blank',
        audience: document.querySelector('input[name="audience"]:checked')?.value || 'all',
        subject: emailSubject.value,
        body: middleContent.value,
        customEmails: customEmails.value
      };
      localStorage.setItem('qaulium_admin_draft', JSON.stringify(draft));
      setStatus(composerStatus, 'Draft saved locally', 'ok');
      setTimeout(function () {
        composerStatus.innerHTML = '';
      }, 3000);
    });
  }

  composerForm.addEventListener('submit', async function (e) {
    e.preventDefault();
    try {
      const audienceValue = document.querySelector('input[name="audience"]:checked')?.value || 'all';
      const templateValue = document.querySelector('input[name="template"]:checked')?.value || 'blank';
      const customList = customEmails.value
        .split(',')
        .map(function (v) { return v.trim(); })
        .filter(Boolean);

      if (templateValue === 'intern-confirmation' && internRoleSelect && !internRoleSelect.value) {
        setStatus(composerStatus, 'Please select intern role.', 'err');
        return;
      }

      const resolvedBody = (emailBody.value || '').trim() || renderTemplateHtml(templates[templateValue] || templates.blank, middleContent.value || '', emailSubject.value.trim());
      if (!resolvedBody) {
        setStatus(composerStatus, 'Email body is required.', 'err');
        return;
      }

      const data = await request('/api/admin/email/send', {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({
          audience: audienceValue,
          subject: emailSubject.value.trim(),
          body: resolvedBody,
          customEmails: customList
        })
      });

      setStatus(composerStatus, `✓ Email sent to ${data.sent} recipient${data.sent !== 1 ? 's' : ''}.`, 'ok');
      addAuditLog('email.sent', 'notifications', 'Sent email campaign to audience ' + audienceValue + ' (' + data.sent + ' recipients).', 'high');
      // Clear draft on successful send
      localStorage.removeItem('qaulium_admin_draft');
    } catch (err) {
      setStatus(composerStatus, err.message, 'err');
    }
  });

  bootstrap();

  // ========================================================
  //   FORMS BUILDER + RESPONSES
  // ========================================================

  let formsListData = [];
  let formBuilderState = { id: null, slug: null, sections: [] };

  const formsList = document.getElementById('formsList');
  const createFormBtn = document.getElementById('createFormBtn');
  const formsSearch = document.getElementById('formsSearch');
  const fbTitle = document.getElementById('fbTitle');
  const fbDescription = document.getElementById('fbDescription');
  const fbSectionsContainer = document.getElementById('fbSections');
  const fbAddSectionBtn = document.getElementById('fbAddSection');
  const saveFormBtn = document.getElementById('saveFormBtn');
  const fbLinkWrap = document.getElementById('fbLinkWrap');
  const fbActive = document.getElementById('fbActive');
  const formBuilderStatus = document.getElementById('formBuilderStatus');
  const backToFormsBtn = document.getElementById('backToFormsBtn');
  const backToFormsBtn2 = document.getElementById('backToFormsBtn2');
  const exportResponsesBtn = document.getElementById('exportResponsesBtn');
  const responsesFormTitle = document.getElementById('responsesFormTitle');
  const responsesHead = document.getElementById('responsesHead');
  const responsesBody = document.getElementById('responsesBody');
  const responseCount = document.getElementById('responseCount');

  let currentResponseFormId = null;

  function renderFormsList(data) {
    formsListData = data || [];
    if (!formsList) return;
    const search = (formsSearch ? formsSearch.value : '').toLowerCase();
    const filtered = formsListData.filter(function(f) {
      return !search || f.title.toLowerCase().includes(search) || (f.description || '').toLowerCase().includes(search);
    });

    if (!filtered.length) {
      formsList.innerHTML = '<div class="forms-empty"><h3>No forms yet</h3><p>Create your first form to start collecting responses.</p></div>';
      return;
    }

    formsList.innerHTML = filtered.map(function(f) {
      const isActive = f.is_active;
      const date = f.created_at ? new Date(f.created_at).toLocaleDateString() : '';
      return '<div class="form-card" data-id="' + f.id + '">' +
        '<h3>' + escapeHtml(f.title) + '</h3>' +
        '<div class="fc-desc">' + escapeHtml(f.description || 'No description') + '</div>' +
        '<div class="fc-meta">' +
          '<span class="fc-badge ' + (isActive ? 'active' : 'closed') + '">' + (isActive ? 'Active' : 'Closed') + '</span>' +
          '<span>' + (f.response_count || 0) + ' response' + ((f.response_count || 0) !== 1 ? 's' : '') + '</span>' +
          '<span>' + date + '</span>' +
        '</div>' +
        '<div class="fc-actions">' +
          '<button data-action="edit" data-id="' + f.id + '">Edit</button>' +
          '<button data-action="responses" data-id="' + f.id + '">Responses</button>' +
          '<button data-action="link" data-slug="' + escapeHtml(f.slug) + '">Copy Link</button>' +
          '<button data-action="delete" data-id="' + f.id + '" class="danger">Delete</button>' +
        '</div>' +
      '</div>';
    }).join('');
  }

  if (formsSearch) formsSearch.addEventListener('input', function() { renderFormsList(formsListData); });

  if (formsList) formsList.addEventListener('click', function(e) {
    const btn = e.target.closest('button[data-action]');
    if (!btn) return;
    e.stopPropagation();
    const action = btn.getAttribute('data-action');
    const id = btn.getAttribute('data-id');
    const slug = btn.getAttribute('data-slug');

    if (action === 'edit') openFormBuilder(parseInt(id));
    else if (action === 'responses') openFormResponses(parseInt(id));
    else if (action === 'link') {
      const url = state.apiBase + '/forms/' + slug;
      navigator.clipboard.writeText(url).then(function() {
        btn.textContent = 'Copied!';
        setTimeout(function() { btn.textContent = 'Copy Link'; }, 1500);
      });
    }
    else if (action === 'delete') deleteForm(parseInt(id));
  });

  if (createFormBtn) createFormBtn.addEventListener('click', function() {
    openFormBuilder(null);
  });

  if (backToFormsBtn) backToFormsBtn.addEventListener('click', function() {
    switchTab('forms');
    loadFormsOnly();
  });
  if (backToFormsBtn2) backToFormsBtn2.addEventListener('click', function() {
    switchTab('forms');
    loadFormsOnly();
  });

  async function loadFormsOnly() {
    try {
      const data = await request('/api/admin/forms', { headers: authHeaders() });
      renderFormsList(data.data || []);
      const statFormsEl = document.getElementById('statForms');
      if (statFormsEl) statFormsEl.textContent = (data.data || []).length;
    } catch (e) { /* ignore */ }
  }

  function generateFieldId() {
    return 'f_' + Math.random().toString(36).substr(2, 8);
  }

  function generateSectionId() {
    return 's_' + Math.random().toString(36).substr(2, 8);
  }

  function openFormBuilder(formId) {
    formBuilderState = { id: formId, slug: null, sections: [] };
    fbTitle.value = '';
    fbDescription.value = '';
    fbActive.checked = true;
    fbLinkWrap.innerHTML = '<span class="muted">Save form to generate link</span>';
    formBuilderStatus.textContent = '';

    if (formId) {
      // Load existing form
      request('/api/admin/forms/' + formId, { headers: authHeaders() })
        .then(function(data) {
          const form = data.form;
          formBuilderState.id = form.id;
          formBuilderState.slug = form.slug;
          fbTitle.value = form.title || '';
          fbDescription.value = form.description || '';
          fbActive.checked = !!form.is_active;
          formBuilderState.sections = form.sections || [];
          if (form.slug) {
            const publicUrl = state.apiBase + '/forms/' + form.slug;
            fbLinkWrap.innerHTML = '<a href="' + publicUrl + '" target="_blank">' + publicUrl + '</a><br>' +
              '<button class="fb-copy-link" onclick="navigator.clipboard.writeText(\'' + publicUrl + '\');this.textContent=\'Copied!\';setTimeout(()=>{this.textContent=\'Copy Link\'},1500)">Copy Link</button>';
          }
          renderFormBuilderSections();
        })
        .catch(function() {
          formBuilderStatus.textContent = 'Failed to load form.';
        });
    } else {
      // New form - add one empty section
      formBuilderState.sections = [{
        id: generateSectionId(),
        title: '',
        description: '',
        fields: []
      }];
      renderFormBuilderSections();
    }

    switchTab('form-builder');
  }

  function renderFormBuilderSections() {
    if (!fbSectionsContainer) return;
    fbSectionsContainer.innerHTML = '';

    formBuilderState.sections.forEach(function(section, si) {
      const secEl = document.createElement('div');
      secEl.className = 'fb-section-card';
      secEl.setAttribute('data-section-index', si);

      let html = '<div class="fb-section-header">' +
        '<input type="text" value="' + escapeHtml(section.title || '') + '" placeholder="Section title" class="fb-sec-title">' +
        '<button type="button" class="fb-section-remove" title="Remove section">&times;</button>' +
      '</div>' +
      '<input type="text" value="' + escapeHtml(section.description || '') + '" placeholder="Section description (optional)" class="fb-section-desc fb-sec-desc">' +
      '<div class="fb-fields">';

      (section.fields || []).forEach(function(field, fi) {
        html += renderFieldEditor(field, fi);
      });

      html += '</div>' +
        '<button type="button" class="btn btn-secondary fb-add-field" style="margin-top:10px;font-size:13px">+ Add field</button>';

      secEl.innerHTML = html;
      fbSectionsContainer.appendChild(secEl);
    });
  }

  function renderFieldEditor(field, fi) {
    const hasOptions = ['dropdown', 'multiple_choice', 'checkbox'].includes(field.type);
    let h = '<div class="fb-field-item" data-field-index="' + fi + '">' +
      '<div class="fb-field-row">' +
        '<input type="text" value="' + escapeHtml(field.label || '') + '" placeholder="Field label" class="fb-fld-label">' +
        '<select class="fb-fld-type">' +
          '<option value="text"' + (field.type === 'text' ? ' selected' : '') + '>Text</option>' +
          '<option value="paragraph"' + (field.type === 'paragraph' ? ' selected' : '') + '>Paragraph</option>' +
          '<option value="email"' + (field.type === 'email' ? ' selected' : '') + '>Email</option>' +
          '<option value="number"' + (field.type === 'number' ? ' selected' : '') + '>Number</option>' +
          '<option value="date"' + (field.type === 'date' ? ' selected' : '') + '>Date</option>' +
          '<option value="phone"' + (field.type === 'phone' ? ' selected' : '') + '>Phone</option>' +
          '<option value="url"' + (field.type === 'url' ? ' selected' : '') + '>URL</option>' +
          '<option value="dropdown"' + (field.type === 'dropdown' ? ' selected' : '') + '>Dropdown</option>' +
          '<option value="multiple_choice"' + (field.type === 'multiple_choice' ? ' selected' : '') + '>Multiple Choice</option>' +
          '<option value="checkbox"' + (field.type === 'checkbox' ? ' selected' : '') + '>Checkbox</option>' +
        '</select>' +
      '</div>' +
      '<div class="fb-field-controls">' +
        '<label><input type="checkbox" class="fb-fld-required"' + (field.required ? ' checked' : '') + '> Required</label>' +
        '<button type="button" class="fb-field-remove" title="Remove field">&times;</button>' +
      '</div>';

    if (hasOptions) {
      h += '<div class="fb-options-editor">';
      (field.options || []).forEach(function(opt, oi) {
        h += '<div class="fb-opt-row" data-opt-index="' + oi + '">' +
          '<input type="text" value="' + escapeHtml(opt) + '" placeholder="Option ' + (oi + 1) + '" class="fb-opt-value">' +
          '<button type="button" class="fb-opt-remove">&times;</button>' +
        '</div>';
      });
      h += '<button type="button" class="fb-add-opt">+ Add option</button></div>';
    }

    h += '</div>';
    return h;
  }

  function collectFormData() {
    const sections = [];
    document.querySelectorAll('#fbSections .fb-section-card').forEach(function(secEl) {
      const section = {
        id: formBuilderState.sections[parseInt(secEl.getAttribute('data-section-index'))]?.id || generateSectionId(),
        title: secEl.querySelector('.fb-sec-title').value.trim(),
        description: secEl.querySelector('.fb-sec-desc').value.trim(),
        fields: []
      };

      secEl.querySelectorAll('.fb-field-item').forEach(function(fldEl, fi) {
        const si = parseInt(secEl.getAttribute('data-section-index'));
        const existingField = (formBuilderState.sections[si]?.fields || [])[fi];
        const type = fldEl.querySelector('.fb-fld-type').value;
        const field = {
          id: existingField?.id || generateFieldId(),
          label: fldEl.querySelector('.fb-fld-label').value.trim() || ('Question ' + (fi + 1)),
          type: type,
          required: fldEl.querySelector('.fb-fld-required').checked,
          placeholder: '',
          options: []
        };

        if (['dropdown', 'multiple_choice', 'checkbox'].includes(type)) {
          fldEl.querySelectorAll('.fb-opt-value').forEach(function(optInput) {
            const v = optInput.value.trim();
            if (v) field.options.push(v);
          });
        }

        section.fields.push(field);
      });

      sections.push(section);
    });
    return sections;
  }

  // Event delegation for form builder
  if (fbSectionsContainer) fbSectionsContainer.addEventListener('click', function(e) {
    const target = e.target;

    // Remove section
    if (target.closest('.fb-section-remove')) {
      const secCard = target.closest('.fb-section-card');
      const si = parseInt(secCard.getAttribute('data-section-index'));
      formBuilderState.sections = collectFormData();
      formBuilderState.sections.splice(si, 1);
      renderFormBuilderSections();
      return;
    }

    // Remove field
    if (target.closest('.fb-field-remove')) {
      const secCard = target.closest('.fb-section-card');
      const fldItem = target.closest('.fb-field-item');
      const si = parseInt(secCard.getAttribute('data-section-index'));
      const fi = parseInt(fldItem.getAttribute('data-field-index'));
      formBuilderState.sections = collectFormData();
      formBuilderState.sections[si].fields.splice(fi, 1);
      renderFormBuilderSections();
      return;
    }

    // Add field (in-section button)
    if (target.closest('.fb-add-field')) {
      const secCard = target.closest('.fb-section-card');
      const si = parseInt(secCard.getAttribute('data-section-index'));
      formBuilderState.sections = collectFormData();
      formBuilderState.sections[si].fields.push({
        id: generateFieldId(),
        label: '',
        type: 'text',
        required: false,
        placeholder: '',
        options: []
      });
      renderFormBuilderSections();
      return;
    }

    // Remove option
    if (target.closest('.fb-opt-remove')) {
      const secCard = target.closest('.fb-section-card');
      const fldItem = target.closest('.fb-field-item');
      const optRow = target.closest('.fb-opt-row');
      const si = parseInt(secCard.getAttribute('data-section-index'));
      const fi = parseInt(fldItem.getAttribute('data-field-index'));
      const oi = parseInt(optRow.getAttribute('data-opt-index'));
      formBuilderState.sections = collectFormData();
      formBuilderState.sections[si].fields[fi].options.splice(oi, 1);
      renderFormBuilderSections();
      return;
    }

    // Add option
    if (target.closest('.fb-add-opt')) {
      const secCard = target.closest('.fb-section-card');
      const fldItem = target.closest('.fb-field-item');
      const si = parseInt(secCard.getAttribute('data-section-index'));
      const fi = parseInt(fldItem.getAttribute('data-field-index'));
      formBuilderState.sections = collectFormData();
      formBuilderState.sections[si].fields[fi].options.push('');
      renderFormBuilderSections();
      return;
    }
  });

  // Change field type re-render (for showing/hiding options)
  if (fbSectionsContainer) fbSectionsContainer.addEventListener('change', function(e) {
    if (e.target.classList.contains('fb-fld-type')) {
      formBuilderState.sections = collectFormData();
      renderFormBuilderSections();
    }
  });

  // Add section
  if (fbAddSectionBtn) fbAddSectionBtn.addEventListener('click', function() {
    formBuilderState.sections = collectFormData();
    formBuilderState.sections.push({
      id: generateSectionId(),
      title: '',
      description: '',
      fields: []
    });
    renderFormBuilderSections();
  });

  // Sidebar "Add Field" buttons
  document.querySelectorAll('.fb-field-btn').forEach(function(btn) {
    btn.addEventListener('click', function() {
      const type = btn.getAttribute('data-type');
      formBuilderState.sections = collectFormData();
      if (!formBuilderState.sections.length) {
        formBuilderState.sections.push({ id: generateSectionId(), title: '', description: '', fields: [] });
      }
      const lastSection = formBuilderState.sections[formBuilderState.sections.length - 1];
      lastSection.fields.push({
        id: generateFieldId(),
        label: '',
        type: type,
        required: false,
        placeholder: '',
        options: type === 'dropdown' || type === 'multiple_choice' || type === 'checkbox' ? ['Option 1'] : []
      });
      renderFormBuilderSections();
    });
  });

  // Save form
  if (saveFormBtn) saveFormBtn.addEventListener('click', async function() {
    const title = fbTitle.value.trim();
    if (!title) {
      formBuilderStatus.textContent = 'Title is required.';
      return;
    }

    formBuilderState.sections = collectFormData();
    saveFormBtn.disabled = true;
    saveFormBtn.textContent = 'Saving...';
    formBuilderStatus.textContent = '';

    try {
      if (formBuilderState.id) {
        // Update
        await request('/api/admin/forms/' + formBuilderState.id, {
          method: 'PUT',
          headers: authHeaders(),
          body: JSON.stringify({
            title: title,
            description: fbDescription.value.trim(),
            sections: formBuilderState.sections,
            is_active: fbActive.checked
          })
        });
        formBuilderStatus.textContent = 'Form saved.';
      } else {
        // Create
        const data = await request('/api/admin/forms', {
          method: 'POST',
          headers: authHeaders(),
          body: JSON.stringify({
            title: title,
            description: fbDescription.value.trim(),
            sections: formBuilderState.sections
          })
        });
        formBuilderState.id = data.form.id;
        formBuilderState.slug = data.form.slug;
        formBuilderStatus.textContent = 'Form created.';
      }

      // Update link
      if (formBuilderState.slug) {
        const publicUrl = state.apiBase + '/forms/' + formBuilderState.slug;
        fbLinkWrap.innerHTML = '<a href="' + publicUrl + '" target="_blank">' + publicUrl + '</a><br>' +
          '<button class="fb-copy-link" onclick="navigator.clipboard.writeText(\'' + publicUrl + '\');this.textContent=\'Copied!\';setTimeout(()=>{this.textContent=\'Copy Link\'},1500)">Copy Link</button>';
      }
    } catch (err) {
      formBuilderStatus.textContent = err.message || 'Save failed.';
    } finally {
      saveFormBtn.disabled = false;
      saveFormBtn.textContent = 'Save Form';
    }
  });

  // Delete form
  async function deleteForm(id) {
    openConfirmModal('Delete this form and all its responses?', async function() {
      try {
        await request('/api/admin/forms/' + id, {
          method: 'DELETE',
          headers: authHeaders()
        });
        loadFormsOnly();
      } catch (err) {
        alert(err.message || 'Delete failed.');
      }
    });
  }

  // Responses viewer
  async function openFormResponses(formId) {
    currentResponseFormId = formId;
    switchTab('form-responses');
    responsesFormTitle.textContent = 'Loading...';
    responsesHead.querySelector('tr').innerHTML = '';
    responsesBody.innerHTML = '';
    responseCount.textContent = '';

    try {
      const [formData, respData] = await Promise.all([
        request('/api/admin/forms/' + formId, { headers: authHeaders() }),
        request('/api/admin/forms/' + formId + '/responses', { headers: authHeaders() })
      ]);

      const form = formData.form;
      const responses = respData.data || [];
      responsesFormTitle.textContent = form.title;
      responseCount.textContent = responses.length + ' response' + (responses.length !== 1 ? 's' : '');

      // Build headers from sections
      const fieldsList = [];
      let fieldCounter = 0;
      (form.sections || []).forEach(function(s) {
        (s.fields || []).forEach(function(f) {
          fieldCounter++;
          var displayLabel = (f.label && f.label.trim() && !/^f_[a-z0-9]+$/i.test(f.label.trim())) ? f.label.trim() : ('Question ' + fieldCounter);
          fieldsList.push({ id: f.id, label: displayLabel });
        });
      });

      let headHtml = '<th>#</th><th>Submitted</th><th>Email</th>';
      fieldsList.forEach(function(f) {
        headHtml += '<th>' + escapeHtml(f.label) + '</th>';
      });
      headHtml += '<th>Actions</th>';
      responsesHead.querySelector('tr').innerHTML = headHtml;

      responsesBody.innerHTML = responses.map(function(r, i) {
        const data = r.data || {};
        let row = '<td>' + (i + 1) + '</td>';
        row += '<td>' + escapeHtml(r.submitted_at ? new Date(r.submitted_at).toLocaleString() : '') + '</td>';
        row += '<td>' + escapeHtml(r.respondent_email || '') + '</td>';
        fieldsList.forEach(function(f) {
          const val = data[f.id];
          row += '<td>' + escapeHtml(Array.isArray(val) ? val.join(', ') : (val || '')) + '</td>';
        });
        row += '<td><button class="row-icon-btn danger" data-action="delete-response" data-rid="' + r.id + '" title="Delete response">' +
          '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2"/></svg>' +
        '</button></td>';
        return '<tr>' + row + '</tr>';
      }).join('');
    } catch (err) {
      responsesFormTitle.textContent = 'Error loading responses';
    }
  }

  // Delete response
  if (responsesBody) responsesBody.addEventListener('click', function(e) {
    const btn = e.target.closest('[data-action="delete-response"]');
    if (!btn) return;
    const rid = parseInt(btn.getAttribute('data-rid'));
    openConfirmModal('Delete this response?', async function() {
      try {
        await request('/api/admin/forms/' + currentResponseFormId + '/responses/' + rid, {
          method: 'DELETE',
          headers: authHeaders()
        });
        openFormResponses(currentResponseFormId);
      } catch (err) {
        alert(err.message || 'Delete failed.');
      }
    });
  });

  // Export CSV
  if (exportResponsesBtn) exportResponsesBtn.addEventListener('click', function() {
    if (!currentResponseFormId) return;
    const url = state.apiBase + '/api/admin/forms/' + currentResponseFormId + '/responses/export';
    const a = document.createElement('a');
    a.href = url;
    // Fetch with auth
    fetch(url, { headers: authHeaders() })
      .then(function(r) { return r.blob(); })
      .then(function(blob) {
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = 'responses.csv';
        link.click();
        URL.revokeObjectURL(link.href);
      });
  });

})();
