import { motion } from "framer-motion";
import {
  buildInitialQueueFromMockData,
  sortTriageQueue,
} from "../../services/triageService.mock";

const QUEUE = sortTriageQueue(buildInitialQueueFromMockData());
const FOCUS = QUEUE[0];
const SECONDARY = QUEUE.slice(1, 4);

const vitalTone = (label, value) => {
  if (value == null) return "neutral";
  if (label === "SpO₂") {
    if (value < 90) return "critical";
    if (value < 94) return "watch";
    return "stable";
  }
  if (label === "HR") {
    if (value > 130 || value < 45) return "critical";
    if (value > 110 || value < 55) return "watch";
    return "stable";
  }
  if (label === "Stress") {
    if (value >= 85) return "critical";
    if (value >= 65) return "watch";
    return "stable";
  }
  return "neutral";
};

const TONE_COLORS = {
  critical:
    "text-[color:var(--color-signal-critical)] bg-[color:var(--color-signal-critical)]/10",
  watch:
    "text-[color:var(--color-signal-watch)] bg-[color:var(--color-signal-watch)]/10",
  stable:
    "text-[color:var(--color-signal-stable)] bg-[color:var(--color-signal-stable)]/10",
  neutral: "text-ink-500 bg-ink-50",
};

const velocityChip = (ui) => {
  const delta = ui.signedBpmDelta ?? 0;
  if (delta > 0) return { arrow: "↑", mag: delta, tone: "rising" };
  if (delta < 0) return { arrow: "↓", mag: Math.abs(delta), tone: "falling" };
  return { arrow: "→", mag: 0, tone: "steady" };
};

const VELOCITY_TONE = {
  rising: "text-[color:var(--color-signal-critical)]",
  falling: "text-[color:var(--color-signal-stable)]",
  steady: "text-ink-400",
};

