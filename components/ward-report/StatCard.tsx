type StatCardProps = {
  icon: string;
  value: string;
  label: string;
  subtitle?: string;
  variant?: "cream" | "navy";
};

export function StatCard({ icon, value, label, subtitle, variant = "cream" }: StatCardProps) {
  const isNavy = variant === "navy";

  return (
    <div
      className={`break-inside-avoid rounded-xl border p-5 shadow-card ${
        isNavy
          ? "border-navy-700 bg-navy-900 text-cream-100"
          : "border-cream-300 bg-cream-50 text-navy-900"
      }`}
    >
      <div
        className={`flex h-10 w-10 items-center justify-center rounded-full text-lg ${
          isNavy ? "bg-gold-500 text-navy-900" : "bg-navy-900 text-cream-50"
        }`}
        aria-hidden="true"
      >
        {icon}
      </div>
      <div className={`mt-3 font-serif text-3xl font-bold ${isNavy ? "text-gold-400" : "text-navy-900"}`}>
        {value}
      </div>
      <div className={`mt-1 text-sm font-semibold ${isNavy ? "text-cream-100" : "text-navy-700"}`}>
        {label}
      </div>
      {subtitle ? (
        <div className={`mt-1 text-xs ${isNavy ? "text-cream-300/80" : "text-navy-500"}`}>{subtitle}</div>
      ) : null}
    </div>
  );
}
