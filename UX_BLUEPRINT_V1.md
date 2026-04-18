# Kinovo UX Blueprint v1

**Date:** 2026-04-18  
**Scope:** Waiting-room intake phase (no ambulance transport UI)  
**Audience:** Product, Design, Frontend, Backend, Clinical Advisors

---

## 1) Purpose

Create a cohesive product experience using a **two-surface model**:

1. **Public Surface (Landing)** for trust and mission storytelling.
2. **Clinical Surface (Portal)** for fast triage operations.

This blueprint aligns navigation, roles, and reliability language so users can quickly answer:

> "Who needs a doctor in the next 60 seconds?"

---

## 2) Non-Goals (for v1)

- No ambulance transport/location UI modeling.
- No deep transport metadata inspector in staff view.
- No implementation details for BLE packet debugger in UI.
- No major visual animation work unrelated to triage/reliability state changes.

---

## 3) Product Information Architecture

## Public Surface

- `/` Landing (mission + outcomes + trust)
- `/how-it-works` System explanation (thin edge, thick client, local-first)
- `/security` Security/accountability overview
- `/portal` CTA entry to authenticated clinical portal

## Clinical Surface

- `/portal/triage` (default) Live risk-sorted queue
- `/portal/intake` Pairing + patient assignment flow
- `/portal/devices` Fleet/device health
- `/portal/analytics` Wait-time + operational insights (admin-focused)
- `/portal/settings` Theme, account security, session settings

---

## 4) Route & Layout Contract

Use nested route shells:

- **PublicShell** for landing/public routes
- **PortalShell** for `/portal/*` with:
  - Global Sidebar (left)
  - System Trust Strip (top)
  - Feature Workspace (main outlet)

Protected route behavior:

- `/portal/*` requires authentication
- Route-level role gating for admin-only modules

---

## 5) Global Sidebar Specification

Sidebar is persistent in PortalShell and includes labeled items (not icon-only by default).

## Core Navigation Items

1. Live Queue
2. Intake & Pairing
3. Device Health
4. Analytics (Admin)
5. Settings

## Sidebar Header

- Current user name
- Role badge (Staff/Admin)
- Facility context (if available)

## Sidebar Reliability Rail (compact)

- Connectivity state pill
- Unsynced record count
- Last successful sync time
- Optional stale patient count

### Global Sidebar v1 — Minimal Data Contract (fields + source + fallback)

Use a single sidebar model that can be fed by current mock/service data now and local-first sync internals later.

#### Contract root

```ts
type GlobalSidebarModel = {
  identity: SidebarIdentity;
  nav: SidebarNav;
  reliabilityRail: SidebarReliabilityRail;
};
```

#### 1) Identity (role-aware header)

| Field          | Type                 | Required | Source (v1)                                                                                        | Fallback          |
| -------------- | -------------------- | -------- | -------------------------------------------------------------------------------------------------- | ----------------- |
| `displayName`  | `string`             | Yes      | `getCurrentSession()?.fullName` then `email` (`triage-dashboard/src/services/authService.mock.js`) | `"Clinical User"` |
| `role`         | `"staff" \| "admin"` | Yes      | `getCurrentSession()?.accountType` (currently staff)                                               | `"staff"`         |
| `facilityName` | `string \| null`     | No       | backend user hospital when surfaced in session/profile                                             | `null`            |

Normalization:

- Unknown/missing roles normalize to `staff`.
- Keep role enum stable when admin auth is introduced.

#### 2) Navigation (role-aware items)

| Field   | Type               | Required | Source (v1)                                     | Fallback            |
| ------- | ------------------ | -------- | ----------------------------------------------- | ------------------- |
| `items` | `SidebarNavItem[]` | Yes      | static route-policy config aligned to portal IA | staff menu baseline |

`SidebarNavItem`:

| Field       | Type                                                                            | Required | Rule                            |
| ----------- | ------------------------------------------------------------------------------- | -------- | ------------------------------- |
| `id`        | `"liveQueue" \| "intakePairing" \| "deviceHealth" \| "analytics" \| "settings"` | Yes      | stable key for tests/analytics  |
| `label`     | `string`                                                                        | Yes      | human-readable label            |
| `route`     | `string`                                                                        | Yes      | portal route path               |
| `visibleTo` | `Array<"staff" \| "admin">`                                                     | Yes      | role visibility control         |
| `enabled`   | `boolean`                                                                       | Yes      | feature flag for phased rollout |

