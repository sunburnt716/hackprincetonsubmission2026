import { motion } from "framer-motion";

const ANNOTATIONS = [
  {
    key: "sensor",
    label: "Optical PPG array",
    body: "Heart rate, SpO₂, perfusion index — sampled 4× per second.",
    style: { top: "18%", left: "-4%" },
    align: "right",
  },
  {
    key: "radio",
    label: "Dual-band radio",
    body: "Bluetooth LE to the bedside gateway, LTE-M fallback for transport.",
    style: { top: "58%", right: "-4%" },
    align: "left",
  },
  {
    key: "battery",
    label: "72-hour battery",
    body: "Hot-swap pack. Charges fully in under 40 minutes.",
    style: { bottom: "10%", left: "-4%" },
    align: "right",
  },
];

function DeviceMockup() {
  return (
    <div className="relative mx-auto aspect-[4/5] w-full max-w-[520px]">
      {/* Ambient lighting */}
      <div
        aria-hidden
        className="absolute inset-0 rounded-[40px] bg-[radial-gradient(60%_50%_at_50%_30%,rgba(61,99,255,0.35),transparent_65%),radial-gradient(40%_40%_at_80%_80%,rgba(92,130,255,0.25),transparent_70%)] blur-3xl"
      />

      {/* Stage floor reflection */}
      <div
        aria-hidden
        className="absolute bottom-4 left-1/2 h-10 w-3/4 -translate-x-1/2 rounded-full bg-ink-800/25 blur-2xl"
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
        className="relative flex h-full w-full items-center justify-center"
        style={{ perspective: "1200px" }}
      >
        <div
          className="relative"
          style={{
            transform: "rotateX(8deg) rotateY(-14deg)",
            transformStyle: "preserve-3d",
            animation: "landing-float 8s ease-in-out infinite",
          }}
        >
          {/* Strap — top */}
          <div
            aria-hidden
            className="absolute left-1/2 top-[-88px] h-[90px] w-[120px] -translate-x-1/2 rounded-t-[38px] bg-gradient-to-b from-ink-700 to-ink-900 shadow-[inset_0_-10px_20px_rgba(0,0,0,0.4)]"
          />
          {/* Strap — bottom */}
          <div
            aria-hidden
            className="absolute left-1/2 bottom-[-88px] h-[90px] w-[120px] -translate-x-1/2 rounded-b-[38px] bg-gradient-to-t from-ink-800 to-ink-700 shadow-[inset_0_10px_20px_rgba(0,0,0,0.4)]"
          />

          {/* Case outer */}
          <div className="relative h-[230px] w-[190px] rounded-[38px] bg-gradient-to-br from-ink-100 via-ink-50 to-ink-200 p-[3px] shadow-[0_50px_100px_-30px_rgba(15,16,32,0.7),0_0_0_1px_rgba(255,255,255,0.4)_inset]">
            {/* Side button */}
            <div
              aria-hidden
              className="absolute right-[-4px] top-[38%] h-8 w-[4px] rounded-r-md bg-gradient-to-r from-ink-300 to-ink-500"
            />
            {/* Crown */}
            <div
              aria-hidden
              className="absolute right-[-6px] top-[22%] h-5 w-[6px] rounded-r-md bg-gradient-to-r from-ink-400 to-ink-700 shadow-[inset_0_0_0_1px_rgba(0,0,0,0.3)]"
            />

            {/* Case inner (screen bezel) */}
            <div className="relative h-full w-full overflow-hidden rounded-[36px] bg-gradient-to-br from-ink-800 via-ink-900 to-[#02030a] p-[10px] shadow-[inset_0_1px_0_rgba(255,255,255,0.12),inset_0_0_40px_rgba(0,0,0,0.7)]">
              {/* Specular highlight sweep */}
              <div
                aria-hidden
                className="pointer-events-none absolute inset-0 overflow-hidden rounded-[36px]"
              >
                <div
                  className="absolute inset-y-0 w-1/3 bg-gradient-to-r from-transparent via-white/15 to-transparent"
                  style={{ animation: "landing-sweep 6s ease-in-out infinite" }}
                />
              </div>

              {/* Display */}
              <div className="relative flex h-full w-full flex-col items-center justify-between rounded-[28px] bg-gradient-to-b from-[#0a0b1a] to-black p-4">
                <div className="flex w-full items-center justify-between text-[9px] font-mono text-white/50">
                  <span>14:28</span>
                  <span className="flex items-center gap-1">
                    <span className="h-1 w-1 rounded-full bg-[color:var(--color-signal-stable)]" />
                    LIVE
                  </span>
                </div>

                <div className="flex flex-col items-center">
                  <p className="text-[9px] font-medium uppercase tracking-[0.18em] text-white/40">
                    Heart Rate
                  </p>
                  <p className="mt-1 font-mono text-[54px] font-semibold leading-none text-white">
                    72
                  </p>
                  <p className="text-[10px] text-white/50">bpm · resting</p>
                </div>

                {/* Pulse waveform */}
                <div className="w-full">
                  <svg viewBox="0 0 120 24" className="h-6 w-full">
                    <defs>
                      <linearGradient id="wave" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor="#3d63ff" stopOpacity="0" />
                        <stop offset="50%" stopColor="#8aa6ff" stopOpacity="1" />
                        <stop offset="100%" stopColor="#3d63ff" stopOpacity="0" />
                      </linearGradient>
                    </defs>
                    <path
                      d="M0 12 L20 12 L28 12 L32 4 L36 20 L40 8 L44 12 L60 12 L72 12 L78 12 L82 6 L86 18 L90 12 L120 12"
                      fill="none"
                      stroke="url(#wave)"
                      strokeWidth="1.4"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  <div className="mt-2 grid grid-cols-2 gap-1">
                    <div className="rounded-md bg-white/5 px-2 py-1">
                      <p className="text-[8px] uppercase tracking-wider text-white/40">SpO₂</p>
                      <p className="font-mono text-[12px] font-semibold text-white">98%</p>
                    </div>
                    <div className="rounded-md bg-white/5 px-2 py-1">
                      <p className="text-[8px] uppercase tracking-wider text-white/40">Temp</p>
                      <p className="font-mono text-[12px] font-semibold text-white">36.8°</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Screen glare */}
              <div
                aria-hidden
                className="pointer-events-none absolute inset-[10px] rounded-[28px] bg-[linear-gradient(135deg,rgba(255,255,255,0.18)_0%,transparent_35%,transparent_60%,rgba(255,255,255,0.06)_100%)]"
              />
            </div>
          </div>
        </div>
      </motion.div>

      {/* Annotations */}
      {ANNOTATIONS.map((a, i) => (
        <motion.div
          key={a.key}
          initial={{ opacity: 0, y: 6 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3 + i * 0.12, duration: 0.5 }}
          className={`absolute hidden max-w-[200px] rounded-xl border border-ink-100 bg-white/95 px-3 py-2 shadow-[0_16px_40px_-20px_rgba(15,16,32,0.5)] backdrop-blur lg:block ${
            a.align === "right" ? "text-left" : "text-left"
          }`}
          style={a.style}
        >
          <div className="flex items-center gap-2">
            <span className="inline-flex h-5 w-5 items-center justify-center rounded-md bg-brand-50 text-[10px] font-bold text-brand-600">
              {i + 1}
            </span>
            <p className="text-[11.5px] font-semibold text-ink-800">{a.label}</p>
          </div>
          <p className="mt-1 text-[11px] leading-[1.5] text-ink-400">{a.body}</p>
        </motion.div>
      ))}
    </div>
  );
}

