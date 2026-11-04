import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { Flame, House, Moon, Plus, Shirt, Sparkles, Sun, Users } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { streakCount } from "@/lib/dates";
import { openStylist } from "@/lib/search";
import { useCloset } from "@/lib/store";
import { RedirectToSignIn, UserButton } from "@/lib/auth/gates";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { AccountDataBoundary } from "./account-data-boundary";
import { Onboarding } from "./onboarding";
import { Sheet } from "./sheet";

const NAV = [
  { to: "/", label: "Home", icon: House, exact: true },
  { to: "/wardrobe", label: "Wardrobe", icon: Shirt, exact: false },
  { to: "/studio", label: "Studio", icon: Sparkles, exact: false },
  { to: "/inspire", label: "Community", icon: Users, exact: false },
] as const;

export function Shell({ children }: { children: ReactNode }) {
  const onboarded = useCloset((state) => state.profile.onboarded);
  const { user, isPending } = useCurrentUserState();
  const [createOpen, setCreateOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    const saved = window.localStorage.getItem("wearly-theme");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const next = saved ? saved === "dark" : prefersDark;
    setDarkMode(next);
    document.documentElement.dataset.theme = next ? "dark" : "light";
  }, []);

  function toggleTheme() {
    setDarkMode((current) => {
      const next = !current;
      document.documentElement.dataset.theme = next ? "dark" : "light";
      window.localStorage.setItem("wearly-theme", next ? "dark" : "light");
      return next;
    });
  }

  if (isPending) return <main className="grid min-h-dvh place-items-center bg-bg text-ink"><p className="text-sm text-muted">Opening Wearly…</p></main>;
  if (!user) return <RedirectToSignIn />;
  if (!onboarded) return <AccountDataBoundary><Onboarding /></AccountDataBoundary>;

  return (
    <AccountDataBoundary>
    <div className="min-h-dvh bg-bg text-ink md:pl-24">
      <Topbar darkMode={darkMode} onToggleTheme={toggleTheme} onProfile={() => setProfileOpen(true)} />
      <div className="mx-auto w-full max-w-5xl px-4 pt-6 pb-28 md:px-8 md:pb-16">{children}</div>
      <BottomNav onAdd={() => setCreateOpen(true)} />
      {createOpen && <CreateSheet onClose={() => setCreateOpen(false)} />}
      {profileOpen && <ProfileSheet onClose={() => setProfileOpen(false)} />}
    </div>
    </AccountDataBoundary>
  );
}

function Topbar({ darkMode, onToggleTheme, onProfile }: { darkMode: boolean; onToggleTheme: () => void; onProfile: () => void }) {
  const name = useCloset((state) => state.profile.name);
  const logs = useCloset((state) => state.logs);
  const streak = streakCount(logs.map((log) => log.date));
  const initial = (name || "W").slice(0, 1).toUpperCase();

  return (
    <header className="sticky top-0 z-10 flex items-center justify-between border-b border-line bg-bg px-4 py-3 md:px-8">
      <Link to="/" className="flex items-center gap-2">
        <img src="/brand/logo-mark.webp" alt="Wearly" className="brand-logo h-8 w-auto" />
      </Link>
      <div className="flex items-center gap-2">
        <button type="button" onClick={onToggleTheme} aria-label={darkMode ? "Switch to light mode" : "Switch to dark mode"} className="flex size-11 items-center justify-center rounded-full border border-line text-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink">
          {darkMode ? <Sun className="size-4" aria-hidden="true" /> : <Moon className="size-4" aria-hidden="true" />}
        </button>
        <Link
          to="/streak"
          aria-label={`${streak} day streak`}
          className="inline-flex min-h-11 items-center gap-1 rounded-full border border-line px-3 text-sm font-semibold tabular-nums focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
        >
          <Flame className="size-4" aria-hidden="true" />
          {streak}
        </Link>
        <button
          type="button"
          onClick={onProfile}
          aria-label="Profile"
          className="flex size-11 items-center justify-center rounded-full border border-line bg-tile font-display text-sm font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
        >
          {initial}
        </button>
      </div>
    </header>
  );
}