Role defaults:

- `staff` sees: `liveQueue`, `intakePairing`, `deviceHealth`, `settings`
- `admin` sees: all above + `analytics`

#### 3) Reliability rail (minimal, future-safe)

| Field                  | Type                                                            | Required | Source (v1)                                                                                                                              | Fallback                   |
| ---------------------- | --------------------------------------------------------------- | -------- | ---------------------------------------------------------------------------------------------------------------------------------------- | -------------------------- |
| `syncState`            | `"live" \| "stale" \| "offline" \| "backfilling" \| "degraded"` | Yes      | derived from `patients[*].transportMeta.connectionStatus` + freshness from `clinicalPayload.timestamp` (`VitalsProvider` + mock service) | `"offline"`                |
| `connectionLabel`      | `string`                                                        | Yes      | derived from `syncState`                                                                                                                 | `"Offline"`                |
| `unsyncedCount`        | `number`                                                        | Yes      | until outbox exists, use `0` or mock aggregate value                                                                                     | `0`                        |
| `lastSuccessfulSyncAt` | `string \| null` (ISO-8601)                                     | No       | max `patients[*].transportMeta.lastSyncTime`                                                                                             | `null`                     |
| `stalePatientCount`    | `number`                                                        | No       | count where `now - clinicalPayload.timestamp > 10s`                                                                                      | `0`                        |
| `lastRailComputedAt`   | `string` (ISO-8601)                                             | Yes      | computed at selector time                                                                                                                | `new Date().toISOString()` |

Future local-first compatibility rule:

- Keep this exact rail shape.
- Map future transport internals (e.g., `bufferedDuringDeadZone`, `backfillBatchId`, `ackState`, retry depth) into existing `syncState` and counts rather than adding new sidebar keys.

### Sidebar v1 Reliability Contract (state + cadence)

The rail uses four mutually exclusive top-level states:

1. **Live**
2. **Stale**
3. **Offline**
4. **Backfilling**

Precedence rule (highest wins):

`Backfilling > Offline > Stale > Live`

#### State thresholds (v1 defaults)

- **Live**
  - Last vitals age: `<= 10s`
  - Last successful sync age: `<= 15s`
  - Connectivity heartbeat seen within `<= 15s`

- **Stale**
  - Last vitals age: `> 10s and <= 60s`, **or**
  - Last successful sync age: `> 15s and <= 120s`, while heartbeat is still present

- **Offline**
  - No connectivity heartbeat for `> 30s`, **or**
  - 3 consecutive sync attempts fail/time out, **or**
  - Transport layer explicitly flags offline

- **Backfilling**
  - Connectivity restored, unsynced count `> 0`, and bulk replay is in progress
  - Remains active until unsynced count reaches `0` based on server acknowledgements

#### Reliability metrics shown in rail

- **Unsynced count**
  - Integer count of locally buffered records not yet server-acknowledged
  - Must only decrement on explicit server acknowledgement (`successfully_ingested_ids`)

- **Last sync age**
  - Display as relative age (e.g., `12s ago`, `2m ago`)
  - Derived from timestamp of last successful checksum-verified ingestion acknowledgement

#### Update cadence (UI + transport)

- UI age labels (`last sync age`, freshness): recompute every `1s`
- Connectivity heartbeat check: every `5s` (normal), tolerate jitter up to `15s`
- Sync status updates (ack success/failure, backfill progress): event-driven and immediate
- Retry loop while offline: exponential backoff with ceiling (e.g., `2s, 4s, 8s ... up to 60s`)

#### Conservative fallback behavior (low-connectivity)

- Default to the **less optimistic** state when signals conflict or are delayed.
  - Example: if heartbeat is uncertain and last sync age is high, show **Offline** over **Stale**.
- Never mark records as synced until:
  1. server returns record ID in `successfully_ingested_ids`, and
  2. server-side checksum verification passes.
- On partial backfill success, remove only acknowledged IDs; keep remaining records buffered with preserved sequence/checksum metadata.
- If state telemetry is missing/ambiguous for `> 20s`, show **Offline (Degraded Link)** and keep unsynced count visible.
- In degraded mode, freeze non-essential visual motion and keep textual status explicit.

