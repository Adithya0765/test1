# Enterprise Admin Dashboard PRD

Version: 1.0  
Date: 2026-03-15  
Owner: Product + Platform Architecture

## 1. Scope and Outcome

This document translates the admin dashboard blueprint into an implementation-ready PRD for engineering execution.

### Objectives

- Deliver a secure, real-time enterprise admin system for multi-tenant SaaS operations.
- Support role-based administration, org management, task/project workflows, analytics, and communications.
- Ensure enterprise-grade UX, auditability, and performance across desktop and mobile.

### Non-goals (Phase 1)

- Full BI warehouse replacement.
- Advanced AI forecasting (planned in later phase).
- Native mobile app (responsive web only in initial releases).

## 2. Personas and Permissions Baseline

- Super Admin: global tenant controls, security policy, critical overrides.
- Org Admin: user lifecycle, roles, departments, announcements, org reporting.
- Department Manager: team-level users/tasks, team dashboards.
- Analyst: read analytics + export.
- Support Agent: constrained user support actions.
- Auditor: read-only audit and compliance evidence.

## 3. Feature Set by Release

## Release R1 (Foundation)

- OTP login for admin users.
- User directory and profile administration.
- Role templates + custom role editor with granular permissions.
- Main dashboard (KPIs + activity feed + alerts).
- Audit log (critical actions only in R1).

## Release R2 (Execution Layer)

- Org hierarchy (department/team/manager graph).
- Task + project management board (Jira-like statuses).
- Notification workflows (email + in-app).
- Analytics Hub v1 with filterable dashboards and exports.

## Release R3 (Global + Compliance)

- Multi-language framework and locale rendering.
- Country-specific policy overlays and scoped reporting.
- Scheduled reports and compliance retention controls.
- Expanded monitoring and incident workflows.

## 4. Functional Requirements

## 4.1 Authentication and Session Security

### FR-AUTH-01
System must support email/password login with OTP challenge for admin users.

### FR-AUTH-02
System must enforce OTP rate limiting and lockout policies.

### FR-AUTH-03
System must allow session revocation by admin and by user self-service.

### FR-AUTH-04
System must record all authentication events in audit trail.

## 4.2 User and Access Management

### FR-UAM-01
Admins can invite, activate, suspend, deactivate users.

### FR-UAM-02
Role editor supports resource-action-scope permission matrix.

### FR-UAM-03
Admins can assign user to department, manager, country scope, and projects.

### FR-UAM-04
Sensitive actions require reason capture and audit log.

## 4.3 Organization Structure

### FR-ORG-01
System supports department/team hierarchy and manager relationships.

### FR-ORG-02
Org chart must render at least 5 hierarchy levels and support search.

### FR-ORG-03
Transfer workflow moves users across teams with approval and access recalculation.

## 4.4 Monitoring

### FR-MON-01
Live dashboard updates critical KPIs with near-real-time transport.

### FR-MON-02
Incident feed supports acknowledge, assign, and status transitions.

### FR-MON-03
Status cards show component health by region.

## 4.5 Analytics and Reporting

### FR-ANL-01
Global filters: date range, country, department, role, project.

### FR-ANL-02
Charts include time series, bar/stacked, funnel, geo distribution.

### FR-ANL-03
Exports: CSV and PDF in R2; scheduled exports in R3.

## 4.6 Communications

### FR-COM-01
System sends email for account updates and task events.

### FR-COM-02
Announcement composer supports audience targeting by role/department/country.

### FR-COM-03
Meeting scheduler generates integration links and time-zone-aware invitations.

## 4.7 Task and Project Management

### FR-TPM-01
Tasks include assignee, priority, due date, dependencies, status.

### FR-TPM-02
Workflow states are configurable and permission-gated.

### FR-TPM-03
System tracks overdue tasks and triggers escalation notifications.

## 5. UX and Screen-Level Component Inventory

## 5.1 Main Dashboard Screen

### Layout Regions

- Top utility bar: search, alerts, quick actions, profile.
- KPI strip: active users, open incidents, open tasks, SLA at risk.
- Live charts area: traffic, error rate, latency.
- Activity feed: latest auth, role, and operational changes.
- Action rail: pending approvals and announcements.

### Components

