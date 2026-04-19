import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { APP_ROUTES } from "../../constants/routes";

const NAV_LINKS = [
  { label: "Platform", href: "#dashboard" },
  { label: "Device", href: "#device" },
  { label: "Hospitals", href: "#stats" },
];

function LandingNavbar() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={[
        "sticky top-0 z-50 w-full transition-all duration-300",
        scrolled
          ? "backdrop-blur-xl bg-white/75 border-b border-ink-100/70 shadow-[0_1px_0_rgba(15,16,32,0.04)]"
          : "bg-white/0 border-b border-transparent",
      ].join(" ")}
    >
      <div className="mx-auto flex h-16 max-w-[1200px] items-center justify-between px-6 lg:px-10">
        <Link
          to={APP_ROUTES.ROOT}
          className="flex items-center gap-2.5 text-ink-800"
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

        <nav className="hidden items-center gap-7 md:flex">
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-[13.5px] font-medium text-ink-500 transition-colors hover:text-ink-800"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Link
            to={APP_ROUTES.LOGIN}
            className="hidden rounded-full px-4 py-2 text-[13.5px] font-medium text-ink-600 transition-colors hover:text-ink-800 sm:inline-flex"
          >
            Patient Login
          </Link>
          <Link
            to={APP_ROUTES.LOGIN}
            className="inline-flex items-center gap-1.5 rounded-full bg-ink-800 px-4 py-2 text-[13.5px] font-medium text-white shadow-[0_8px_20px_-8px_rgba(8,9,26,0.5)] transition-all hover:-translate-y-px hover:bg-ink-900"
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
