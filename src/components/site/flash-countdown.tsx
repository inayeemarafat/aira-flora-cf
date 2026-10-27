import { useEffect, useState } from "react";

function pad(n: number): string {
  return String(Math.max(0, n)).padStart(2, "0");
}

/** Live countdown to a flash-sale end time. Renders placeholders until mounted to avoid SSR mismatch. */
export function FlashCountdown({ endsAt }: { endsAt: string }) {
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    setNow(Date.now());
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const remaining = now == null ? null : Math.max(0, new Date(endsAt).getTime() - now);
  const expired = remaining !== null && remaining <= 0;

  if (expired) return null;

  const d = remaining == null ? "--" : Math.floor(remaining / 86_400_000);
  const h = remaining == null ? "--" : pad(Math.floor((remaining % 86_400_000) / 3_600_000));
  const m = remaining == null ? "--" : pad(Math.floor((remaining % 3_600_000) / 60_000));
  const s = remaining == null ? "--" : pad(Math.floor((remaining % 60_000) / 1000));

  return (
    <div className="flex items-center gap-2">
      {[
        { label: "Days", value: d },
        { label: "Hrs", value: h },
        { label: "Min", value: m },
        { label: "Sec", value: s },
      ].map((unit) => (
        <div key={unit.label} className="flex flex-col items-center">
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-primary font-display text-lg font-semibold text-primary-foreground">
            {unit.value}
          </span>
          <span className="mt-1 text-[0.58rem] uppercase tracking-[0.16em] text-muted-foreground">
            {unit.label}
          </span>
        </div>
      ))}
    </div>
  );
}