- KPI cards (interactive drill-down)
- Live line chart widget
- Alert list with severity badges
- Activity timeline
- Compact data table

## 5.2 Role Management Screen

### Layout Regions

- Left: role list + search + template filter.
- Center: permission matrix editor.
- Right: impact preview and users affected.

### Components

- Role list table
- Permission matrix grid (resource/action/scope)
- Validation panel (conflicts/over-permission warnings)
- Save modal (reason required)

## 5.3 User Administration Screen

### Layout Regions

- Header filters and bulk actions.
- User table with status and last activity.
- Detail drawer for quick updates.
- Profile tabs: details, access, tasks, activity.

### Components

- Data table with column chooser
- Bulk action toolbar
- Side drawer editor
- OTP status widget
- Session revoke action control

## 5.4 Analytics Hub Screen

### Layout Regions

- Global filter ribbon.
- Widget canvas (resizable chart cards).
- Insight summary panel.
- Export and schedule control panel.

### Components

- Filter chips and presets
- Chart widgets (line/bar/funnel/geo)
- Saved view manager
- Export modal

## 6. Wireframe Guidance (Low-Fidelity)

## Dashboard Wireframe

- Row 1: [Search][Quick Create][Notifications][Profile]
- Row 2: [KPI1][KPI2][KPI3][KPI4]
- Row 3: [Large Live Chart 70% width][Alerts Feed 30% width]
- Row 4: [Team Productivity][Approvals + Announcements]

## Role Management Wireframe

- Left column 25%: role list.
- Middle 55%: permission matrix with horizontal scroll.
- Right 20%: impact/preview summary and warnings.

## User Administration Wireframe

- Top: filter/search row + bulk actions.
- Main: full-width table.
- Right slide-over: editable user details.
- Detail page: tabbed sections with timeline.

## Analytics Hub Wireframe

- Top: sticky filters and date selector.
- Main: drag-and-drop widget grid.
- Right: insights and export controls.

## 7. API Contracts (Initial)

Base path: /api/admin

## 7.1 Auth

- POST /auth/login
  - Request: { email, password }
  - Response: { challengeId, otpRequired, methods[] }

- POST /auth/verify-otp
  - Request: { challengeId, otpCode }
  - Response: { accessToken, refreshToken, user, roles[] }

- POST /auth/logout
  - Request: { sessionId }
  - Response: { success: true }

## 7.2 Users

- GET /users?query=&status=&role=&department=&country=&page=&limit=
  - Response: { items[], page, total }

- POST /users/invite
  - Request: { email, name, roleId, departmentId, countryCode, managerId }
  - Response: { userId, inviteStatus }

- PATCH /users/:id
  - Request: partial fields
  - Response: { user }

- POST /users/:id/suspend
  - Request: { reason }
  - Response: { success }

- POST /users/:id/revoke-sessions
  - Request: { reason }
  - Response: { revokedCount }

## 7.3 Roles and Permissions

- GET /roles
  - Response: { items[] }

- POST /roles
  - Request: { name, description, permissions[] }
  - Response: { role }

- PATCH /roles/:id
  - Request: { name?, description?, permissions? }
  - Response: { role }

- POST /roles/:id/simulate
  - Request: { userContext }
  - Response: { allowedActions[], deniedActions[] }

## 7.4 Org Structure

- GET /org/departments
  - Response: { items[] }

- POST /org/departments
  - Request: { name, parentDepartmentId? }
  - Response: { department }

- GET /org/chart?rootDepartmentId=
  - Response: { nodes[], edges[] }

## 7.5 Tasks and Projects

- GET /projects
  - Response: { items[] }

- GET /tasks?projectId=&status=&assigneeId=&dueBefore=
  - Response: { items[], total }

- POST /tasks
  - Request: { title, description, assigneeId, priority, dueDate, projectId }
  - Response: { task }

- PATCH /tasks/:id
  - Request: partial fields
  - Response: { task }

- POST /tasks/:id/transition
  - Request: { toStatus, reason? }
  - Response: { task, transitionValid }

## 7.6 Monitoring and Analytics

- GET /monitoring/kpis
  - Response: { activeUsers, errorRate, avgLatencyMs, openIncidents, updatedAt }

