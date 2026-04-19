import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import {
  buildInitialQueueFromMockData,
  sortTriageQueue,
} from "../../services/triageService.mock";

const CONNECTION_LABEL = {
  connected: "Connected",
  pending_reads: "Pending reads",
  disconnected: "Disconnected",
  unpaired: "Unpaired",
};

const velocityFor = (ui) => {
  const delta = ui.signedBpmDelta ?? 0;
  if (delta > 0) {
    return { arrow: "↑", label: "Rising", mag: delta, tone: "rising" };
  }
  if (delta < 0) {
    return {
      arrow: "↓",
      label: "Falling",
      mag: Math.abs(delta),
      tone: "falling",
    };
  }
  return { arrow: "→", label: "Steady", mag: 0, tone: "steady" };
};

const VELOCITY_TONE = {
  rising: "text-[color:var(--color-signal-critical)]",
  falling: "text-[color:var(--color-signal-stable)]",
  steady: "text-ink-400 dark:text-ink-300",
};

const CONNECTION_TONE = {
  connected:
    "text-[color:var(--color-signal-stable)] bg-[color:var(--color-signal-stable)]/10",
  pending_reads:
    "text-[color:var(--color-signal-watch)] bg-[color:var(--color-signal-watch)]/10",
  disconnected:
    "text-[color:var(--color-signal-critical)] bg-[color:var(--color-signal-critical)]/10",
  unpaired: "text-ink-400 bg-ink-100/60 dark:text-ink-300 dark:bg-ink-700/40",
};

const FEATURES = [
  {
    title: "Real-time re-prioritization",
    body: "When a vital crosses a clinical threshold, queue order updates in under two seconds — no manual refresh, no paging tree.",
    icon: (
      <path
        d="M3 10h3l2-5 4 10 2-5h3"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    ),
  },
  {
    title: "Calm, single-pane view",
    body: "One board per department. Designed for peripheral glance — priority tone, chief complaint, and the vital driving the rank.",
    icon: (
      <>
        <rect
          x="3"
          y="4"
          width="14"
          height="12"
          rx="2"
          stroke="currentColor"
          strokeWidth="1.6"
        />
        <path d="M3 9h14" stroke="currentColor" strokeWidth="1.6" />
      </>
    ),
  },
  {
    title: "Audit-ready by default",
    body: "Every rank change is logged with the triggering signal and the clinician acknowledgment — exportable for M&M review.",
    icon: (
      <path
        d="M6 4h6l4 4v8a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2zM12 4v4h4M7 12h6M7 15h4"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    ),
  },
];

function PatientRow({ patient, highlight }) {
  const { patientName, patientId, clinicalPayload, uiState, transportMeta } =
    patient;
  const v = velocityFor(uiState);
  const connStatus = transportMeta?.connectionStatus ?? "unpaired";
  const stress = clinicalPayload.vitals.stress;

  return (
    <motion.div
      layout
      transition={{ type: "spring", stiffness: 260, damping: 28 }}
      className={`relative flex items-center gap-3 rounded-xl border px-3.5 py-3 ${
        uiState.isCritical
          ? "border-[color:var(--color-signal-critical)]/25 bg-[color:var(--color-signal-critical)]/5 dark:bg-[color:var(--color-signal-critical)]/10"
          : "border-ink-100 bg-white dark:border-ink-700 dark:bg-ink-800/60"
      }`}
    >
      {uiState.isCritical ? (
        <span
          aria-hidden
          className="pointer-events-none absolute inset-y-0 left-0 w-[3px] rounded-l-xl bg-gradient-to-b from-[color:var(--color-signal-critical)] to-[color:var(--color-signal-urgent)]"
        />
      ) : null}
      {highlight ? (
        <span
          aria-hidden
          className="pointer-events-none absolute -inset-px rounded-xl ring-2 ring-brand-400/60"
          style={{ animation: "landing-pulse-ring 1.6s ease-out 1" }}
        />
      ) : null}

      <span
        className={`h-2 w-2 shrink-0 rounded-full ${
          uiState.isCritical
            ? "bg-[color:var(--color-signal-critical)]"
            : "bg-[color:var(--color-signal-stable)]"
        }`}
      />

      <div className="flex min-w-0 flex-1 items-baseline gap-2">
        <span className="truncate text-[13px] font-semibold text-ink-800 dark:text-ink-50">
          {patientName}
        </span>
        <span className="shrink-0 font-mono text-[10.5px] text-ink-400 dark:text-ink-300">
          {patientId}
        </span>
      </div>

      <div className="hidden items-center gap-1.5 sm:flex">
        <span className="text-[10px] font-medium uppercase tracking-[0.1em] text-ink-300 dark:text-ink-400">
          SpO₂
        </span>
        <span className="font-mono text-[12.5px] font-semibold text-ink-700 dark:text-ink-100">
          {clinicalPayload.vitals.bloodOxygen}%
        </span>
      </div>

      <div className="flex items-center gap-1.5">
        <span className="text-[10px] font-medium uppercase tracking-[0.1em] text-ink-300 dark:text-ink-400">
          BPM
        </span>
        <span className="font-mono text-[12.5px] font-semibold text-ink-700 dark:text-ink-100">
          {clinicalPayload.vitals.heartBeat}
        </span>
      </div>

      <div className="hidden items-center gap-1.5 md:flex">
        <span className="text-[10px] font-medium uppercase tracking-[0.1em] text-ink-300 dark:text-ink-400">
          Stress
        </span>
        <span className="font-mono text-[12.5px] font-semibold text-ink-700 dark:text-ink-100">
          {stress == null ? "—" : stress}
        </span>
      </div>

      <span
        className={`hidden shrink-0 font-mono text-[11.5px] ${VELOCITY_TONE[v.tone]} lg:inline`}
      >
        {v.arrow} {v.label} {v.mag} bpm
      </span>

      <span
        className={`hidden shrink-0 rounded-full px-2 py-0.5 text-[10.5px] font-medium lg:inline ${CONNECTION_TONE[connStatus]}`}
      >
        {CONNECTION_LABEL[connStatus] ?? "Unpaired"}
      </span>

      {uiState.isCritical ? (
        <span className="absolute bottom-1 left-6 text-[10.5px] font-semibold uppercase tracking-[0.1em] text-[color:var(--color-signal-critical)] opacity-80">
          {uiState.criticalReason}
        </span>
      ) : null}
    </motion.div>
  );
}

