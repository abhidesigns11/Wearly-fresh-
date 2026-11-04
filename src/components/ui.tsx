import type { ButtonHTMLAttributes, ReactNode } from "react";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  tone?: "brand" | "outline" | "ghost" | "ink";
};

export function Button({ tone = "outline", className = "", type = "button", ...props }: ButtonProps) {
  const tones = {
    brand: "bg-brand text-on-brand",
    outline: "border border-ink bg-transparent text-ink",
    ghost: "bg-transparent px-3 text-ink underline decoration-1 underline-offset-4",
    ink: "bg-ink text-bg",
  } as const;
  return (
    <button
      type={type}
      className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-full px-5 py-2 text-sm font-semibold transition-opacity focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink disabled:cursor-not-allowed disabled:opacity-40 ${tones[tone]} ${className}`}
      {...props}
    />
  );
}

export function Chip({
  pressed,
  children,
  onClick,
}: {
  pressed: boolean;
  children: ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      onClick={onClick}
      className={`min-h-11 shrink-0 rounded-full border px-4 text-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink ${
        pressed ? "border-ink bg-ink text-bg" : "border-line bg-surface text-ink"
      }`}
    >
      {children}
    </button>
  );
}

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="flex flex-col gap-2 text-sm font-semibold">
      {label}
      {children}
    </label>
  );
}

export const inputClass =
  "min-h-11 w-full rounded-md border border-line bg-surface px-3 text-base font-normal text-ink outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink";