- GET /monitoring/incidents?status=&severity=
  - Response: { items[] }

- GET /analytics/overview?from=&to=&country=&department=&role=
  - Response: { widgets: { ... } }

- POST /analytics/export
  - Request: { format, filterSet, widgetIds[] }
  - Response: { exportId, status }

## 7.7 Communications

- POST /communications/announcements
  - Request: { title, body, audienceFilter, channels[] }
  - Response: { announcementId, recipients }

- POST /communications/meeting-links
  - Request: { provider, startTime, durationMin, attendeeIds[] }
  - Response: { meetingUrl, meetingId }

## 8. Real-Time Event Contracts

Channel: /ws/admin

### Event Types

- auth.login.success
- auth.login.failed
- user.updated
- role.updated
- task.status.changed
- incident.created
- incident.updated
- kpi.snapshot.updated

### Event Envelope

{
  "eventId": "uuid",
  "eventType": "task.status.changed",
  "tenantId": "t_123",
  "actorId": "u_1",
  "timestamp": "2026-03-15T10:00:00Z",
  "payload": {}
}

## 9. Data Model Starter (Entities)

- users(id, email, name, status, department_id, country_code, otp_enabled, created_at)
- roles(id, name, description, created_at)
- permissions(id, resource, action, scope)
- role_permissions(role_id, permission_id)
- user_roles(user_id, role_id)
- departments(id, name, parent_id)
- tasks(id, project_id, title, status, assignee_id, due_date, priority)
- projects(id, name, owner_id, status)
- incidents(id, severity, status, summary, region, created_at)
- audit_logs(id, actor_id, action, target_type, target_id, metadata_json, created_at)

## 10. Non-Functional Requirements

- Availability target: 99.9% for admin core operations.
- P95 API response target:
  - reads <= 300ms
  - writes <= 500ms
- Dashboard initial contentful render <= 2.5s on broadband.
- Support 10k+ users per tenant and 200 concurrent admin sessions.
- Audit log immutability for privileged actions.
- Accessibility baseline WCAG 2.1 AA.

## 11. Performance and Scalability Strategy

- Cache hot dashboard metrics with short TTL (15-30s).
- Use cursor-based pagination for high-volume tables.
- Partition event streams by tenant/region.
- Offload heavy analytics queries to read replicas or warehouse.
- Use background jobs for report generation and bulk emails.

## 12. QA and Acceptance Matrix

## Security

- OTP bypass attempts blocked.
- Session revocation effective within 60 seconds.
- Privileged actions always require audit reason.

## Functional

- Role matrix enforces action-level restrictions.
- User transfer updates org chart and access scopes.
- Task workflow constraints enforced by role/state.

## Real-Time

- Incident feed updates within 3 seconds target.
- Reconnect logic resumes with no duplicate event rendering.

## 13. Sprint-Level Engineering Plan (10 Sprints)

Sprint 1
- Auth service hardening, OTP flow UI/API, token/session model.

Sprint 2
- User directory backend + table UI + profile drawer.

Sprint 3
- Role templates + custom permission matrix + simulation endpoint.

Sprint 4
- Dashboard KPIs, activity feed, alert center, websocket skeleton.

Sprint 5
- Org hierarchy CRUD + org chart + transfer workflow.

Sprint 6
- Task/project entities + board/list UI + transition rules.

Sprint 7
- Analytics Hub v1 + global filters + CSV/PDF exports.

Sprint 8
- Notification engine + announcement composer + email templates.

Sprint 9
- Multi-country localization shell + regional policy guardrails.

Sprint 10
- Performance hardening, observability, security review, UAT signoff.

## 14. Risks and Mitigations

- Risk: Permission model complexity causes regressions.
  - Mitigation: permission simulation endpoint + policy test suite.

- Risk: Real-time updates increase client complexity.
  - Mitigation: unified event bus adapter + replay on reconnect.

- Risk: Analytics queries degrade app responsiveness.
  - Mitigation: pre-aggregations, async export jobs, caching.

## 15. Implementation Notes for Current Repo

- Reuse existing /api/admin pattern from current admin-page app.
- Keep feature modules isolated in frontend by domain folders.
- Introduce shared UI component layer before expanding modules.
- Add contract tests between frontend and /api/admin endpoints.