function escalatePatient(patient) {
  const nextOxygen = Math.max(
    82,
    Math.min(patient.clinicalPayload.vitals.bloodOxygen, 89) - 2,
  );
  return {
    ...patient,
    clinicalPayload: {
      ...patient.clinicalPayload,
      vitals: {
        ...patient.clinicalPayload.vitals,
        bloodOxygen: nextOxygen,
        heartBeat: patient.clinicalPayload.vitals.heartBeat + 18,
      },
    },
    uiState: {
      ...patient.uiState,
      isCritical: true,
      criticalReason: "Critical oxygen drop",
      bpmDelta: 18,
      signedBpmDelta: 18,
      heartBeatDirection: "rising",
    },
  };
}

function DashboardMockup() {
  const [queue, setQueue] = useState(() =>
    sortTriageQueue(buildInitialQueueFromMockData()),
  );
  const [highlightId, setHighlightId] = useState(null);

  useEffect(() => {
    // Simulate live re-prioritization: escalate the first non-critical patient.
    const target = queue.find((p) => !p.uiState.isCritical);
    if (!target) return undefined;

    const t1 = setTimeout(() => {
      setQueue((current) => {
        const next = current.map((p) =>
          p.patientId === target.patientId ? escalatePatient(p) : p,
        );
        return sortTriageQueue(next);
      });
      setHighlightId(target.patientId);
    }, 2500);

    const t2 = setTimeout(() => setHighlightId(null), 5200);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="relative mx-auto w-full max-w-[880px]">
      {/* Ambient glow */}
      <div
        aria-hidden
        className="absolute -inset-10 rounded-[40px] bg-[radial-gradient(70%_60%_at_50%_0%,rgba(61,99,255,0.14),transparent_70%)] blur-2xl"
      />
      <div
        className="relative overflow-hidden rounded-[22px] border border-ink-100 bg-gradient-to-b from-white to-ink-50/60 shadow-[0_50px_100px_-40px_rgba(15,16,32,0.35),0_16px_32px_-16px_rgba(15,16,32,0.15)] dark:border-ink-700 dark:from-ink-800 dark:to-ink-900/80 dark:shadow-[0_50px_100px_-40px_rgba(0,0,0,0.75),0_16px_32px_-16px_rgba(0,0,0,0.5)]"
        style={{ animation: "landing-float 7s ease-in-out infinite" }}
      >
        {/* Window chrome */}
        <div className="flex items-center justify-between border-b border-ink-100 bg-white/70 px-4 py-3 backdrop-blur-sm dark:border-ink-700 dark:bg-ink-900/60">
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-ink-100 dark:bg-ink-700" />
            <span className="h-2.5 w-2.5 rounded-full bg-ink-100 dark:bg-ink-700" />
            <span className="h-2.5 w-2.5 rounded-full bg-ink-100 dark:bg-ink-700" />
          </div>
          <div className="flex items-center gap-2 rounded-md bg-ink-50 px-3 py-1 text-[11px] font-mono text-ink-400 dark:bg-ink-800 dark:text-ink-300">
            <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
              <path
                d="M6 1.5v1M6 9.5v1M1.5 6h1M9.5 6h1M2.6 2.6l.7.7M8.7 8.7l.7.7M2.6 9.4l.7-.7M8.7 3.3l.7-.7"
                stroke="currentColor"
                strokeWidth="1.2"
                strokeLinecap="round"
              />
              <circle
                cx="6"
                cy="6"
                r="2"
                stroke="currentColor"
                strokeWidth="1.2"
              />
            </svg>
            kinova.health/portal/triage
          </div>
          <span className="text-[11px] font-medium text-ink-400 dark:text-ink-300">
            ED West · Live
          </span>
        </div>

        {/* Body — full-width queue, matching the real portal layout */}
        <div className="p-5 md:p-6">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-400 dark:text-ink-300">
                Active Queue
              </p>
              <p className="text-[13px] font-medium text-ink-700 dark:text-ink-100">
                Auto-sorted by clinical priority
              </p>
            </div>
            <div className="flex items-center gap-2 rounded-full border border-ink-100 bg-white px-3 py-1 text-[11px] font-medium text-ink-500 dark:border-ink-700 dark:bg-ink-800/70 dark:text-ink-200">
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-[color:var(--color-signal-stable)]">
                <span
                  className="absolute inset-0 rounded-full bg-[color:var(--color-signal-stable)]"
                  style={{
                    animation: "landing-pulse-ring 2s ease-out infinite",
                  }}
                />
              </span>
              Streaming
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <AnimatePresence initial={false}>
              {queue.map((p) => (
                <PatientRow
                  key={p.patientId}
                  patient={p}
                  highlight={highlightId === p.patientId}
                />
              ))}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}

function DashboardSection() {
  return (
    <section
      id="dashboard"
      className="relative scroll-mt-20 overflow-hidden border-t border-ink-100 bg-gradient-to-b from-ink-50/40 to-white py-20 lg:py-28 dark:border-ink-700 dark:from-ink-900 dark:to-[#0c0d14]"
    >
      <div className="mx-auto max-w-[1200px] px-6 lg:px-10">
        <div className="mx-auto max-w-[680px] text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-ink-100 bg-white px-3 py-1 text-[11.5px] font-medium text-ink-500 dark:border-ink-700 dark:bg-ink-800/60 dark:text-ink-200">
            <span className="h-1.5 w-1.5 rounded-full bg-brand-500" />
            The Dashboard
          </span>
          <h2 className="mt-5 text-[32px] font-medium leading-[1.08] tracking-[-0.025em] text-black sm:text-[42px] dark:text-white">
            Patients{" "}
            <span className="font-serif italic font-normal text-brand-700 dark:text-brand-300">
              re-prioritize
            </span>{" "}
            themselves.
          </h2>
          <p className="mt-4 text-[15.5px] leading-[1.55] text-ink-500 sm:text-[16.5px] dark:text-ink-300">
            Every device reading flows into one queue. The sickest patient rises
            the moment their vitals say so — not when someone notices.
          </p>
        </div>

        <div className="mt-12 lg:mt-14">
          <DashboardMockup />
        </div>

        <div className="mt-12 grid gap-4 md:mt-14 md:grid-cols-3 md:gap-5">
          {FEATURES.map((f) => (
            <div
              key={f.title}
              className="rounded-2xl border border-ink-100 bg-white p-5 transition-all hover:-translate-y-0.5 hover:border-ink-200 hover:shadow-[0_24px_40px_-28px_rgba(15,16,32,0.35)] dark:border-ink-700 dark:bg-ink-800/50 dark:hover:border-ink-600 dark:hover:shadow-[0_24px_40px_-28px_rgba(0,0,0,0.7)]"
            >
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-500/20 dark:text-brand-200">
                <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
                  {f.icon}
                </svg>
              </span>
              <h3 className="mt-3.5 text-[15px] font-semibold tracking-[-0.01em] text-ink-800 dark:text-ink-50">
                {f.title}
              </h3>
              <p className="mt-1.5 text-[13.5px] leading-[1.55] text-ink-500 dark:text-ink-300">
                {f.body}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default DashboardSection;
