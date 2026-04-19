import { motion } from "framer-motion";

const VITALS = [
  { label: "HR", value: "128", unit: "bpm", tone: "urgent" },
  { label: "SpO₂", value: "91", unit: "%", tone: "watch" },
  { label: "BP", value: "148/92", unit: "", tone: "urgent" },
];

const TONE_COLORS = {
  urgent: "text-[color:var(--color-signal-urgent)] bg-[color:var(--color-signal-urgent)]/10",
  watch: "text-[color:var(--color-signal-watch)] bg-[color:var(--color-signal-watch)]/10",
  stable: "text-[color:var(--color-signal-stable)] bg-[color:var(--color-signal-stable)]/10",
};

function HeroVisual() {
  return (
    <div className="relative mx-auto aspect-[4/5] w-full max-w-[520px] lg:aspect-[5/6]">
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
        className="absolute inset-0 overflow-hidden rounded-[28px] border border-ink-100 bg-gradient-to-b from-white to-ink-50 shadow-[0_40px_80px_-30px_rgba(15,16,32,0.35),0_12px_24px_-12px_rgba(15,16,32,0.15)]"
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
        <div className="relative flex h-full w-full flex-col gap-4 p-6">
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
            <div
              aria-hidden
              className="pointer-events-none absolute inset-y-0 left-0 w-[3px] bg-gradient-to-b from-[color:var(--color-signal-critical)] to-[color:var(--color-signal-urgent)]"
            />
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[color:var(--color-signal-critical)]">
                  Priority · Critical
                </p>
                <p className="mt-1 text-[15px] font-semibold text-ink-800">
                  Patient #4821 · M, 62
                </p>
                <p className="text-[12px] text-ink-400">Chest pain · bay 3</p>
              </div>
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-ink-50 text-[11px] font-semibold text-ink-600">
                ↑ 4
              </div>
            </div>
            <div className="mt-4 grid grid-cols-3 gap-2">
              {VITALS.map((v) => (
                <div
                  key={v.label}
                  className={`rounded-lg px-2.5 py-2 ${TONE_COLORS[v.tone]}`}
                >
                  <p className="text-[10px] font-medium opacity-80">{v.label}</p>
                  <p className="font-mono text-[14px] font-semibold leading-tight">
                    {v.value}
                    <span className="ml-0.5 text-[10px] font-normal opacity-70">
                      {v.unit}
                    </span>
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Secondary queue rows */}
          <div className="flex flex-col gap-2">
            {[
              { id: "#3377", tag: "Urgent", tone: "urgent", age: "F, 41", note: "Dyspnea", hr: "112" },
              { id: "#2204", tag: "Watch", tone: "watch", age: "M, 29", note: "Fever", hr: "98" },
              { id: "#1958", tag: "Stable", tone: "stable", age: "F, 73", note: "Post-op", hr: "74" },
            ].map((row, i) => (
              <motion.div
                key={row.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 + i * 0.08, duration: 0.5 }}
                className="flex items-center gap-3 rounded-xl border border-ink-100 bg-white/80 px-3 py-2.5"
              >
                <span
                  className={`h-2 w-2 shrink-0 rounded-full ${
                    row.tone === "urgent"
                      ? "bg-[color:var(--color-signal-urgent)]"
                      : row.tone === "watch"
                        ? "bg-[color:var(--color-signal-watch)]"
                        : "bg-[color:var(--color-signal-stable)]"
                  }`}
                />
                <div className="flex flex-1 items-baseline gap-2">
                  <span className="text-[12px] font-semibold text-ink-700">
                    {row.id}
                  </span>
                  <span className="text-[11.5px] text-ink-400">{row.age}</span>
                </div>
                <span className="text-[11.5px] text-ink-400">{row.note}</span>
                <span className="font-mono text-[12px] text-ink-500">
                  {row.hr} bpm
                </span>
              </motion.div>
            ))}
          </div>

          {/* Sparkline footer */}
          <div className="mt-auto rounded-xl border border-ink-100 bg-ink-50/60 p-3">
            <div className="flex items-center justify-between text-[11px]">
              <span className="font-semibold text-ink-600">Queue pressure</span>
              <span className="font-mono text-ink-400">7-day · normal</span>
            </div>
            <svg
              viewBox="0 0 200 40"
              className="mt-2 h-10 w-full"
              preserveAspectRatio="none"
            >
              <defs>
                <linearGradient id="spark" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--color-brand-500)" stopOpacity="0.35" />
                  <stop offset="100%" stopColor="var(--color-brand-500)" stopOpacity="0" />
                </linearGradient>
              </defs>
              <path
                d="M0 30 L20 26 L40 28 L60 18 L80 22 L100 12 L120 20 L140 10 L160 16 L180 6 L200 14"
                fill="none"
                stroke="var(--color-brand-500)"
                strokeWidth="1.75"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M0 30 L20 26 L40 28 L60 18 L80 22 L100 12 L120 20 L140 10 L160 16 L180 6 L200 14 L200 40 L0 40 Z"
                fill="url(#spark)"
              />
            </svg>
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
              <path d="M2 6l3 3 5-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
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
