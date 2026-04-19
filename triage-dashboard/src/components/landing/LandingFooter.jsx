import { Link } from "react-router-dom";
import { APP_ROUTES } from "../../constants/routes";

function LandingFooter() {
  return (
    <footer className="border-t border-ink-100 bg-white">
      <div className="mx-auto flex max-w-[1200px] flex-col gap-6 px-6 py-10 sm:flex-row sm:items-center sm:justify-between lg:px-10">
        <div className="flex items-center gap-2 text-[13px] text-ink-400">
          <span
            aria-hidden
            className="inline-flex h-6 w-6 items-center justify-center rounded-md bg-gradient-to-br from-brand-500 to-brand-700 text-white"
          >
            <svg width="12" height="12" viewBox="0 0 14 14" fill="none">
              <path
                d="M1 7h3l1.5-4 3 8L10 7h3"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>
          <span>
            © {new Date().getFullYear()}{" "}
            <span className="wordmark text-ink-700 text-[13px]">Kinova</span>{" "}
            Health · HackPrinceton
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-5 text-[13px] text-ink-500">
          <a href="#dashboard" className="hover:text-ink-800">Platform</a>
          <a href="#device" className="hover:text-ink-800">Device</a>
          <Link to={APP_ROUTES.LOGIN} className="hover:text-ink-800">
            Hospital Login
          </Link>
          <Link to={APP_ROUTES.LOGIN} className="hover:text-ink-800">
            Patient Login
          </Link>
        </div>
      </div>
    </footer>
  );
}

export default LandingFooter;
