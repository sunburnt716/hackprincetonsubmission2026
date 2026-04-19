import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";

const INITIAL_QUEUE = [
  { id: "4821", name: "M · 62", chief: "Chest pain", priority: "Critical", tone: "critical", hr: 128, spo2: 91, pulse: true },
  { id: "3377", name: "F · 41", chief: "Dyspnea", priority: "Urgent", tone: "urgent", hr: 112, spo2: 94 },
  { id: "2990", name: "M · 55", chief: "Laceration", priority: "Urgent", tone: "urgent", hr: 98, spo2: 97 },
  { id: "2204", name: "M · 29", chief: "Fever", priority: "Watch", tone: "watch", hr: 98, spo2: 98 },
  { id: "1958", name: "F · 73", chief: "Post-op obs", priority: "Stable", tone: "stable", hr: 74, spo2: 99 },
];

const TONE_STYLES = {
  critical: "border-[color:var(--color-signal-critical)]/25 bg-[color:var(--color-signal-critical)]/5",
  urgent: "border-[color:var(--color-signal-urgent)]/25 bg-[color:var(--color-signal-urgent)]/5",
  watch: "border-[color:var(--color-signal-watch)]/25 bg-[color:var(--color-signal-watch)]/5",
  stable: "border-ink-100 bg-white",
};

const TONE_DOT = {
  critical: "bg-[color:var(--color-signal-critical)]",
  urgent: "bg-[color:var(--color-signal-urgent)]",
  watch: "bg-[color:var(--color-signal-watch)]",
  stable: "bg-[color:var(--color-signal-stable)]",
};

const TONE_TEXT = {
  critical: "text-[color:var(--color-signal-critical)]",
  urgent: "text-[color:var(--color-signal-urgent)]",
  watch: "text-[color:var(--color-signal-watch)]",
  stable: "text-[color:var(--color-signal-stable)]",
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
        <rect x="3" y="4" width="14" height="12" rx="2" stroke="currentColor" strokeWidth="1.6" />
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
  return (
    <motion.div
      layout
      transition={{ type: "spring", stiffness: 260, damping: 28 }}
      className={`relative flex items-center gap-3 rounded-xl border px-3.5 py-3 ${TONE_STYLES[patient.tone]}`}
    >
      {highlight ? (
        <span
          aria-hidden
          className="pointer-events-none absolute -inset-px rounded-xl ring-2 ring-brand-400/60"
          style={{ animation: "landing-pulse-ring 1.6s ease-out 1" }}
        />
      ) : null}
      <span className={`h-2 w-2 shrink-0 rounded-full ${TONE_DOT[patient.tone]}`} />
      <div className="flex flex-1 items-baseline gap-2">
        <span className="text-[12.5px] font-semibold text-ink-800">#{patient.id}</span>
        <span className="text-[11.5px] text-ink-400">{patient.name}</span>
      </div>
      <span className="hidden text-[11.5px] text-ink-500 sm:inline">
        {patient.chief}
      </span>
      <span className={`text-[11px] font-semibold uppercase tracking-[0.1em] ${TONE_TEXT[patient.tone]}`}>
        {patient.priority}
      </span>
      <div className="hidden items-center gap-2 text-[11px] font-mono text-ink-500 md:flex">
        <span>{patient.hr} bpm</span>
        <span className="text-ink-200">·</span>
        <span>{patient.spo2}%</span>
      </div>
    </motion.div>
  );
}

