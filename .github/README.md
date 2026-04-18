# Kinovo Triage Dashboard

Kinovo is a waiting room triage application built to support nurses during intake. The goal is to surface critical patient changes quickly, reduce scan time across many patients, and make wearable health status visible before escalation.

This project is currently frontend first. Core workflows are implemented with mock data and placeholder backend routes so the team can iterate on clinical usability while API services are being built.

## What this project does

The dashboard provides a single page intake experience with these capabilities.

1. Live waiting room queue populated by wearable connected patients.
2. Acuity focused patient cards with critical state highlighting.
3. Patient detail modal with deeper vitals visibility.
4. Device health section for battery, signal, and sync status.
5. Add patient workflow supporting registered lookup and temporary patient intake.
6. Auth scaffolding for patient and hospital staff account types.

## Large scale decisions made so far

### 1. Waiting room scope only

The system is intentionally scoped to nurse intake and waiting room monitoring. Ambulance transport modeling and location fields are deferred for this phase.

### 2. Acuity first interface hierarchy

The queue is sorted to keep highest risk patients on top using the triage ordering below.

$$
	ext{Priority} = (\text{isCritical DESC}, SpO_2\ \text{ASC}, timestamp\ \text{DESC})
$$

Critical state is currently triggered by threshold logic.

$$
	ext{isCritical} = (SpO_2 < 90) \lor (\Delta BPM > 20)
$$

### 3. In memory vitals buffering

Raw vitals are handled in volatile memory using circular buffers.

1. Trend buffer: 60 points at 1 sample per second for card sparklines.
2. Waveform buffer: 150 points at 25 samples per second for detail waveform.

Data is purged on patient release and provider unmount in the current implementation.

### 4. Visualization split by clinical purpose

Two chart modes are used to improve readability.

1. SVG sparkline in the card for fast trend scanning.
2. Canvas waveform in detail view for higher frequency beat visualization.

The rendering stack uses React with D3 primitives for scaling and path generation.

### 5. Backend ready frontend contracts

The app uses placeholder service routes and normalized data structures so backend integration can be attached with minimal UI rewrites.

### 6. Role aware UX direction

Navigation and account flows support patient and staff pathways. Staff users route into dashboard operations. Settings and logout are consolidated under profile controls to preserve visual focus on the queue.

## Technology stack

1. React
2. Vite
3. React Router
4. D3
5. ESLint

## Project status

Current state is prototype plus architecture hardening.

1. Dashboard readability and triage behavior are actively being tuned.
2. Clinical intake workflow is the primary focus.
3. Backend services are pending and will replace mock service layers incrementally.

## Next milestones

1. Connect dashboard state to secure backend endpoints.
2. Finalize patient release data retention policy for production.
3. Expand device fleet diagnostics and admin analytics.
4. Add deeper test coverage for queue ordering and staleness behavior.