const SPECS = [
  { label: "Weight", value: "22 g" },
  { label: "Sampling", value: "4 Hz" },
  { label: "Battery", value: "72 h" },
  { label: "Ingress", value: "IP67" },
];

function DeviceSection() {
  return (
    <section
      id="device"
      className="relative scroll-mt-20 overflow-hidden border-t border-ink-100 bg-gradient-to-b from-ink-900 via-ink-800 to-ink-900 py-20 text-white lg:py-28"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_50%_at_50%_0%,rgba(61,99,255,0.22),transparent_70%),radial-gradient(40%_40%_at_20%_100%,rgba(92,130,255,0.12),transparent_70%)]"
      />

      <div className="relative mx-auto max-w-[1200px] px-6 lg:px-10">
        <div className="grid items-center gap-12 lg:grid-cols-12 lg:gap-14">
          <div className="order-2 lg:order-1 lg:col-span-6">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11.5px] font-medium text-white/70 backdrop-blur">
              <span className="h-1.5 w-1.5 rounded-full bg-brand-300" />
              The Device
            </span>
            <h2 className="mt-5 text-[32px] font-medium leading-[1.05] tracking-[-0.025em] text-white sm:text-[42px]">
              One wearable.
              <br />
              <span className="font-serif italic font-normal text-brand-200">
                Every vital
              </span>{" "}
              that matters.
            </h2>
            <p className="mt-5 max-w-[480px] text-[15.5px] leading-[1.6] text-white/60 sm:text-[16.5px]">
              A medical-grade wrist unit that captures HR, SpO₂, skin temperature
              and motion, and streams them continuously to the bedside gateway.
              No leads. No cables. No checking in every fifteen minutes.
            </p>

            <div className="mt-7 grid max-w-[440px] grid-cols-2 gap-2.5 sm:grid-cols-4">
              {SPECS.map((s) => (
                <div
                  key={s.label}
                  className="rounded-xl border border-white/10 bg-white/5 p-3 backdrop-blur-sm"
                >
                  <p className="font-mono text-[18px] font-semibold text-white">
                    {s.value}
                  </p>
                  <p className="mt-0.5 text-[11px] uppercase tracking-[0.1em] text-white/50">
                    {s.label}
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <a
                href="#stats"
                className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 text-[14px] font-medium text-ink-800 shadow-[0_14px_28px_-14px_rgba(255,255,255,0.6)] transition-all hover:-translate-y-0.5"
              >
                Request a pilot
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path
                    d="M3 7h8m0 0L7.5 3.5M11 7 7.5 10.5"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </a>
              <a
                href="#dashboard"
                className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-5 py-3 text-[14px] font-medium text-white/80 transition-colors hover:bg-white/10"
              >
                See it on the dashboard
              </a>
            </div>
          </div>

          <div className="order-1 lg:order-2 lg:col-span-6">
            <DeviceMockup />
          </div>
        </div>
      </div>
    </section>
  );
}

export default DeviceSection;