function DashboardMockup() {
  const [queue, setQueue] = useState(INITIAL_QUEUE);
  const [highlightId, setHighlightId] = useState(null);

  useEffect(() => {
    // Simulate live re-prioritization: patient #2204 deteriorates after 2.5s
    const t1 = setTimeout(() => {
      setQueue((q) => {
        const next = q.map((p) =>
          p.id === "2204"
            ? { ...p, tone: "critical", priority: "Critical", hr: 138, spo2: 88, chief: "Fever · ↓ SpO₂" }
            : p,
        );
        // Move #2204 to top
        next.sort((a, b) => {
          const order = { critical: 0, urgent: 1, watch: 2, stable: 3 };
          return order[a.tone] - order[b.tone];
        });
        return next;
      });
      setHighlightId("2204");
    }, 2500);

    const t2 = setTimeout(() => setHighlightId(null), 5200);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, []);

  return (
    <div className="relative mx-auto w-full max-w-[880px]">
      {/* Ambient glow */}
      <div
        aria-hidden
        className="absolute -inset-10 rounded-[40px] bg-[radial-gradient(70%_60%_at_50%_0%,rgba(61,99,255,0.14),transparent_70%)] blur-2xl"
      />
      <div
        className="relative overflow-hidden rounded-[22px] border border-ink-100 bg-gradient-to-b from-white to-ink-50/60 shadow-[0_50px_100px_-40px_rgba(15,16,32,0.35),0_16px_32px_-16px_rgba(15,16,32,0.15)]"
        style={{ animation: "landing-float 7s ease-in-out infinite" }}
      >
        {/* Window chrome */}
        <div className="flex items-center justify-between border-b border-ink-100 bg-white/70 px-4 py-3 backdrop-blur-sm">
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-ink-100" />
            <span className="h-2.5 w-2.5 rounded-full bg-ink-100" />
            <span className="h-2.5 w-2.5 rounded-full bg-ink-100" />
          </div>
          <div className="flex items-center gap-2 rounded-md bg-ink-50 px-3 py-1 text-[11px] font-mono text-ink-400">
            <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
              <path
                d="M6 1.5v1M6 9.5v1M1.5 6h1M9.5 6h1M2.6 2.6l.7.7M8.7 8.7l.7.7M2.6 9.4l.7-.7M8.7 3.3l.7-.7"
                stroke="currentColor"
                strokeWidth="1.2"
                strokeLinecap="round"
              />
              <circle cx="6" cy="6" r="2" stroke="currentColor" strokeWidth="1.2" />
            </svg>
            kinovo.health/portal/triage
          </div>
          <span className="text-[11px] font-medium text-ink-400">ED West · Live</span>
        </div>

        {/* Body */}
        <div className="grid gap-5 p-5 md:grid-cols-[180px_1fr] md:gap-6 md:p-6">
          {/* Side filters */}
          <aside className="hidden flex-col gap-1.5 md:flex">
            <p className="px-2 text-[10.5px] font-semibold uppercase tracking-[0.12em] text-ink-300">
              Filters
            </p>
            {[
              { label: "All patients", count: 24, active: true },
              { label: "Critical", count: 2 },
              { label: "Urgent", count: 5 },
              { label: "Watch", count: 8 },
              { label: "Stable", count: 9 },
            ].map((f) => (
              <button
                key={f.label}
                type="button"
                className={`flex items-center justify-between rounded-lg px-2.5 py-2 text-left text-[12.5px] transition-colors ${
                  f.active
                    ? "bg-ink-800 text-white"
                    : "text-ink-500 hover:bg-ink-50"
                }`}
              >
                <span>{f.label}</span>
                <span
                  className={`rounded px-1.5 py-0.5 text-[10.5px] font-mono ${
                    f.active ? "bg-white/15" : "bg-ink-100/80 text-ink-500"
                  }`}
                >
                  {f.count}
                </span>
              </button>
            ))}
          </aside>

          {/* Queue */}
          <div>
            <div className="mb-3 flex items-center justify-between">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-400">
                  Active Queue
                </p>
                <p className="text-[13px] font-medium text-ink-700">
                  Auto-sorted by clinical priority
                </p>
              </div>
              <div className="flex items-center gap-2 rounded-full border border-ink-100 bg-white px-3 py-1 text-[11px] font-medium text-ink-500">
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-[color:var(--color-signal-stable)]">
                  <span
                    className="absolute inset-0 rounded-full bg-[color:var(--color-signal-stable)]"
                    style={{ animation: "landing-pulse-ring 2s ease-out infinite" }}
                  />
                </span>
                Streaming
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <AnimatePresence initial={false}>
                {queue.map((p) => (
                  <PatientRow
                    key={p.id}
                    patient={p}
                    highlight={highlightId === p.id}
                  />
                ))}
              </AnimatePresence>
            </div>
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
      className="relative overflow-hidden border-t border-ink-100 bg-gradient-to-b from-ink-50/40 to-white py-20 lg:py-28"
    >
      <div className="mx-auto max-w-[1200px] px-6 lg:px-10">
        <div className="mx-auto max-w-[680px] text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-ink-100 bg-white px-3 py-1 text-[11.5px] font-medium text-ink-500">
            <span className="h-1.5 w-1.5 rounded-full bg-brand-500" />
            The Dashboard
          </span>
          <h2 className="mt-5 text-[32px] font-medium leading-[1.08] tracking-[-0.025em] text-black sm:text-[42px]">
            Patients{" "}
            <span className="font-serif italic font-normal text-brand-700">
              re-prioritize
            </span>{" "}
            themselves.
          </h2>
          <p className="mt-4 text-[15.5px] leading-[1.55] text-ink-500 sm:text-[16.5px]">
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
              className="rounded-2xl border border-ink-100 bg-white p-5 transition-all hover:-translate-y-0.5 hover:border-ink-200 hover:shadow-[0_24px_40px_-28px_rgba(15,16,32,0.35)]"
            >
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
                  {f.icon}
                </svg>
              </span>
              <h3 className="mt-3.5 text-[15px] font-semibold tracking-[-0.01em] text-ink-800">
                {f.title}
              </h3>
              <p className="mt-1.5 text-[13.5px] leading-[1.55] text-ink-500">
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