function HeroVisual() {
  const focusVitals = [
    { label: "HR", value: FOCUS.clinicalPayload.vitals.heartBeat, unit: "bpm" },
    { label: "SpO₂", value: FOCUS.clinicalPayload.vitals.bloodOxygen, unit: "%" },
    { label: "Stress", value: FOCUS.clinicalPayload.vitals.stress, unit: "" },
  ];

  const focusVelocity = velocityChip(FOCUS.uiState);
  const isFocusCritical = FOCUS.uiState.isCritical;

  return (
    <div className="relative mx-auto w-full max-w-[520px]">
      {/* Ambient gradient backdrop */}
      <div
        aria-hidden
        className="absolute -inset-8 rounded-[44px] bg-[radial-gradient(60%_60%_at_70%_20%,rgba(61,99,255,0.22),transparent_70%),radial-gradient(50%_50%_at_20%_80%,rgba(138,166,255,0.18),transparent_65%)] blur-2xl"
      />

      {/* Glass card */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        className="relative overflow-hidden rounded-[28px] border border-ink-100 bg-gradient-to-b from-white to-ink-50 shadow-[0_40px_80px_-30px_rgba(15,16,32,0.35),0_12px_24px_-12px_rgba(15,16,32,0.15)]"
      >
        {/* Specular top highlight */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-white to-transparent"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(120%_60%_at_50%_-20%,rgba(255,255,255,0.9),transparent_45%)]"
        />

        {/* Inner frame — live triage preview */}
        <div className="relative flex w-full flex-col gap-3.5 p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="relative inline-flex h-2 w-2 rounded-full bg-[color:var(--color-signal-stable)]">
                <span
                  className="absolute inset-0 rounded-full bg-[color:var(--color-signal-stable)]"
                  style={{ animation: "landing-pulse-ring 2s ease-out infinite" }}
                />
              </span>
              <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-400">
                Live Triage · ED West
              </span>
            </div>
            <span className="text-[11px] font-mono text-ink-300">14:28:04</span>
          </div>

          {/* Focus patient tile */}
          <div className="relative overflow-hidden rounded-2xl border border-ink-100 bg-white p-4">
            {isFocusCritical ? (
              <div
                aria-hidden
                className="pointer-events-none absolute inset-y-0 left-0 w-[3px] bg-gradient-to-b from-[color:var(--color-signal-critical)] to-[color:var(--color-signal-urgent)]"
              />
            ) : null}
            <div className="flex items-start justify-between">
              <div>
                <p
                  className={`text-[11px] font-semibold uppercase tracking-[0.12em] ${
                    isFocusCritical
                      ? "text-[color:var(--color-signal-critical)]"
                      : "text-[color:var(--color-signal-stable)]"
                  }`}
                >
                  Priority · {isFocusCritical ? "Critical" : "Stable"}
                </p>
                <p className="mt-1 text-[15px] font-semibold text-ink-800">
                  {FOCUS.patientName}
                </p>
                <p className="font-mono text-[11.5px] text-ink-400">
                  {FOCUS.patientId}
                  {isFocusCritical ? ` · ${FOCUS.uiState.criticalReason}` : ""}
                </p>
              </div>
              <div
                className={`flex h-9 min-w-9 items-center justify-center gap-0.5 rounded-xl px-2 text-[11px] font-semibold ${
                  focusVelocity.tone === "rising"
                    ? "bg-[color:var(--color-signal-critical)]/10 text-[color:var(--color-signal-critical)]"
                    : focusVelocity.tone === "falling"
                      ? "bg-[color:var(--color-signal-stable)]/10 text-[color:var(--color-signal-stable)]"
                      : "bg-ink-50 text-ink-500"
                }`}
                title="Heartbeat velocity"
              >
                {focusVelocity.arrow} {focusVelocity.mag}
              </div>
            </div>
            <div className="mt-4 grid grid-cols-3 gap-2">
              {focusVitals.map((v) => {
                const tone = vitalTone(v.label, v.value);
                return (
                  <div
                    key={v.label}
                    className={`rounded-lg px-2.5 py-2 ${TONE_COLORS[tone]}`}
                  >
                    <p className="text-[10px] font-medium opacity-80">
                      {v.label}
                    </p>
                    <p className="font-mono text-[14px] font-semibold leading-tight">
                      {v.value ?? "—"}
                      {v.value != null && v.unit ? (
                        <span className="ml-0.5 text-[10px] font-normal opacity-70">
                          {v.unit}
                        </span>
                      ) : null}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Secondary queue rows */}
          <div className="flex flex-col gap-2">
            {SECONDARY.map((p, i) => {
              const v = velocityChip(p.uiState);
              return (
                <motion.div
                  key={p.patientId}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 + i * 0.08, duration: 0.5 }}
                  className="flex items-center gap-3 rounded-xl border border-ink-100 bg-white/80 px-3 py-2.5"
                >
                  <span
                    className={`h-2 w-2 shrink-0 rounded-full ${
                      p.uiState.isCritical
                        ? "bg-[color:var(--color-signal-critical)]"
                        : "bg-[color:var(--color-signal-stable)]"
                    }`}
                  />
                  <div className="flex flex-1 items-baseline gap-2 overflow-hidden">
                    <span className="truncate text-[12.5px] font-semibold text-ink-700">
                      {p.patientName}
                    </span>
                    <span className="shrink-0 font-mono text-[10.5px] text-ink-400">
                      {p.patientId}
                    </span>
                  </div>
                  <span className="shrink-0 font-mono text-[12px] text-ink-500">
                    {p.clinicalPayload.vitals.heartBeat} bpm
                  </span>
                  <span
                    className={`shrink-0 font-mono text-[11px] ${VELOCITY_TONE[v.tone]}`}
                  >
                    {v.arrow} {v.mag}
                  </span>
                </motion.div>
              );
            })}
          </div>
        </div>
      </motion.div>

      {/* Floating annotation */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6, duration: 0.6 }}
        className="absolute -right-3 top-10 hidden rounded-2xl border border-ink-100 bg-white/95 px-3 py-2 shadow-[0_16px_32px_-16px_rgba(15,16,32,0.35)] backdrop-blur-md lg:block"
        style={{ animation: "landing-float 5s ease-in-out infinite" }}
      >
        <div className="flex items-center gap-2">
          <span className="inline-flex h-6 w-6 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
            <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
              <path
                d="M2 6l3 3 5-6"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>
          <div>
            <p className="text-[11px] font-semibold text-ink-700">Re-triaged</p>
            <p className="text-[10px] text-ink-400">HR spike · 42s ago</p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

export default HeroVisual;