function BottomNav({ onAdd }: { onAdd: () => void }) {
  const path = useRouterState({ select: (state) => state.location.pathname });
  const left = NAV.slice(0, 2);
  const right = NAV.slice(2);

  const item = (entry: (typeof NAV)[number]) => {
    const Icon = entry.icon;
    const current = entry.exact ? path === entry.to : path.startsWith(entry.to);
    return (
      <Link
        key={entry.to}
        to={entry.to}
        aria-current={current ? "page" : undefined}
        className={`flex min-h-11 min-w-14 flex-col items-center justify-center gap-0.5 text-xs ${
          current ? "font-semibold text-ink" : "text-muted"
        }`}
      >
        <Icon className="size-5" aria-hidden="true" />
        {entry.label}
      </Link>
    );
  };

  return (
    <nav
      aria-label="Main"
      className="safe-bottom fixed inset-x-0 bottom-0 z-20 flex items-center justify-around border-t border-line bg-bg px-2 pt-2 md:inset-y-0 md:right-auto md:w-24 md:flex-col md:justify-start md:gap-2 md:border-t-0 md:border-r md:px-2 md:pt-6"
    >
      {left.map(item)}
      <button
        type="button"
        onClick={onAdd}
        aria-label="Create"
        className="flex size-14 items-center justify-center rounded-full bg-brand text-on-brand focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink md:-order-1 md:mb-4"
      >
        <Plus className="size-6" aria-hidden="true" />
      </button>
      {right.map(item)}
    </nav>
  );
}

function CreateSheet({ onClose }: { onClose: () => void }) {
  const navigate = useNavigate();
  const go = (to: "/wardrobe" | "/stylist" | "/studio" | "/colors" | "/inspire", search?: { add: boolean }) => {
    onClose();
    if (to === "/wardrobe") navigate({ to: "/wardrobe", search: search ?? { add: false } });
    else if (to === "/stylist") navigate({ to: "/stylist", search: openStylist });
    else if (to === "/studio") navigate({ to: "/studio" });
    else navigate({ to });
  };

  return (
    <Sheet title="Create" onClose={onClose}>
      <ul className="flex flex-col">
        <MenuRow title="Add item" detail="Photograph a piece you own" onClick={() => go("/wardrobe", { add: true })} />
        <MenuRow title="Open Outfit Studio" detail="Build, check and plan outfits" onClick={() => go("/studio")} />
        <MenuRow title="Check your colors" detail="Undertone, metals, and glasses" onClick={() => go("/colors")} />
        <MenuRow title="Open your community feed" detail="Share outfits and save ideas from others" onClick={() => go("/inspire")} />
      </ul>
    </Sheet>
  );
}

function MenuRow({ title, detail, onClick }: { title: string; detail: string; onClick: () => void }) {
  return (
    <li>
      <button
        type="button"
        onClick={onClick}
        className="flex w-full min-h-11 flex-col items-start py-3 text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
      >
        <span className="font-semibold">{title}</span>
        <span className="text-sm text-muted">{detail}</span>
      </button>
    </li>
  );
}

function ProfileSheet({ onClose }: { onClose: () => void }) {
  const profile = useCloset((state) => state.profile);
  const navigate = useNavigate();
  return (
    <Sheet title={profile.name || "You"} onClose={onClose}>
      <UserButton />
      <p className="mt-3 text-sm text-muted">
        {profile.undertone[0].toUpperCase() + profile.undertone.slice(1)} undertone · {profile.face} face
      </p>
      <div className="mt-5 flex flex-col gap-3">
        <button
          type="button"
          className="min-h-11 text-left font-semibold underline underline-offset-4"
          onClick={() => {
            onClose();
            navigate({ to: "/colors" });
          }}
        >
          Edit color profile
        </button>
        <button
          type="button"
          className="min-h-11 text-left font-semibold underline underline-offset-4"
          onClick={() => {
            onClose();
            navigate({ to: "/streak" });
          }}
        >
          Style streak
        </button>
      </div>
    </Sheet>
  );
}