Accessibility requirements:

- Keyboard navigable
- Visible focus state
- Label + icon redundancy
- Targets large enough for high-pressure usage environments

---

## 6) Role Behavior Contract

## Staff View (default operational mode)

Priorities:

- Live queue scanability
- Rapid patient focus switching
- Quick actions: view details, release, pair workflow

Visibility emphasis:

- Vitals + acuity + freshness + device state

## Admin View (operational oversight)

Priorities:

- Wait-time trend and bottlenecks
- Fleet battery/risk hotspots
- Reliability and sync health

Visibility emphasis:

- Aggregated metrics and actionable exceptions

---

## 7) Status Language Contract (shared across product)

Use the same state vocabulary in cards, headers, and admin views:

- **Live**: data updated within threshold
- **Stale**: data older than threshold (default threshold: 10s)
- **Offline**: no active upstream sync
- **Backfilling**: replaying buffered records after reconnection

For Sidebar v1 implementation details (thresholds, precedence, and cadence), use the contract in Section 5.

## Display rules

- Never rely on color alone; include text labels/icons.
- Stale state should dim values but keep them visible.
- Show last-updated timestamp consistently.

---

## 8) Triage Workspace Visual Hierarchy

Main workspace order (most important first):

1. **Risk-sorted patient queue**
2. **Critical summary strip**
3. **Selected patient detail panel**
4. **Secondary analytics**

Card-level hierarchy:

1. Acuity state
2. SpO₂ (largest numeric emphasis)
3. Heart rate
4. Stress
5. Last updated / freshness indicator
6. Device connection status

Sort rule (explicit and stable):

`is_critical DESC, spo2 ASC, timestamp DESC`

---

## 9) Intake & Pairing Experience (3-step wizard)

1. **Pair Device** (discover/select wearable)
2. **Assign Patient** (existing or temporary intake record)
3. **Confirm Live Stream** (active reads + battery confidence)

Design principle:

- Keep workflow in ≤3 taps/clicks where feasible.
- Surface blockers clearly (e.g., no active reads, battery critical).

---

## 10) Safety & Trust UX Guardrails

- High-impact actions (e.g., release patient) must remain deliberate.
- Preserve clear action contrast between “View Details” and “Release”.
- Show session/user role context at all times inside portal.
- Keep security/account state language human-readable, not crypto-jargon heavy.

---

## 11) Collaboration Model (2+ developer team)

## Recommended ownership

- Shell + Navigation: Frontend Architect/Owner A
- Triage + Intake workflows: Owner B
- Reliability states + data contracts: Shared with backend owner

## PR strategy

- Small, scoped PRs by feature area
- Avoid unrelated style churn
- Require screenshot checks for navigation and triage states

## Decision hygiene

- Track key decisions in short ADRs:
  - route strategy
  - sidebar contract
  - status language
  - role gating behavior

---

## 12) Phase Plan

## Phase 0: UX Skeleton

- Landing shell
- Portal shell with sidebar + trust strip
- Route scaffolding + role guards

## Phase 1: Core Triage Flow

- Risk-sorted queue
- Patient detail panel
- Intake pairing wizard
- Stale-state visuals

## Phase 2: Reliability & Local-First UX

- Unsynced/backfill visibility (global first)
- Retry/error states for low-connectivity environments

## Phase 3: Admin Depth

- Wait-time analytics
- Device fleet health and operational exception flows

---

## 13) Acceptance Criteria for Blueprint Adoption

- Team agrees on two-surface architecture (Public + Portal).
- Route map and sidebar labels are frozen for Phase 0/1.
- Shared status vocabulary is implemented consistently.
- Staff and admin role views have clear, distinct priorities.
- No location/transport expansion in waiting-room phase without explicit scope change.

---

## 14) Open Questions for Next Planning Session

1. What exact stale threshold(s) should trigger visual dim vs escalation?
2. Which analytics belong in staff view vs admin-only view?
3. Should release actions require confirmation in all cases or only critical cases?
4. Which reliability indicators should be always-on vs expandable details?

---

## 15) One-line North Star

**Success is not Bluetooth connection; success is reliable, glanceable triage prioritization that helps staff identify who needs care next, fast.**
