import { useEffect, useState, type ReactNode } from "react";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { loadWearlyData, saveWearlyData } from "@/lib/wearly-cloud";
import { useCloset } from "@/lib/store";
import type { CommunityPost, Item, OutfitLog, Profile, SavedLook } from "@/lib/types";

type CloudData = { profile: Profile; items: Item[]; logs: OutfitLog[]; saved: SavedLook[]; posts: CommunityPost[] };

export function AccountDataBoundary({ children }: { children: ReactNode }) {
  const { user, isPending } = useCurrentUserState();
  const profile = useCloset((state) => state.profile);
  const items = useCloset((state) => state.items);
  const logs = useCloset((state) => state.logs);
  const saved = useCloset((state) => state.saved);
  const posts = useCloset((state) => state.posts);
  const restore = useCloset((state) => state.restoreCloudData);
  const [readyFor, setReadyFor] = useState<string | null>(null);
  const [legacyData, setLegacyData] = useState<CloudData | null>(null);
  const [needsImportChoice, setNeedsImportChoice] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (isPending || !user) return;
    let active = true;
    setReadyFor(null);
    setError("");
    loadWearlyData()
      .then((data) => {
        if (!active) return;
        if (data) {
          restore(data as CloudData);
          setLegacyData(null);
          setNeedsImportChoice(false);
          setReadyFor(user.id);
          return;
        }
        // Existing pre-account installs kept a local-only closet. Never assign
        // it to a new account silently: ask the signed-in person to claim it.
        let previous: CloudData | null = null;
        try {
          const raw = window.localStorage.getItem("wearly-closet-v1");
          const parsed = raw ? JSON.parse(raw) as { state?: CloudData } : null;
          const state = parsed?.state;
          if (state?.profile && Array.isArray(state.items) && (state.profile.onboarded || state.profile.name || state.logs?.length || state.saved?.length || state.items.some((item) => !["ivory-blouse","sage-shirt","mocha-knit","charcoal-trousers","black-dress","navy-blazer","camel-coat","white-sneakers","mocha-loafers","sand-tote"].includes(String(item.id))))) {
            previous = {
              profile: state.profile,
              items: state.items,
              logs: state.logs ?? [],
              saved: state.saved ?? [],
              posts: state.posts ?? [],
            };
          }
        } catch {
          previous = null;
        }
        if (!active) return;
        if (previous) {
          setLegacyData(previous);
          setNeedsImportChoice(true);
          return;
        }
        restore(null);
        setReadyFor(user.id);
      })
      .catch((err) => {
        if (!active) return;
        setError(err instanceof Error ? err.message : "Could not load your saved wardrobe.");
      });
    return () => { active = false; };
  }, [isPending, user?.id, restore]);

  useEffect(() => {
    if (!user || readyFor !== user.id) return;
    const snapshot = { profile, items, logs, saved, posts };
    const timer = window.setTimeout(() => {
      saveWearlyData({ data: snapshot }).catch((err) => {
        setError(err instanceof Error ? err.message : "Your changes could not be synced.");
      });
    }, 900);
    return () => window.clearTimeout(timer);
  }, [user?.id, readyFor, profile, items, logs, saved, posts]);

  if (needsImportChoice && legacyData && user) {
    return <main className="grid min-h-dvh place-items-center bg-bg px-6 py-10 text-ink"><section className="w-full max-w-md rounded-2xl border border-line bg-surface p-6 shadow-sm"><img src="/brand/logo-mark.webp" alt="" className="brand-logo mb-5 h-12 w-auto"/><p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">Existing Wearly data found</p><h1 className="mt-2 font-display text-3xl font-semibold">Bring your old wardrobe along?</h1><p className="mt-3 text-sm leading-6 text-muted">This device has a previous Wearly closet with {legacyData.items.length} clothing pieces, {legacyData.logs.length} outfit logs and {legacyData.saved.length} saved looks. Import it into this account only if it belongs to you.</p><button type="button" onClick={() => { restore(legacyData); setNeedsImportChoice(false); setLegacyData(null); setReadyFor(user.id); }} className="mt-6 min-h-12 w-full rounded-full bg-brand px-5 text-sm font-semibold text-on-brand">Yes, import my old Wearly data</button><button type="button" onClick={() => { restore(null); setNeedsImportChoice(false); setLegacyData(null); setReadyFor(user.id); }} className="mt-2 min-h-11 w-full rounded-full border border-line px-5 text-sm font-semibold">Start with a fresh wardrobe</button></section></main>;
  }

  if (isPending || !user || readyFor !== user.id) {
    return <main className="grid min-h-dvh place-items-center bg-bg px-6 text-ink"><div className="text-center"><img src="/brand/logo-mark.webp" alt="" className="brand-logo mx-auto mb-5 h-12 w-auto"/><p className="text-sm text-muted">{error || "Opening your personal wardrobe…"}</p>{error && <button className="mt-4 text-sm underline" onClick={() => window.location.reload()}>Try again</button>}</div></main>;
  }

  return <>{children}{error && <div role="status" className="fixed bottom-24 left-1/2 z-50 -translate-x-1/2 rounded-full border border-line bg-surface px-4 py-2 text-xs text-muted shadow-lg">{error}</div>}</>;
}
