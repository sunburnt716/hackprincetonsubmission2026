function StatCard({ value, label, trend, accent = "brand" }) {
  const accentClass =
    accent === "signal"
      ? "text-[color:var(--color-signal-stable)]"
      : "text-brand-600";

  return (
    <div className="group relative overflow-hidden rounded-2xl border border-ink-100 bg-white/80 p-5 backdrop-blur-sm transition-all hover:-translate-y-0.5 hover:border-ink-200 hover:shadow-[0_24px_40px_-24px_rgba(15,16,32,0.2)]">
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-ink-200/80 to-transparent"
        aria-hidden
      />
      <div className="flex items-baseline gap-2">
        <span className="text-[28px] font-semibold tracking-tight text-ink-800">
          {value}
        </span>
        {trend ? (
          <span className={`text-[12px] font-medium ${accentClass}`}>
            {trend}
          </span>
        ) : null}
      </div>
      <p className="mt-1 text-[13px] font-medium text-ink-400">{label}</p>
    </div>
  );
}

export default StatCard;
