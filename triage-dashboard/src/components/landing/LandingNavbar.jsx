import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { APP_ROUTES } from "../../constants/routes";

const NAV_LINKS = [
  { label: "Dashboard", href: "#dashboard" },
  { label: "Device", href: "#device" },
];

function smoothScrollTo(hash) {
  const target = document.querySelector(hash);
  if (!target) return;
  target.scrollIntoView({ behavior: "smooth", block: "start" });
}

function LandingNavbar() {
  // `revealed` = user has scrolled past the hero CTA, so the full navbar shows.
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    const sentinel = document.getElementById("hero-cta-row");
    if (!sentinel) return undefined;

    const observer = new IntersectionObserver(
      ([entry]) => setRevealed(!entry.isIntersecting),
      { threshold: 0 },
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, []);

  return (
    <header
      className={[
        "fixed inset-x-0 top-0 z-50 transition-transform duration-300 ease-out",
        revealed ? "translate-y-0" : "translate-y-0",
      ].join(" ")}
    >
      {/* Banner background — fades in once the hero CTA is offscreen. */}
      <div
        aria-hidden
        className={[
          "absolute inset-0 transition-all duration-300",
          revealed
            ? "backdrop-blur-xl bg-white/92 border-b border-ink-200/80 shadow-[0_6px_24px_-12px_rgba(15,16,32,0.18)] dark:bg-ink-900/85 dark:border-ink-700/70 dark:shadow-[0_6px_24px_-12px_rgba(0,0,0,0.6)]"
            : "pointer-events-none opacity-0",
        ].join(" ")}
      />

      <div className="relative mx-auto flex h-14 max-w-[1200px] items-center justify-between px-6 lg:h-16 lg:px-10">
        {/* Always-visible logo */}
        <Link
          to={APP_ROUTES.ROOT}
          className="flex items-center gap-2.5 text-ink-800 dark:text-ink-50"
        >
          <span
            aria-hidden
            className="inline-flex h-7 w-7 items-center justify-center rounded-[9px] bg-gradient-to-br from-brand-500 to-brand-700 text-white shadow-[0_6px_16px_-4px_rgba(61,99,255,0.55)]"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path
                d="M1 7h3l1.5-4 3 8L10 7h3"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>
          <span className="wordmark text-[19px] leading-none">Kinova</span>
        </Link>

        {/* Nav links — only visible after hero */}
        <nav
          className={[
            "hidden items-center gap-7 transition-opacity duration-300 md:flex",
            revealed ? "opacity-100" : "pointer-events-none opacity-0",
          ].join(" ")}
        >
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              onClick={(e) => {
                e.preventDefault();
                smoothScrollTo(link.href);
                history.replaceState(null, "", link.href);
              }}
              className="text-[13.5px] font-medium text-ink-500 transition-colors hover:text-ink-800 dark:text-ink-300 dark:hover:text-ink-50"
            >
              {link.label}
            </a>
          ))}
        </nav>

        {/* CTA — only visible after hero */}
        <div
          className={[
            "flex items-center gap-2 transition-opacity duration-300",
            revealed ? "opacity-100" : "pointer-events-none opacity-0",
          ].join(" ")}
        >
          <Link
            to={APP_ROUTES.LOGIN}
            className="inline-flex items-center gap-1.5 rounded-full bg-ink-800 px-4 py-2 text-[13.5px] font-medium text-white shadow-[0_8px_20px_-8px_rgba(8,9,26,0.5)] transition-all hover:-translate-y-px hover:bg-ink-900 dark:bg-white dark:text-ink-900 dark:shadow-[0_8px_20px_-8px_rgba(0,0,0,0.7)] dark:hover:bg-ink-100"
          >
            Hospital Login
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path
                d="M3 6h6m0 0L6.5 3.5M9 6 6.5 8.5"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </Link>
        </div>
      </div>
    </header>
  );
}

export default LandingNavbar;
