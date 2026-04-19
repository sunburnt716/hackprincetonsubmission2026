import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { APP_ROUTES } from "../../constants/routes";
import HeroVisual from "./HeroVisual";
import StatCard from "./StatCard";

const STATS = [
  { value: "38%", label: "Faster time-to-triage", trend: "▲ since pilot" },
  { value: "< 2s", label: "Re-prioritization latency" },
  { value: "4.9k", label: "Vitals events / min" },
  { value: "99.97%", label: "Uptime on-prem + cloud" },
];

function Hero() {
  return (
    <section className="relative overflow-hidden">
      {/* Subtle radial background */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(80%_60%_at_70%_-10%,rgba(61,99,255,0.10),transparent_60%),radial-gradient(50%_50%_at_10%_10%,rgba(138,166,255,0.12),transparent_60%)]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-ink-100 to-transparent dark:via-ink-700"
      />

      <div className="relative mx-auto max-w-[1200px] px-6 pb-12 pt-14 lg:px-10 lg:pb-14 lg:pt-16">
        <div className="grid items-start gap-10 lg:grid-cols-12 lg:gap-12">
          <div className="lg:col-span-6">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="inline-flex items-center gap-2 rounded-full border border-ink-100 bg-white/70 px-3 py-1 text-[11.5px] font-medium text-ink-500 backdrop-blur dark:border-ink-700 dark:bg-ink-800/60 dark:text-ink-300"
            >
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-[color:var(--color-signal-stable)]">
                <span
                  className="absolute inset-0 rounded-full bg-[color:var(--color-signal-stable)]"
                  style={{ animation: "landing-pulse-ring 2.2s ease-out infinite" }}
                />
              </span>
              Live at Princeton Medical · pilot deployment
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
              className="mt-3 text-[42px] font-medium leading-[1.04] tracking-[-0.035em] text-black sm:text-[54px] lg:text-[62px] dark:text-white"
            >
              Triage that{" "}
              <span className="font-serif italic font-normal text-brand-700 dark:text-brand-300">
                moves
              </span>{" "}
              <br className="hidden sm:block" />
              with the patient.
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15, duration: 0.7 }}
              className="mt-7 max-w-[520px] text-[16.5px] leading-[1.65] text-ink-500 lg:text-[17.5px] dark:text-ink-300"
            >
              Kinova streams vitals from a wearable directly into your ED, re-ranks
              the queue the instant a patient deteriorates, and hands clinicians a
              single calm, real-time view of who needs care next.
            </motion.p>

            <motion.div
              id="hero-cta-row"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25, duration: 0.6 }}
              className="mt-9 flex flex-wrap items-center gap-3"
            >
              <Link
                to={APP_ROUTES.LOGIN}
                className="group inline-flex items-center gap-2 rounded-full bg-ink-800 px-5 py-3 text-[14px] font-medium text-white shadow-[0_14px_28px_-12px_rgba(8,9,26,0.55)] transition-all hover:-translate-y-0.5 hover:bg-ink-900 hover:shadow-[0_18px_36px_-14px_rgba(8,9,26,0.7)] dark:bg-white dark:text-ink-900 dark:shadow-[0_14px_28px_-12px_rgba(0,0,0,0.75)] dark:hover:bg-ink-100 dark:hover:shadow-[0_18px_36px_-14px_rgba(0,0,0,0.8)]"
              >
                Hospital Login
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 14 14"
                  fill="none"
                  className="transition-transform group-hover:translate-x-0.5"
                >
                  <path
                    d="M3 7h8m0 0L7.5 3.5M11 7 7.5 10.5"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </Link>
              <span className="text-[12.5px] text-ink-400 dark:text-ink-300">
                HIPAA-aligned · on-prem option
              </span>
            </motion.div>
          </div>

          <div className="lg:col-span-6">
            <HeroVisual />
          </div>
        </div>

        {/* Modular stat cards */}
        <motion.div
          id="stats"
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6 }}
          className="mt-10 grid grid-cols-2 gap-3 lg:mt-10 lg:grid-cols-4 lg:gap-4"
        >
          {STATS.map((s) => (
            <StatCard key={s.label} {...s} />
          ))}
        </motion.div>
      </div>
    </section>
  );
}

export default Hero;
