import type { Part } from "@/lib/types";

export function LookBoard({ parts, label }: { parts: Part[]; label: string }) {
  return (
    <div className="rounded-md bg-tile p-3" role="img" aria-label={label}>
      <div className="grid grid-cols-2 gap-2">
        {parts.map((part) => {
          const wide = part.slot === "dress" || part.slot === "outer";
          return (
            <figure key={`${part.slot}-${part.id}`} className={wide ? "col-span-2" : ""}>
              <div className="flex aspect-square items-center justify-center overflow-hidden rounded-sm bg-bg">
                <img src={part.image} alt={part.name} className="h-full w-full object-contain p-2" />
              </div>
            </figure>
          );
        })}
      </div>
    </div>
  );
}

export function MatchRing({ pct }: { pct: number }) {
  const radius = 26;
  const circ = 2 * Math.PI * radius;
  return (
    <svg className="size-16 shrink-0" viewBox="0 0 64 64" role="img" aria-label={`${pct} percent match`}>
      <circle cx="32" cy="32" r={radius} fill="none" stroke="var(--color-line)" strokeWidth="6" />
      <circle
        cx="32"
        cy="32"
        r={radius}
        fill="none"
        stroke="var(--color-ink)"
        strokeWidth="6"
        strokeLinecap="round"
        strokeDasharray={`${(circ * pct) / 100} ${circ}`}
        transform="rotate(-90 32 32)"
      />
      <text
        x="32"
        y="37"
        textAnchor="middle"
        fill="var(--color-ink)"
        fontFamily="var(--font-display)"
        fontSize="16"
        fontWeight="700"
      >
        {pct}
      </text>
    </svg>
  );
}
